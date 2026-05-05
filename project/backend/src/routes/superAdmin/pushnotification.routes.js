const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/superAdmin/pushNotification.controller');

router.get('/',      ctrl.getPushNotifications);
router.post('/',     ctrl.sendPushNotification);
router.delete('/:id', ctrl.deletePushNotification);

module.exports = router;