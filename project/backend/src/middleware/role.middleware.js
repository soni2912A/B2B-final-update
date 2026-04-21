const { sendError } = require('../utils/responseHelper');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, `Role '${req.user.role}' is not authorized to access this route`);
    }
    next();
  };
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.user.role === 'super_admin' || req.user.role === 'admin') return next();
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return sendError(res, 403, 'You do not have permission to perform this action');
    }
    next();
  };
};

module.exports = { authorize, checkPermission };
