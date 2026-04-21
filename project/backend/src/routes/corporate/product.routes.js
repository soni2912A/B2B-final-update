const express = require('express');
const router = express.Router();
const Product = require('../../models/Product.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

router.get('/', async (req, res) => {
  try {
    const products = await Product.find({
      business: req.businessId,
      status: 'active',
    }).select('name sku basePrice stockQuantity category unit taxRate images description pricingTiers status').sort({ name: 1 });
    return sendSuccess(res, 200, 'Products fetched', { products });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
});

module.exports = router;
