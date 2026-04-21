const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  code: { type: String, required: true, uppercase: true },
  description: { type: String },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number },
  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 },
  applicableTo: { type: String, enum: ['all', 'specific_corporate'], default: 'all' },
  corporates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Corporate' }],
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

discountSchema.index({ business: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Discount', discountSchema);
