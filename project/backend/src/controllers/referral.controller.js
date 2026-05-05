const Referral = require('../models/Referral.model');
const referralSvc = require('../services/referral.service');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/* ─────────────────────────────────────────────────────────
   GET /admin/referral/me  OR  /corporate/referral/me
   ───────────────────────────────────────────────────────── */
exports.getMyReferral = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const businessId   = isSuperAdmin ? null : req.businessId;

    const referral = await referralSvc.getOrCreateReferral(
      req.user._id,
      businessId,
    );

    const appUrl  = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    const path    = (isSuperAdmin || req.user.role === 'admin') ? '/register-admin' : '/register';
    const link    = `${appUrl}${path}?ref=${referral.code}`;

    // Include discount info — read from env or DB config if available
    const discountType  = process.env.REFERRAL_DISCOUNT_TYPE  || 'percentage';
    const discountValue = Number(process.env.REFERRAL_DISCOUNT_VALUE || 10);

    const recentConversions = referral.conversions
      .slice(-10)
      .reverse()
      .map(c => ({
        _id:         c._id,
        convertedAt: c.convertedAt,
        rewardGiven: c.rewardGiven,
        rewardType:  c.rewardType,
        rewardValue: c.rewardValue,
      }));

    return sendSuccess(res, 200, 'OK', {
      referral: {
        _id:              referral._id,
        code:             referral.code,
        link,
        totalClicks:      referral.totalClicks,
        totalConversions: referral.totalConversions,
        maxUses:          referral.maxUses,
        usesRemaining:    Math.max(0, referral.maxUses - referral.totalConversions),
        recentConversions,
        pendingRewards:   referral.conversions.filter(c => !c.rewardGiven).length,
        discountType,
        discountValue,
      },
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/* ─────────────────────────────────────────────────────────
   POST /public/referrals/click  — public click tracker
   ───────────────────────────────────────────────────────── */
exports.recordClick = async (req, res) => {
  try {
    const { code } = req.body;
    if (code) {
      await Referral.updateOne({ code: code.toUpperCase() }, { $inc: { totalClicks: 1 } });
    }
    return sendSuccess(res, 200, 'OK');
  } catch {
    return sendSuccess(res, 200, 'OK'); // never fail a click track
  }
};

/* ─────────────────────────────────────────────────────────
   GET /super-admin/referrals  — all referrals overview
   ───────────────────────────────────────────────────────── */
exports.getAllReferrals = async (req, res) => {
  try {
    const User = require('../models/User.model');

    // Only show referrals belonging to admin or super_admin users
    const allowedUsers = await User.find({
      role: { $in: ['admin', 'super_admin'] },
    }).select('_id');

    const allowedIds = allowedUsers.map(u => u._id);

    const referrals = await Referral.find({ referrer: { $in: allowedIds } })
      .populate('referrer', 'name email role')
      .populate('business', 'name')
      .sort({ totalConversions: -1 })
      .limit(200);

    return sendSuccess(res, 200, 'OK', { referrals });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/* ─────────────────────────────────────────────────────────
   PATCH /super-admin/referrals/:id/max-uses  — set usage limit
   ───────────────────────────────────────────────────────── */
exports.updateMaxUses = async (req, res) => {
  try {
    const { maxUses } = req.body;
    if (!maxUses || isNaN(maxUses) || maxUses < 1) {
      return sendError(res, 400, 'maxUses must be a positive number.');
    }
    const referral = await referralSvc.updateMaxUses(req.params.id, Number(maxUses));
    if (!referral) return sendError(res, 404, 'Referral not found.');
    return sendSuccess(res, 200, 'maxUses updated.', { referral });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/* ─────────────────────────────────────────────────────────
   Internal — called from auth.controller after first payment
   ───────────────────────────────────────────────────────── */
exports.triggerReferralReward = async ({ referralId, conversionId }) => {
  try {
    if (!referralId) return;
    const referral = await Referral.findById(referralId);
    if (!referral) return;
    const conv = referral.conversions.id(conversionId);
    if (!conv || conv.rewardGiven) return;

    conv.rewardGiven  = true;
    conv.rewardType   = 'credit';
    conv.rewardValue  = 500;
    await referral.save();

    console.log(`[referral] ✅ ₹500 reward granted → referrer ${referral.referrer}`);
  } catch (err) {
    console.error('[referral] triggerReferralReward error:', err.message);
  }
};