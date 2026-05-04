const express = require('express');
const router  = express.Router();
const {
  getAdminSummary,
  getEmailSchedule,
  saveEmailSchedule,
  sendTestEmail,
} = require('../controllers/reportData.controller');

router.get('/admin-summary',         getAdminSummary);
router.get('/email-schedule',        getEmailSchedule);
router.post('/email-schedule',       saveEmailSchedule);
router.post('/email-schedule/test',  sendTestEmail);

module.exports = router;