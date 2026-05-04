const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/referral.controller');

router.get('/', ctrl.getAllReferrals);

module.exports = router;