const express = require('express');
const router = express.Router();
const { getAllSubscriptions, createSubscription, updateSubscription, deleteSubscription } = require('../../controllers/superAdmin/subscription.controller');

router.route('/').get(getAllSubscriptions).post(createSubscription);
router.route('/:id').put(updateSubscription).delete(deleteSubscription);

module.exports = router;