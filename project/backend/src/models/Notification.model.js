const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['order', 'delivery', 'invoice', 'system', 'feedback', 'ticket', 'occasion', 'low_stock', 'payment', 'corporate'], default: 'system' },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  referenceModel: { type: String },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
