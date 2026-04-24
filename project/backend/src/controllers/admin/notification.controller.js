const Notification = require('../../models/Notification.model');
const notificationService = require('../../services/notification.service');
const { sendSuccess, sendError } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

const getNotifications = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { recipient: req.user._id };
    if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);
    return sendSuccess(res, 200, 'Notifications fetched', { notifications, total, unreadCount, page, limit });
  } catch (e) { return handleError(res, e, 'getNotifications'); }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    return sendSuccess(res, 200, 'Unread count fetched', { count });
  } catch (e) { return handleError(res, e, 'getUnreadCount'); }
};

const markRead = async (req, res) => {
  try {
    const result = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!result) return sendError(res, 404, 'Notification not found');
    return sendSuccess(res, 200, 'Notification marked as read', { notification: result });
  } catch (e) { return handleError(res, e, 'markRead'); }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return sendSuccess(res, 200, 'All notifications marked as read');
  } catch (e) { return handleError(res, e, 'markAllRead'); }
};

const PREF_DEFAULTS = {
  newOrderPlaced:         { email: true, inApp: true },
  orderCancelled:         { email: true, inApp: true },
  lowStockAlert:          { email: true, inApp: true },
  paymentReceived:        { email: true, inApp: true },
  deliveryCompleted:      { email: true, inApp: true },
  newCorporateRegistered: { email: true, inApp: true },
  newTicket:              { email: true, inApp: true },
  upcomingOccasion:       { email: true, inApp: true },
};

const mergeDefaults = (saved) => {
  const out = {};
  for (const key of Object.keys(PREF_DEFAULTS)) {
    out[key] = saved && saved[key] !== undefined ? saved[key] : PREF_DEFAULTS[key];
  }
  return out;
};

const getPreferences = async (req, res) => {
  try {
    const User = require('../../models/User.model');
    const user = await User.findById(req.user._id).select('notificationPrefs');
    return sendSuccess(res, 200, 'Preferences fetched', {
      preferences: mergeDefaults(user?.notificationPrefs),
    });
  } catch (e) { return handleError(res, e, 'getPreferences'); }
};

const updatePreferences = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return sendError(res, 400, 'Preferences must be an object.');
    }
    const sanitized = {};
    for (const key of Object.keys(PREF_DEFAULTS)) {
      if (req.body[key] !== undefined) sanitized[key] = req.body[key];
    }
    const User = require('../../models/User.model');
    await User.findByIdAndUpdate(req.user._id, { notificationPrefs: sanitized });
    return sendSuccess(res, 200, 'Preferences updated', { preferences: mergeDefaults(sanitized) });
  } catch (e) { return handleError(res, e, 'updatePreferences'); }
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, getPreferences, updatePreferences };
