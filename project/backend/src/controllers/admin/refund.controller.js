const Refund = require('../../models/Refund.model');
const Invoice = require('../../models/Invoice.model');
const Order = require('../../models/Order.model');
const Corporate = require('../../models/Corporate.model');
const emailService = require('../../services/email.service');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};


async function notifyCorporate(refund, subject, line) {
  try {
    const corp = await Corporate.findById(refund.corporate).select('email companyName');
    if (!corp?.email) return;
    await emailService.sendMail({
      to: corp.email,
      subject,
      html:
        `<p>Hi ${corp.companyName || 'there'},</p>` +
        `<p>${line}</p>` +
        `<ul>` +
          `<li><strong>Amount:</strong> ${refund.amount}</li>` +
          (refund.reason ? `<li><strong>Reason:</strong> ${refund.reason}</li>` : '') +
          (refund.referenceNumber ? `<li><strong>Reference:</strong> ${refund.referenceNumber}</li>` : '') +
        `</ul>`,
      businessId: refund.business,
      templateType: 'refund_status',
      referenceId: refund._id,
    });
  } catch (err) {
    console.error('[refund.notifyCorporate] email failed:', err.message);
  }
}


const initiateRefundForOrder = async (req, res) => {
  try {
    const { amount, reason, notes } = req.body;
    const order = await Order.findOne({ _id: req.params.id, business: req.businessId });
    if (!order) return sendError(res, 404, 'Order not found');
    if (order.status !== 'cancelled') {
      return sendError(res, 400, 'Refunds can only be initiated for cancelled orders.');
    }

   
    const existing = await Refund.findOne({
      business: req.businessId,
      status: { $in: ['pending', 'processed'] },
    }).populate({
      path: 'invoice',
      match: { order: order._id },
      select: 'order',
    });
    if (existing && existing.invoice) {
      return sendError(res, 400, 'A refund already exists for this order.');
    }

    const refundAmount = Number(amount ?? order.totalAmount);
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return sendError(res, 400, 'Refund amount must be greater than zero.');
    }

    const invoice = await Invoice.findOne({ order: order._id, business: req.businessId });

    const refund = await Refund.create({
      business: req.businessId,
      invoice: invoice?._id,   // may be undefined — schema requires it
      corporate: order.corporate,
      amount: refundAmount,
      reason: String(reason || order.cancelReason || 'Order cancelled').trim(),
      notes,
      status: 'pending',
    });

    await notifyCorporate(
      refund,
      'Refund initiated',
      `We've initiated a refund of <strong>${refundAmount}</strong> for your cancelled order <strong>${order.orderNumber}</strong>. We'll email again once it's processed.`,
    );

    return sendSuccess(res, 201, 'Refund initiated', { refund });
  } catch (error) {
    
    if (error?.errors?.invoice) {
      return sendError(res, 400, 'Cannot initiate refund: no invoice exists for this order.');
    }
    return handleError(res, error, 'initiateRefundForOrder');
  }
};

const listRefunds = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { business: req.businessId };
    if (req.query.status) filter.status = req.query.status;
    const [refunds, total] = await Promise.all([
      Refund.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate('corporate', 'companyName email')
        .populate({ path: 'invoice', select: 'invoiceNumber order', populate: { path: 'order', select: 'orderNumber' } })
        .populate('processedBy', 'name email'),
      Refund.countDocuments(filter),
    ]);
    return sendPaginated(res, refunds, total, page, limit, 'refunds');
  } catch (error) { return handleError(res, error, 'listRefunds'); }
};

const getRefund = async (req, res) => {
  try {
    const refund = await Refund.findOne({ _id: req.params.id, business: req.businessId })
      .populate('corporate', 'companyName email')
      .populate({ path: 'invoice', populate: { path: 'order', select: 'orderNumber' } })
      .populate('processedBy', 'name email');
    if (!refund) return sendError(res, 404, 'Refund not found');
    return sendSuccess(res, 200, 'Refund fetched', { refund });
  } catch (error) { return handleError(res, error, 'getRefund'); }
};


const processRefund = async (req, res) => {
  try {
    const { referenceNumber, notes } = req.body;
    if (!referenceNumber || !String(referenceNumber).trim()) {
      return sendError(res, 400, 'A payment reference number is required to mark a refund as processed.');
    }
    const refund = await Refund.findOne({ _id: req.params.id, business: req.businessId });
    if (!refund) return sendError(res, 404, 'Refund not found');
    if (refund.status !== 'pending') {
      return sendError(res, 400, `Refund is already ${refund.status}.`);
    }
    refund.status = 'processed';
    refund.referenceNumber = String(referenceNumber).trim();
    if (notes !== undefined) refund.notes = notes;
    refund.processedBy = req.user?._id;
    refund.processedAt = new Date();
    await refund.save();

    await notifyCorporate(
      refund,
      'Refund processed',
      `Your refund of <strong>${refund.amount}</strong> has been processed.`,
    );

    return sendSuccess(res, 200, 'Refund processed', { refund });
  } catch (error) { return handleError(res, error, 'processRefund'); }
};

const rejectRefund = async (req, res) => {
  try {
    const { reason } = req.body;
    const refund = await Refund.findOne({ _id: req.params.id, business: req.businessId });
    if (!refund) return sendError(res, 404, 'Refund not found');
    if (refund.status !== 'pending') {
      return sendError(res, 400, `Refund is already ${refund.status}.`);
    }
    refund.status = 'rejected';
    if (reason !== undefined) refund.notes = String(reason).trim();
    refund.processedBy = req.user?._id;
    refund.processedAt = new Date();
    await refund.save();

    await notifyCorporate(
      refund,
      'Refund request declined',
      `Unfortunately we were unable to process your refund request. ${refund.notes ? 'Reason: ' + refund.notes : ''}`,
    );

    return sendSuccess(res, 200, 'Refund rejected', { refund });
  } catch (error) { return handleError(res, error, 'rejectRefund'); }
};

module.exports = {
  initiateRefundForOrder, listRefunds, getRefund, processRefund, rejectRefund,
};
