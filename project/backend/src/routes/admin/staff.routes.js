const express = require('express');
const router = express.Router();
const { exportStaff, importStaff, staffTemplate } = require('../../controllers/admin/staff.controller');
const { importFileMiddleware } = require('../../middleware/upload.middleware');

router.get('/export', exportStaff);
router.get('/import/template', staffTemplate);
router.post('/import', importFileMiddleware('file'), importStaff);

module.exports = router;
