const Invoice = require('../../models/Invoice.model');
const Order = require('../../models/Order.model');
const Payment = require('../../models/Payment.model');
const invoiceService = require('../../services/invoice.service');
const emailService = require('../../services/email.service');
const notificationService = require('../../services/notification.service');
const importExportService = require('../../services/importExport.service');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination, buildSortQuery } = require('../../utils/pagination');

const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};


const buildFilter = async (req) => {
  const { search, status, from, to, corporate } = req.query;
  const filter = { business: req.businessId };
  if (status && status !== 'all') filter.status = status;
  if (corporate) filter.corporate = corporate;
  if (from || to) {
    filter.invoiceDate = {};
    if (from) filter.invoiceDate.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.invoiceDate.$lte = end;
    }
  }
  if (search && String(search).trim()) {
    const re = new RegExp(String(search).trim().replace(ESCAPE_RE, '\\$&'), 'i');
    const matchingOrders = await Order.find({
      business: req.businessId,
      orderNumber: re,
    }).select('_id').lean();
    filter.$or = [
      { invoiceNumber: re },
      { order: { $in: matchingOrders.map(o => o._id) } },
    ];
  }
  return filter;
};

const getAllInvoices = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const sort = buildSortQuery(req.query);
    const filter = await buildFilter(req);
    const [invoices, total] = await Promise.all([
      Invoice.find(filter).sort(sort).skip(skip).limit(limit)
        .populate('corporate', 'companyName email')
        .populate('order', 'orderNumber'),
      Invoice.countDocuments(filter),
    ]);
    return sendPaginated(res, invoices, total, page, limit, 'invoices');
  } catch (error) { return handleError(res, error, 'getAllInvoices'); }
};

const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.businessId })
      .populate('corporate').populate('order');
    if (!invoice) return sendError(res, 404, 'Invoice not found');
    return sendSuccess(res, 200, 'Invoice fetched', { invoice });
  } catch (error) { return handleError(res, error, 'getInvoice'); }
};

const downloadInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.businessId })
      .populate('corporate').populate('order').populate('business');
    if (!invoice) return sendError(res, 404, 'Invoice not found');
    const pdfBuffer = await invoiceService.generatePdf(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) { return handleError(res, error, 'downloadInvoicePdf'); }
};

const sendInvoiceEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.businessId })
      .populate('corporate').populate('order');
    if (!invoice) return sendError(res, 404, 'Invoice not found');
    await emailService.sendInvoice(invoice);
    await Invoice.findByIdAndUpdate(req.params.id, { status: 'sent' });
    return sendSuccess(res, 200, 'Invoice sent via email');
  } catch (error) { return handleError(res, error, 'sendInvoiceEmail'); }
};

const recordPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.businessId });
    if (!invoice) return sendError(res, 404, 'Invoice not found');

    const { amount, method, transactionId, notes } = req.body;
    if (!amount || amount <= 0) return sendError(res, 400, 'Valid payment amount required');

    const payment = await Payment.create({
      business: req.businessId, invoice: invoice._id,
      corporate: invoice.corporate, amount, method, transactionId,
      status: 'success', paidAt: new Date(), notes, recordedBy: req.user._id,
    });

    const previousStatus = invoice.status;
    invoice.paidAmount = (invoice.paidAmount || 0) + amount;
    invoice.status = invoice.paidAmount >= invoice.totalAmount ? 'paid' : 'partial';
    if (invoice.status === 'paid') invoice.paidAt = new Date();
    await invoice.save();

    if (previousStatus !== 'paid' && invoice.status === 'paid') {
      notificationService.notifyPaymentReceived(invoice, req.user._id)
        .catch(err => console.error('[recordPayment] notifyPaymentReceived failed:', err.message));
    }

    return sendSuccess(res, 200, 'Payment recorded', { payment, invoice });
  } catch (error) { return handleError(res, error, 'recordPayment'); }
};



const exportInvoices = async (req, res) => {
  try {
    const { format = 'xlsx' } = req.query;
    if (!['xlsx', 'pdf'].includes(String(format).toLowerCase())) {
      return sendError(res, 400, 'Invalid format. Supported: xlsx, pdf.');
    }
    const filter = await buildFilter(req);
    const invoices = await Invoice.find(filter)
      .populate('corporate', 'companyName email')
      .populate('order', 'orderNumber')
      .sort({ invoiceDate: -1 })
      .lean();

    const dataset = {
      title: 'Invoices',
      columns: ['Invoice No.', 'Corporate', 'Order No.', 'Status', 'Subtotal', 'Tax', 'Discount', 'Total Amount', 'Paid', 'Balance', 'Due Date', 'Paid At'],
      widths: [16, 22, 16, 10, 12, 10, 12, 14, 12, 12, 14, 18],
      rows: invoices.map(inv => [
        inv.invoiceNumber || '—',
        inv.corporate?.companyName || '—',
        inv.order?.orderNumber || '—',
        inv.status || '—',
        Number((inv.subtotal || 0).toFixed(2)),
        Number((inv.taxAmount || 0).toFixed(2)),
        Number((inv.discountAmount || 0).toFixed(2)),
        Number((inv.totalAmount || 0).toFixed(2)),
        Number((inv.paidAmount || 0).toFixed(2)),
        Number((inv.balanceAmount || 0).toFixed(2)),
        inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : '—',
        inv.paidAt ? new Date(inv.paidAt).toISOString() : '—',
      ]),
    };
    const handled = importExportService.sendExport(res, format, dataset, `invoices-${Date.now()}`);
    if (!handled) return sendError(res, 400, 'Invalid format.');
  } catch (error) { return handleError(res, error, 'exportInvoices'); }
};

module.exports = {
  getAllInvoices, getInvoice, downloadInvoicePdf, sendInvoiceEmail,
  recordPayment, exportInvoices,
};
