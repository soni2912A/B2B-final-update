const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  // null when the referrer is a super_admin (not tied to any business)
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: false, default: null },

  // The user who owns this referral code (admin or corporate_user or super_admin)
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Unique code embedded in the shareable link
  code: { type: String, required: true, uppercase: true, trim: true },

  // Every successful signup that used this code
  conversions: [
    {
      referredUser:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      referredCorporate: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate' },
      convertedAt:     { type: Date, default: Date.now },
      rewardGiven:     { type: Boolean, default: false },
      rewardType:      { type: String, enum: ['credit', 'discount', 'none'], default: 'none' },
      rewardValue:     { type: Number, default: 0 },
    },
  ],

  // Running totals (denormalised for fast dashboard queries)
  totalClicks:      { type: Number, default: 0 },
  totalConversions: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date }, // optional expiry; leave unset for permanent codes
}, { timestamps: true });

referralSchema.index({ referrer: 1 }, { unique: true }); // one code per user globally
referralSchema.index({ code: 1 }, { unique: true });     // codes must be globally unique

module.exports = mongoose.model('Referral', referralSchema);