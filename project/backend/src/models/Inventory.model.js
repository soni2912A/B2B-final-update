const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['in', 'out', 'adjustment'], required: true },
  quantity: { type: Number, required: true },
  previousStock: { type: Number },
  currentStock: { type: Number },
  reason: { type: String },
  reference: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  warehouse: { type: String, default: 'main' },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
