const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  corporate: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate', required: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true },
  phone: { type: String },
  employeeId: { type: String },
  department: { type: String },
  designation: { type: String },
  dateOfBirth: { type: Date },
  dateOfJoining: { type: Date },
  anniversary: { type: Date },
  address: {
    street: String, city: String, state: String, pincode: String,
  },
  status: { type: String, enum: ['active', 'inactive', 'on_hold', 'archived'], default: 'active' },
  avatar: { type: String },
  notes: { type: String },
}, { timestamps: true });

staffSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Staff', staffSchema);
