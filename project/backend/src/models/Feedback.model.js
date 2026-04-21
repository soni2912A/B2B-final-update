const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  corporate: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  tags: [{ type: String }],
  adminResponse: { type: String },
  respondedAt: { type: Date },
  isPublic: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
