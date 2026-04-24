const Order = require('../../models/Order.model');
const Delivery = require('../../models/Delivery.model');
const Corporate = require('../../models/Corporate.model');
const Invoice = require('../../models/Invoice.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

const getDashboard = async (req, res) => {
  try {
    const businessId = req.businessId;
    const isStaff    = req.user.role === 'staff';
    const staffId    = isStaff ? req.user._id : null;

    const startOfDay   = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay     = new Date(startOfDay); endOfDay.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

    
    const deliveryBase = isStaff
      ? { business: businessId, assignedTo: staffId }
      : { business: businessId };

    const [
      totalOrders, todayOrders, pendingOrders,
      totalDeliveries, todayDeliveries, pendingDeliveries,
      totalCorporates, activeCorporates,
      revenueThisMonth, overdueInvoices,
      recentOrders, todaysDeliveryList,
    ] = await Promise.all([
      Order.countDocuments({ business: businessId }),
      Order.countDocuments({ business: businessId, createdAt: { $gte: startOfDay } }),
      Order.countDocuments({ business: businessId, status: { $in: ['new', 'processing'] } }),
      Delivery.countDocuments(deliveryBase),
      Delivery.countDocuments({ ...deliveryBase, scheduledDate: { $gte: startOfDay, $lte: endOfDay } }),
      Delivery.countDocuments({ ...deliveryBase, status: { $in: ['scheduled', 'in_transit', 'rescheduled'] } }),
      Corporate.countDocuments({ business: businessId }),
      Corporate.countDocuments({ business: businessId, status: 'active' }),
      Invoice.aggregate([
        { $match: { business: businessId, status: 'paid', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Invoice.countDocuments({ business: businessId, status: 'overdue' }),
      Order.find({ business: businessId }).sort({ createdAt: -1 }).limit(5).populate('corporate', 'companyName'),
    
      isStaff
        ? Delivery.find({ ...deliveryBase, scheduledDate: { $gte: startOfDay, $lte: endOfDay } })
            .sort({ scheduledDate: 1 }).limit(10)
            .populate('order', 'orderNumber')
            .populate('corporate', 'companyName')
            .populate('assignedTo', 'name')
        : Delivery.find({ business: businessId, status: 'scheduled', scheduledDate: { $gte: new Date() } })
            .sort({ scheduledDate: 1 }).limit(5)
            .populate('order', 'orderNumber')
            .populate('corporate', 'companyName')
            .populate('assignedTo', 'name'),
    ]);

   
    return sendSuccess(res, 200, 'Dashboard data fetched', {
      stats: {
        totalOrders,
        todayOrders,
        pendingOrders,
        totalDeliveries,
        todayDeliveries,
        pendingDeliveries,
        totalCorporates,
        activeCorporates,
        totalRevenue: revenueThisMonth[0]?.total || 0,
        overdueInvoices,
      },
      recentOrders,
      upcomingDeliveries: todaysDeliveryList,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { getDashboard };