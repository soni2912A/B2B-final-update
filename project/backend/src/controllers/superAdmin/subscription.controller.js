const Subscription = require('../../models/Subscription.model');
const Business = require('../../models/Business.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  if (error && error.code === 11000) {
    return sendError(res, 400, 'A subscription with that name already exists.');
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().sort({ price: 1 }).populate('business', 'name email');
    return sendSuccess(res, 200, 'Subscriptions fetched', { subscriptions });
  } catch (error) { return handleError(res, error, 'getAllSubscriptions'); }
};

const createSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.create(req.body);
    if (req.body.business) {
      await Business.findByIdAndUpdate(req.body.business, { subscription: subscription._id });
    }
    return sendSuccess(res, 201, 'Subscription created', { subscription });
  } catch (error) { return handleError(res, error, 'createSubscription'); }
};

const ALLOWED_UPDATE_KEYS = ['price', 'billingCycle', 'maxCorporates', 'maxStaffPerCorporate', 'maxOrders', 'features'];

const updateSubscription = async (req, res) => {
  try {
    const patch = {};
    for (const key of ALLOWED_UPDATE_KEYS) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (Object.keys(patch).length === 0) {
      return sendError(res, 400, 'No updatable fields provided.');
    }
    if (patch.features !== undefined && !Array.isArray(patch.features)) {
      return sendError(res, 400, 'Features must be an array of strings.');
    }
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id, patch, { new: true, runValidators: true },
    );
    if (!subscription) return sendError(res, 404, 'Subscription not found');
    return sendSuccess(res, 200, 'Subscription updated', { subscription });
  } catch (error) { return handleError(res, error, 'updateSubscription'); }
};

module.exports = { getAllSubscriptions, createSubscription, updateSubscription };
