const crypto = require('crypto');
const Referral = require('../models/Referral.model');

/**
 * Generate a short, uppercase alphanumeric code.
 * Collision is astronomically unlikely at this scale but we guard anyway.
 */
const generateCode = () =>
  crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F7C12B"

/**
 * Get or create the referral record for a user.
 * Each user gets exactly one referral code (super_admin has null businessId).
 */
const getOrCreateReferral = async (userId, businessId) => {
  let referral = await Referral.findOne({ referrer: userId });
  if (!referral) {
    let code;
    let attempts = 0;
    // Retry until we get a unique code (almost always first try)
    while (attempts < 5) {
      code = generateCode();
      const exists = await Referral.findOne({ code });
      if (!exists) break;
      attempts++;
    }
    referral = await Referral.create({
      business: businessId || null,
      referrer: userId,
      code,
    });
  }
  return referral;
};

/**
 * Validate a referral code on registration.
 * Returns the Referral doc if valid, null otherwise.
 */
const validateCode = async (code, businessId) => {
  if (!code) return null;
  const referral = await Referral.findOne({
    business: businessId,
    code: code.toUpperCase(),
    isActive: true,
  });
  if (!referral) return null;
  if (referral.expiresAt && referral.expiresAt < new Date()) return null;
  return referral;
};

/**
 * Record a successful conversion after a new user signs up via a referral link.
 */
const recordConversion = async (referralId, { referredUserId, referredCorporateId } = {}) => {
  const referral = await Referral.findByIdAndUpdate(
    referralId,
    {
      $push: {
        conversions: {
          referredUser:      referredUserId || undefined,
          referredCorporate: referredCorporateId || undefined,
          convertedAt:       new Date(),
        },
      },
      $inc: { totalConversions: 1 },
    },
    { new: true }
  );
  return referral;
};

/**
 * Increment click counter (called from frontend when link is opened — optional).
 */
const recordClick = async (code, businessId) => {
  await Referral.updateOne(
    { code: code.toUpperCase(), business: businessId },
    { $inc: { totalClicks: 1 } }
  );
};

module.exports = { getOrCreateReferral, validateCode, recordConversion, recordClick };