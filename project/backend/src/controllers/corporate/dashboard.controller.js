const Order = require('../../models/Order.model');
const Staff = require('../../models/Staff.model');
const Invoice = require('../../models/Invoice.model');
const Occasion = require('../../models/Occasion.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

const getDashboard = async (req, res) => {
  try {
    const corporateId = req.user.corporate;
    const today = new Date();
    const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalStaff, activeOrders, pendingInvoices,
      upcomingOccasions, recentOrders,
    ] = await Promise.all([
      Staff.countDocuments({ corporate: corporateId, status: 'active' }),
      Order.countDocuments({ corporate: corporateId, status: { $nin: ['delivered', 'cancelled'] } }),
      Invoice.countDocuments({ corporate: corporateId, status: { $in: ['sent', 'partial', 'overdue'] } }),
      Occasion.find({
        corporate: corporateId,
        date: { $gte: today, $lte: next7Days },
      }).populate('staff', 'firstName lastName').limit(10),
      Order.find({ corporate: corporateId }).sort({ createdAt: -1 }).limit(5)
        .populate('assignedTo', 'name'),
    ]);

    
    return sendSuccess(res, 200, 'Dashboard fetched', {
      stats: {
        totalStaff,
        activeOrders,
        pendingInvoices,
        upcomingEvents: upcomingOccasions.length,
      },
      upcomingBirthdays: upcomingOccasions.map(o => {
        const name = o.staff ? `${o.staff.firstName || ''} ${o.staff.lastName || ''}`.trim() : (o.title || 'Event');
        const days = Math.max(0, Math.ceil((new Date(o.date) - today) / (24 * 60 * 60 * 1000)));
        return { name, date: new Date(o.date).toDateString(), days };
      }),
      recentOrders,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { getDashboard };
