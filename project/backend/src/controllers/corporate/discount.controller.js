const Discount = require('../../models/Discount.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');


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
