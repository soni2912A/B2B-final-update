const mongoose = require('mongoose');


const roleSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  permissions: [{ type: String }],
  scope:       { type: String, enum: ['system', 'business'], required: true },
  business:    { type: mongoose.Schema.Types.ObjectId, ref: 'Business', default: null },
  builtin:     { type: Boolean, default: false },
}, { timestamps: true });


roleSchema.index(
  { name: 1, scope: 1, business: 1 },
  { unique: true }
);

module.exports = mongoose.model('Role', roleSchema);
