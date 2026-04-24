
const Corporate = require('../../models/Corporate.model');
const User = require('../../models/User.model');
const notificationService = require('../../services/notification.service');
const importExportService = require('../../services/importExport.service');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination, buildSortQuery, buildSearchQuery } = require('../../utils/pagination');

const getAllCorporates = async (req, res) => {
  try {
    const Order = require('../../models/Order.model');
    const { page, limit, skip } = getPagination(req.query);
    const sort = buildSortQuery(req.query);
    const search = buildSearchQuery(req.query, ['companyName', 'email', 'contactPerson']);
    const filter = { business: req.businessId, ...search };
    if (req.query.status) filter.status = req.query.status;

    const [corporates, total] = await Promise.all([
      Corporate.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Corporate.countDocuments(filter),
    ]);

    // Attach totalOrders count for each corporate
    const corpIds = corporates.map(c => c._id);
    const orderCounts = await Order.aggregate([
      { $match: { business: req.businessId, corporate: { $in: corpIds } } },
      { $group: { _id: '$corporate', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    orderCounts.forEach(r => { countMap[String(r._id)] = r.count; });
    const corporatesWithOrders = corporates.map(c => ({
      ...c,
      totalOrders: countMap[String(c._id)] || 0,
    }));

    return sendPaginated(res, corporatesWithOrders, total, page, limit, 'corporates');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getCorporate = async (req, res) => {
  try {
    const corporate = await Corporate.findOne({ _id: req.params.id, business: req.businessId });
    if (!corporate) return sendError(res, 404, 'Corporate not found');
    return sendSuccess(res, 200, 'Corporate fetched', { corporate });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const createCorporate = async (req, res) => {
  try {
    const corporate = await Corporate.create({ ...req.body, business: req.businessId });
    notificationService.notifyNewCorporate(corporate, req.user._id)
      .catch(err => console.error('[createCorporate] notifyNewCorporate failed:', err.message));
    return sendSuccess(res, 201, 'Corporate created successfully', { corporate });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const updateCorporate = async (req, res) => {
  try {
    const corporate = await Corporate.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!corporate) return sendError(res, 404, 'Corporate not found');
    return sendSuccess(res, 200, 'Corporate updated', { corporate });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const updateCorporateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const corporate = await Corporate.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId },
      { status },
      { new: true }
    );
    if (!corporate) return sendError(res, 404, 'Corporate not found');
    return sendSuccess(res, 200, `Corporate status updated to ${status}`, { corporate });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const deleteCorporate = async (req, res) => {
  try {
    const corporate = await Corporate.findOneAndDelete({ _id: req.params.id, business: req.businessId });
    if (!corporate) return sendError(res, 404, 'Corporate not found');
    return sendSuccess(res, 200, 'Corporate deleted');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const exportCorporates = async (req, res) => {
  try {
    const { format = 'xlsx' } = req.query;
    if (!['xlsx', 'csv'].includes(String(format).toLowerCase())) {
      return sendError(res, 400, 'Invalid format. Supported: xlsx, csv.');
    }
    const corporates = await Corporate.find({ business: req.businessId }).sort({ createdAt: -1 }).lean();
    const dataset = {
      title: 'Corporates',
      columns: ['Company Name', 'Contact Person', 'Email', 'Phone', 'Status', 'Credit Limit', 'Payment Terms (days)', 'Onboarded At'],
      widths: [28, 22, 26, 16, 12, 14, 18, 18],
      rows: corporates.map(c => [
        c.companyName || '—',
        c.contactPerson || '—',
        c.email || '—',
        c.phone || '—',
        c.status || '—',
        Number(c.creditLimit || 0),
        Number(c.paymentTerms || 0),
        c.onboardedAt ? new Date(c.onboardedAt).toISOString() : '—',
      ]),
    };
    const handled = importExportService.sendExport(res, format, dataset, `corporates-${Date.now()}`);
    if (!handled) return sendError(res, 400, 'Invalid format.');
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    console.error('[exportCorporates] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

const importCorporates = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'No file uploaded');
    const rows = importExportService.parseExcel(req.file.buffer);
    if (!Array.isArray(rows) || rows.length === 0) return sendError(res, 400, 'File is empty.');

    const errors = [];
    const cleaned = [];
    const seenEmails = new Set();

    rows.forEach((row, i) => {
      const line = i + 2; // account for header row
      const companyName = String(row.companyName || '').trim();
      const contactPerson = String(row.contactPerson || '').trim();
      const email = String(row.email || '').trim().toLowerCase();
      if (!companyName)   return errors.push({ row: line, field: 'companyName', error: 'required' });
      if (!contactPerson) return errors.push({ row: line, field: 'contactPerson', error: 'required' });
      if (!email)         return errors.push({ row: line, field: 'email', error: 'required' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errors.push({ row: line, field: 'email', error: 'invalid format' });
      if (seenEmails.has(email)) return errors.push({ row: line, field: 'email', error: 'duplicate in file' });
      seenEmails.add(email);
      cleaned.push({
        business: req.businessId,
        companyName,
        contactPerson,
        email,
        phone: row.phone ? String(row.phone).trim() : undefined,
        creditLimit: row.creditLimit !== undefined && row.creditLimit !== '' ? Number(row.creditLimit) : 0,
        paymentTerms: row.paymentTerms !== undefined && row.paymentTerms !== '' ? Number(row.paymentTerms) : 30,
      });
    });

    if (cleaned.length > 0) {
      const existing = await Corporate.find({
        business: req.businessId,
        email: { $in: cleaned.map(c => c.email) },
      }).select('email').lean();
      const existingSet = new Set(existing.map(e => e.email));
      cleaned.forEach((c, i) => {
        if (existingSet.has(c.email)) {
          errors.push({ row: i + 2, field: 'email', error: 'already exists' });
        }
      });
    }

    if (errors.length > 0) return sendError(res, 400, 'Validation failed', errors);

    const inserted = await Corporate.insertMany(cleaned, { ordered: true });
    return sendSuccess(res, 201, `Imported ${inserted.length} corporate(s).`, { imported: inserted.length });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    console.error('[importCorporates] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

const corporatesTemplate = (req, res) => {
  const buffer = importExportService.getCorporateTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="corporates-template.xlsx"');
  res.setHeader('Cache-Control', 'no-store');
  return res.send(buffer);
};

module.exports = {
  getAllCorporates, getCorporate, createCorporate, updateCorporate,
  updateCorporateStatus, deleteCorporate,
  exportCorporates, importCorporates, corporatesTemplate,
};