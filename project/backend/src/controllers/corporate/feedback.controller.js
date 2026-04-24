const Feedback = require('../../models/Feedback.model');
const Order = require('../../models/Order.model');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  if (error && error.code === 11000) {
    return sendError(res, 400, 'Feedback already submitted for this order.');
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

const listMyFeedback = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { corporate: req.user.corporate, business: req.businessId };
    if (req.query.order) filter.order = req.query.order;
    const [feedbacks, total] = await Promise.all([
      Feedback.find(filter)
        .populate('order', 'orderNumber totalAmount')
        .populate('submittedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Feedback.countDocuments(filter),
    ]);
    return sendPaginated(res, feedbacks, total, page, limit, 'feedbacks');
  } catch (error) { return handleError(res, error, 'listMyFeedback'); }
};


const submitFeedback = async (req, res) => {
  try {
    const { order, rating, comment } = req.body;

    if (!order) return sendError(res, 400, 'Order is required.');
    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return sendError(res, 400, 'Rating must be a number between 1 and 5.');
    }

    const orderDoc = await Order.findOne({ _id: order, corporate: req.user.corporate });
    if (!orderDoc) return sendError(res, 404, 'Order not found.');
    if (orderDoc.status !== 'delivered') {
      return sendError(res, 400, 'Feedback can only be left for delivered orders.');
    }

    const existing = await Feedback.findOne({ order });
    if (existing) return sendError(res, 400, 'Feedback already submitted for this order.');

    const feedback = await Feedback.create({
      business: req.businessId,
      corporate: req.user.corporate,
      order,
      submittedBy: req.user._id,
      rating: ratingNum,
      comment: comment ? String(comment).trim() : undefined,
    });

    return sendSuccess(res, 201, 'Feedback submitted. Thank you!', { feedback });
  } catch (error) { return handleError(res, error, 'submitFeedback'); }
};

module.exports = { submitFeedback, listMyFeedback };
