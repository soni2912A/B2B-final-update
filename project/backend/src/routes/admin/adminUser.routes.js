const express = require('express');
const router = express.Router();
const {
  getAllAdminUsers, inviteUser, updateAdminUser,
  toggleUserStatus, resetUserPassword, deleteAdminUser,
} = require('../../controllers/admin/adminUser.controller');

router.get('/', getAllAdminUsers);
router.post('/invite', inviteUser);
router.put('/:id', updateAdminUser);
router.delete('/:id', deleteAdminUser);
router.patch('/:id/toggle-status', toggleUserStatus);
router.patch('/:id/reset-password', resetUserPassword);

module.exports = router;
