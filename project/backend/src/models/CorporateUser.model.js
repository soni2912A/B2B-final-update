const mongoose = require('mongoose');

const corporateUserSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  corporate: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate', required: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  designation: { type: String, trim: true },
  moduleAccess: {
    dashboard: { type: Boolean, default: true },
    staff: { type: Boolean, default: true },
    placeOrder: { type: Boolean, default: true },
    myOrders: { type: Boolean, default: true },
    invoices: { type: Boolean, default: true },
    manageUsers: { type: Boolean, default: false },
  },
  isOwner: { type: Boolean, default: false },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inviteToken: { type: String, select: false },
  inviteExpire: { type: Date, select: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

corporateUserSchema.index({ corporate: 1, business: 1 });

module.exports = mongoose.model('CorporateUser', corporateUserSchema);
