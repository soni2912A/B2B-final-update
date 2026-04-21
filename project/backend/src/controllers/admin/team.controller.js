const User = require('../../models/User.model');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

// Read-only directory of operational users for dropdowns (e.g. "assign delivery
// to staff"). Deliberately separate from /admin/users — that router is
// mount-locked to admin-only because it also hosts invite/update/delete
// mutations. This endpoint is scoped to `adminAccess` so staff can populate
// dropdowns without gaining access to user management.
const listTeam = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {
      business: req.businessId,
      role: { $in: ['admin', 'staff'] },
    };
    if (req.query.active === 'true') filter.isActive = true;
    if (req.query.role && ['admin', 'staff'].includes(req.query.role)) {
      filter.role = req.query.role;
    }
    const [users, total] = await Promise.all([
      User.find(filter).select('_id name email role isActive').sort({ name: 1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return sendPaginated(res, users, total, page, limit, 'users');
  } catch (error) { return handleError(res, error, 'listTeam'); }
};

module.exports = { listTeam };
