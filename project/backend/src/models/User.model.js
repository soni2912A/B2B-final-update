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
  isEmailVerified: { type: Boolean, default: false },   
  emailVerifyToken: { type: String },                    

  permissions: [{ type: String }],
  lastLogin:   { type: Date },

  passwordChangedAt:   { type: Date },
  passwordResetToken:  { type: String },
  passwordResetExpires:{ type: Date },

  
  inviteToken:  { type: String, select: false },
  inviteExpire: { type: Date,   select: false },

  notificationPrefs: { type: mongoose.Schema.Types.Mixed, default: {} },

  
  googleCalendar: {
    email:        { type: String },
    connectedAt:  { type: Date },
    accessToken:  { type: String, select: false },
    refreshToken: { type: String, select: false },
    expiresAt:    { type: Date,   select: false },
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