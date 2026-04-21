const express = require('express');
const router = express.Router();
const { getAllInventory, getLowStockItems, adjustStock } = require('../../controllers/admin/inventory.controller');

router.get('/', getAllInventory);
router.get('/low-stock', getLowStockItems);
router.patch('/:productId/adjust', adjustStock);

module.exports = router;
