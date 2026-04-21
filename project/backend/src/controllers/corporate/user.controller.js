const User = require('../../models/User.model');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const getCorporateUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { corporate: req.user.corporate, role: 'corporate_user' };
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    return sendPaginated(res, users, total, page, limit, 'users');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const inviteUser = async (req, res) => {
  try {
    const user = await User.create({
      ...req.body,
      role: 'corporate_user',
      corporate: req.user.corporate,
      business: req.businessId,
    });
    return sendSuccess(res, 201, 'User invited', { user });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, corporate: req.user.corporate });
    if (!user) return sendError(res, 404, 'User not found');
    // Guard rail: don't let the currently-logged-in user deactivate their own
    // account through this screen (they'd lock themselves out).
    if (String(user._id) === String(req.user._id)) {
      return sendError(res, 400, 'You cannot deactivate your own account.');
    }
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    return sendSuccess(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'}`, { user });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Allowed edit fields: name and phone only. Email is identity (don't let the
// UI rewrite it), role stays 'corporate_user', business/corporate/isActive are
// managed via other routes.
const updateCorporateUser = async (req, res) => {
  try {
    const { name, phone } = req.body || {};
    const patch = {};
    if (name !== undefined) {
      if (!String(name).trim()) return sendError(res, 400, 'Name cannot be empty.');
      patch.name = String(name).trim();
    }
    if (phone !== undefined) patch.phone = String(phone).trim() || undefined;
    if (Object.keys(patch).length === 0) return sendError(res, 400, 'No updatable fields provided.');

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, corporate: req.user.corporate, role: 'corporate_user' },
      patch,
      { new: true, runValidators: true },
    );
    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'User updated', { user });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    return sendError(res, 500, error.message);
  }
};

module.exports = { getCorporateUsers, inviteUser, toggleUserStatus, updateCorporateUser };
