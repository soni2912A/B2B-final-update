const express = require('express');
const router = express.Router();
const {
  listRefunds, getRefund, processRefund, rejectRefund,
} = require('../../controllers/admin/refund.controller');

router.get('/', listRefunds);
router.get('/:id', getRefund);
router.patch('/:id/process', processRefund);
router.patch('/:id/reject', rejectRefund);

module.exports = router;
