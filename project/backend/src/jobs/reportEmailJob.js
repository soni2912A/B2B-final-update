/**
 * reportEmailJob.js
 *
 * Builds and sends the daily summary email for a given scope:
 *   - 'admin'      → per-business KPI report (invoices + today's orders)
 *   - 'superAdmin' → platform-wide report
 *
 * Called by:
 *   1. The cron job in cronJobs.js (daily at configured time)
 *   2. The test endpoint POST /report-data/email-schedule/test
 */

const mongoose = require('mongoose');
const Business = require('../models/Business.model');
const Corporate = require('../models/Corporate.model');
const Order = require('../models/Order.model');
const Staff = require('../models/Staff.model');
const Invoice = require('../models/Invoice.model');
const ReportEmailSchedule = require('../models/ReportEmailSchedule.model');
const emailService = require('../services/email.service');

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtMoney(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

function fmtPct(n) {
  if (n == null) return '—';
  return (n >= 0 ? '↑ ' : '↓ ') + Math.abs(n).toFixed(1) + '% vs last month';
}

// ─── admin (per-business) report builder ─────────────────────────────────────

async function buildAdminReport(businessId) {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const bidObj     = new mongoose.Types.ObjectId(businessId);

  const [corps, staff, invStats, monthRev, prevRev, todayOrderStats] = await Promise.all([
    Corporate.countDocuments({ business: businessId }),
    Staff.countDocuments({ business: businessId }),

    Invoice.aggregate([
      { $match: { business: bidObj } },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
    ]),

    Invoice.aggregate([
      { $match: { business: bidObj, status: 'paid', createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),

    Invoice.aggregate([
      { $match: { business: bidObj, status: 'paid', createdAt: { $gte: prevStart, $lt: monthStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),

    // Today's order KPIs — the core data the admin wants
    Order.aggregate([
      { $match: { business: bidObj, createdAt: { $gte: todayStart, $lte: todayEnd } } },
      {
        $group: {
          _id: null,
          totalPlaced:  { $sum: 1 },
          delivered:    { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          processing:   { $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed', 'processing', 'assigned', 'ready']] }, 1, 0] } },
          cancelled:    { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          todayRevenue: { $sum: '$totalAmount' },
        },
      },
    ]),
  ]);

  const byStatus = {};
  invStats.forEach(s => { byStatus[s._id] = { count: s.count, total: s.total }; });

  const thisMonth = monthRev[0]?.total || 0;
  const prevMonth = prevRev[0]?.total  || 0;
  const growth    = prevMonth > 0
    ? Number((((thisMonth - prevMonth) / prevMonth) * 100).toFixed(1))
    : null;

  const today = todayOrderStats[0] || {
    totalPlaced: 0, delivered: 0, processing: 0, cancelled: 0, todayRevenue: 0,
  };

  return {
    totalCorporates:  corps,
    totalStaff:       staff,
    totalInvoices:    invStats.reduce((s, x) => s + x.count, 0),
    totalRevenue:     byStatus['paid']?.total    || 0,
    overdueRevenue:   byStatus['overdue']?.total || 0,
    overdueCount:     byStatus['overdue']?.count || 0,
    thisMonthRevenue: thisMonth,
    revenueGrowth:    growth,
    // Today's orders
    todayPlaced:    today.totalPlaced,
    todayDelivered: today.delivered,
    todayProcessing: today.processing,
    todayCancelled: today.cancelled,
    todayRevenue:   today.todayRevenue,
  };
}

// ─── super-admin (platform) report builder ────────────────────────────────────

async function buildSuperAdminReport() {
  const businesses = await Business.find().lean();
  const ids = businesses.map(b => b._id);

  const [corpCounts, invCounts] = await Promise.all([
    Corporate.aggregate([
      { $match: { business: { $in: ids } } },
      { $group: { _id: '$business', count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { business: { $in: ids } } },
      { $group: { _id: '$business', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
  ]);

  const ccMap  = Object.fromEntries(corpCounts.map(x => [x._id.toString(), x.count]));
  const revMap = Object.fromEntries(invCounts.map(x  => [x._id.toString(), x.total]));

  return {
    totalBusinesses:  businesses.length,
    activeBusinesses: businesses.filter(b => b.isActive).length,
    totalCorporates:  Object.values(ccMap).reduce((s, n) => s + n, 0),
    totalRevenue:     Object.values(revMap).reduce((s, n) => s + n, 0),
  };
}

// ─── HTML email builder (admin) ───────────────────────────────────────────────

function buildAdminEmailHtml(data, businessName) {
  const now = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: -apple-system, Arial, sans-serif; background:#F9FAFB; margin:0; padding:20px; }
    .container { max-width:580px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; border:1px solid #E5E7EB; }
    .header { background:linear-gradient(135deg,#0ea5e9 0%,#6366F1 100%); padding:28px 24px; color:#fff; }
    .header h1 { margin:0; font-size:22px; font-weight:700; }
    .header p  { margin:4px 0 0; font-size:13px; opacity:.85; }
    .section-label { font-size:11px; font-weight:700; letter-spacing:.08em; color:#6B7280; text-transform:uppercase; padding:20px 24px 8px; }
    .body { padding:0 24px 20px; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:4px; }
    .card { background:#F9FAFB; border:1px solid #E5E7EB; border-radius:10px; padding:14px 16px; }
    .card .val { font-size:24px; font-weight:800; color:#111827; }
    .card .lbl { font-size:12px; color:#6B7280; margin-top:2px; }
    .card .sub { font-size:11px; font-weight:600; margin-top:3px; }
    .divider { border:none; border-top:1px solid #F3F4F6; margin:16px 24px; }
    .alert { margin:0 24px 16px; background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:12px 16px; font-size:13px; color:#991B1B; }
    .footer { padding:16px 24px; background:#F9FAFB; font-size:11px; color:#9CA3AF; border-top:1px solid #E5E7EB; text-align:center; }
  </style>
</head>
<body>
<div class="container">

  <div class="header">
    <h1>📊 Daily Business Report</h1>
    <p>${businessName} &nbsp;·&nbsp; ${now}</p>
  </div>

  <div class="section-label">Today's Orders</div>
  <div class="body">
    <div class="grid">
      <div class="card">
        <div class="val">${data.totalCorporates}</div>
        <div class="lbl">Total Corporate Clients</div>
      </div>
      <div class="card">
        <div class="val">${data.todayPlaced}</div>
        <div class="lbl">Orders Placed Today</div>
      </div>
      <div class="card">
        <div class="val" style="color:#16A34A">${data.todayDelivered}</div>
        <div class="lbl">✅ Delivered Today</div>
      </div>
      <div class="card">
        <div class="val" style="color:#D97706">${data.todayProcessing}</div>
        <div class="lbl">⏳ In Process</div>
      </div>
      <div class="card">
        <div class="val" style="color:#DC2626">${data.todayCancelled}</div>
        <div class="lbl">❌ Cancelled Today</div>
      </div>
      <div class="card">
        <div class="val" style="color:#7C3AED">${fmtMoney(data.todayRevenue)}</div>
        <div class="lbl">💰 Revenue Today</div>
      </div>
    </div>
  </div>

  <hr class="divider"/>

  <div class="section-label">Billing Overview</div>
  <div class="body">
    <div class="grid">
      <div class="card">
        <div class="val" style="color:#6366F1">${fmtMoney(data.totalRevenue)}</div>
        <div class="lbl">Total Revenue (Paid)</div>
        <div class="sub" style="color:#6366F1">${fmtPct(data.revenueGrowth)}</div>
      </div>
      <div class="card">
        <div class="val">${fmtMoney(data.thisMonthRevenue)}</div>
        <div class="lbl">This Month's Revenue</div>
      </div>
      <div class="card">
        <div class="val">${data.totalInvoices}</div>
        <div class="lbl">Total Invoices</div>
      </div>
      <div class="card">
        <div class="val" style="color:#DC2626">${fmtMoney(data.overdueRevenue)}</div>
        <div class="lbl">Overdue Amount</div>
        <div class="sub" style="color:#DC2626">${data.overdueCount} overdue</div>
      </div>
    </div>
  </div>

  ${data.overdueCount > 0 ? `
  <div class="alert">
    🔴 <strong>${data.overdueCount} overdue invoice${data.overdueCount !== 1 ? 's' : ''}</strong>
    totalling ${fmtMoney(data.overdueRevenue)} — please follow up with clients.
  </div>` : ''}

  <div class="footer">
    Automated daily report · B2B Corporate Bakery Platform<br/>
    Sent every day at your configured time.
  </div>
</div>
</body>
</html>`;
}

// ─── HTML email builder (super admin) ────────────────────────────────────────

function buildSuperAdminEmailHtml(data) {
  const now = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: -apple-system, Arial, sans-serif; background:#F9FAFB; margin:0; padding:20px; }
    .container { max-width:560px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; border:1px solid #E5E7EB; }
    .header { background:#6366F1; padding:24px; color:#fff; }
    .header h1 { margin:0; font-size:20px; }
    .header p  { margin:4px 0 0; font-size:13px; opacity:.85; }
    .body { padding:24px; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
    .card { background:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; padding:14px 16px; }
    .card .val { font-size:22px; font-weight:800; color:#111827; }
    .card .lbl { font-size:12px; color:#6B7280; margin-top:2px; }
    .footer { padding:16px 24px; background:#F9FAFB; font-size:11px; color:#9CA3AF; border-top:1px solid #E5E7EB; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🏢 Platform Daily Report</h1>
    <p>Super Admin Summary &nbsp;·&nbsp; ${now}</p>
  </div>
  <div class="body">
    <div class="grid">
      <div class="card"><div class="val">${data.totalBusinesses}</div><div class="lbl">Total Businesses</div></div>
      <div class="card"><div class="val" style="color:#16A34A">${data.activeBusinesses}</div><div class="lbl">Active Businesses</div></div>
      <div class="card"><div class="val">${data.totalCorporates}</div><div class="lbl">Total Corporate Clients</div></div>
      <div class="card"><div class="val" style="color:#6366F1">${fmtMoney(data.totalRevenue)}</div><div class="lbl">Platform Revenue</div></div>
    </div>
  </div>
  <div class="footer">Automated platform summary. Do not reply to this email.</div>
</div>
</body>
</html>`;
}

// ─── main export ──────────────────────────────────────────────────────────────

async function sendReportEmail(scope, businessId) {
  const isSuperAdmin = scope === 'superAdmin';

  const query = isSuperAdmin
    ? { scope: 'superAdmin', business: null }
    : { scope: 'admin', business: businessId };

  const schedule = await ReportEmailSchedule.findOne(query);
  if (!schedule || !schedule.enabled || schedule.emails.length === 0) {
    console.log(`[reportEmailJob] No active schedule for scope=${scope} business=${businessId}`);
    return;
  }

  let html, subject, businessName;

  if (isSuperAdmin) {
    const data = await buildSuperAdminReport();
    html    = buildSuperAdminEmailHtml(data);
    subject = `Platform Daily Report — ${new Date().toLocaleDateString('en-IN')}`;
  } else {
    const business = await Business.findById(businessId).lean();
    businessName   = business?.name || 'Your Business';
    const data     = await buildAdminReport(businessId);
    html    = buildAdminEmailHtml(data, businessName);
    subject = `Daily Report: ${businessName} — ${new Date().toLocaleDateString('en-IN')}`;
  }

  for (const email of schedule.emails) {
    try {
      await emailService.sendMail({
        to: email,
        subject,
        html,
        businessId: isSuperAdmin ? null : businessId,
      });
      console.log(`[reportEmailJob] Sent to ${email}`);
    } catch (err) {
      console.error(`[reportEmailJob] Failed to send to ${email}:`, err.message);
    }
  }

  await ReportEmailSchedule.findByIdAndUpdate(schedule._id, { lastSentAt: new Date() });
}

module.exports = { sendReportEmail };