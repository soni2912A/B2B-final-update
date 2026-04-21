const mongoose = require('mongoose');
const Delivery = require('../../models/Delivery.model');
const Order = require('../../models/Order.model');
const notificationService = require('../../services/notification.service');
const invoiceService = require('../../services/invoice.service');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination, buildSortQuery } = require('../../utils/pagination');

const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

// Build the Mongo filter. Search on order.orderNumber via a two-step lookup
// (first find matching Order _ids, then filter deliveries where order ∈ ids).
// Avoids an aggregation pipeline for a single search field.
const buildFilter = async (req) => {
  const { search, status, from, to, assignedTo } = req.query;
  const filter = { business: req.businessId };
  if (status && status !== 'all') filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (from || to) {
    filter.scheduledDate = {};
    if (from) filter.scheduledDate.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.scheduledDate.$lte = end;
    }
  }
  if (search && String(search).trim()) {
    const re = new RegExp(String(search).trim().replace(ESCAPE_RE, '\\$&'), 'i');
    const matchingOrders = await Order.find({
      business: req.businessId,
      orderNumber: re,
    }).select('_id').lean();
    filter.order = { $in: matchingOrders.map(o => o._id) };
  }
  return filter;
};

const getAllDeliveries = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const sort = buildSortQuery(req.query);
    const filter = await buildFilter(req);
    const [deliveries, total] = await Promise.all([
      Delivery.find(filter).sort(sort).skip(skip).limit(limit)
        .populate('order', 'orderNumber totalAmount')
        .populate('corporate', 'companyName')
        .populate('assignedTo', 'name email'),
      Delivery.countDocuments(filter),
    ]);
    return sendPaginated(res, deliveries, total, page, limit, 'deliveries');
  } catch (error) { return handleError(res, error, 'getAllDeliveries'); }
};

const getDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, business: req.businessId })
      .populate('order').populate('corporate').populate('assignedTo', 'name email phone');
    if (!delivery) return sendError(res, 404, 'Delivery not found');
    return sendSuccess(res, 200, 'Delivery fetched', { delivery });
  } catch (error) { return handleError(res, error, 'getDelivery'); }
};

const createDelivery = async (req, res) => {
  try {
    const { order, scheduledDate, assignedTo, deliveryAddress, notes } = req.body;

    // Fail-fast validation — produces 400 with an actionable message instead
    // of relying on Mongoose errors surfacing through the catch.
    if (!order)         return sendError(res, 400, 'Order is required.');
    if (!mongoose.isValidObjectId(order)) {
      return sendError(res, 400, 'Invalid order reference.');
    }
    if (!scheduledDate) return sendError(res, 400, 'Scheduled date is required.');
    if (Number.isNaN(new Date(scheduledDate).getTime())) {
      return sendError(res, 400, 'Scheduled date is invalid.');
    }
    if (assignedTo && !mongoose.isValidObjectId(assignedTo)) {
      return sendError(res, 400, 'Invalid staff reference.');
    }

    // Derive `corporate` from the referenced Order — never trust client.
    const ord = await Order.findOne({ _id: order, business: req.businessId });
    if (!ord) return sendError(res, 400, 'Order not found in this business.');

    const delivery = await Delivery.create({
      business: req.businessId,
      order: ord._id,
      corporate: ord.corporate,
      assignedTo: assignedTo || undefined,
      scheduledDate: new Date(scheduledDate),
      deliveryAddress: deliveryAddress || undefined,
      notes,
    });

    // Intentionally NOT auto-changing order status — the Order state machine
    // is managed via the Orders page. Scheduling a delivery doesn't imply
    // the order is ready to move through `processing → assigned`. Admins can
    // transition explicitly. Removing the previous `Order.findByIdAndUpdate
    // ({ status: 'assigned' })` side effect prevents state-machine bypass.

    return sendSuccess(res, 201, 'Delivery scheduled', { delivery });
  } catch (error) { return handleError(res, error, 'createDelivery'); }
};

const updateDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId },
      req.body,
      { new: true, runValidators: true },
    );
    if (!delivery) return sendError(res, 404, 'Delivery not found');
    return sendSuccess(res, 200, 'Delivery updated', { delivery });
  } catch (error) { return handleError(res, error, 'updateDelivery'); }
};

const markDelivered = async (req, res) => {
  try {
    const { notes, proofOfDelivery } = req.body;
    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId },
      { status: 'delivered', deliveredAt: new Date(), notes, proofOfDelivery },
      { new: true },
    ).populate('order').populate('corporate');
    if (!delivery) return sendError(res, 404, 'Delivery not found');
    await Order.findByIdAndUpdate(delivery.order._id, { status: 'delivered' });

    // Mirror the invoice trigger from updateOrderStatus's 'delivered' branch —
    // marking a delivery complete is the other code path that takes an order to
    // 'delivered', and historically it was missing this side effect. Idempotent
    // by design (invoiceService.findOne + unique index on { order }), so re-
    // marking a delivered delivery won't duplicate. Load the fresh order so the
    // service sees the just-updated status/fields.
    const orderDoc = await Order.findById(delivery.order._id);
    if (orderDoc) {
      try { await invoiceService.generateInvoice(orderDoc); }
      catch (err) { console.error('[markDelivered] invoice generation failed:', err.message); }
    }

    notificationService.notifyDeliveryComplete(delivery)
      .catch(err => console.error('[markDelivered] notifyDeliveryComplete failed:', err.message));
    return sendSuccess(res, 200, 'Delivery marked as completed', { delivery });
  } catch (error) { return handleError(res, error, 'markDelivered'); }
};

const markFailed = async (req, res) => {
  try {
    const { failureReason } = req.body;
    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId },
      { status: 'failed', failureReason, $inc: { attemptCount: 1 } },
      { new: true },
    );
    if (!delivery) return sendError(res, 404, 'Delivery not found');
    return sendSuccess(res, 200, 'Delivery marked as failed', { delivery });
  } catch (error) { return handleError(res, error, 'markFailed'); }
};

// Step-tracking: flip the delivery into "in transit". Only legal from
// 'scheduled' or 'rescheduled' — don't regress from delivered/failed.
const markInTransit = async (req, res) => {
  try {
    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId, status: { $in: ['scheduled', 'rescheduled'] } },
      { status: 'in_transit' },
      { new: true },
    );
    if (!delivery) {
      const exists = await Delivery.findOne({ _id: req.params.id, business: req.businessId });
      if (!exists) return sendError(res, 404, 'Delivery not found');
      return sendError(res, 400, `Cannot mark '${exists.status}' delivery as in-transit.`);
    }
    return sendSuccess(res, 200, 'Delivery is now in transit', { delivery });
  } catch (error) { return handleError(res, error, 'markInTransit'); }
};

// Retry a failed delivery: reset status to 'rescheduled' with an optional new
// scheduledDate, clear failureReason. attemptCount was already bumped by
// markFailed, so a retry that fails again will correctly show as attempt 2, 3…
const retryDelivery = async (req, res) => {
  try {
    const { scheduledDate } = req.body;
    const delivery = await Delivery.findOne({ _id: req.params.id, business: req.businessId });
    if (!delivery) return sendError(res, 404, 'Delivery not found');
    if (delivery.status !== 'failed') {
      return sendError(res, 400, `Only failed deliveries can be retried (current: ${delivery.status}).`);
    }
    delivery.status = 'rescheduled';
    delivery.failureReason = undefined;
    if (scheduledDate) {
      const dt = new Date(scheduledDate);
      if (Number.isNaN(dt.getTime())) return sendError(res, 400, 'Invalid scheduled date.');
      delivery.scheduledDate = dt;
    }
    await delivery.save();
    return sendSuccess(res, 200, 'Delivery rescheduled for retry', { delivery });
  } catch (error) { return handleError(res, error, 'retryDelivery'); }
};

// Proof-of-delivery upload. The route applies proofUploadMiddleware('proof')
// before this handler, so req.file is populated on success. The relative URL
// is stored on the delivery so the /uploads static route can serve it.
const uploadProofOfDelivery = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'No file uploaded.');
    const delivery = await Delivery.findOne({ _id: req.params.id, business: req.businessId });
    if (!delivery) return sendError(res, 404, 'Delivery not found');

    const url = `/uploads/proofs/${req.file.filename}`;
    delivery.proofOfDelivery = url;
    await delivery.save();
    return sendSuccess(res, 200, 'Proof uploaded', { delivery, url });
  } catch (error) { return handleError(res, error, 'uploadProofOfDelivery'); }
};

// Today's deliveries — used by the coordinator/delivery-staff view.
// When the caller is a delivery staff member (role === 'staff'), only their
// own assigned deliveries are returned so the dashboard stays personal.
const getTodaysDeliveries = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setHours(23, 59, 59, 999);
    const filter = {
      business: req.businessId,
      scheduledDate: { $gte: start, $lte: end },
    };
    if (req.user.role === 'staff') {
      filter.assignedTo = req.user._id;
    }
    const deliveries = await Delivery.find(filter)
      .sort({ scheduledDate: 1 })
      .populate('order', 'orderNumber totalAmount')
      .populate('corporate', 'companyName')
      .populate('assignedTo', 'name email');
    return sendSuccess(res, 200, "Today's deliveries", { deliveries });
  } catch (error) { return handleError(res, error, 'getTodaysDeliveries'); }
};

module.exports = {
  getAllDeliveries, getDelivery, createDelivery, updateDelivery,
  markDelivered, markFailed, markInTransit, retryDelivery,
  uploadProofOfDelivery, getTodaysDeliveries,
};