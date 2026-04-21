const express = require('express');
const router = express.Router();
const {
  getAllDeliveries, getDelivery, createDelivery, updateDelivery,
  markDelivered, markFailed, markInTransit, retryDelivery,
  uploadProofOfDelivery, getTodaysDeliveries,
} = require('../../controllers/admin/delivery.controller');
const { proofUploadMiddleware } = require('../../middleware/upload.middleware');

router.get('/today', getTodaysDeliveries);
router.route('/').get(getAllDeliveries).post(createDelivery);
router.route('/:id').get(getDelivery).put(updateDelivery);
router.patch('/:id/in-transit', markInTransit);
router.patch('/:id/delivered', markDelivered);
router.patch('/:id/failed', markFailed);
router.post('/:id/retry', retryDelivery);
router.post('/:id/proof', proofUploadMiddleware('proof'), uploadProofOfDelivery);

module.exports = router;
