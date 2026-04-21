const Order = require('../../models/Order.model');
const User = require('../../models/User.model');
const Delivery = require('../../models/Delivery.model');
const Invoice = require('../../models/Invoice.model');
const invoiceService = require('../../services/invoice.service');
const notificationService = require('../../services/notification.service');
const emailService = require('../../services/email.service');
const importExportService = require('../../services/importExport.service');
const {
  ORDER_STATE_MACHINE, ALL_ORDER_STATUSES,
  checkTransition, illegalTransitionMessage,
} = require('../../constants/orderStateMachine');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination, buildSortQuery } = require('../../utils/pagination');

const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

// Shared filter builder used by list + export so one edit changes both.
const buildFilter = (req) => {
  const { search, status, from, to, corporate } = req.query;
  const filter = { business: req.businessId };
  if (status && status !== 'all') filter.status = status;
  if (corporate) filter.corporate = corporate;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  if (search && String(search).trim()) {
    const re = new RegExp(String(search).trim().replace(ESCAPE_RE, '\\$&'), 'i');
    // Corporate-name search isn't in scope this turn (flagged as a follow-up).
    filter.orderNumber = re;
  }
  return filter;
};

const getAllOrders = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const sort = buildSortQuery(req.query);
    const filter = buildFilter(req);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(limit)
        .populate('corporate', 'companyName email')
        .populate('assignedTo', 'name email'),
      Order.countDocuments(filter),
    ]);
    return sendPaginated(res, orders, total, page, limit, 'orders');
  } catch (error) { return handleError(res, error, 'getAllOrders'); }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, business: req.businessId })
      .populate('corporate')
      .populate('items.product', 'name sku')
      .populate('items.staffMembers', 'firstName lastName')
      .populate('assignedTo', 'name email')
      .populate('discount');
    if (!order) return sendError(res, 404, 'Order not found');
    return sendSuccess(res, 200, 'Order fetched', { order });
  } catch (error) { return handleError(res, error, 'getOrder'); }
};

// Returns the canonical state machine for the frontend to render legal next
// transitions without duplicating the map. See constants/orderStateMachine.js.
const getStateMachine = (req, res) => {
  return sendSuccess(res, 200, 'State machine fetched.', {
    machine: ORDER_STATE_MACHINE,
    all: ALL_ORDER_STATUSES,
  });
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return sendError(res, 400, 'status is required');
    if (!ALL_ORDER_STATUSES.includes(status)) {
      return sendError(res, 400, `Unknown status '${status}'. Valid: ${ALL_ORDER_STATUSES.join(', ')}.`);
    }

    const order = await Order.findOne({ _id: req.params.id, business: req.businessId });
    if (!order) return sendError(res, 404, 'Order not found');

    if (order.status === status) {
      // No-op transition — don't error, just return.
      return sendSuccess(res, 200, `Order already '${status}'.`, { order });
    }

    const { isLegal } = checkTransition(order.status, status);
    if (!isLegal) {
      return sendError(res, 400, illegalTransitionMessage(order.status, status));
    }

    order.status = status;
    await order.save();
    await order.populate('corporate');

    if (status === 'delivered') {
      try {
        await invoiceService.generateInvoice(order);
        // Mirror the delivery-completion side effects so corporates get the same
        // emails regardless of which path flipped the order to 'delivered'.
        // generateInvoice is idempotent — no risk of duplicate emails via the
        // delivery path (each caller runs once per state change).
        const invoice = await Invoice.findOne({ order: order._id }).populate('corporate', 'email companyName');
        if (invoice?.corporate?.email) {
          await emailService.sendInvoice(invoice);
        }
      } catch (err) {
        console.error('[updateOrderStatus] invoice generation/email failed:', err.message);
      }
    }

    return sendSuccess(res, 200, `Order status updated to ${status}`, { order });
  } catch (error) { return handleError(res, error, 'updateOrderStatus'); }
};

const assignOrder = async (req, res) => {
  try {
    const { staffId } = req.body;
    if (!staffId) return sendError(res, 400, 'staffId is required');

    // Tenant-scope the staff user — prevents cross-tenant assignment. Must be
    // an active admin/staff role within this business.
    const staff = await User.findOne({
      _id: staffId,
      business: req.businessId,
      role: { $in: ['admin', 'staff'] },
      isActive: true,
    }).select('_id name email');
    if (!staff) return sendError(res, 400, 'Assigned user is not a valid staff member for this business.');

    const order = await Order.findOne({ _id: req.params.id, business: req.businessId });
    if (!order) return sendError(res, 404, 'Order not found');

    const { isLegal } = checkTransition(order.status, 'assigned');
    if (!isLegal) {
      return sendError(res, 400, illegalTransitionMessage(order.status, 'assigned'));
    }

    order.status = 'assigned';
    order.assignedTo = staff._id;
    await order.save();
    await order.populate('corporate', 'email companyName').populate('assignedTo', 'name email');

    // Fire-and-forget: staff email + in-app notifications to staff and
    // corporate users. Don't block the HTTP response on the mailer.
    notificationService.notifyOrderAssigned(order, staff._id, req.user?._id)
      .catch(err => console.error('[assignOrder] notifyOrderAssigned failed:', err.message));

    return sendSuccess(res, 200, 'Order assigned', { order });
  } catch (error) { return handleError(res, error, 'assignOrder'); }
};

// ─── Bulk pre-delivery reminders (item #11) ─────────────────────────────────
// Finds orders delivering in the next `days` days (inclusive of today) whose
// status isn't terminal, emails each corporate, and returns a count. Idempotent
// in practice — re-running simply re-sends; callers can tighten the window or
// add a `preDeliveryAlertSent: false` filter later if spam becomes an issue.
const sendBulkDeliveryReminders = async (req, res) => {
  try {
    const days = Math.max(1, Math.min(14, Number(req.query.days) || 2));

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      business: req.businessId,
      deliveryDate: { $gte: start, $lte: end },
      status: { $in: ['new', 'scheduled', 'processing', 'assigned', 'out_for_delivery'] },
    }).populate('corporate', 'email companyName');

    const candidates = orders.filter(o => o.corporate && o.corporate.email);
    let sent = 0;
    const failed = [];
    for (const order of candidates) {
      try {
        await emailService.sendPreDeliveryAlert(order);
        sent++;
      } catch (err) {
        failed.push({ orderNumber: order.orderNumber, error: err.message });
      }
    }

    // Mark so the existing cron can skip the ones we just handled.
    if (sent > 0) {
      await Order.updateMany(
        { _id: { $in: candidates.map(o => o._id) } },
        { preDeliveryAlertSent: true },
      );
    }

    return sendSuccess(res, 200, `Reminders sent to ${sent} client${sent === 1 ? '' : 's'}.`, {
      windowDays: days,
      eligibleOrders: orders.length,
      sent,
      failed,
    });
  } catch (error) { return handleError(res, error, 'sendBulkDeliveryReminders'); }
};

const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    // Atomic transition gate via $in of source states. Avoids a race between
    // read-validate-update when two admins cancel at once.
    const sources = Object.entries(ORDER_STATE_MACHINE)
      .filter(([, targets]) => targets.includes('cancelled'))
      .map(([src]) => src);

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId, status: { $in: sources } },
      { status: 'cancelled', cancelReason: reason, cancelledAt: new Date() },
      { new: true },
    );
    if (!order) {
      // Either not found or already in a terminal state.
      const existing = await Order.findOne({ _id: req.params.id, business: req.businessId });
      if (!existing) return sendError(res, 404, 'Order not found');
      return sendError(res, 400, illegalTransitionMessage(existing.status, 'cancelled'));
    }

    notificationService.notifyOrderCancelled(order)
      .catch(err => console.error('[cancelOrder] notifyOrderCancelled failed:', err.message));

    return sendSuccess(res, 200, 'Order cancelled', { order });
  } catch (error) { return handleError(res, error, 'cancelOrder'); }
};

const sendPreDeliveryAlert = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, business: req.businessId })
      .populate('corporate');
    if (!order) return sendError(res, 404, 'Order not found');
    const emailService = require('../../services/email.service');
    await emailService.sendPreDeliveryAlert(order);
    await Order.findByIdAndUpdate(req.params.id, { preDeliveryAlertSent: true });
    return sendSuccess(res, 200, 'Pre-delivery alert sent');
  } catch (error) { return handleError(res, error, 'sendPreDeliveryAlert'); }
};

const exportOrders = async (req, res) => {
  try {
    const { format = 'xlsx' } = req.query;
    if (!['xlsx', 'csv', 'pdf'].includes(String(format).toLowerCase())) {
      return sendError(res, 400, 'Invalid format. Supported: xlsx, csv, pdf.');
    }
    const filter = buildFilter(req);
    const orders = await Order.find(filter)
      .populate('corporate', 'companyName email')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const dataset = {
      title: 'Orders',
      columns: ['Order No.', 'Corporate', 'Status', 'Items', 'Subtotal', 'Total Amount', 'Delivery Date', 'Assigned To', 'Created On'],
      widths: [16, 24, 12, 8, 14, 14, 14, 18, 16],
      rows: orders.map(o => [
        o.orderNumber || '—',
        o.corporate?.companyName || '—',
        o.status || '—',
        Array.isArray(o.items) ? o.items.length : 0,
        Number((o.subtotal || 0).toFixed(2)),
        Number((o.totalAmount || 0).toFixed(2)),
        o.deliveryDate ? new Date(o.deliveryDate).toISOString().slice(0, 10) : '—',
        o.assignedTo?.name || '—',
        o.createdAt ? new Date(o.createdAt).toISOString() : '—',
      ]),
    };
    const handled = importExportService.sendExport(res, format, dataset, `orders-${Date.now()}`);
    if (!handled) return sendError(res, 400, 'Invalid format.');
  } catch (error) { return handleError(res, error, 'exportOrders'); }
};

module.exports = {
  getAllOrders, getOrder, getStateMachine,
  updateOrderStatus, assignOrder, cancelOrder,
  sendPreDeliveryAlert, sendBulkDeliveryReminders, exportOrders,
};
