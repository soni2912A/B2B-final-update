const express = require('express');
const router = express.Router();
const { getAllLoginLogs, exportLoginLogs } = require('../../controllers/admin/loginLog.controller');

router.get('/export', exportLoginLogs);
router.get('/', getAllLoginLogs);

module.exports = router;
