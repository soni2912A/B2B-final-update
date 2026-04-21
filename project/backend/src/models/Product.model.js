const mongoose = require('mongoose');

const pricingTierSchema = new mongoose.Schema({
  label: { type: String },
  minQty: { type: Number, default: 1 },
  price: { type: Number, required: true },
}, { _id: false });

const productSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  images: [{ type: String }],
  basePrice: { type: Number, required: true },
  pricingTiers: [pricingTierSchema],
  taxRate: { type: Number, default: 0 },
  stockQuantity: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  unit: { type: String, default: 'pcs' },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock', 'archived'],
    default: 'active',
  },
  tags: [{ type: String }],
}, { timestamps: true });

productSchema.index({ business: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
