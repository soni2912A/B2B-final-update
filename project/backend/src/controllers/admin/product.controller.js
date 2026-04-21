const Product = require('../../models/Product.model');
const Inventory = require('../../models/Inventory.model');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination, buildSortQuery, buildSearchQuery } = require('../../utils/pagination');
const path = require('path');

const getAllProducts = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const sort = buildSortQuery(req.query);
    const search = buildSearchQuery(req.query, ['name', 'sku', 'category']);
    const filter = { business: req.businessId, ...search };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);
    return sendPaginated(res, products, total, page, limit, 'products');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, business: req.businessId });
    if (!product) return sendError(res, 404, 'Product not found');
    return sendSuccess(res, 200, 'Product fetched', { product });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

function getImageUrl(req) {
  if (!req.file) return null;
  const filename = path.basename(req.file.path || req.file.filename || '');
  return filename ? `/uploads/products/${filename}` : null;
}

const createProduct = async (req, res) => {
  try {
    const body = { ...req.body, business: req.businessId };
    const imgUrl = getImageUrl(req);
    if (imgUrl) body.images = [imgUrl];
    if (typeof body.pricingTiers === 'string') {
      try { body.pricingTiers = JSON.parse(body.pricingTiers); } catch { body.pricingTiers = []; }
    }
    if (body.basePrice !== undefined) body.basePrice = Number(body.basePrice);
    if (body.stockQuantity !== undefined) body.stockQuantity = Number(body.stockQuantity);
    if (body.lowStockThreshold !== undefined) body.lowStockThreshold = Number(body.lowStockThreshold);
    const product = await Product.create(body);
    if (product.stockQuantity > 0) {
      await Inventory.create({
        business: req.businessId,
        product: product._id,
        type: 'in',
        quantity: product.stockQuantity,
        previousStock: 0,
        currentStock: product.stockQuantity,
        reason: 'Initial stock',
        performedBy: req.user._id,
      });
    }
    return sendSuccess(res, 201, 'Product created', { product });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const updateProduct = async (req, res) => {
  try {
    const body = { ...req.body };
    const imgUrl = getImageUrl(req);
    if (imgUrl) body.images = [imgUrl];
    if (typeof body.pricingTiers === 'string') {
      try { body.pricingTiers = JSON.parse(body.pricingTiers); } catch { body.pricingTiers = []; }
    }
    if (body.basePrice !== undefined) body.basePrice = Number(body.basePrice);
    if (body.stockQuantity !== undefined) body.stockQuantity = Number(body.stockQuantity);
    if (body.lowStockThreshold !== undefined) body.lowStockThreshold = Number(body.lowStockThreshold);
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId },
      body,
      { new: true, runValidators: true }
    );
    if (!product) return sendError(res, 404, 'Product not found');
    return sendSuccess(res, 200, 'Product updated', { product });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, business: req.businessId });
    if (!product) return sendError(res, 404, 'Product not found');
    return sendSuccess(res, 200, 'Product deleted');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const importExportService = require('../../services/importExport.service');

function parseAndValidateProductRows(buffer, businessId) {
  const rows = importExportService.parseExcel(buffer);
  const errors = [];
  const cleaned = [];
  if (!Array.isArray(rows)) return { cleaned, errors: [{ row: 0, field: '_file', error: 'unreadable' }] };
  const seenSkus = new Set();
  rows.forEach((row, i) => {
    const line = i + 2;
    const name = String(row.name || '').trim();
    const sku = String(row.sku || '').trim();
    const basePriceRaw = row.basePrice;
    if (!name) return errors.push({ row: line, field: 'name', error: 'required' });
    if (!sku)  return errors.push({ row: line, field: 'sku', error: 'required' });
    if (basePriceRaw === undefined || basePriceRaw === '' || Number.isNaN(Number(basePriceRaw)))
      return errors.push({ row: line, field: 'basePrice', error: 'required numeric' });
    if (seenSkus.has(sku)) return errors.push({ row: line, field: 'sku', error: 'duplicate in file' });
    seenSkus.add(sku);
    cleaned.push({
      business: businessId, name, sku,
      description: row.description ? String(row.description) : undefined,
      category: row.category ? String(row.category) : undefined,
      basePrice: Number(basePriceRaw),
      taxRate: row.taxRate !== undefined && row.taxRate !== '' ? Number(row.taxRate) : 0,
      stockQuantity: row.stockQuantity !== undefined && row.stockQuantity !== '' ? Number(row.stockQuantity) : 0,
      unit: row.unit ? String(row.unit) : 'pcs',
    });
  });
  return { cleaned, errors };
}

const previewImportProducts = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'No file uploaded');
    const { cleaned, errors } = parseAndValidateProductRows(req.file.buffer, req.businessId);
    if (cleaned.length === 0 && errors.length === 0) return sendError(res, 400, 'File is empty.');
    const skus = cleaned.map(c => c.sku);
    const existing = await Product.find({ business: req.businessId, sku: { $in: skus } }).select('sku').lean();
    const existingSet = new Set(existing.map(p => p.sku));
    const rows = cleaned.map(c => ({ ...c, _action: existingSet.has(c.sku) ? 'update' : 'create' }));
    return sendSuccess(res, 200, 'Preview generated', {
      total: rows.length,
      toCreate: rows.filter(r => r._action === 'create').length,
      toUpdate: rows.filter(r => r._action === 'update').length,
      rows, errors,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const importProducts = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'No file uploaded');
    const { cleaned, errors } = parseAndValidateProductRows(req.file.buffer, req.businessId);
    if (cleaned.length === 0 && errors.length === 0) return sendError(res, 400, 'File is empty.');
    if (errors.length > 0) return sendError(res, 400, 'Validation failed', errors);
    const ops = cleaned.map(c => ({
      updateOne: { filter: { business: c.business, sku: c.sku }, update: { $set: c }, upsert: true },
    }));
    const result = await Product.bulkWrite(ops, { ordered: true });
    return sendSuccess(res, 200, `Processed ${cleaned.length} product(s).`, {
      results: { success: cleaned.length, failed: 0, errors: [] },
      imported: cleaned.length,
      created: result.upsertedCount || 0,
      updated: result.modifiedCount || 0,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') return sendError(res, 400, error.message);
    return sendError(res, 500, error.message);
  }
};

const BULK_UPDATABLE_FIELDS = ['basePrice', 'stockQuantity', 'status', 'category', 'taxRate', 'lowStockThreshold'];
const bulkUpdateProducts = async (req, res) => {
  try {
    const { ids, patch } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) return sendError(res, 400, 'ids must be a non-empty array.');
    if (!patch || typeof patch !== 'object') return sendError(res, 400, 'patch object is required.');
    const cleanPatch = {};
    for (const k of BULK_UPDATABLE_FIELDS) {
      if (patch[k] !== undefined && patch[k] !== '' && patch[k] !== null) cleanPatch[k] = patch[k];
    }
    if (Object.keys(cleanPatch).length === 0)
      return sendError(res, 400, 'No updatable fields provided. Allowed: ' + BULK_UPDATABLE_FIELDS.join(', '));
    const result = await Product.updateMany({ _id: { $in: ids }, business: req.businessId }, { $set: cleanPatch });
    return sendSuccess(res, 200, `Updated ${result.modifiedCount} product(s).`, {
      matched: result.matchedCount, modified: result.modifiedCount, fields: Object.keys(cleanPatch),
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') return sendError(res, 400, error.message);
    return sendError(res, 500, error.message);
  }
};

const listCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { business: req.businessId, category: { $ne: null, $ne: '' } });
    return sendSuccess(res, 200, 'Categories', { categories: categories.filter(Boolean).sort() });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const exportProducts = async (req, res) => {
  try {
    const { format = 'xlsx' } = req.query;
    if (!['xlsx', 'csv'].includes(String(format).toLowerCase()))
      return sendError(res, 400, 'Invalid format. Supported: xlsx, csv.');
    const products = await Product.find({ business: req.businessId }).sort({ createdAt: -1 }).lean();
    const dataset = {
      title: 'Products',
      columns: ['Name', 'SKU', 'Category', 'Description', 'Base Price', 'Tax Rate', 'Stock Quantity', 'Unit', 'Status'],
      widths: [24, 14, 16, 28, 12, 10, 14, 8, 12],
      rows: products.map(p => [
        p.name || '—', p.sku || '—', p.category || '—', p.description || '',
        Number((p.basePrice || 0).toFixed(2)), Number((p.taxRate || 0).toFixed(2)),
        Number(p.stockQuantity || 0), p.unit || 'pcs', p.status || '—',
      ]),
    };
    const handled = importExportService.sendExport(res, format, dataset, `products-${Date.now()}`);
    if (!handled) return sendError(res, 400, 'Invalid format.');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const productsTemplate = (req, res) => {
  const buffer = importExportService.getProductTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="products-template.xlsx"');
  res.setHeader('Cache-Control', 'no-store');
  return res.send(buffer);
};

module.exports = {
  getAllProducts, getProduct, createProduct, updateProduct, deleteProduct,
  importProducts, previewImportProducts, bulkUpdateProducts, listCategories,
  exportProducts, productsTemplate,
};
