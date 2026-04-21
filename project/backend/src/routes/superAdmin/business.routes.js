const express = require('express');
const router = express.Router();
const { getAllBusinesses, getBusiness, getBusinessDetails, createBusiness, updateBusiness, toggleBusinessStatus, deleteBusiness } = require('../../controllers/superAdmin/business.controller');

router.route('/').get(getAllBusinesses).post(createBusiness);
router.get('/:id/details', getBusinessDetails);
router.route('/:id').get(getBusiness).put(updateBusiness).delete(deleteBusiness);
router.patch('/:id/toggle-status', toggleBusinessStatus);

module.exports = router;
