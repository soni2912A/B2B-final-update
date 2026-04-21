const crypto = require('crypto');
const User = require('../../models/User.model');
const Role = require('../../models/Role.model');
const emailService = require('../../services/email.service');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

// Fetch a role the admin is allowed to assign (system template OR a role scoped
// to their own business). Returns the role or null.
async function resolveAssignableRole(roleId, businessId) {
  if (!roleId) return null;
  return Role.findOne({
    _id: roleId,
    $or: [
      { scope: 'system' },
      { scope: 'business', business: businessId },
    ],
  });
}

const ALLOWED_ROLES = ['admin', 'staff'];
const INVITE_TTL_MS = 48 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  if (error && error.code === 11000) {
    return sendError(res, 400, 'A user with that email already exists.');
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');
const clientBase = () => (process.env.CLIENT_URL || '').split(',')[0].trim() || 'http://localhost:5173';

const getAllAdminUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { business: req.businessId, role: { $in: ALLOWED_ROLES } };
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    return sendPaginated(res, users, total, page, limit, 'users');
  } catch (error) { return handleError(res, error, 'getAllAdminUsers'); }
};

// Invite flow: create an inactive User with a hashed token, send email containing
// the raw token in the URL. Admin never sees a cleartext password; the invitee
// sets their own on the accept page.
const inviteUser = async (req, res) => {
  try {
    const { email, name, role = 'staff', permissions, roleId } = req.body;
    if (!email || !String(email).trim())   return sendError(res, 400, 'Email is required.');
    if (!name  || !String(name).trim())    return sendError(res, 400, 'Name is required.');
    if (!ALLOWED_ROLES.includes(role))     return sendError(res, 400, `Role must be one of: ${ALLOWED_ROLES.join(', ')}.`);

    // If roleId is provided, its permissions take precedence over the raw
    // permissions[] array. This is how Admin-assigned role-based access works.
    let resolvedPermissions = Array.isArray(permissions) ? permissions : [];
    if (roleId) {
      const assignedRole = await resolveAssignableRole(roleId, req.businessId);
      if (!assignedRole) return sendError(res, 400, 'Selected role is invalid or not accessible.');
      resolvedPermissions = assignedRole.permissions.slice();
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return sendError(res, 400, 'A user with that email already exists.');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed = hashToken(rawToken);
    // User.password is required by the schema; give a throwaway random value that
    // the accept-invite flow overwrites before the user logs in.
    const placeholderPassword = crypto.randomBytes(24).toString('hex');

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: placeholderPassword,
      role,
      business: req.businessId,
      permissions: resolvedPermissions,
      isActive: false,
      isEmailVerified: false,
      inviteToken: hashed,
      inviteExpire: new Date(Date.now() + INVITE_TTL_MS),
    });

    const inviteUrl = `${clientBase()}/accept-invite?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;
    try {
      await emailService.sendInviteEmail(
        normalizedEmail, user.name, req.user?.name || 'An admin', role, inviteUrl, req.businessId,
      );
    } catch (mailErr) {
      console.error('[inviteUser] email failed:', mailErr.message);
    }

    const out = user.toObject();
    delete out.password;
    delete out.inviteToken;
    delete out.inviteExpire;
    return sendSuccess(res, 201, 'Invitation sent.', { user: out });
  } catch (error) { return handleError(res, error, 'inviteUser'); }
};

const updateAdminUser = async (req, res) => {
  try {
    // Strict allowlist — email, password, isActive, business, role-to-super_admin
    // must NEVER be settable via this endpoint.
    const { name, role, permissions, roleId } = req.body;
    const patch = {};
    if (name !== undefined) patch.name = String(name).trim();
    if (role !== undefined) {
      if (!ALLOWED_ROLES.includes(role)) return sendError(res, 400, `Role must be one of: ${ALLOWED_ROLES.join(', ')}.`);
      patch.role = role;
    }
    // roleId wins over raw permissions[] when both are provided.
    if (roleId) {
      const assignedRole = await resolveAssignableRole(roleId, req.businessId);
      if (!assignedRole) return sendError(res, 400, 'Selected role is invalid or not accessible.');
      patch.permissions = assignedRole.permissions.slice();
    } else if (permissions !== undefined) {
      if (!Array.isArray(permissions)) return sendError(res, 400, 'Permissions must be an array.');
      patch.permissions = permissions;
    }
    if (Object.keys(patch).length === 0) return sendError(res, 400, 'No updatable fields provided.');

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId, role: { $in: ALLOWED_ROLES } },
      patch,
      { new: true, runValidators: true },
    );
    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'User updated', { user });
  } catch (error) { return handleError(res, error, 'updateAdminUser'); }
};

const toggleUserStatus = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return sendError(res, 400, 'You cannot deactivate your own account.');
    }
    const user = await User.findOne({
      _id: req.params.id, business: req.businessId, role: { $in: ALLOWED_ROLES },
    });
    if (!user) return sendError(res, 404, 'User not found');
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    return sendSuccess(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'}`, { user });
  } catch (error) { return handleError(res, error, 'toggleUserStatus'); }
};

// Admin-triggered email-based reset. Does NOT accept a cleartext password.
const resetUserPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id, business: req.businessId, role: { $in: ALLOWED_ROLES },
    });
    if (!user) return sendError(res, 404, 'User not found');

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${clientBase()}/reset-password/${rawToken}`;
    try {
      await emailService.sendPasswordReset(user.email, user.name, resetUrl, req.businessId);
    } catch (mailErr) {
      console.error('[resetUserPassword] email failed:', mailErr.message);
    }

    return sendSuccess(res, 200, 'Password reset email sent.');
  } catch (error) { return handleError(res, error, 'resetUserPassword'); }
};

const deleteAdminUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return sendError(res, 400, 'You cannot delete your own account');
    }
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      business: req.businessId,
      role: { $in: ALLOWED_ROLES },
    });
    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'User deleted');
  } catch (error) { return handleError(res, error, 'deleteAdminUser'); }
};

module.exports = {
  getAllAdminUsers, inviteUser, updateAdminUser,
  toggleUserStatus, resetUserPassword, deleteAdminUser,
};
