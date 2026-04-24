const Business = require('../../models/Business.model');
const Subscription = require('../../models/Subscription.model');
const User = require('../../models/User.model');
const Corporate = require('../../models/Corporate.model');
const Order = require('../../models/Order.model');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  if (error && error.code === 11000) {
    return sendError(res, 400, 'A business with this name or admin email already exists.');
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

const enrich = async (b) => {
  const users = await User.countDocuments({ business: b._id });
  return {
    ...(b.toObject ? b.toObject() : b),
    plan: b.subscription?.name?.toLowerCase() || 'starter',
    users,
    status: b.isActive ? 'active' : 'suspended',
  };
};

const getAllBusinesses = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, plan, status } = req.query;

    const filter = {};
    if (search && String(search).trim()) {
      const re = new RegExp(String(search).trim().replace(ESCAPE_RE, '\\$&'), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    if (status === 'active')    filter.isActive = true;
    if (status === 'suspended') filter.isActive = false;

    // `plan` filters by the joined Subscription's name. Two-step lookup: find
    // matching Subscription _ids, then filter businesses whose subscription ∈ ids.
    if (plan && plan !== 'all') {
      const subs = await Subscription.find({
        name: new RegExp(`^${String(plan).replace(ESCAPE_RE, '\\$&')}$`, 'i'),
      }).select('_id').lean();
      filter.subscription = { $in: subs.map(s => s._id) };
    }

    const [businesses, total] = await Promise.all([
      Business.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('subscription', 'name price billingCycle'),
      Business.countDocuments(filter),
    ]);
    const enriched = await Promise.all(businesses.map(enrich));
    return sendPaginated(res, enriched, total, page, limit, 'businesses');
  } catch (error) { return handleError(res, error, 'getAllBusinesses'); }
};

const getBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).populate('subscription');
    if (!business) return sendError(res, 404, 'Business not found');
    return sendSuccess(res, 200, 'Business fetched', { business: await enrich(business) });
  } catch (error) { return handleError(res, error, 'getBusiness'); }
};

const createBusiness = async (req, res) => {
  try {
    const {
      name, adminName, adminEmail, adminPassword, plan,
      phone, currency, timezone,
    } = req.body;

    if (!name || !String(name).trim())         return sendError(res, 400, 'Business name is required.');
    if (!adminEmail || !String(adminEmail).trim()) return sendError(res, 400, 'Admin email is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(adminEmail).trim())) {
      return sendError(res, 400, 'Admin email format is invalid.');
    }
    if (!adminPassword || String(adminPassword).length < 6) {
      return sendError(res, 400, 'Admin password must be at least 6 characters.');
    }

   
    const normalisedEmail = String(adminEmail).trim().toLowerCase();

   
    let subscriptionId;
    if (plan) {
      const sub = await Subscription.findOne({
        name: new RegExp(`^${String(plan).replace(ESCAPE_RE, '\\$&')}$`, 'i'),
      });
      if (sub) subscriptionId = sub._id;
    }

    const business = await Business.create({
      name: String(name).trim(),
      email: normalisedEmail,
      phone: phone ? String(phone).trim() : undefined,
      currency,
      timezone,
      subscription: subscriptionId,
      isActive: true,
    });

   
    let adminUser;
    try {
      adminUser = await User.create({
        name: adminName && String(adminName).trim() || 'Admin',
        email: normalisedEmail,
        password: adminPassword,
        role: 'admin',
        business: business._id,
        isActive: true,
        isEmailVerified: true,
      });
    } catch (userErr) {
      
      await Business.deleteOne({ _id: business._id }).catch(err => {
        console.error('[createBusiness] rollback failed:', err.message);
      });
      throw userErr;
    }

    const out = adminUser.toObject();
    delete out.password;
    return sendSuccess(res, 201, 'Business created', { business, adminUser: out });
  } catch (error) { return handleError(res, error, 'createBusiness'); }
};

const updateBusiness = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!business) return sendError(res, 404, 'Business not found');
    return sendSuccess(res, 200, 'Business updated', { business });
  } catch (error) { return handleError(res, error, 'updateBusiness'); }
};

const toggleBusinessStatus = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return sendError(res, 404, 'Business not found');
    business.isActive = !business.isActive;
    await business.save();
    const enriched = await enrich(business);
    return sendSuccess(res, 200, `Business ${business.isActive ? 'activated' : 'suspended'}`, { business: enriched });
  } catch (error) { return handleError(res, error, 'toggleBusinessStatus'); }
};

const getBusinessDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const business = await Business.findById(id).populate('subscription');
    if (!business) return sendError(res, 404, 'Business not found');

    const [users, staff, corporates, orders, primaryAdmin] = await Promise.all([
      User.countDocuments({ business: id }),
      User.countDocuments({ business: id, role: { $in: ['admin', 'staff'] } }),
      Corporate.countDocuments({ business: id }),
      Order.countDocuments({ business: id }),
      User.findOne({ business: id, role: 'admin' }).sort({ createdAt: 1 }).select('name email').lean(),
    ]);

    const sub = business.subscription;
    return sendSuccess(res, 200, 'Business details fetched', {
      business: {
        _id: business._id,
        name: business.name,
        email: business.email,
        logo: business.logo,
        createdAt: business.createdAt,
        isActive: business.isActive,
      },
      subscription: sub ? {
        _id: sub._id,
        name: sub.name,
        price: sub.price,
        billingCycle: sub.billingCycle,
        maxCorporates: sub.maxCorporates,
        maxStaffPerCorporate: sub.maxStaffPerCorporate,
        maxOrders: sub.maxOrders,
        features: sub.features || [],
      } : null,
      primaryAdmin: primaryAdmin ? { name: primaryAdmin.name, email: primaryAdmin.email } : null,
      usage: { corporates, staff, orders, users },
    });
  } catch (error) { return handleError(res, error, 'getBusinessDetails'); }
};

const deleteBusiness = async (req, res) => {
  try {
    const Business = require('../../models/Business.model');
    const User = require('../../models/User.model');
    const business = await Business.findById(req.params.id);
    if (!business) return handleError(res, 404, 'Business not found');
    await User.deleteMany({ business: business._id });
    await business.deleteOne();
    return res.json({ success: true, message: 'Business deleted successfully.' });
  } catch (error) { return handleError(res, error, 'deleteBusiness'); }
};

module.exports = { getAllBusinesses, getBusiness, getBusinessDetails, createBusiness, updateBusiness, toggleBusinessStatus, deleteBusiness };
