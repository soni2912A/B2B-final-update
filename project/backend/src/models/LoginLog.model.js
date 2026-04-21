const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  attemptedEmail: { type: String }, // captures email when user not found
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  ipAddress: { type: String },
  userAgent: { type: String },
  browser: { type: String },
  os: { type: String },
  device: { type: String },
  location: { type: String },
  status: { type: String, enum: ['success', 'failed'], required: true },
  failureReason: { type: String },
  loggedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('LoginLog', loginLogSchema);
