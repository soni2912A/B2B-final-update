const express = require('express');
const router = express.Router();
const { submitFeedback, listMyFeedback } = require('../../controllers/corporate/feedback.controller');

router.get('/', listMyFeedback);
router.post('/', submitFeedback);

module.exports = router;
