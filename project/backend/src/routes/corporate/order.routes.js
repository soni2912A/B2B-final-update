const express = require('express');
const router = express.Router();
const {
  placeOrder, getMyOrders, getMyOrder, listDeliveryStaff,
} = require('../../controllers/corporate/order.controller');

// delivery-staff must come before /:id so the literal path wins the match.
router.get('/delivery-staff', listDeliveryStaff);
router.route('/').get(getMyOrders).post(placeOrder);
router.get('/:id', getMyOrder);

module.exports = router;
