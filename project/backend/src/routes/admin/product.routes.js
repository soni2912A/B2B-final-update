const express = require('express');
const router = express.Router();
const {
  getAllProducts, getProduct, createProduct, updateProduct, deleteProduct,
  importProducts, previewImportProducts, bulkUpdateProducts, listCategories,
  exportProducts, productsTemplate,
} = require('../../controllers/admin/product.controller');
const { importFileMiddleware, productImageMiddleware } = require('../../middleware/upload.middleware');

router.get('/export', exportProducts);
router.get('/categories', listCategories);
router.get('/import/template', productsTemplate);
router.post('/import/preview', importFileMiddleware('file'), previewImportProducts);
router.post('/import', importFileMiddleware('file'), importProducts);
router.post('/bulk-update', bulkUpdateProducts);

router.route('/').get(getAllProducts).post(productImageMiddleware, createProduct);
router.route('/:id').get(getProduct).put(productImageMiddleware, updateProduct).delete(deleteProduct);

module.exports = router;
