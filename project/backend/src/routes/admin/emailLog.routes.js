const express = require('express');
const router = express.Router();
const { getAllEmailLogs, resendEmailLog } = require('../../controllers/admin/emailLog.controller');

router.get('/', getAllEmailLogs);
router.post('/:id/resend', resendEmailLog);

module.exports = router;
