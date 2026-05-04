const express = require('express');
const router = express.Router();
const { getMyReferral } = require('../../controllers/referral.controller');

// GET /corporate/referrals/my-link
router.get('/my-link', getMyReferral);

module.exports = router;