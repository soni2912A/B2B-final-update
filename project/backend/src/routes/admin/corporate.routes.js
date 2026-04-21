const express = require('express');
const router = express.Router();
const {
  getAllCorporates, getCorporate, createCorporate,
  updateCorporate, updateCorporateStatus, deleteCorporate,
  exportCorporates, importCorporates, corporatesTemplate,
} = require('../../controllers/admin/corporate.controller');
const { importFileMiddleware } = require('../../middleware/upload.middleware');

router.get('/export', exportCorporates);
router.get('/import/template', corporatesTemplate);
router.post('/import', importFileMiddleware('file'), importCorporates);

router.route('/').get(getAllCorporates).post(createCorporate);
router.route('/:id').get(getCorporate).put(updateCorporate).delete(deleteCorporate);
router.patch('/:id/status', updateCorporateStatus);

module.exports = router;
