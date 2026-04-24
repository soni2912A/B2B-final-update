const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} = require('../../controllers/admin/notification.controller');

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

module.exports = router;
