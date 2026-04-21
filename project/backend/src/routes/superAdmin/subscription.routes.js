const express = require('express');
const router = express.Router();
const { getAllSubscriptions, createSubscription, updateSubscription } = require('../../controllers/superAdmin/subscription.controller');

router.route('/').get(getAllSubscriptions).post(createSubscription);
router.route('/:id').put(updateSubscription);

module.exports = router;
