const Inventory = require('../../models/Inventory.model');
const Product = require('../../models/Product.model');
const notificationService = require('../../services/notification.service');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

// List products with their current stock — Product.stockQuantity is the source of truth
const getAllInventory = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const products = await Product.find({ business: req.businessId })
      .sort({ stockQuantity: 1 })
      .skip(skip).limit(limit).lean();
    const total = await Product.countDocuments({ business: req.businessId });

    const items = products.map(p => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      stock: p.stockQuantity,
      alertThreshold: p.lowStockThreshold,
      warehouse: 'Main',
      status: p.stockQuantity === 0 ? 'out_of_stock'
            : p.stockQuantity <= p.lowStockThreshold ? 'low_stock' : 'active',
    }));
    return sendPaginated(res, items, total, page, limit, 'items');
  } catch (e) { return sendError(res, 500, e.message); }
};

const getLowStockItems = async (req, res) => {
  try {
    const items = await Product.find({
      business: req.businessId,
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
    }).select('name sku category stockQuantity lowStockThreshold');
    return sendSuccess(res, 200, 'Low stock items fetched', { items, total: items.length });
  } catch (e) { return sendError(res, 500, e.message); }
};

// Adjust stock — update Product.stockQuantity + append Inventory ledger entry
const adjustStock = async (req, res) => {
  try {
    const { quantity, reason, type, reference } = req.body;
    if (!quantity || !type || !['in', 'out', 'adjustment'].includes(type)) {
      return sendError(res, 400, 'quantity and valid type (in|out|adjustment) required');
    }
    const product = await Product.findOne({ _id: req.params.productId, business: req.businessId });
    if (!product) return sendError(res, 404, 'Product not found');

    const delta = type === 'in' ? Math.abs(quantity)
                : type === 'out' ? -Math.abs(quantity)
                : quantity; // adjustment = signed
    const previousStock = product.stockQuantity;
    const newStock = Math.max(0, previousStock + delta);

    product.stockQuantity = newStock;
    if (newStock === 0) product.status = 'out_of_stock';
    else if (product.status === 'out_of_stock') product.status = 'active';
    await product.save();

    const entry = await Inventory.create({
      business: req.businessId,
      product: product._id,
      type,
      quantity: Math.abs(delta),
      previousStock,
      currentStock: newStock,
      reason,
      reference,
      performedBy: req.user._id,
    });

    notificationService.notifyLowStockIfCrossed(product, previousStock, req.user._id)
      .catch(err => console.error('[adjustStock] notifyLowStockIfCrossed failed:', err.message));

    return sendSuccess(res, 200, 'Stock adjusted', { product, entry });
  } catch (e) { return sendError(res, 500, e.message); }
};

module.exports = { getAllInventory, getLowStockItems, adjustStock };
