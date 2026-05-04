const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  maxCorporates: { type: Number, default: 10 },
  maxStaffPerCorporate: { type: Number, default: 100 },
  maxOrders: { type: Number, default: 500 },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true },

  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },  
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['pending', 'active', 'expired', 'cancelled'], default: 'active' },

  activationToken: { type: String, select: false },
  paidAt: { type: Date },
  paymentReference: { type: String },

  // Coupon applied at registration
  couponCode:     { type: String, default: null },
  discountAmount: { type: Number, default: 0 },

  // Referral code used at registration
  referralCode: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);