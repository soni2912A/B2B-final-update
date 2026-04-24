// const express = require('express');
// const router  = express.Router();

// const { listOccasions, createOccasion, updateOccasion, deleteOccasion } =
//   require('../../controllers/corporate/occasion.controller');
// const { syncCorporate } =
//   require('../../controllers/shared/occasionSync.controller');
// const { getGoogleEvents } =
//   require('../../controllers/corporate/googleEvents.controller');

// // Google events — must be before /:id
// router.get('/google-events', getGoogleEvents);

// router.route('/').get(listOccasions).post(createOccasion);
// router.route('/:id').patch(updateOccasion).delete(deleteOccasion);

// // Push a stored Occasion to Google Calendar
// router.post('/:id/sync-to-google', syncCorporate);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { listOccasions, createOccasion, updateOccasion, deleteOccasion } = require('../../controllers/corporate/occasion.controller');
const { syncCorporate } = require('../../controllers/shared/occasionSync.controller');

router.route('/').get(listOccasions).post(createOccasion);
router.route('/:id').patch(updateOccasion).delete(deleteOccasion);
router.post('/:id/sync-to-google', syncCorporate);

module.exports = router;