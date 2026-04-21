const mongoose = require('mongoose');

const corporateSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  companyName: { type: String, required: true, trim: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String },
  logo: { type: String },
  address: {
    billing: {
      street: String, city: String, state: String, pincode: String, country: String,
    },
    delivery: {
      street: String, city: String, state: String, pincode: String, country: String,
    },
  },
  status: { type: String, enum: ['pending', 'active', 'inactive', 'rejected'], default: 'pending' },
  creditLimit: { type: Number, default: 0 },
  paymentTerms: { type: Number, default: 30 },
  notes: { type: String },
  onboardedAt: { type: Date, default: Date.now },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Corporate', corporateSchema);
