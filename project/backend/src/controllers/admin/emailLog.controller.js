const EmailLog = require('../../models/EmailLog.model');
const emailService = require('../../services/email.service');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;
const NOT_RESENDABLE = new Set(['password_reset', 'invite', 'verify_email']);
const RESENDABLE_LABEL = {
  password_reset: 'Password reset',
  invite: 'Invitation',
  verify_email: 'Verification',
};

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

const getAllEmailLogs = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, status, from, to } = req.query;
    const filter = { business: req.businessId };

    if (status && status !== 'all') filter.status = status;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search && search.trim()) {
      const re = new RegExp(search.trim().replace(ESCAPE_RE, '\\$&'), 'i');
      filter.$or = [{ to: re }, { subject: re }];
    }

    const [logs, total] = await Promise.all([
      EmailLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      EmailLog.countDocuments(filter),
    ]);
    return sendPaginated(res, logs, total, page, limit, 'logs');
  } catch (error) { return handleError(res, error, 'getAllEmailLogs'); }
};

const resendEmailLog = async (req, res) => {
  try {
    const log = await EmailLog.findOne({ _id: req.params.id, business: req.businessId });
    if (!log) return sendError(res, 404, 'Log not found.');

    const type = log.templateType;
    if (NOT_RESENDABLE.has(type)) {
      return sendError(res, 400, `${RESENDABLE_LABEL[type]} links can't be resent — ask the user to request a new one.`);
    }

    switch (type) {
      case 'order_confirm':
      case 'pre_delivery':
      case 'feedback_request': {
        const Order = require('../../models/Order.model');
        const order = await Order.findOne({ _id: log.referenceId, business: req.businessId })
          .populate('corporate', 'companyName email');
        if (!order) return sendError(res, 404, 'Original order no longer exists.');
        if (type === 'order_confirm')    await emailService.sendOrderConfirmation(order);
        else if (type === 'pre_delivery') await emailService.sendPreDeliveryAlert(order);
        else                              await emailService.sendFeedbackRequest(order);
        break;
      }
      case 'delivery_confirm': {
        const Delivery = require('../../models/Delivery.model');
        const delivery = await Delivery.findOne({ _id: log.referenceId, business: req.businessId })
          .populate('corporate', 'companyName email')
          .populate('order', 'orderNumber');
        if (!delivery) return sendError(res, 404, 'Original delivery no longer exists.');
        await emailService.sendDeliveryComplete(delivery);
        break;
      }
      case 'invoice': {
        const Invoice = require('../../models/Invoice.model');
        const invoice = await Invoice.findOne({ _id: log.referenceId, business: req.businessId })
          .populate('corporate', 'companyName email');
        if (!invoice) return sendError(res, 404, 'Original invoice no longer exists.');
        await emailService.sendInvoice(invoice);
        break;
      }
      case 'low_stock_alert': {
        const Product = require('../../models/Product.model');
        const User = require('../../models/User.model');
        const product = await Product.findOne({ _id: log.referenceId, business: req.businessId }).populate('business');
        if (!product) return sendError(res, 404, 'Original product no longer exists.');
        const admin = await User.findOne({ business: req.businessId, role: 'admin', isActive: true });
        if (!admin) return sendError(res, 400, 'No active admin to notify.');
        await emailService.sendLowStockAlert(admin.email, admin.name, product);
        break;
      }
      default:
        return sendError(res, 400, `Resend not supported for template type: ${type || 'unknown'}.`);
    }

    return sendSuccess(res, 200, 'Email resent.');
  } catch (error) { return handleError(res, error, 'resendEmailLog'); }
};

module.exports = { getAllEmailLogs, resendEmailLog };
