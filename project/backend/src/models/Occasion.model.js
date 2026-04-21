const mongoose = require('mongoose');

const occasionSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  corporate: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate', required: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  title: { type: String, required: true },
  type: { type: String, enum: ['birthday', 'anniversary', 'holiday', 'custom'], required: true },
  date: { type: Date, required: true },
  recurringYearly: { type: Boolean, default: true },
  reminderDaysBefore: { type: Number, default: 2 },
  notes: { type: String },
  reminderSentAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Populated after a user clicks "Add to Google Calendar" and the sync
  // succeeds. Stored per-occasion (not per-user-per-occasion) — multiple users
  // syncing the same occasion overwrite each other. Acceptable for v1: the
  // primary use case is the creator pushing to their own calendar.
  googleEventId:    { type: String },
  googleEventLink:  { type: String },
  googleSyncedAt:   { type: Date },
  googleSyncedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Occasion', occasionSchema);
