const Order = require('../models/Order.model');
const Invoice = require('../models/Invoice.model');
const Delivery = require('../models/Delivery.model');
const Corporate = require('../models/Corporate.model');

const getSalesSummary = async (businessId, from, to) => {
  const match = { business: businessId };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }
  return await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        avgOrderValue: { $avg: '$totalAmount' },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      },
    },
  ]);
};

const getTopCorporates = async (businessId, limit = 5) => {
  return await Order.aggregate([
    { $match: { business: businessId, status: 'delivered' } },
    { $group: { _id: '$corporate', totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    { $lookup: { from: 'corporates', localField: '_id', foreignField: '_id', as: 'corporate' } },
    { $unwind: '$corporate' },
  ]);
};

const getMonthlyRevenue = async (businessId, year) => {
  return await Invoice.aggregate([
    { $match: { business: businessId, status: 'paid', paidAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } },
    { $group: { _id: { $month: '$paidAt' }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
};

module.exports = { getSalesSummary, getTopCorporates, getMonthlyRevenue };
