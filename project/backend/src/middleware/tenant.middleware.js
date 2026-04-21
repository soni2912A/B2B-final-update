const { sendError } = require('../utils/responseHelper');
const Business = require('../models/Business.model');

const tenantScope = async (req, res, next) => {
  if (req.user.role === 'super_admin') {
    // super_admin: use query param ?businessId=... or fall back to first business
    if (req.query.businessId || req.body.businessId) {
      req.businessId = req.query.businessId || req.body.businessId;
    } else {
      const biz = await Business.findOne().sort({ createdAt: 1 });
      if (biz) req.businessId = biz._id;
    }
    return next();
  }
  if (!req.user.business) return sendError(res, 403, 'No business associated with this account');
  req.businessId = req.user.business;
  next();
};

module.exports = { tenantScope };