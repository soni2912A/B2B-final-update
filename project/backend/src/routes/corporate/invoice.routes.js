const express = require('express');
const router = express.Router();
const { getMyInvoices, downloadInvoice } = require('../../controllers/corporate/invoice.controller');

router.get('/', getMyInvoices);
router.get('/:id/download', downloadInvoice);

module.exports = router;
