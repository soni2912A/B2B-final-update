const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  corporate: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  invoiceNumber: { type: String },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  lineItems: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    taxRate: Number,
    taxAmount: Number,
    total: Number,
  }],
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'], default: 'draft' },
  paymentMethod: { type: String, enum: ['online', 'bank_transfer', 'cash', 'cheque'] },
  paidAt: { type: Date },
  pdfUrl: { type: String },
  notes: { type: String },
}, { timestamps: true });

invoiceSchema.pre('save', function (next) {
  this.balanceAmount = this.totalAmount - this.paidAmount;
  next();
});

// Compound unique index — invoice numbers are unique per-business, not globally
invoiceSchema.index({ business: 1, invoiceNumber: 1 }, { unique: true });

// One invoice per order. Enforced at the DB layer so concurrent delivered-
// transitions can't duplicate. The service's idempotency check is the happy
// path; this index is the safety net for races.
invoiceSchema.index({ order: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
