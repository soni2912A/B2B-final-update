// /**
//  * reportData.controller.js
//  *
//  * Provides three categories of endpoints, adapted for the B2B bakery platform:
//  *
//  *  1. Admin summary   – business-level KPIs (corporates, staff, invoices, revenue)
//  *  2. Super-admin summary – platform-wide view across all businesses
//  *  3. Email schedule  – save/load/test the daily report email
//  */

// const mongoose = require('mongoose');
// const Business = require('../../models/Business.model');
// const Subscription = require('../../models/Subscription.model');
// const User = require('../../models/User.model');
// const Corporate = require('../../models/Corporate.model');
// const Staff = require('../../models/Staff.model');
// const Order = require('../../models/Order.model');
// const Invoice = require('../../models/Invoice.model');
// const ReportEmailSchedule = require('../../models/ReportEmailSchedule.model');
// const { sendSuccess, sendError } = require('../../utils/responseHelper');

// // ─────────────────────────────────────────────────────────────────────────────
// // ADMIN – business-level summary
// // GET /api/report-data/admin-summary
// // ─────────────────────────────────────────────────────────────────────────────
// exports.getAdminSummary = async (req, res) => {
//   try {
//     const bid = req.user?.business; // ObjectId or string

//     const now = new Date();
//     const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
//     const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

//     const bidObj = new mongoose.Types.ObjectId(bid);

//     const [
//       totalCorporates,
//       activeCorporates,
//       totalStaff,
//       activeStaff,
//       adminUsers,
//       invoiceStats,
//       monthRevenue,
//       prevRevenue,
//       recentCorporates,
//       topCorporates,
//     ] = await Promise.all([
//       Corporate.countDocuments({ business: bid }),
//       Corporate.countDocuments({ business: bid, status: 'active' }),
//       Staff.countDocuments({ business: bid }),
//       Staff.countDocuments({ business: bid, status: 'active' }),
//       User.countDocuments({
//         business: bid,
//         role: { $in: ['admin', 'staff'] },
//         isActive: true,
//       }),
//       Invoice.aggregate([
//         { $match: { business: bidObj } },
//         {
//           $group: {
//             _id: '$status',
//             count: { $sum: 1 },
//             total: { $sum: '$totalAmount' },
//           },
//         },
//       ]),
//       Invoice.aggregate([
//         {
//           $match: {
//             business: bidObj,
//             status: 'paid',
//             createdAt: { $gte: monthStart },
//           },
//         },
//         { $group: { _id: null, total: { $sum: '$totalAmount' } } },
//       ]),
//       Invoice.aggregate([
//         {
//           $match: {
//             business: bidObj,
//             status: 'paid',
//             createdAt: { $gte: prevStart, $lt: monthStart },
//           },
//         },
//         { $group: { _id: null, total: { $sum: '$totalAmount' } } },
//       ]),
//       Corporate.find({ business: bid })
//         .sort({ createdAt: -1 })
//         .limit(5)
//         .select('companyName email status')
//         .lean(),
//       Invoice.aggregate([
//         { $match: { business: bidObj } },
//         {
//           $group: {
//             _id: '$corporate',
//             totalRevenue: { $sum: '$totalAmount' },
//             invoiceCount: { $sum: 1 },
//           },
//         },
//         { $sort: { totalRevenue: -1 } },
//         { $limit: 5 },
//         {
//           $lookup: {
//             from: 'corporates',
//             localField: '_id',
//             foreignField: '_id',
//             as: 'corp',
//           },
//         },
//         { $unwind: { path: '$corp', preserveNullAndEmptyArrays: true } },
//         {
//           $project: {
//             _id: 0,
//             companyName: '$corp.companyName',
//             totalRevenue: 1,
//             invoiceCount: 1,
//           },
//         },
//       ]),
//     ]);

//     // Build invoice breakdown map
//     const invByStatus = {};
//     invoiceStats.forEach((s) => {
//       invByStatus[s._id] = { count: s.count, total: s.total };
//     });

//     const totalInvoices = invoiceStats.reduce((s, x) => s + x.count, 0);
//     const totalRevenue = invByStatus['paid']?.total || 0;
//     const overdueRevenue = invByStatus['overdue']?.total || 0;
//     const pendingRevenue = invByStatus['pending']?.total || 0;
//     const thisMonthRev = monthRevenue[0]?.total || 0;
//     const prevMonthRev = prevRevenue[0]?.total || 0;
//     const revenueGrowth =
//       prevMonthRev > 0
//         ? Number((((thisMonthRev - prevMonthRev) / prevMonthRev) * 100).toFixed(1))
//         : null;

//     return sendSuccess(res, 200, 'Admin summary fetched.', {
//       corporates: { total: totalCorporates, active: activeCorporates },
//       staff: { total: totalStaff, active: activeStaff },
//       adminUsers: { total: adminUsers },
//       invoices: {
//         total: totalInvoices,
//         paid: invByStatus['paid']?.count || 0,
//         pending: invByStatus['pending']?.count || 0,
//         overdue: invByStatus['overdue']?.count || 0,
//         draft: invByStatus['draft']?.count || 0,
//         totalRevenue,
//         overdueRevenue,
//         pendingRevenue,
//         thisMonthRevenue: thisMonthRev,
//         prevMonthRevenue: prevMonthRev,
//         revenueGrowth,
//       },
//       recentCorporates,
//       topCorporates,
//     });
//   } catch (err) {
//     console.error('[getAdminSummary]', err);
//     return sendError(res, 500, err.message);
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // SUPER ADMIN – platform-wide summary
// // GET /api/report-data/super-admin-summary
// // ─────────────────────────────────────────────────────────────────────────────
// exports.getSuperAdminSummary = async (req, res) => {
//   try {
//     if (req.user?.role !== 'super_admin') {
//       return sendError(res, 403, 'Forbidden');
//     }

//     const businesses = await Business.find()
//       .populate('subscription', 'name price billingCycle status endDate startDate')
//       .sort({ createdAt: -1 })
//       .lean();

//     const businessIds = businesses.map((b) => b._id);

//     const [corpCounts, staffCounts, userCounts, invoiceCounts] =
//       await Promise.all([
//         Corporate.aggregate([
//           { $match: { business: { $in: businessIds } } },
//           { $group: { _id: '$business', count: { $sum: 1 } } },
//         ]),
//         Staff.aggregate([
//           { $match: { business: { $in: businessIds } } },
//           { $group: { _id: '$business', count: { $sum: 1 } } },
//         ]),
//         User.aggregate([
//           {
//             $match: {
//               business: { $in: businessIds },
//               role: { $in: ['admin', 'staff'] },
//             },
//           },
//           { $group: { _id: '$business', count: { $sum: 1 } } },
//         ]),
//         Invoice.aggregate([
//           { $match: { business: { $in: businessIds } } },
//           {
//             $group: {
//               _id: '$business',
//               total: { $sum: '$totalAmount' },
//               count: { $sum: 1 },
//             },
//           },
//         ]),
//       ]);

//     const toMap = (arr, key = 'count') =>
//       Object.fromEntries(arr.map((x) => [x._id.toString(), x[key]]));

//     const ccMap = toMap(corpCounts);
//     const scMap = toMap(staffCounts);
//     const ucMap = toMap(userCounts);
//     const invMap = toMap(invoiceCounts, 'total');
//     const invCMap = toMap(invoiceCounts, 'count');

//     const today = new Date();

//     const companies = businesses.map((b) => {
//       const id = b._id.toString();
//       const sub = b.subscription;
//       const subEnd = sub?.endDate ? new Date(sub.endDate) : null;
//       const daysLeft = subEnd
//         ? Math.ceil((subEnd - today) / 86_400_000)
//         : null;

//       return {
//         _id: b._id,
//         name: b.name,
//         email: b.email,
//         planName: sub?.name || 'Free',
//         planStatus: sub?.status || (b.isActive ? 'active' : 'suspended'),
//         subscriptionStart: sub?.startDate || null,
//         subscriptionEnd: sub?.endDate || null,
//         daysLeft,
//         isExpired: subEnd ? subEnd < today : false,
//         isExpiring: daysLeft != null && daysLeft <= 30 && daysLeft > 0,
//         isActive: b.isActive,
//         corporates: ccMap[id] || 0,
//         staff: scMap[id] || 0,
//         users: ucMap[id] || 0,
//         invoices: invCMap[id] || 0,
//         revenue: invMap[id] || 0,
//         createdAt: b.createdAt,
//       };
//     });

//     const totals = {
//       businesses: companies.length,
//       active: companies.filter((c) => c.isActive).length,
//       suspended: companies.filter((c) => !c.isActive).length,
//       expiringSoon: companies.filter((c) => c.isExpiring).length,
//       expired: companies.filter((c) => c.isExpired).length,
//       totalCorporates: companies.reduce((s, c) => s + c.corporates, 0),
//       totalStaff: companies.reduce((s, c) => s + c.staff, 0),
//       totalRevenue: companies.reduce((s, c) => s + c.revenue, 0),
//     };

//     return sendSuccess(res, 200, 'Super-admin summary fetched.', {
//       companies,
//       totals,
//     });
//   } catch (err) {
//     console.error('[getSuperAdminSummary]', err);
//     return sendError(res, 500, err.message);
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // EMAIL SCHEDULE — GET
// // GET /api/report-data/email-schedule
// // ─────────────────────────────────────────────────────────────────────────────
// exports.getEmailSchedule = async (req, res) => {
//   try {
//     const isSuperAdmin = req.user?.role === 'super_admin';
//     const query = isSuperAdmin
//       ? { scope: 'superAdmin', business: null }
//       : { scope: 'admin', business: req.user?.business };

//     const schedule = await ReportEmailSchedule.findOne(query).lean();
//     return sendSuccess(res, 200, 'Schedule fetched.', {
//       schedule: schedule || null,
//     });
//   } catch (err) {
//     return sendError(res, 500, err.message);
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // EMAIL SCHEDULE — SAVE (upsert)
// // POST /api/report-data/email-schedule
// // ─────────────────────────────────────────────────────────────────────────────
// exports.saveEmailSchedule = async (req, res) => {
//   try {
//     const isSuperAdmin = req.user?.role === 'super_admin';
//     const { emails = [], sendTime, enabled } = req.body;

//     const validEmails = emails
//       .map((e) => String(e).trim().toLowerCase())
//       .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

//     const filter = isSuperAdmin
//       ? { scope: 'superAdmin', business: null }
//       : { scope: 'admin', business: req.user?.business };

//     const update = {
//       ...filter,
//       emails: validEmails,
//       sendTime: sendTime || '18:00',
//       enabled: enabled !== false,
//     };

//     const schedule = await ReportEmailSchedule.findOneAndUpdate(
//       filter,
//       update,
//       { upsert: true, new: true, runValidators: true }
//     );

//     return sendSuccess(res, 200, 'Email schedule saved.', { schedule });
//   } catch (err) {
//     return sendError(res, 500, err.message);
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // EMAIL SCHEDULE — TEST (send now)
// // POST /api/report-data/email-schedule/test
// // ─────────────────────────────────────────────────────────────────────────────
// exports.testEmailSchedule = async (req, res) => {
//   try {
//     const isSuperAdmin = req.user?.role === 'super_admin';
//     const { sendReportEmail } = require('../../jobs/reportEmailJob');
//     await sendReportEmail(
//       isSuperAdmin ? 'superAdmin' : 'admin',
//       isSuperAdmin ? null : req.user?.business
//     );
//     return sendSuccess(res, 200, 'Test report email sent.');
//   } catch (err) {
//     console.error('[testEmailSchedule]', err);
//     return sendError(res, 500, err.message);
//   }
// };
/**
 * reportData.controller.js
 *
 * Handles:
 *   GET  /report-data/admin-summary       – KPI summary for the Summary dashboard tab
 *   GET  /report-data/email-schedule      – fetch current email schedule
 *   POST /report-data/email-schedule      – save / upsert email schedule
 *   POST /report-data/email-schedule/test – send a test report email right now
 */

const mongoose = require('mongoose');
const Order = require('../models/Order.model');
const Corporate = require('../models/Corporate.model');
const Invoice = require('../models/Invoice.model');
const Staff = require('../models/Staff.model');
const User = require('../models/User.model');
const ReportEmailSchedule = require('../models/ReportEmailSchedule.model');
const { sendReportEmail } = require('../jobs/reportEmailJob');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// ─── GET /report-data/admin-summary ──────────────────────────────────────────

const getAdminSummary = async (req, res) => {
  try {
    const businessId = req.businessId;
    const bid = new mongoose.Types.ObjectId(businessId);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    const [
      totalCorporates,
      activeCorporates,
      totalStaff,
      adminUsers,
      invoiceStats,
      monthRevRows,
      prevRevRows,
      recentCorporates,
      topCorporates,
      todayOrderStats,
    ] = await Promise.all([
      Corporate.countDocuments({ business: businessId }),
      Corporate.countDocuments({ business: businessId, status: 'active' }),
      Staff.countDocuments({ business: businessId }),
      User.countDocuments({ business: businessId, role: 'admin', isActive: true }),

      Invoice.aggregate([
        { $match: { business: bid } },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]),

      Invoice.aggregate([
        { $match: { business: bid, status: 'paid', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      Invoice.aggregate([
        { $match: { business: bid, status: 'paid', createdAt: { $gte: prevStart, $lt: monthStart } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      Corporate.find({ business: businessId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('companyName email status createdAt')
        .lean(),

      Order.aggregate([
        { $match: { business: bid } },
        { $group: { _id: '$corporate', totalRevenue: { $sum: '$totalAmount' }, totalOrders: { $sum: 1 } } },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'corporates', localField: '_id', foreignField: '_id', as: 'corp' } },
        { $unwind: { path: '$corp', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, companyName: '$corp.companyName', totalRevenue: 1, totalOrders: 1 } },
      ]),

      // Today's order stats — powers the Summary tab's "today orders" section
      Order.aggregate([
        { $match: { business: bid, createdAt: { $gte: todayStart, $lte: todayEnd } } },
        {
          $group: {
            _id: null,
            totalPlaced:  { $sum: 1 },
            delivered:    { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            processing:   { $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed', 'processing', 'assigned', 'ready']] }, 1, 0] } },
            cancelled:    { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            totalRevenue: { $sum: '$totalAmount' },
          },
        },
      ]),
    ]);

    const invMap = {};
    invoiceStats.forEach(s => { invMap[s._id] = { count: s.count, total: s.total }; });

    const totalRevenue     = invMap['paid']?.total    || 0;
    const overdueRevenue   = invMap['overdue']?.total || 0;
    const pendingRevenue   = invMap['pending']?.total || 0;
    const thisMonthRevenue = monthRevRows[0]?.total   || 0;
    const prevMonthRevenue = prevRevRows[0]?.total    || 0;
    const revenueGrowth    = prevMonthRevenue > 0
      ? Number((((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1))
      : null;

    const todayStats = todayOrderStats[0] || {
      totalPlaced: 0, delivered: 0, processing: 0, cancelled: 0, totalRevenue: 0,
    };

    return sendSuccess(res, 200, 'Admin summary fetched.', {
      corporates: { total: totalCorporates, active: activeCorporates },
      staff:      { total: totalStaff },
      adminUsers: { total: adminUsers },
      invoices: {
        total:             invoiceStats.reduce((s, x) => s + x.count, 0),
        paid:              invMap['paid']?.count    || 0,
        pending:           invMap['pending']?.count || 0,
        overdue:           invMap['overdue']?.count || 0,
        draft:             invMap['draft']?.count   || 0,
        totalRevenue,
        overdueRevenue,
        pendingRevenue,
        thisMonthRevenue,
        prevMonthRevenue,
        revenueGrowth,
      },
      todayOrders: {
        totalPlaced:  todayStats.totalPlaced,
        delivered:    todayStats.delivered,
        processing:   todayStats.processing,
        cancelled:    todayStats.cancelled,
        totalRevenue: todayStats.totalRevenue,
      },
      recentCorporates,
      topCorporates,
    });
  } catch (err) {
    console.error('[getAdminSummary]', err.message);
    return sendError(res, 500, err.message);
  }
};

// ─── GET /report-data/email-schedule ─────────────────────────────────────────

const getEmailSchedule = async (req, res) => {
  try {
    const schedule = await ReportEmailSchedule.findOne({
      scope: 'admin',
      business: req.businessId,
    }).lean();
    return sendSuccess(res, 200, 'Schedule fetched.', { schedule: schedule || null });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// ─── POST /report-data/email-schedule ────────────────────────────────────────

const saveEmailSchedule = async (req, res) => {
  try {
    const { emails = [], sendTime = '18:00', enabled = true } = req.body;
    const schedule = await ReportEmailSchedule.findOneAndUpdate(
      { scope: 'admin', business: req.businessId },
      { $set: { emails, sendTime, enabled } },
      { upsert: true, new: true, runValidators: true }
    );
    return sendSuccess(res, 200, 'Schedule saved.', { schedule });
  } catch (err) {
    return sendError(res, 400, err.message);
  }
};

// ─── POST /report-data/email-schedule/test ───────────────────────────────────

const sendTestEmail = async (req, res) => {
  try {
    await sendReportEmail('admin', req.businessId);
    return sendSuccess(res, 200, 'Test report sent.');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { getAdminSummary, getEmailSchedule, saveEmailSchedule, sendTestEmail };