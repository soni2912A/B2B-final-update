const cron = require('node-cron');
const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const Occasion = require('../models/Occasion.model');
const Business = require('../models/Business.model');
const Corporate = require('../models/Corporate.model');
const User = require('../models/User.model');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');
const ReportEmailSchedule = require('../models/ReportEmailSchedule.model');
const { sendReportEmail } = require('./reportEmailJob');

const OCCASION_REMINDER_LEAD_DAYS = parseInt(process.env.OCCASION_REMINDER_LEAD_DAYS) || 7;

const preDeliveryAlertJob = cron.schedule('0 8 * * *', async () => {
  try {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const startOfDay = new Date(twoDaysFromNow.setHours(0, 0, 0, 0));
    const endOfDay = new Date(twoDaysFromNow.setHours(23, 59, 59, 999));

    const orders = await Order.find({
      deliveryDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['processing', 'assigned'] },
      preDeliveryAlertSent: false,
    }).populate('corporate');

    for (const order of orders) {
      await emailService.sendPreDeliveryAlert(order);
      await Order.findByIdAndUpdate(order._id, { preDeliveryAlertSent: true });
      console.log(`Pre-delivery alert sent for order ${order.orderNumber}`);
    }
  } catch (error) {
    console.error('Pre-delivery alert job error:', error.message);
  }
}, { scheduled: false });

const lowStockAlertJob = cron.schedule('0 9 * * *', async () => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
      status: 'active',
    }).populate('business');

    for (const product of lowStockProducts) {
      console.log(`Low stock alert: ${product.name} (${product.stockQuantity} remaining)`);
      try {
        const User = require('../models/User.model');
        const admin = await User.findOne({ business: product.business?._id, role: 'admin', isActive: true });
        if (admin) {
          await emailService.sendLowStockAlert(admin.email, admin.name, product);
        }
      } catch (e) {
        console.error('Low stock email error:', e.message);
      }
    }
  } catch (error) {
    console.error('Low stock alert job error:', error.message);
  }
}, { scheduled: false });

const feedbackRequestJob = cron.schedule('0 10 * * *', async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

    const deliveredOrders = await Order.find({
      status: 'delivered',
      updatedAt: { $gte: startOfYesterday, $lte: endOfYesterday },
    }).populate('corporate');

    for (const order of deliveredOrders) {
      await emailService.sendFeedbackRequest(order);
      console.log(`Feedback request sent for order ${order.orderNumber}`);
    }
  } catch (error) {
    console.error('Feedback request job error:', error.message);
  }
}, { scheduled: false });

const overdueInvoiceJob = cron.schedule('0 7 * * *', async () => {
  try {
    const Invoice = require('../models/Invoice.model');
    await Invoice.updateMany(
      { status: { $in: ['sent', 'partial'] }, dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );
    console.log('Overdue invoices updated');
  } catch (error) {
    console.error('Overdue invoice job error:', error.message);
  }
}, { scheduled: false });

const runUpcomingOccasionReminders = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + OCCASION_REMINDER_LEAD_DAYS);
  windowEnd.setHours(23, 59, 59, 999);

  const occasions = await Occasion.find({
    date: { $gte: today, $lte: windowEnd },
    reminderSentAt: null,
    createdBy: { $ne: null },
  }).populate('staff', 'firstName lastName');

  let sent = 0;
  for (const occasion of occasions) {
    try {
      const allowed = await notificationService.shouldNotify(occasion.createdBy, 'upcomingOccasion');
      if (allowed) {
        const staffName = occasion.staff && (occasion.staff.firstName || occasion.staff.lastName)
          ? `${occasion.staff.firstName || ''} ${occasion.staff.lastName || ''}`.trim()
          : null;
        const when = new Date(occasion.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const subject = staffName ? `${staffName}'s ${occasion.type}` : (occasion.title || occasion.type);
        await notificationService.createNotification({
          business: occasion.business,
          recipient: occasion.createdBy,
          title: 'Upcoming Occasion',
          message: `${subject} on ${when}.`,
          type: 'occasion',
          referenceId: occasion._id,
          referenceModel: 'Occasion',
        });
        sent += 1;
      }
      await Occasion.findByIdAndUpdate(occasion._id, { reminderSentAt: new Date() });
    } catch (err) {
      console.error(`[upcomingOccasionReminder] occasion ${occasion._id} failed:`, err.message);
    }
  }
  console.log(`Upcoming occasion reminders: ${sent}/${occasions.length} sent`);
  return { matched: occasions.length, sent };
};

const upcomingOccasionReminderJob = cron.schedule('30 7 * * *', async () => {
  try {
    await runUpcomingOccasionReminders();
  } catch (error) {
    console.error('Upcoming occasion reminder job error:', error.message);
  }
}, { scheduled: false });

/**
 * Build and send a daily summary report for a single business.
 * Called at 5 PM every day for all active businesses.
 */
const sendDailyReportForBusiness = async (business, adminEmail, adminName) => {
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const endOfToday   = new Date(today.setHours(23, 59, 59, 999));

  const [totalCorporates, orderStats] = await Promise.all([
    Corporate.countDocuments({ business: business._id }),
    Order.aggregate([
      { $match: { business: business._id, createdAt: { $gte: startOfToday, $lte: endOfToday } } },
      {
        $group: {
          _id: null,
          totalPlaced:   { $sum: 1 },
          delivered:     { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          processing:    { $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed', 'processing', 'assigned', 'ready']] }, 1, 0] } },
          cancelled:     { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          totalRevenue:  { $sum: '$totalAmount' },
        },
      },
    ]),
  ]);

  const stats = orderStats[0] || { totalPlaced: 0, delivered: 0, processing: 0, cancelled: 0, totalRevenue: 0 };
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:10px;">
      <h2 style="color:#0ea5e9;margin-bottom:4px;">📊 Daily Report – ${dateStr}</h2>
      <p style="color:#555;margin-top:0;">${business.name}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;"/>

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;width:48%;">
            <div style="font-size:13px;color:#6b7280;">Total Corporates</div>
            <div style="font-size:28px;font-weight:700;color:#1f2937;">${totalCorporates}</div>
          </td>
          <td style="width:4%;"></td>
          <td style="padding:10px 16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;width:48%;">
            <div style="font-size:13px;color:#6b7280;">Orders Placed Today</div>
            <div style="font-size:28px;font-weight:700;color:#1f2937;">${stats.totalPlaced}</div>
          </td>
        </tr>
        <tr><td colspan="3" style="height:12px;"></td></tr>
        <tr>
          <td style="padding:10px 16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;width:48%;">
            <div style="font-size:13px;color:#6b7280;">✅ Delivered Today</div>
            <div style="font-size:28px;font-weight:700;color:#16a34a;">${stats.delivered}</div>
          </td>
          <td style="width:4%;"></td>
          <td style="padding:10px 16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;width:48%;">
            <div style="font-size:13px;color:#6b7280;">⏳ In Process</div>
            <div style="font-size:28px;font-weight:700;color:#d97706;">${stats.processing}</div>
          </td>
        </tr>
        <tr><td colspan="3" style="height:12px;"></td></tr>
        <tr>
          <td style="padding:10px 16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;width:48%;">
            <div style="font-size:13px;color:#6b7280;">❌ Cancelled Today</div>
            <div style="font-size:28px;font-weight:700;color:#dc2626;">${stats.cancelled}</div>
          </td>
          <td style="width:4%;"></td>
          <td style="padding:10px 16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;width:48%;">
            <div style="font-size:13px;color:#6b7280;">💰 Revenue Today</div>
            <div style="font-size:28px;font-weight:700;color:#7c3aed;">₹${Number(stats.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
      <p style="font-size:12px;color:#9ca3af;text-align:center;">
        This is an automated daily report sent every day at 5:00 PM IST.<br/>
        B2B Corporate Bakery Platform
      </p>
    </div>
  `;

  await emailService.sendMail({
    to: adminEmail,
    subject: `📊 Daily Report – ${dateStr} | ${business.name}`,
    html,
    businessId: business._id,
    templateType: 'daily_report',
  });

  console.log(`[dailyReport] Sent to ${adminEmail} for business ${business.name}`);
};

/**
 * Daily 5 PM IST report job.
 * Sends per-business summary to each admin and super admin.
 * Cron: '0 17 * * *'  →  every day at 17:00 server time
 * (Make sure the server is in Asia/Kolkata timezone, or adjust accordingly.)
 */
const dailyReportJob = cron.schedule('0 17 * * *', async () => {
  console.log('[dailyReport] Running 5 PM daily report job...');
  try {
    const superAdmins = await User.find({ role: 'super_admin', isActive: true }).lean();
    const businesses  = await Business.find({ isActive: true }).lean();

    // Per-business: send to admin(s) of that business
    for (const business of businesses) {
      try {
        const admins = await User.find({ business: business._id, role: 'admin', isActive: true }).lean();
        for (const admin of admins) {
          try {
            await sendDailyReportForBusiness(business, admin.email, admin.name);
          } catch (err) {
            console.error(`[dailyReport] Failed for admin ${admin.email}:`, err.message);
          }
        }
      } catch (err) {
        console.error(`[dailyReport] Business ${business._id} error:`, err.message);
      }
    }

    // Super admins: iterate all businesses
    for (const sa of superAdmins) {
      for (const business of businesses) {
        try {
          await sendDailyReportForBusiness(business, sa.email, sa.name);
        } catch (err) {
          console.error(`[dailyReport] Failed for super_admin ${sa.email}, biz ${business._id}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('[dailyReport] Job error:', err.message);
  }
}, { scheduled: false });

/**
 * Schedule-driven report email job.
 * Runs every minute and fires emails when the wall-clock matches a
 * ReportEmailSchedule document's sendTime (HH:MM).
 */
const dailyReportEmailJob = cron.schedule('* * * * *', async () => {
  try {
    // Use IST (Asia/Kolkata = UTC+5:30) to match stored sendTime
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istNow = new Date(now.getTime() + istOffset);
    const hh  = String(istNow.getUTCHours()).padStart(2, '0');
    const mm  = String(istNow.getUTCMinutes()).padStart(2, '0');
    const nowTime = `${hh}:${mm}`;

    // Find all enabled schedules that match the current HH:MM
    const schedules = await ReportEmailSchedule.find({
      enabled:  true,
      sendTime: nowTime,
      'emails.0': { $exists: true }, // at least one recipient
    }).lean();

    for (const s of schedules) {
      const isSuperAdmin = s.scope === 'superAdmin';
      try {
        await sendReportEmail(isSuperAdmin ? 'superAdmin' : 'admin', s.business || null);
        console.log(`[dailyReportEmailJob] Sent ${s.scope} report for business=${s.business}`);
      } catch (err) {
        console.error(`[dailyReportEmailJob] Error for schedule ${s._id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Daily report email job error:', error.message);
  }
}, { scheduled: false });

const startAllJobs = () => {
  preDeliveryAlertJob.start();
  lowStockAlertJob.start();
  feedbackRequestJob.start();
  overdueInvoiceJob.start();
  upcomingOccasionReminderJob.start();
  dailyReportJob.start();
  dailyReportEmailJob.start();
  console.log('All cron jobs started');
};

module.exports = {
  startAllJobs,
  preDeliveryAlertJob,
  lowStockAlertJob,
  feedbackRequestJob,
  overdueInvoiceJob,
  upcomingOccasionReminderJob,
  runUpcomingOccasionReminders,
  dailyReportJob,
  sendDailyReportForBusiness,
  dailyReportEmailJob,
};