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
        recentConversions,
        pendingRewards:   referral.conversions.filter(c => !c.rewardGiven).length,
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
    const referrals = await Referral.find()
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
   Internal — called from auth.controller after first payment
   Reward is ONLY given after subscription is activated
   ───────────────────────────────────────────────────────── */
exports.triggerReferralReward = async ({ referralId, conversionId }) => {
  try {
    if (!referralId) return;
    const referral = await Referral.findById(referralId);
    if (!referral) return;
    const conv = referral.conversions.id(conversionId);
    if (!conv || conv.rewardGiven) return;

    // ── Reward policy: ₹500 credit ──────────────────────
    conv.rewardGiven  = true;
    conv.rewardType   = 'credit';
    conv.rewardValue  = 500;
    await referral.save();

    console.log(`[referral] ✅ ₹500 reward granted → referrer ${referral.referrer}`);
  } catch (err) {
    console.error('[referral] triggerReferralReward error:', err.message);
  }
};