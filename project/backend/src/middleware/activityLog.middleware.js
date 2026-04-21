const ActivityLog = require('../models/ActivityLog.model');

const logActivity = (module, action, getDescription) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      try {
        await ActivityLog.create({
          business: req.businessId || req.user.business,
          user: req.user._id,
          action,
          module,
          description: getDescription ? getDescription(req) : `${action} in ${module}`,
          referenceId: req.params.id || null,
          ipAddress: req.ip,
        });
      } catch (err) {
        console.error('Activity log error:', err.message);
      }
    }
  });
  next();
};

module.exports = { logActivity };
