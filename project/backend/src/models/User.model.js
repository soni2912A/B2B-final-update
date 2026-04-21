const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['super_admin', 'admin', 'staff', 'corporate_user'], required: true },

  business:  { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  corporate: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate' },

  avatar: { type: String },
  phone:  { type: String },

  isActive:        { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },   // ← added (used by register flow)
  emailVerifyToken: { type: String },                    // ← added (used by register flow)

  permissions: [{ type: String }],
  lastLogin:   { type: Date },

  passwordChangedAt:   { type: Date },
  passwordResetToken:  { type: String },
  passwordResetExpires:{ type: Date },

  // Admin-invite flow: hashed invite token + 48h expiry. Raw token goes in the
  // email URL only; never returned by any API.
  inviteToken:  { type: String, select: false },
  inviteExpire: { type: Date,   select: false },

  notificationPrefs: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Google Calendar OAuth state (optional — only populated for users who
  // connected their Google account via /auth/google/connect). Tokens are
  // select:false so they never leak through a stray populate or projection.
  // Non-token fields (email, connectedAt) are safe to return in API responses
  // so the UI can show "Connected as foo@gmail.com".
  googleCalendar: {
    email:        { type: String },
    connectedAt:  { type: Date },
    accessToken:  { type: String, select: false },
    refreshToken: { type: String, select: false },
    expiresAt:    { type: Date,   select: false },
    // CSRF state token — set when /auth/google/connect issues a URL, verified
    // on callback to ensure the return trip came from the same session. Never
    // returned by default projections.
    pendingState: { type: String, select: false },
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);