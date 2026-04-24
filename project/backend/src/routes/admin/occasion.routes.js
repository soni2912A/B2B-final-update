const express = require('express');
const router  = express.Router();

const { getOccasions, createOccasion, updateOccasion, deleteOccasion } =
  require('../../controllers/admin/occasion.controller');
const { syncAdmin } =
  require('../../controllers/shared/occasionSync.controller');
const { getGoogleEvents } =
  require('../../controllers/admin/googleEvents.controller');

router.get('/google-events', getGoogleEvents);

router.get('/',    getOccasions);
router.post('/',   createOccasion);
router.put('/:id', updateOccasion);
router.delete('/:id', deleteOccasion);

router.post('/:id/sync-to-google', syncAdmin);

module.exports = router;
