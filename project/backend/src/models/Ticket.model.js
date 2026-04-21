const mongoose = require('mongoose');

const ticketCommentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  isInternal: { type: Boolean, default: false },
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  corporate: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate' },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ticketNumber: { type: String, unique: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['delivery', 'order', 'billing', 'technical', 'general'], default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  comments: [ticketCommentSchema],
  resolvedAt: { type: Date },
  attachments: [{ type: String }],
}, { timestamps: true });

ticketSchema.pre('save', async function (next) {
  if (!this.ticketNumber) {
    const count = await this.constructor.countDocuments({ business: this.business });
    this.ticketNumber = `TKT-${count + 1001}`;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
