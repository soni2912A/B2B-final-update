const mongoose = require('mongoose');

/**
 * Stores the daily email-report schedule for a business (admin) or
 * the platform as a whole (super_admin).
 *
 * scope: 'admin'      → tied to a specific business
 * scope: 'superAdmin' → platform-level report, business is null
 */
const reportEmailScheduleSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      enum: ['admin', 'superAdmin'],
      required: true,
    },
    // null when scope === 'superAdmin'
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },
    emails: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) =>
          arr.every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
        message: 'One or more email addresses are invalid',
      },
    },
    // HH:mm in IST, e.g. "18:00"
    sendTime: {
      type: String,
      default: '18:00',
      match: [/^\d{2}:\d{2}$/, 'sendTime must be HH:mm'],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    lastSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One schedule doc per (scope, business) pair
reportEmailScheduleSchema.index(
  { scope: 1, business: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'ReportEmailSchedule',
  reportEmailScheduleSchema
);