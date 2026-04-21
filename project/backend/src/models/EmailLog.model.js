const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  templateType: { type: String },
  // 'bounced' is reserved for future SMTP bounce webhook handlers (e.g. SES
   // notifications) — the sendMail path never writes it directly. 'skipped' is
   // only used in dev when SMTP isn't configured.
  status: { type: String, enum: ['sent', 'failed', 'pending', 'skipped', 'bounced'], default: 'pending' },
  errorMessage: { type: String },
  sentAt: { type: Date },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  referenceModel: { type: String },
  attempts: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('EmailLog', emailLogSchema);
