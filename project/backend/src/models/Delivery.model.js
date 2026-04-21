const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  corporate: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scheduledDate: { type: Date, required: true },
  deliveredAt: { type: Date },
  status: {
    type: String,
    enum: ['scheduled', 'in_transit', 'delivered', 'failed', 'rescheduled'],
    default: 'scheduled',
  },
  deliveryAddress: {
    street: String, city: String, state: String, pincode: String,
  },
  notes: { type: String },
  proofOfDelivery: { type: String },
  failureReason: { type: String },
  attemptCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
