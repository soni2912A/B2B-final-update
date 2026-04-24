const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  corporate: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processed', 'rejected'], default: 'pending' },
  referenceNumber: { type: String },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Refund', refundSchema);
