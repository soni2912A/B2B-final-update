const express = require('express');
const router = express.Router();
const {
  getCorporateUsers, inviteUser, toggleUserStatus, updateCorporateUser,
} = require('../../controllers/corporate/user.controller');

router.route('/').get(getCorporateUsers).post(inviteUser);
router.put('/:id', updateCorporateUser);
router.patch('/:id/toggle-status', toggleUserStatus);

module.exports = router;
