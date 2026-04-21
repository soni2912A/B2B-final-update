const Discount = require('../../models/Discount.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  if (error && error.code === 11000) {
    return sendError(res, 400, 'A discount with that code already exists.');
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

const getAllDiscounts = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { business: req.businessId };
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const [discounts, total] = await Promise.all([
      Discount.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Discount.countDocuments(filter),
    ]);
    return sendSuccess(res, 200, 'Discounts fetched', { discounts, total, page, limit });
  } catch (e) { return handleError(res, e, 'getAllDiscounts'); }
};

const createDiscount = async (req, res) => {
  try {
    const discount = await Discount.create({ ...req.body, business: req.businessId, createdBy: req.user._id });
    return sendSuccess(res, 201, 'Discount created', { discount });
  } catch (e) { return handleError(res, e, 'createDiscount'); }
};

const updateDiscount = async (req, res) => {
  try {
    const { business, ...patch } = req.body;
    const discount = await Discount.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId }, patch, { new: true, runValidators: true }
    );
    if (!discount) return sendError(res, 404, 'Discount not found');
    return sendSuccess(res, 200, 'Discount updated', { discount });
  } catch (e) { return handleError(res, e, 'updateDiscount'); }
};

const deleteDiscount = async (req, res) => {
  try {
    const deleted = await Discount.findOneAndDelete({ _id: req.params.id, business: req.businessId });
    if (!deleted) return sendError(res, 404, 'Discount not found');
    return sendSuccess(res, 200, 'Discount deleted');
  } catch (e) { return handleError(res, e, 'deleteDiscount'); }
};

const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount, corporateId } = req.body;
    if (!code) return sendError(res, 400, 'Coupon code is required');
    const now = new Date();
    const discount = await Discount.findOne({
      business: req.businessId, code: code.toUpperCase(), isActive: true,
      validFrom: { $lte: now }, $or: [{ validUntil: null }, { validUntil: { $gte: now } }],
    });
    if (!discount) return sendError(res, 404, 'Invalid or expired coupon code');
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit)
      return sendError(res, 400, 'Coupon usage limit reached');
    if (orderAmount && orderAmount < discount.minOrderAmount)
      return sendError(res, 400, `Minimum order amount is ${discount.minOrderAmount}`);
    const discountAmount = discount.type === 'percentage'
      ? Math.min((orderAmount * discount.value) / 100, discount.maxDiscountAmount || Infinity)
      : discount.value;
    return sendSuccess(res, 200, 'Coupon valid', { discount, discountAmount });
  } catch (e) { return handleError(res, e, 'validateCoupon'); }
};

module.exports = { getAllDiscounts, createDiscount, updateDiscount, deleteDiscount, validateCoupon };
