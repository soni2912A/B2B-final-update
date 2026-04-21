const express = require('express');
const router = express.Router();
const {
  getAllInvoices, getInvoice, downloadInvoicePdf,
  sendInvoiceEmail, recordPayment, exportInvoices,
} = require('../../controllers/admin/invoice.controller');

router.get('/export', exportInvoices);
router.get('/', getAllInvoices);
router.get('/:id', getInvoice);
router.get('/:id/download', downloadInvoicePdf);
router.post('/:id/send', sendInvoiceEmail);
router.post('/:id/payment', recordPayment);
// Refunds migrated to /admin/refunds (see refund.routes.js). Legacy route
// removed — invoice-tied refund creation without a pending-state workflow
// was a gap flagged during the Batch 6 audit.

module.exports = router;
