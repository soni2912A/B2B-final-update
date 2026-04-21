const express = require('express');
const router = express.Router();
const { getAllLoginLogs, exportLoginLogs } = require('../../controllers/superAdmin/loginLog.controller');

router.get('/export', exportLoginLogs);
router.get('/', getAllLoginLogs);

module.exports = router;
