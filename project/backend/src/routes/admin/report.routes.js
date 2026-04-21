const express = require('express');
const router = express.Router();
const {
  getReportOverview,
  getSalesReport,
  getDeliveryReport,
  getClientsReport,
  getProductsReport,
  getRevenueReport,
  exportReport,
} = require('../../controllers/admin/report.controller');

router.get('/',         getReportOverview);
router.get('/sales',    getSalesReport);
router.get('/delivery', getDeliveryReport);
router.get('/clients',  getClientsReport);
router.get('/products', getProductsReport);
router.get('/revenue',  getRevenueReport);
router.get('/export',   exportReport);

module.exports = router;
