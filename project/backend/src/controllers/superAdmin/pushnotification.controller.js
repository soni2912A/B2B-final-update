const mongoose = require('mongoose');
const Notification = require('../../models/Notification.model');
const User = require('../../models/User.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

const pushLogSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  audience:  { type: String, default: 'all' },
  sentCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const PushNotificationLog =
  mongoose.models.PushNotificationLog ||
  mongoose.model('PushNotificationLog', pushLogSchema);


const AUDIENCE_ROLE_MAP = {
  all:       ['admin', 'staff', 'corporate_user'],
  admin:     ['admin'],
  corporate: ['corporate_user'],
  staff:     ['staff'],
};

exports.sendPushNotification = async (req, res) => {
  try {
    const { title, message, audience = 'all' } = req.body;
    if (!title || !message) return sendError(res, 400, 'title and message are required.');

    if (!AUDIENCE_ROLE_MAP[audience]) {
      return sendError(res, 400, `audience must be one of: ${Object.keys(AUDIENCE_ROLE_MAP).join(', ')}`);
    }

    const roles = AUDIENCE_ROLE_MAP[audience];
    const users = await User.find({ role: { $in: roles }, isActive: true }).select('_id');

    if (users.length === 0) {
      return sendSuccess(res, 200, 'No active users found for that audience.', { sentCount: 0 });
    }

    const notifDocs = users.map(u => ({
      recipient: u._id,
      title:     title.trim(),
      message:   message.trim(),
      type:      'system',
    }));
    await Notification.insertMany(notifDocs);

    
    const log = await PushNotificationLog.create({
      title:     title.trim(),
      message:   message.trim(),
      audience,
      sentCount: users.length,
      createdBy: req.user._id,
    });

    return sendSuccess(res, 201, `Notification sent to ${users.length} users.`, {
      sentCount: users.length,
      log,
    });
  } catch (err) {
    console.error('[push-notification] sendPushNotification error:', err);
    return sendError(res, 500, err.message);
  }
};


exports.getPushNotifications = async (req, res) => {
  try {
    const logs = await PushNotificationLog.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    return sendSuccess(res, 200, 'OK', { notifications: logs });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

exports.deletePushNotification = async (req, res) => {
  try {
    const log = await PushNotificationLog.findByIdAndDelete(req.params.id);
    if (!log) return sendError(res, 404, 'Notification log not found.');
    return sendSuccess(res, 200, 'Deleted.');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};