const express = require('express');
const router = express.Router();
const {
  getAllStaff, getStaffMember, createStaff, updateStaff, updateStaffStatus,
  deleteStaff, bulkImportStaff, previewImportStaff, exportStaff,
} = require('../../controllers/corporate/staff.controller');
const { importFileMiddleware } = require('../../middleware/upload.middleware');

router.route('/').get(getAllStaff).post(createStaff);
router.get('/export', exportStaff);
router.post('/import/preview', importFileMiddleware('file'), previewImportStaff);
router.post('/import', importFileMiddleware('file'), bulkImportStaff);
router.route('/:id').get(getStaffMember).put(updateStaff).delete(deleteStaff);
router.patch('/:id/status', updateStaffStatus);

module.exports = router;
