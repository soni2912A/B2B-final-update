const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title:   { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  // 'all' | 'admin' | 'corporate' | 'staff'
  audience: {
    type: String,
    enum: ['all', 'admin', 'corporate', 'staff'],
    default: 'all',
  },
  // optional: pin to specific business tenant (null = all businesses)
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // track who has dismissed/read it
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);