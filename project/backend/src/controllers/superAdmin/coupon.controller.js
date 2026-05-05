const CouponCode = require('../../models/CouponCode.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

// GET /super-admin/coupons
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await CouponCode.find()
      .populate('createdBy', 'name email')
      .populate('applicablePlans', 'name price')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'OK', { coupons });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /super-admin/coupons
exports.createCoupon = async (req, res) => {
  try {
    const {
      code, description, type, value, maxDiscountAmount,
      applicablePlans, usageLimit, validFrom, validUntil,
    } = req.body;

    if (!code || !type || !value || !validFrom || !validUntil) {
      return sendError(res, 400, 'code, type, value, validFrom and validUntil are required.');
    }
    if (!['percentage', 'fixed'].includes(type)) {
      return sendError(res, 400, 'type must be percentage or fixed.');
    }
    if (type === 'percentage' && (value < 1 || value > 100)) {
      return sendError(res, 400, 'Percentage value must be between 1 and 100.');
    }

    const existing = await CouponCode.findOne({ code: code.toUpperCase() });
    if (existing) return sendError(res, 400, 'A coupon with this code already exists.');

    const coupon = await CouponCode.create({
      code: code.toUpperCase().trim(),
      description,
      type, value,
      maxDiscountAmount: maxDiscountAmount || null,
      applicablePlans:   applicablePlans   || [],
      usageLimit:        usageLimit != null ? Number(usageLimit) : 10,
      validFrom:  new Date(validFrom),
      validUntil: new Date(validUntil),
      createdBy:  req.user._id,
    });
    return sendSuccess(res, 201, 'Coupon created.', { coupon });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 400, 'Coupon code already exists.');
    return sendError(res, 500, err.message);
  }
};

// PATCH /super-admin/coupons/:id
exports.updateCoupon = async (req, res) => {
  try {
    const allowed = ['description','type','value','maxDiscountAmount','applicablePlans','usageLimit','validFrom','validUntil','isActive'];
    const patch = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    }
    const coupon = await CouponCode.findByIdAndUpdate(
      req.params.id, patch, { new: true, runValidators: true }
    );
    if (!coupon) return sendError(res, 404, 'Coupon not found.');
    return sendSuccess(res, 200, 'Coupon updated.', { coupon });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// DELETE /super-admin/coupons/:id
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await CouponCode.findById(req.params.id);
    if (!coupon) return sendError(res, 404, 'Coupon not found.');
    coupon.isActive = false;
    await coupon.save();
    return sendSuccess(res, 200, 'Coupon deactivated.');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /public/coupons/validate  — called from register page before payment
exports.validateCoupon = async (req, res) => {
  try {
    const { code, planId } = req.body;
    if (!code) return sendError(res, 400, 'code is required.');

    const now = new Date();
    const coupon = await CouponCode.findOne({
      code:       code.toUpperCase().trim(),
      isActive:   true,
      validFrom:  { $lte: now },
      validUntil: { $gte: now },
    });

    if (!coupon) return sendError(res, 404, 'Invalid or expired coupon code.');

    // usage limit check
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return sendError(res, 400, 'This coupon has reached its usage limit.');
    }

    // plan restriction check
    if (coupon.applicablePlans.length > 0 && planId) {
      const applicable = coupon.applicablePlans.map(p => p.toString());
      if (!applicable.includes(String(planId))) {
        return sendError(res, 400, 'This coupon is not valid for the selected plan.');
      }
    }

    return sendSuccess(res, 200, 'Coupon is valid!', {
      coupon: {
        code:              coupon.code,
        type:              coupon.type,
        value:             coupon.value,
        maxDiscountAmount: coupon.maxDiscountAmount,
        description:       coupon.description,
      },
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// Internal helper — called from auth controller when subscription is activated
exports.applyCoupon = async (code, planPrice, planId, businessId) => {
  if (!code) return { discountAmount: 0, finalPrice: planPrice, coupon: null };

  const now = new Date();
  const coupon = await CouponCode.findOne({
    code:       code.toUpperCase().trim(),
    isActive:   true,
    validFrom:  { $lte: now },
    validUntil: { $gte: now },
  });

  if (!coupon) return { discountAmount: 0, finalPrice: planPrice, coupon: null };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { discountAmount: 0, finalPrice: planPrice, coupon: null };
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (planPrice * coupon.value) / 100;
    if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
  } else {
    discount = Math.min(coupon.value, planPrice);
  }

  const finalPrice = Math.max(0, planPrice - discount);

  // Mark as used
  await CouponCode.findByIdAndUpdate(coupon._id, {
    $inc: { usedCount: 1 },
    $push: { usedBy: { business: businessId, savedAmount: discount } },
  });

  return { discountAmount: discount, finalPrice, coupon };
};