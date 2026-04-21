const express = require('express');
const router = express.Router();
const { getAllTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate } = require('../../controllers/admin/template.controller');

router.route('/').get(getAllTemplates).post(createTemplate);
router.route('/:id').get(getTemplate).put(updateTemplate).delete(deleteTemplate);

module.exports = router;
