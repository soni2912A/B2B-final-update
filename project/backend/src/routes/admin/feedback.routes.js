const express = require('express');
const router = express.Router();
const { getAllFeedback, getFeedbackById, respondToFeedback } = require('../../controllers/admin/feedback.controller');
router.get('/', getAllFeedback);
router.get('/:id', getFeedbackById);
router.patch('/:id/respond', respondToFeedback);
module.exports = router;
