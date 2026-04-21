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
  // When `business` is null, this document is a **plan template** — the catalog
  // shown during self-registration and on the super-admin plans page. When
  // `business` is set, it's a **tenant subscription instance** bound to that
  // business, with its own lifecycle (startDate, endDate, status).
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },  // ref to template plan (for instances)
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['pending', 'active', 'expired', 'cancelled'], default: 'active' },
  // Hashed one-time token used by the post-registration payment step to prove
  // the caller is the same party that registered. Cleared once activation
  // succeeds so the token is not reusable.
  activationToken: { type: String, select: false },
  paidAt: { type: Date },
  paymentReference: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
