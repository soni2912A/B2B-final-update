const express = require('express');
const router = express.Router();
const {
  listOccasions,
  createOccasion,
  updateOccasion,
  deleteOccasion,
} = require('../../controllers/corporate/occasion.controller');
const { syncCorporate } = require('../../controllers/shared/occasionSync.controller');

router.route('/').get(listOccasions).post(createOccasion);
router.route('/:id').patch(updateOccasion).delete(deleteOccasion);
// Google Calendar sync — additive, does not alter the existing handlers.
router.post('/:id/sync-to-google', syncCorporate);

module.exports = router;
