const express = require('express');
const router = express.Router();
const { validateCoupon, listAvailableDiscounts } = require('../../controllers/corporate/discount.controller');

router.get('/', listAvailableDiscounts);
router.post('/validate', validateCoupon);

module.exports = router;
