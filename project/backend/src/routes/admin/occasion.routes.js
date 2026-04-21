const express = require('express');
const router = express.Router();
const { getOccasions, createOccasion, updateOccasion, deleteOccasion } = require('../../controllers/admin/occasion.controller');
const { syncAdmin } = require('../../controllers/shared/occasionSync.controller');

router.get('/', getOccasions);
router.post('/', createOccasion);
router.put('/:id', updateOccasion);
router.delete('/:id', deleteOccasion);
// Google Calendar sync — additive, does not alter any of the handlers above.
router.post('/:id/sync-to-google', syncAdmin);

module.exports = router;
