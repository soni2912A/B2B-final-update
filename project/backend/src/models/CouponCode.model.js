const mongoose = require('mongoose');

const couponCodeSchema = new mongoose.Schema({
  // Unique code (e.g. LAUNCH50, SAVE20)
  code: { type: String, required: true, uppercase: true, trim: true, unique: true },

  description: { type: String, trim: true },

  // discount type
  type: { type: String, enum: ['percentage', 'fixed'], required: true },

  // percentage off (0-100) or fixed INR amount off
  value: { type: Number, required: true, min: 0 },

  // max discount cap for percentage codes (null = no cap)
  maxDiscountAmount: { type: Number, default: null },

  // which subscription plans this applies to (empty = all plans)
  applicablePlans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' }],

  // how many total uses allowed (null = unlimited); default 10 for new coupons
  usageLimit: { type: Number, default: 10 },

  // how many times it's been used
  usedCount: { type: Number, default: 0 },

  // track which businesses used it
  usedBy: [{
    business:  { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
    usedAt:    { type: Date, default: Date.now },
    savedAmount: { type: Number, default: 0 },
  }],

  validFrom:  { type: Date, required: true },
  validUntil: { type: Date, required: true },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

couponCodeSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('CouponCode', couponCodeSchema);