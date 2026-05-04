const express = require('express');
const router  = express.Router();

const ctrl = require('../controllers/superAdmin/announcement.controller');

if (!ctrl.getMyAnnouncements || !ctrl.markRead) {
  throw new Error(
    '[announcements.routes] Controller exports are undefined. ' +
    'Make sure announcement.controller.js is in backend/src/controllers/superAdmin/'
  );
}

router.get('/me',          ctrl.getMyAnnouncements);
router.patch('/:id/read',  ctrl.markRead);

module.exports = router;