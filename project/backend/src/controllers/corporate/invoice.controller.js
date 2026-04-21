const Invoice = require('../../models/Invoice.model');
const invoiceService = require('../../services/invoice.service');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const getMyInvoices = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { corporate: req.user.corporate };
    if (req.query.status) filter.status = req.query.status;
    const [invoices, total] = await Promise.all([
      Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('order', 'orderNumber'),
      Invoice.countDocuments(filter),
    ]);
    return sendPaginated(res, invoices, total, page, limit, 'invoices');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, corporate: req.user.corporate })
      .populate('corporate').populate('order').populate('business');
    if (!invoice) return sendError(res, 404, 'Invoice not found');
    const pdfBuffer = await invoiceService.generatePdf(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { getMyInvoices, downloadInvoice };
