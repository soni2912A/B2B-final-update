const crypto = require('crypto');
const User = require('../../models/User.model');
const Business = require('../../models/Business.model');
const Corporate = require('../../models/Corporate.model');
const Subscription = require('../../models/Subscription.model');
const LoginLog = require('../../models/LoginLog.model');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwtHelper');
const { sendSuccess, sendError } = require('../../utils/responseHelper');
const emailService = require('../../services/email.service');
const notificationService = require('../../services/notification.service');
const referralService = require('../../services/referral.service');
const { applyCoupon } = require('../superAdmin/coupon.controller');
const { triggerReferralReward } = require('../referral.controller');

const hashToken = (raw) => crypto.createHash('sha256').update(String(raw)).digest('hex');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 400, 'Email and password are required');

    const user = await User.findOne({ email }).select('+password').populate('business');
    const passwordOk = user ? await user.matchPassword(password) : false;

    const logAttempt = (status, reason) => LoginLog.create({
      user: user?._id, business: user?.business, ipAddress: req.ip,
      userAgent: req.headers['user-agent'], status,
      failureReason: reason, loggedAt: new Date(),
    }).catch(() => {});

    if (!user || !passwordOk) {
      logAttempt('failed', 'Invalid credentials');
      return sendError(res, 401, 'Invalid email or password');
    }
    if (user.isEmailVerified === false) {
      logAttempt('failed', 'Email not verified');
      return sendError(res, 403, 'Please verify your email before logging in. Check your inbox (or server logs in dev).');
    }
    if (!user.isActive) {
      logAttempt('failed', 'Account deactivated');
      return sendError(res, 401, 'Your account has been deactivated. Contact support.');
    }

    logAttempt('success');
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const userData = user.toObject();
    delete userData.password;

    return sendSuccess(res, 200, 'Login successful', { token, refreshToken, user: userData });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('business').populate('corporate');
    return sendSuccess(res, 200, 'User fetched', { user });
  } catch (error) { return sendError(res, 500, error.message); }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return sendError(res, 404, 'No user found with this email');

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const clientUrl = (process.env.CLIENT_URL || '').split(',')[0].trim() || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    try {
      await emailService.sendPasswordReset(user.email, user.name, resetUrl, user.business);
    } catch (mailErr) {
      console.error('[forgotPassword] email failed:', mailErr.message);
    }

    return sendSuccess(res, 200, 'Password reset email sent');
  } catch (error) { return sendError(res, 500, error.message); }
};

const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) return sendError(res, 400, 'Token is invalid or has expired');

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    const token = generateToken(user._id);
    return sendSuccess(res, 200, 'Password reset successful', { token });
  } catch (error) { return sendError(res, 500, error.message); }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return sendError(res, 401, 'Refresh token required');
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);
    if (!user) return sendError(res, 401, 'User not found');
    if (!user.isActive) return sendError(res, 401, 'Account is deactivated');
    const newToken = generateToken(user._id);
    return sendSuccess(res, 200, 'Token refreshed', { token: newToken });
  } catch (error) { return sendError(res, 401, 'Invalid refresh token'); }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!await user.matchPassword(currentPassword)) return sendError(res, 401, 'Current password is incorrect');
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();
    return sendSuccess(res, 200, 'Password changed successfully');
  } catch (error) { return sendError(res, 500, error.message); }
};

// ─── M02 — Corporate self-registration ───────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, companyName, phone, contactPerson, referralCode } = req.body;
    if (!name || !email || !password || !companyName) {
      return sendError(res, 400, 'name, email, password, and companyName are required');
    }

    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 400, 'Email already registered');

    // Attach to default business (seeded) or configurable via env
    let business;
    if (process.env.DEFAULT_BUSINESS_ID) {
      business = await Business.findById(process.env.DEFAULT_BUSINESS_ID);
    }
    if (!business) business = await Business.findOne().sort({ createdAt: 1 });
    if (!business) return sendError(res, 500, 'No business configured. Run `npm run seed` first.');

    // ── Referral: validate code before creating anything ──────────────────────
    // Invalid codes are silently ignored — we never block registration over them
    let validReferral = null;
    if (referralCode) {
      validReferral = await referralService.validateCode(referralCode, business._id);
    }

    const corporate = await Corporate.create({
      business: business._id,
      companyName,
      contactPerson: contactPerson || name,
      email,
      phone,
      status: 'pending',
    });

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const isDev = process.env.NODE_ENV !== 'production';

    const user = await User.create({
      name, email, password,
      phone: phone || undefined,
      role: 'corporate_user',
      business: business._id,
      corporate: corporate._id,
      isEmailVerified: isDev,   // auto-verify in dev
      isActive: isDev,           // auto-activate in dev
      emailVerifyToken: isDev ? undefined : crypto.createHash('sha256').update(verifyToken).digest('hex'),
    });

    // ── Referral: record conversion after user is successfully created ─────────
    if (validReferral) {
      referralService
        .recordConversion(validReferral._id, {
          referredUserId:      user._id,
          referredCorporateId: corporate._id,
        })
        .catch(err => console.error('[register] referral conversion failed:', err.message));
    }

    notificationService.notifyNewCorporate(corporate, user._id)
      .catch(err => console.error('[register] notifyNewCorporate failed:', err.message));

    if (!isDev) {
      const clientUrl = (process.env.CLIENT_URL || '').split(',')[0].trim() || 'http://localhost:5173';
      const verifyUrl = `${clientUrl}/verify-email/${verifyToken}`;
      try {
        await emailService.sendMail({
          to: email,
          subject: 'Verify your email — B2B Corporate Bakery Platform',
          html: `<p>Hi ${name},</p><p>Please verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p><p>Link expires in 24 hours.</p>`,
          templateType: 'verify_email',
          businessId: business._id,
          referenceId: user._id,
        });
      } catch (mailErr) {
        console.error('[register] verification email failed:', mailErr.message);
      }
    }

    return sendSuccess(res, 201, isDev
      ? 'Registration successful. You can log in now.'
      : 'Registration successful. Please check your email to verify your account.',
      { userId: user._id });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ emailVerifyToken: hashedToken });
    if (!user) return sendError(res, 400, 'Invalid or expired verification link');

    user.isEmailVerified = true;
    user.isActive = true;
    user.emailVerifyToken = undefined;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, 200, 'Email verified successfully. You can now log in.');
  } catch (error) { return sendError(res, 500, error.message); }
};

const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 404, 'User not found');
    if (user.isEmailVerified) return sendError(res, 400, 'Email already verified');

    const verifyToken = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
    await user.save({ validateBeforeSave: false });

    const clientUrl = (process.env.CLIENT_URL || '').split(',')[0].trim() || 'http://localhost:5173';
    const verifyUrl = `${clientUrl}/verify-email/${verifyToken}`;
    await emailService.sendMail({
      to: user.email,
      subject: 'Verify your email — B2B Corporate Bakery Platform',
      html: `<p>Please verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
      templateType: 'verify_email',
      businessId: user.business,
      referenceId: user._id,
    });

    return sendSuccess(res, 200, 'Verification email resent');
  } catch (error) { return sendError(res, 500, error.message); }
};

const acceptInvite = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token)    return sendError(res, 400, 'Invite token is required.');
    if (!password || String(password).length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters.');
    }
    if (confirmPassword !== undefined && confirmPassword !== password) {
      return sendError(res, 400, 'Passwords do not match.');
    }

    const hashed = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({
      inviteToken: hashed,
      inviteExpire: { $gt: new Date() },
      isActive: false,
    }).select('+inviteToken +inviteExpire +password');

    if (!user) return sendError(res, 400, 'Invite is invalid or has expired.');

    user.password = password;
    user.isActive = true;
    user.isEmailVerified = true;
    user.inviteToken = undefined;
    user.inviteExpire = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    const jwt = generateToken(user._id);
    const refresh = generateRefreshToken(user._id);
    const userData = user.toObject();
    delete userData.password;
    delete userData.inviteToken;
    delete userData.inviteExpire;

    return sendSuccess(res, 200, 'Invite accepted. You are now logged in.', {
      token: jwt, refreshToken: refresh, user: userData,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    console.error('[acceptInvite] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

const listPublicPlans = async (_req, res) => {
  try {
    const plans = await Subscription.find({ business: null, isActive: true })
      .sort({ price: 1 })
      .select('name price billingCycle maxCorporates maxStaffPerCorporate maxOrders features');
    return sendSuccess(res, 200, 'Plans fetched', { plans });
  } catch (error) { return sendError(res, 500, error.message); }
};


const registerAdmin = async (req, res) => {
  try {
    const {
      name, email, password,
      businessName, phone, planId,
      couponCode, referralCode,
    } = req.body;

    if (!name || !email || !password || !businessName || !planId) {
      return sendError(res, 400, 'name, email, password, businessName and planId are required.');
    }
    if (String(password).length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters.');
    }

    const normEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normEmail });
    if (existingUser) return sendError(res, 400, 'Email already registered.');

    const existingBiz = await Business.findOne({ email: normEmail });
    if (existingBiz) return sendError(res, 400, 'A business with that email already exists.');

    const plan = await Subscription.findOne({ _id: planId, business: null, isActive: true });
    if (!plan) return sendError(res, 400, 'Selected plan is invalid or no longer available.');

    const business = await Business.create({
      name: String(businessName).trim(),
      email: normEmail,
      phone: phone || undefined,
      isActive: false,   // activated only after payment
    });

    const rawActivationToken = crypto.randomBytes(32).toString('hex');

    // ── Coupon: calculate discounted price ──────────────────────────────────
    const { discountAmount, finalPrice } = await applyCoupon(
      couponCode, plan.price, plan._id, business._id
    );

    // ── Referral: validate code ─────────────────────────────────────────────
    let validAdminReferral = null;
    if (referralCode) {
      validAdminReferral = await referralService.validateCode(referralCode, business._id)
        .catch(() => null);
    }

    const subscription = await Subscription.create({
      name: plan.name,
      price: finalPrice,         // discounted price stored
      billingCycle: plan.billingCycle,
      maxCorporates: plan.maxCorporates,
      maxStaffPerCorporate: plan.maxStaffPerCorporate,
      maxOrders: plan.maxOrders,
      features: plan.features,
      business: business._id,
      plan: plan._id,
      status: 'pending',
      activationToken: hashToken(rawActivationToken),
      couponCode:      couponCode   || undefined,
      discountAmount:  discountAmount || 0,
      referralCode:    referralCode  || undefined,
    });

    business.subscription = subscription._id;
    await business.save();

    const user = await User.create({
      name: String(name).trim(),
      email: normEmail,
      password,
      phone: phone || undefined,
      role: 'admin',
      business: business._id,
      isActive: false,
      isEmailVerified: true,
    });

    // Store referral conversion (reward only after payment)
    if (validAdminReferral) {
      referralService.recordConversion(validAdminReferral._id, {
        referredUserId: user._id,
      }).catch(err => console.error('[registerAdmin] referral conversion failed:', err.message));
    }

    return sendSuccess(res, 201, 'Registration received — complete payment to activate.', {
      businessId: business._id,
      subscriptionId: subscription._id,
      activationToken: rawActivationToken,
      plan: {
        name:          plan.name,
        originalPrice: plan.price,
        discountAmount,
        finalPrice,
        billingCycle:  plan.billingCycle,
      },
      couponApplied: discountAmount > 0 ? { code: couponCode, savedAmount: discountAmount } : null,
      adminEmail: user.email,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    console.error('[registerAdmin] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

const activateSubscription = async (req, res) => {
  try {
    const { subscriptionId, activationToken, paymentReference } = req.body;
    if (!subscriptionId || !activationToken) {
      return sendError(res, 400, 'subscriptionId and activationToken are required.');
    }

    const subscription = await Subscription.findById(subscriptionId).select('+activationToken');
    if (!subscription) return sendError(res, 404, 'Subscription not found.');
    if (subscription.status === 'active') {
      return sendError(res, 400, 'Subscription already active.');
    }
    if (subscription.status !== 'pending' || !subscription.activationToken) {
      return sendError(res, 400, 'Subscription is not awaiting activation.');
    }
    if (subscription.activationToken !== hashToken(activationToken)) {
      return sendError(res, 401, 'Activation token is invalid.');
    }

    const now = new Date();
    const end = new Date(now);
    if (subscription.billingCycle === 'yearly') end.setFullYear(end.getFullYear() + 1);
    else                                        end.setMonth(end.getMonth() + 1);

    subscription.status = 'active';
    subscription.startDate = now;
    subscription.endDate = end;
    subscription.paidAt = now;
    subscription.paymentReference = paymentReference || `MOCK-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    subscription.activationToken = undefined;
    await subscription.save();

    await Business.findByIdAndUpdate(subscription.business, { isActive: true });
    await User.updateMany(
      { business: subscription.business, role: 'admin' },
      { isActive: true },
    );

    // ── Trigger referral reward if this subscription was via a referral ─────
    if (subscription.referralCode) {
      const referral = await require('../../models/Referral.model').findOne({
        code: subscription.referralCode.toUpperCase(),
      });
      if (referral) {
        // Find the pending conversion for the admin user of this business
        const adminUser = await User.findOne({ business: subscription.business, role: 'admin' });
        const conv = adminUser
          ? referral.conversions.find(c => String(c.referredUser) === String(adminUser._id) && !c.rewardGiven)
          : null;
        if (conv) {
          triggerReferralReward({ referralId: referral._id, conversionId: conv._id }).catch(() => {});
        }
      }
    }

    return sendSuccess(res, 200, 'Subscription activated.', {
      subscriptionId: subscription._id,
      paymentReference: subscription.paymentReference,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
    });
  } catch (error) {
    console.error('[activateSubscription] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  login, getMe, forgotPassword, resetPassword, refreshToken,
  changePassword, register, verifyEmail, resendVerification, acceptInvite,
  listPublicPlans, registerAdmin, activateSubscription,
};