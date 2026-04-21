const Delivery = require('../models/Delivery.model');
const Order = require('../models/Order.model');
const notificationService = require('./notification.service');

const scheduleDelivery = async (orderId, businessId, scheduledDate, assignedTo) => {
  const order = await Order.findById(orderId).populate('corporate');
  if (!order) throw new Error('Order not found');
  const delivery = await Delivery.create({
    business: businessId,
    order: orderId,
    corporate: order.corporate._id,
    assignedTo,
    scheduledDate,
    deliveryAddress: order.deliveryAddress,
    status: 'scheduled',
  });
  await Order.findByIdAndUpdate(orderId, { status: 'assigned' });
  return delivery;
};

const getUpcomingDeliveries = async (businessId, days = 2) => {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + days);
  return await Delivery.find({
    business: businessId,
    scheduledDate: { $gte: from, $lte: to },
    status: 'scheduled',
    'order.preDeliveryAlertSent': false,
  }).populate('order').populate('corporate');
};

module.exports = { scheduleDelivery, getUpcomingDeliveries };
