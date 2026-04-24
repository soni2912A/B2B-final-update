const cron = require('node-cron');
const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const Occasion = require('../models/Occasion.model');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');

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

const startAllJobs = () => {
  preDeliveryAlertJob.start();
  lowStockAlertJob.start();
  feedbackRequestJob.start();
  overdueInvoiceJob.start();
  upcomingOccasionReminderJob.start();
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
};
