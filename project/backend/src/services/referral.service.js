const crypto = require('crypto');
const Referral = require('../models/Referral.model');

const generateCode = () =>
  crypto.randomBytes(4).toString('hex').toUpperCase(); 
const createFreshReferral = async (userId, businessId, maxUses = 10) => {
  let code;
  let attempts = 0;
  while (attempts < 5) {
    code = generateCode();
    const exists = await Referral.findOne({ code });
    if (!exists) break;
    attempts++;
  }
  return Referral.create({
    business: businessId || null,
    referrer: userId,
    code,
    maxUses,
  });
};


const getOrCreateReferral = async (userId, businessId) => {
  let referral = await Referral.findOne({ referrer: userId, isActive: true });
  if (!referral) {
    referral = await createFreshReferral(userId, businessId);
  }
  return referral;
};


const validateCode = async (code, businessId) => {
  if (!code) return null;
  const referral = await Referral.findOne({
    business: businessId,
    code: code.toUpperCase(),
    isActive: true,
  });
  if (!referral) return null;
  if (referral.expiresAt && referral.expiresAt < new Date()) return null;
  if (referral.totalConversions >= referral.maxUses) return null;
  return referral;
};


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

  let newReferral = null;
  if (referral && referral.totalConversions >= referral.maxUses) {
    referral.isActive = false;
    referral.expiredAt = new Date();
    newReferral = await createFreshReferral(
      referral.referrer,
      referral.business,
      referral.maxUses
    );
    referral.supersededBy = newReferral.code;
    await referral.save();
    console.log(`[referral] Code ${referral.code} expired after ${referral.maxUses} uses. New code: ${newReferral.code}`);
  }

  return { referral, newReferral };
};


const recordClick = async (code, businessId) => {
  await Referral.updateOne(
    { code: code.toUpperCase(), business: businessId },
    { $inc: { totalClicks: 1 } }
  );
};


const updateMaxUses = async (referralId, maxUses) => {
  return Referral.findByIdAndUpdate(referralId, { maxUses }, { new: true });
};

module.exports = { getOrCreateReferral, validateCode, recordConversion, recordClick, updateMaxUses, createFreshReferral };