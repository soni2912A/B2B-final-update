const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const emailService = require('./email.service');

// Prefs are keyed per-event (not per-type) so two events sharing a `type`
// (e.g. newOrderPlaced and orderCancelled both use type 'order') can be
// toggled independently. Each helper passes its own `prefKey` explicitly.

// Opt-out semantics: missing/undefined prefs → notify.
// Supports legacy boolean prefs (`prefs[key] === true|false`) and structured
// `{ email, inApp }` entries. Only the inApp channel is checked here.
const isInAppOptedIn = (prefs, prefKey) => {
  if (!prefs || !prefKey) return true;
  const entry = prefs[prefKey];
  if (entry === undefined || entry === null) return true;
  if (typeof entry === 'boolean') return entry;
  return entry.inApp !== false;
};

// Single-recipient gate.
const shouldNotify = async (userId, prefKey) => {
  if (!userId) return false;
  if (!prefKey) return true;
  const user = await User.findById(userId).select('notificationPrefs');
  if (!user) return false;
  return isInAppOptedIn(user.notificationPrefs, prefKey);
};

const createNotification = async ({ business, recipient, title, message, type, referenceId, referenceModel }) => {
  return await Notification.create({ business, recipient, title, message, type, referenceId, referenceModel });
};

// Bulk fan-out: one Notification per recipient, skipping actor, deduplicating,
// and filtering out recipients who've opted out of the in-app channel for this prefKey.
const fanOut = async ({ recipients, actorUserId, payload, prefKey }) => {
  if (!Array.isArray(recipients) || recipients.length === 0) return [];
  const actorKey = actorUserId ? String(actorUserId) : null;
  const seen = new Set();
  const candidateIds = [];
  for (const u of recipients) {
    if (!u || !u._id) continue;
    const id = String(u._id);
    if (actorKey && id === actorKey) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    candidateIds.push(u._id);
  }
  if (candidateIds.length === 0) return [];

  let allowedIds = candidateIds;
  if (prefKey) {
    const users = await User.find({ _id: { $in: candidateIds } }).select('notificationPrefs');
    const allowSet = new Set(
      users.filter(u => isInAppOptedIn(u.notificationPrefs, prefKey)).map(u => String(u._id))
    );
    allowedIds = candidateIds.filter(id => allowSet.has(String(id)));
  }
  if (allowedIds.length === 0) return [];

  const docs = allowedIds.map(_id => ({ ...payload, recipient: _id }));
  return Notification.insertMany(docs);
};

// ─── Event 1 — New order placed ──────────────────────────────────────────────
const notifyNewOrder = async (order, actorUserId) => {
  const admins = await User.find({
    business: order.business,
    role: { $in: ['admin', 'staff'] },
    isActive: true,
  }).select('_id');
  await fanOut({
    recipients: admins,
    actorUserId,
    prefKey: 'newOrderPlaced',
    payload: {
      business: order.business,
      title: 'New Order',
      message: `Order ${order.orderNumber || ''} placed${order.corporate && order.corporate.companyName ? ` by ${order.corporate.companyName}` : ''}.`,
      type: 'order',
      referenceId: order._id,
      referenceModel: 'Order',
    },
  });
  try { await emailService.sendOrderConfirmation(order); }
  catch (err) { console.error('[notifyNewOrder] email failed:', err.message); }
};

// ─── Event 2 — Low stock alert (fires only when threshold is crossed) ───────
// previousStock is passed explicitly by the caller — the helper doesn't infer it.
const notifyLowStockIfCrossed = async (product, previousStock, actorUserId) => {
  if (!product) return;
  const threshold = product.lowStockThreshold ?? 0;
  const current = product.stockQuantity ?? 0;
  const crossed = Number(previousStock) > threshold && current <= threshold;
  if (!crossed) return;

  const admins = await User.find({
    business: product.business,
    role: 'admin',
    isActive: true,
  }).select('_id');
  await fanOut({
    recipients: admins,
    actorUserId,
    prefKey: 'lowStockAlert',
    payload: {
      business: product.business,
      title: 'Low Stock Alert',
      message: `${product.name} stock is at ${current} (threshold ${threshold}).`,
      type: 'low_stock',
      referenceId: product._id,
      referenceModel: 'Product',
    },
  });
};

// ─── Event 3 — Invoice payment received ──────────────────────────────────────
const notifyPaymentReceived = async (invoice, actorUserId) => {
  const [corpUsers, admins] = await Promise.all([
    User.find({
      business: invoice.business,
      corporate: invoice.corporate,
      role: 'corporate_user',
      isActive: true,
    }).select('_id'),
    User.find({
      business: invoice.business,
      role: 'admin',
      isActive: true,
    }).select('_id'),
  ]);
  await fanOut({
    recipients: [...corpUsers, ...admins],
    actorUserId,
    prefKey: 'paymentReceived',
    payload: {
      business: invoice.business,
      title: 'Payment Received',
      message: `Invoice ${invoice.invoiceNumber || ''} marked as paid.`,
      type: 'payment',
      referenceId: invoice._id,
      referenceModel: 'Invoice',
    },
  });
};

// ─── Event 4 — Delivery completed ────────────────────────────────────────────
// Fires: (1) in-app notification to the user who placed the order,
//        (2) "Your order has been delivered" email to the corporate,
//        (3) generated invoice email to the corporate (if an invoice exists
//            for this order — invoiceService.generateInvoice is idempotent so
//            the caller may also have already created one).
const notifyDeliveryComplete = async (delivery) => {
  const Order = require('../models/Order.model');
  const Invoice = require('../models/Invoice.model');

  let order = delivery.order;
  if (order && (!order.placedBy || !order.orderNumber)) {
    order = await Order.findById(order._id || order).select('placedBy orderNumber business');
  }
  if (order && order.placedBy && await shouldNotify(order.placedBy, 'deliveryCompleted')) {
    await createNotification({
      business: delivery.business || order.business,
      recipient: order.placedBy,
      title: 'Delivery Completed',
      message: `Order ${order.orderNumber || ''} has been delivered.`,
      type: 'delivery',
      referenceId: delivery._id,
      referenceModel: 'Delivery',
    });
  }

  try { await emailService.sendDeliveryComplete(delivery); }
  catch (err) { console.error('[notifyDeliveryComplete] delivery email failed:', err.message); }

  // Find the invoice for this order and email it to the corporate. We don't
  // generate one here — that's the delivery controller's job (idempotent via
  // the unique {order} index on Invoice). This lookup may run just after the
  // generation, so the invoice is almost always present; if missing, we skip.
  try {
    const orderId = order?._id || delivery.order?._id || delivery.order;
    if (orderId) {
      const invoice = await Invoice.findOne({ order: orderId }).populate('corporate', 'email companyName');
      if (invoice && invoice.corporate?.email) {
        await emailService.sendInvoice(invoice);
      }
    }
  } catch (err) {
    console.error('[notifyDeliveryComplete] invoice email failed:', err.message);
  }
};

// ─── Event 5 — New corporate registration ────────────────────────────────────
const notifyNewCorporate = async (corporate, actorUserId) => {
  const recipients = await User.find({
    $or: [
      { business: corporate.business, role: 'admin', isActive: true },
      { role: 'super_admin', isActive: true },
    ],
  }).select('_id');
  await fanOut({
    recipients,
    actorUserId,
    prefKey: 'newCorporateRegistered',
    payload: {
      business: corporate.business,
      title: 'New Corporate Registered',
      message: `${corporate.companyName || 'A new corporate'} has been registered.`,
      type: 'corporate',
      referenceId: corporate._id,
      referenceModel: 'Corporate',
    },
  });
};

// ─── Event — Order assigned to delivery staff ───────────────────────────────
// Fan-out: assigned staff user + all active corporate_users on the corporate.
// Email: direct template to the assigned staff member ("This order has been
// assigned to you"). Corporate users receive in-app only (noise-sensitive).
const notifyOrderAssigned = async (order, assignedUserId, actorUserId) => {
  if (!order || !assignedUserId) return;

  // Ensure order has populated fields the email template needs.
  const Order = require('../models/Order.model');
  let fullOrder = order;
  if (!order.corporate || typeof order.corporate === 'string' || !order.orderNumber) {
    fullOrder = await Order.findById(order._id || order)
      .populate('corporate', 'email companyName');
  }

  const assignedUser = await User.findById(assignedUserId).select('_id name email');
  const corpUsers = await User.find({
    business: fullOrder.business,
    corporate: fullOrder.corporate?._id || fullOrder.corporate,
    role: 'corporate_user',
    isActive: true,
  }).select('_id');

  await fanOut({
    recipients: [assignedUser, ...corpUsers].filter(Boolean),
    actorUserId,
    prefKey: 'orderAssigned',
    payload: {
      business: fullOrder.business,
      title: 'Order Assigned',
      message: `Order ${fullOrder.orderNumber || ''} has been assigned${assignedUser ? ' to ' + assignedUser.name : ''}.`,
      type: 'order',
      referenceId: fullOrder._id,
      referenceModel: 'Order',
    },
  });

  if (assignedUser?.email) {
    try { await emailService.sendOrderAssignedToStaff(fullOrder, assignedUser); }
    catch (err) { console.error('[notifyOrderAssigned] email failed:', err.message); }
  }
};

// ─── Event — Order cancelled (single recipient: the user who placed it) ─────
const notifyOrderCancelled = async (order) => {
  if (!order || !order.placedBy) return;
  if (!await shouldNotify(order.placedBy, 'orderCancelled')) return;
  const reason = order.cancelReason && String(order.cancelReason).trim();
  const message = reason
    ? `Order ${order.orderNumber || ''} was cancelled: ${reason}.`
    : `Order ${order.orderNumber || ''} was cancelled.`;
  await createNotification({
    business: order.business,
    recipient: order.placedBy,
    title: 'Order Cancelled',
    message: message.trim(),
    type: 'order',
    referenceId: order._id,
    referenceModel: 'Order',
  });
};

// ─── Event — New support ticket (fan-out to admins + staff, skip actor) ─────
const notifyNewTicket = async (ticket, actorUserId) => {
  const recipients = await User.find({
    business: ticket.business,
    role: { $in: ['admin', 'staff'] },
    isActive: true,
  }).select('_id');
  await fanOut({
    recipients,
    actorUserId,
    prefKey: 'newTicket',
    payload: {
      business: ticket.business,
      title: 'New Support Ticket',
      message: `Ticket ${ticket.ticketNumber || ''}: ${ticket.subject}`.trim(),
      type: 'ticket',
      referenceId: ticket._id,
      referenceModel: 'Ticket',
    },
  });
};

const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ recipient: userId, isRead: false });
};

const markAllRead = async (userId) => {
  await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true, readAt: new Date() });
};

module.exports = {
  createNotification,
  notifyNewOrder,
  notifyOrderCancelled,
  notifyOrderAssigned,
  notifyLowStockIfCrossed,
  notifyPaymentReceived,
  notifyDeliveryComplete,
  notifyNewCorporate,
  notifyNewTicket,
  getUnreadCount,
  markAllRead,
  shouldNotify,
};
