const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  type: {
    type: String,
    enum: ['order_confirm', 'order_assigned', 'pre_delivery', 'delivery_confirm', 'invoice', 'feedback_request', 'welcome', 'password_reset'],
    required: true,
  },
  placeholders: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
