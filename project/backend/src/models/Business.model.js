const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  logo: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  currency: { type: String, default: 'INR' },
  taxRate: { type: Number, default: 18 },
  timezone: { type: String, default: 'Asia/Kolkata' },
  dateFormat: { type: String, default: 'DD/MM/YYYY' },
  invoicePrefix: { type: String, default: 'INV' },
  invoiceCounter: { type: Number, default: 1000 },
  emailSenderName: { type: String },
  emailSenderAddress: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);
