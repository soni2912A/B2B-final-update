const Occasion = require('../../models/Occasion.model');
const Staff = require('../../models/Staff.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const getOccasions = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { type, corporateId, upcoming, from, to } = req.query;
    const filter = { business: req.businessId };
    if (type) filter.type = type;
    if (corporateId) filter.corporate = corporateId;
    if (upcoming === 'true') {
      const today = new Date();
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
      Occasion.find(filter).populate('staff', 'firstName lastName').populate('corporate', 'companyName').sort({ date: 1 }).skip(skip).limit(limit),
      Occasion.countDocuments(filter),
    ]);
    return sendSuccess(res, 200, 'Occasions fetched.', { occasions, total, page, limit });
  } catch (e) { return sendError(res, 500, e.message); }
};

const createOccasion = async (req, res) => {
  try {
    const occasion = await Occasion.create({ ...req.body, business: req.businessId });
    return sendSuccess(res, 201, 'Occasion created.', { occasion });
  } catch (e) { return sendError(res, 500, e.message); }
};

const updateOccasion = async (req, res) => {
  try {
    const occasion = await Occasion.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId }, req.body, { new: true, runValidators: true }
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
