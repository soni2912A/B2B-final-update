const Occasion = require('../../models/Occasion.model');
const Staff    = require('../../models/Staff.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

const ALLOWED_TYPES = ['birthday', 'anniversary', 'holiday', 'custom'];

const buildTenantFilter = (req) => ({
  business:  req.businessId,
  corporate: req.user.corporate,
});

const listOccasions = async (req, res) => {
  try {
    const { upcoming, from, to, source } = req.query;
    const filter = buildTenantFilter(req);

    if (source) filter.source = source;

    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.date = { $gte: today };
    }
    if (from || to) {
      const range = { ...(filter.date || {}) };
      if (from) range.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        range.$lte = end;
      }
      filter.date = range;
    }

    const occasions = await Occasion.find(filter)
      .populate('staff', 'firstName lastName')
      .sort({ date: 1 });
    return sendSuccess(res, 200, 'Occasions fetched.', { occasions });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    console.error('[listOccasions] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

const createOccasion = async (req, res) => {
  try {
    const { staff, type, date, title, customTitle, notes, recurringYearly, reminderDaysBefore } = req.body;

    if (!staff) return sendError(res, 400, 'Staff member is required.');
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return sendError(res, 400, `Type must be one of: ${ALLOWED_TYPES.join(', ')}.`);
    }
    if (!date) return sendError(res, 400, 'Date is required.');
    if (Number.isNaN(new Date(date).getTime())) {
      return sendError(res, 400, 'Date is invalid.');
    }
    if (!req.user.corporate) {
      return sendError(res, 400, 'User is not linked to a corporate account.');
    }

    const staffDoc = await Staff.findOne({
      _id:       staff,
      business:  req.businessId,
      corporate: req.user.corporate,
    });
    if (!staffDoc) return sendError(res, 404, 'Staff member not found for this corporate.');

    let resolvedTitle = title?.trim() || customTitle?.trim() || '';
    if (!resolvedTitle) {
      resolvedTitle = `${staffDoc.firstName} ${staffDoc.lastName}'s ${type}`.trim();
    }

    const occasion = await Occasion.create({
      business:  req.businessId,
      corporate: req.user.corporate,
      staff:     staffDoc._id,
      title:     resolvedTitle,
      customTitle: type === 'custom' ? (customTitle?.trim() || resolvedTitle) : undefined,
      type,
      date,
      notes,
      recurringYearly,
      reminderDaysBefore,
      createdBy: req.user._id,
      source:    'manual',
    });

    await occasion.populate('staff', 'firstName lastName');
    return sendSuccess(res, 201, 'Occasion added.', { occasion });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    console.error('[createOccasion] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

const updateOccasion = async (req, res) => {
  try {
    if (req.body.type && !ALLOWED_TYPES.includes(req.body.type)) {
      return sendError(res, 400, `Type must be one of: ${ALLOWED_TYPES.join(', ')}.`);
    }
    if (req.body.date && Number.isNaN(new Date(req.body.date).getTime())) {
      return sendError(res, 400, 'Date is invalid.');
    }

    const { business, corporate, createdBy, ...patch } = req.body;
    if (patch.type === 'custom' && patch.customTitle && !patch.title) {
      patch.title = patch.customTitle;
    }

    const occasion = await Occasion.findOneAndUpdate(
      { _id: req.params.id, ...buildTenantFilter(req) },
      patch,
      { new: true, runValidators: true },
    ).populate('staff', 'firstName lastName');

    if (!occasion) return sendError(res, 404, 'Occasion not found.');
    return sendSuccess(res, 200, 'Occasion updated.', { occasion });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    console.error('[updateOccasion] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

const deleteOccasion = async (req, res) => {
  try {
    const occasion = await Occasion.findOneAndDelete({
      _id: req.params.id,
      ...buildTenantFilter(req),
    });
    if (!occasion) return sendError(res, 404, 'Occasion not found.');
    return sendSuccess(res, 200, 'Occasion deleted.');
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    console.error('[deleteOccasion] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  listOccasions,
  createOccasion,
  updateOccasion,
  deleteOccasion,
  getMyOccasions: listOccasions,
};
