const mongoose = require('mongoose');

const occasionSchema = new mongoose.Schema({
  business:  { type: mongoose.Schema.Types.ObjectId, ref: 'Business',   required: true },
  corporate: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate',  required: true },
  staff:     { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  title:     { type: String, required: true },

  // 'custom' maps to the "Other" option in the UI. When type is 'custom' the
  // frontend sends a customTitle which the controller copies into `title`.
  type: {
    type: String,
    enum: ['birthday', 'anniversary', 'holiday', 'custom'],
    required: true,
  },

  // Free-form label provided by the user when type === 'custom'. Stored for
  // audit purposes; the display title is always stored in `title`.
  customTitle: { type: String },

  date:               { type: Date,    required: true },
  recurringYearly:    { type: Boolean, default: true },
  reminderDaysBefore: { type: Number,  default: 2 },
  notes:              { type: String },
  reminderSentAt:     { type: Date },
  createdBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // 'manual'  — created in the app
  // 'google'  — imported from Google Calendar (reserved for future full-import)
  source: { type: String, enum: ['manual', 'google'], default: 'manual' },

  // Populated after "Add to Google Calendar" sync succeeds.
  googleEventId:   { type: String },
  googleEventLink: { type: String },
  googleSyncedAt:  { type: Date },
  googleSyncedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Occasion', occasionSchema);
