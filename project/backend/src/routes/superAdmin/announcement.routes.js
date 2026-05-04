const express = require('express');
const router  = express.Router();

const ctrl = require('../../controllers/superAdmin/announcement.controller');

// Defensive check — catch misconfigured require paths early
if (!ctrl.getAnnouncements || !ctrl.createAnnouncement ||
    !ctrl.updateAnnouncement || !ctrl.deleteAnnouncement) {
  throw new Error(
    '[announcement.routes] Controller exports are undefined. ' +
    'Make sure announcement.controller.js is in backend/src/controllers/superAdmin/'
  );
}

router.route('/')
  .get(ctrl.getAnnouncements)
  .post(ctrl.createAnnouncement);

router.route('/:id')
  .patch(ctrl.updateAnnouncement)
  .delete(ctrl.deleteAnnouncement);

module.exports = router;