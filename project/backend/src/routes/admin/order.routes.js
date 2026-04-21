const express = require('express');
const router = express.Router();
const {
  getAllOrders, getOrder, getStateMachine, updateOrderStatus,
  assignOrder, cancelOrder, sendPreDeliveryAlert, sendBulkDeliveryReminders,
  exportOrders,
} = require('../../controllers/admin/order.controller');
const { initiateRefundForOrder } = require('../../controllers/admin/refund.controller');

router.get('/export', exportOrders);
router.get('/state-machine', getStateMachine);
router.post('/send-delivery-reminders', sendBulkDeliveryReminders);
router.get('/', getAllOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/assign', assignOrder);
router.patch('/:id/cancel', cancelOrder);
router.post('/:id/initiate-refund', initiateRefundForOrder);
router.post('/:id/pre-delivery-alert', sendPreDeliveryAlert);

module.exports = router;
