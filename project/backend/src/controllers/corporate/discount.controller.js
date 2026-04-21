const Discount = require('../../models/Discount.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

// List coupons the corporate user can browse and pick from on Place Order Step 4.
// Tenant-scoped, active, within date window, and not over usage cap.
//
// TODO: applicableTo: 'specific_corporate' filtering is not enforced anywhere today.
// Before production, audit Discount usage and either enforce it consistently across
// validate/list/place, or drop the enum value from the schema.
const listAvailableDiscounts = async (req, res) => {
  try {
    const now = new Date();
    const discounts = await Discount.find({
      business: req.businessId,
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
      ],
    })
      .select('_id code type value minOrderAmount maxDiscountAmount validUntil')
      .sort({ validUntil: 1 })
      .limit(50)
      .lean();
    return sendSuccess(res, 200, 'Available coupons fetched', { discounts });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    console.error('[listAvailableDiscounts] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

// Non-mutating coupon verdict for the Place Order wizard. Mirrors the exact
// checks in corporate/order.controller.js placeOrder — no side effects, no
// usedCount increment. That still happens at order-create time.
//
// Response shape per spec: 200 OK with { valid: true, discountAmount, finalAmount, code }
// on success, or { valid: false, message } on failed validation. Bad request
// input (missing fields, NaN) still returns 400.
const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body || {};
    if (!code || !String(code).trim()) {
      return sendError(res, 400, 'Coupon code is required.');
    }
    const sub = Number(subtotal);
    if (!Number.isFinite(sub) || sub < 0) {
      return sendError(res, 400, 'Valid subtotal is required.');
    }

    const now = new Date();
    const discount = await Discount.findOne({
      business: req.businessId,
      code: String(code).toUpperCase(),
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    });

    if (!discount) {
      return sendSuccess(res, 200, 'Coupon check complete', {
        valid: false, message: 'Invalid or expired coupon code',
      });
    }
    if (discount.minOrderAmount && sub < discount.minOrderAmount) {
      return sendSuccess(res, 200, 'Coupon check complete', {
        valid: false, message: `Minimum order amount is ${discount.minOrderAmount}`,
      });
    }

    let discountAmount = discount.type === 'percentage'
      ? (sub * discount.value) / 100
      : discount.value;
    if (discount.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
    }
    const finalAmount = Math.max(0, sub - discountAmount);

    return sendSuccess(res, 200, 'Coupon valid', {
      valid: true,
      code: discount.code,
      discountAmount,
      finalAmount,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    console.error('[validateCoupon] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

module.exports = { validateCoupon, listAvailableDiscounts };
