const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  sku: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  staffMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
}, { _id: false });

const deliveryAddressSchema = new mongoose.Schema({
  type: { type: String, default: 'delivery' },
  label: String,
  street: String,
  city: String,
  state: String,
  pincode: String,
  address: String,
  instructions: String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  corporate: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate', required: true },
  orderNumber: { type: String, unique: true },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['new', 'scheduled', 'processing', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'new',
  },
  deliveryDate: { type: Date, required: true },
  deliveryAddress: deliveryAddressSchema,
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  discount: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
  couponCode: { type: String },
  remarks: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  preDeliveryAlertSent: { type: Boolean, default: false },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  placedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
