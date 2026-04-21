const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} = require('../../controllers/admin/notification.controller');

// These handlers are already recipient-scoped (filter by req.user._id),
// not business-scoped — safe to reuse for super-admin behind a super_admin gate.
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

module.exports = router;
