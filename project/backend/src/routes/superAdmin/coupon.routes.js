const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/superAdmin/coupon.controller');

router.route('/').get(ctrl.getCoupons).post(ctrl.createCoupon);
router.route('/:id').patch(ctrl.updateCoupon).delete(ctrl.deleteCoupon);

module.exports = router;