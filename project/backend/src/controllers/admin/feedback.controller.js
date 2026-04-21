const Feedback = require('../../models/Feedback.model');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const getAllFeedback = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { business: req.businessId };
    if (req.query.corporate) filter.corporate = req.query.corporate;
    const [feedbacks, total] = await Promise.all([
      Feedback.find(filter)
        .populate('order', 'orderNumber')
        .populate('corporate', 'companyName')
        .populate('submittedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Feedback.countDocuments(filter),
    ]);
    return sendPaginated(res, feedbacks, total, page, limit, 'feedbacks');
  } catch (e) { return sendError(res, 500, e.message); }
};

const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ _id: req.params.id, business: req.businessId })
      .populate('order').populate('corporate', 'companyName');
    if (!feedback) return sendError(res, 404, 'Feedback not found');
    return sendSuccess(res, 200, 'Feedback fetched', { feedback });
  } catch (e) { return sendError(res, 500, e.message); }
};

const respondToFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId },
      { adminResponse: req.body.response, respondedBy: req.user._id, respondedAt: new Date() },
      { new: true }
    );
    if (!feedback) return sendError(res, 404, 'Feedback not found');
    return sendSuccess(res, 200, 'Response saved', { feedback });
  } catch (e) { return sendError(res, 500, e.message); }
};

module.exports = { getAllFeedback, getFeedbackById, respondToFeedback };
