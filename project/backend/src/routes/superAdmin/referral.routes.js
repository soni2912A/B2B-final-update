const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/referral.controller');

// GET /super-admin/referrals       — all referrals overview (SA dashboard)
router.get('/', ctrl.getAllReferrals);

// GET /super-admin/referrals/me    — SA's own referral code & link
router.get('/me', ctrl.getMyReferral);

// PATCH /super-admin/referrals/:id/max-uses — customize usage limit
router.patch('/:id/max-uses', ctrl.updateMaxUses);

module.exports = router;