const Occasion = require('../../models/Occasion.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const getOccasions = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { type, corporateId, upcoming, from, to, source } = req.query;
    const filter = { business: req.businessId };

    if (type)        filter.type = type;
    if (corporateId) filter.corporate = corporateId;
    if (source)      filter.source = source;

    if (upcoming === 'true') {
      const today    = new Date();
      const nextMonth = new Date(); nextMonth.setDate(nextMonth.getDate() + 30);
      filter.date = { $gte: today, $lte: nextMonth };
    }
    if (from || to) {
      const range = {};
      if (from) range.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        range.$lte = end;
      }
      filter.date = { ...(filter.date || {}), ...range };
    }

    const [occasions, total] = await Promise.all([
      Occasion.find(filter)
        .populate('staff', 'firstName lastName')
        .populate('corporate', 'companyName')
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit),
      Occasion.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Occasions fetched.', { occasions, total, page, limit });
  } catch (e) { return sendError(res, 500, e.message); }
};

const createOccasion = async (req, res) => {
  try {
    const body = { ...req.body, business: req.businessId, source: 'manual' };

    // When type is 'custom', the client sends customTitle as the meaningful
    // label. We copy it into title if title was not explicitly provided.
    if (body.type === 'custom' && body.customTitle && !body.title) {
      body.title = body.customTitle;
    }

    const occasion = await Occasion.create(body);
    return sendSuccess(res, 201, 'Occasion created.', { occasion });
  } catch (e) { return sendError(res, 500, e.message); }
};

const updateOccasion = async (req, res) => {
  try {
    const patch = { ...req.body };
    if (patch.type === 'custom' && patch.customTitle && !patch.title) {
      patch.title = patch.customTitle;
    }

    const occasion = await Occasion.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId },
      patch,
      { new: true, runValidators: true }
    );
    if (!occasion) return sendError(res, 404, 'Occasion not found.');
    return sendSuccess(res, 200, 'Occasion updated.', { occasion });
  } catch (e) { return sendError(res, 500, e.message); }
};

const deleteOccasion = async (req, res) => {
  try {
    await Occasion.findOneAndDelete({ _id: req.params.id, business: req.businessId });
    return sendSuccess(res, 200, 'Occasion deleted.');
  } catch (e) { return sendError(res, 500, e.message); }
};

module.exports = { getOccasions, createOccasion, updateOccasion, deleteOccasion };
