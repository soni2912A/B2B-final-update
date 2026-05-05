const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: false, default: null },

  
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  
  code: { type: String, required: true, uppercase: true, trim: true },

  
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

  totalClicks:      { type: Number, default: 0 },
  totalConversions: { type: Number, default: 0 },

 
  maxUses:   { type: Number, default: 10 },

  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date }, 
  expiredAt: { type: Date }, 
  supersededBy: { type: String, default: null }, 
}, { timestamps: true });


referralSchema.index({ referrer: 1, isActive: 1 });
referralSchema.index({ code: 1 }, { unique: true });    

module.exports = mongoose.model('Referral', referralSchema);