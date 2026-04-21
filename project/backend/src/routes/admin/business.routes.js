const express = require('express');
const router = express.Router();
const { getBusiness, updateBusiness, uploadLogo } = require('../../controllers/admin/business.controller');
const { logoUploadMiddleware } = require('../../middleware/upload.middleware');

router.get('/', getBusiness);
router.patch('/', updateBusiness);
router.post('/logo', logoUploadMiddleware('logo'), uploadLogo);

module.exports = router;
