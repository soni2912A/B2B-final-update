const mongoose = require('mongoose');

// Roles come in two flavours:
//   scope='system'   → Super-Admin-defined templates available to every tenant
//                      (business === null)
//   scope='business' → Admin-defined roles inside a specific tenant
//                      (business === <tenant _id>)
//
// `builtin: true` marks seed/default roles that cannot be deleted via API.
const roleSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  permissions: [{ type: String }],
  scope:       { type: String, enum: ['system', 'business'], required: true },
  business:    { type: mongoose.Schema.Types.ObjectId, ref: 'Business', default: null },
  builtin:     { type: Boolean, default: false },
}, { timestamps: true });

// Unique role name per scope+tenant. System roles are globally unique; business
// roles are unique within their business.
roleSchema.index(
  { name: 1, scope: 1, business: 1 },
  { unique: true }
);

module.exports = mongoose.model('Role', roleSchema);
