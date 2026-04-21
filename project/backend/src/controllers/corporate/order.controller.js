const Order = require('../../models/Order.model');
const Product = require('../../models/Product.model');
const Discount = require('../../models/Discount.model');
const User = require('../../models/User.model');
const notificationService = require('../../services/notification.service');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination, buildSortQuery } = require('../../utils/pagination');

// Expose the business's active delivery staff to corporate users so they can
// pick one in the place-order wizard. Read-only, minimal projection — no
// emails or phone numbers get leaked to corporate tenants beyond name/id.
// The admin-side /admin/users endpoint is admin-only and includes more detail
// that corporate users shouldn't see.
const listDeliveryStaff = async (req, res) => {
  try {
    const staff = await User.find({
      business: req.businessId,
      role: 'staff',
      isActive: true,
    })
      .select('_id name')
      .sort({ name: 1 });
    return sendSuccess(res, 200, 'Delivery staff', { staff });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const placeOrder = async (req, res) => {
  try {
    const { items, deliveryDate, deliveryAddress, couponCode, remarks, assignedTo } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, 'At least one item is required.');
    }
    for (const item of items) {
      if (!item || !item.product) {
        return sendError(res, 400, 'Each item must reference a product.');
      }
      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty < 1) {
        return sendError(res, 400, 'Each item must have a quantity of at least 1.');
      }
    }
    if (!deliveryDate) return sendError(res, 400, 'Delivery date is required.');
    if (Number.isNaN(new Date(deliveryDate).getTime())) {
      return sendError(res, 400, 'Delivery date is invalid.');
    }
    if (!deliveryAddress || (!deliveryAddress.address && !deliveryAddress.street)) {
      return sendError(res, 400, 'Delivery address is required.');
    }
    if (!req.user.corporate) return sendError(res, 400, 'User is not linked to a corporate account');

    // Validate the optional delivery-staff assignment up front. Must be an
    // active staff user of the SAME business — blocks cross-tenant assignment.
    let assignedStaff = null;
    if (assignedTo) {
      assignedStaff = await User.findOne({
        _id: assignedTo,
        business: req.businessId,
        role: 'staff',
        isActive: true,
      }).select('_id name email');
      if (!assignedStaff) {
        return sendError(res, 400, 'Selected delivery staff is not valid for this business.');
      }
    }

    let subtotal = 0;
    const resolvedItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.product, business: req.businessId, status: 'active' });
      if (!product) return sendError(res, 404, `Product ${item.product} not found or inactive`);

      const tier = product.pricingTiers?.find(t => item.quantity >= t.minQty);
      const unitPrice = tier ? tier.price : product.basePrice;
      const taxAmount = (unitPrice * item.quantity * product.taxRate) / 100;
      const totalPrice = unitPrice * item.quantity + taxAmount;
      subtotal += totalPrice;

      resolvedItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        taxRate: product.taxRate,
        taxAmount,
        totalPrice,
        staffMembers: item.staffMembers || [],
      });
    }

    let discountAmount = 0;
    let discountDoc = null;
    if (couponCode) {
      // TODO: applicableTo: 'specific_corporate' filtering is not enforced anywhere today.
      // Before production, audit Discount usage and either enforce it consistently across
      // validate/list/place, or drop the enum value from the schema.
      discountDoc = await Discount.findOne({
        business: req.businessId,
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
      });
      if (!discountDoc) return sendError(res, 400, 'Invalid or expired coupon code');
      if (discountDoc.minOrderAmount && subtotal < discountDoc.minOrderAmount) {
        return sendError(res, 400, `Minimum order amount is ${discountDoc.minOrderAmount}`);
      }
      discountAmount = discountDoc.type === 'percentage'
        ? (subtotal * discountDoc.value) / 100
        : discountDoc.value;
      if (discountDoc.maxDiscountAmount) discountAmount = Math.min(discountAmount, discountDoc.maxDiscountAmount);
      await Discount.findByIdAndUpdate(discountDoc._id, { $inc: { usedCount: 1 } });
    }

    const totalAmount = subtotal - discountAmount;
    const order = await Order.create({
      business: req.businessId,
      corporate: req.user.corporate,
      items: resolvedItems,
      // If a delivery staff was picked at placement, jump straight to the
      // 'assigned' state. Matches the admin-side /:id/assign flow so the
      // state-machine invariant (assigned ⇒ assignedTo set) holds.
      status: assignedStaff ? 'assigned' : 'new',
      deliveryDate,
      deliveryAddress,
      subtotal,
      discountAmount,
      totalAmount,
      discount: discountDoc?._id,
      couponCode,
      remarks,
      placedBy: req.user._id,
      assignedTo: assignedStaff?._id,
    });

    await order.populate('corporate', 'email companyName');
    notificationService.notifyNewOrder(order, req.user._id)
      .catch(err => console.error('[placeOrder] notifyNewOrder failed:', err.message));

    // Fire-and-forget: staff email + in-app notifications. Same helper used
    // by the admin-side assignOrder endpoint so behaviour is consistent.
    if (assignedStaff) {
      notificationService.notifyOrderAssigned(order, assignedStaff._id, req.user._id)
        .catch(err => console.error('[placeOrder] notifyOrderAssigned failed:', err.message));
    }

    return sendSuccess(res, 201, 'Order placed successfully', { order });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    if (error.code === 11000) {
      return sendError(res, 400, 'Duplicate order — please retry.');
    }
    console.error('[placeOrder] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

const getMyOrders = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const sort = buildSortQuery(req.query);
    const filter = { corporate: req.user.corporate };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }
    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(limit)
        .populate('assignedTo', 'name'),
      Order.countDocuments(filter),
    ]);
    return sendPaginated(res, orders, total, page, limit, 'orders');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getMyOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, corporate: req.user.corporate })
      .populate('items.product', 'name sku images')
      .populate('items.staffMembers', 'firstName lastName')
      .populate('discount');
    if (!order) return sendError(res, 404, 'Order not found');
    return sendSuccess(res, 200, 'Order fetched', { order });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { placeOrder, getMyOrders, getMyOrder, listDeliveryStaff };
