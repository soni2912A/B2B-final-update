const express = require('express');
const router = express.Router();
const { getAllDiscounts, createDiscount, updateDiscount, deleteDiscount, validateCoupon } = require('../../controllers/admin/discount.controller');
router.get('/', getAllDiscounts);
router.post('/', createDiscount);
router.post('/validate', validateCoupon);
router.put('/:id', updateDiscount);
router.delete('/:id', deleteDiscount);
module.exports = router;
