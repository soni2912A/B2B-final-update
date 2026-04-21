const Order = require('../../models/Order.model');
const Invoice = require('../../models/Invoice.model');
const Delivery = require('../../models/Delivery.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

// ─── Shared helpers ──────────────────────────────────────────────────────────
function buildOrderMatch(req, { dateField = 'createdAt' } = {}) {
  const { from, to, corporate } = req.query;
  const match = { business: req.businessId };
  if (from || to) {
    match[dateField] = {};
    if (from) match[dateField].$gte = new Date(from);
    if (to)   match[dateField].$lte = endOfDay(to);
  }
  if (corporate) match.corporate = new (require('mongoose').Types.ObjectId)(corporate);
  return match;
}

function endOfDay(dateStr) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function computeOrderSummary(match) {
  const [row] = await Order.aggregate([
    { $match: match },
    { $group: {
        _id: null,
        totalOrders:  { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        delivered:    { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        cancelled:    { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
    }},
  ]);
  const s = row || { totalOrders: 0, totalRevenue: 0, delivered: 0, cancelled: 0 };
  return {
    totalOrders:   s.totalOrders,
    totalRevenue:  s.totalRevenue,
    avgOrderValue: s.totalOrders ? s.totalRevenue / s.totalOrders : 0,
    deliveryRate:  s.totalOrders ? (s.delivered / s.totalOrders) * 100 : 0,
    delivered:     s.delivered,
    cancelled:     s.cancelled,
  };
}

function fmtGBP(d) {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtINR(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

// ─── Overview — combined report for legacy /admin/reports endpoint ───────────
const getReportOverview = async (req, res) => {
  try {
    const match = buildOrderMatch(req);
    if (!match.createdAt) {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      match.createdAt = { $gte: weekAgo };
    }

    const [salesByDay, topCorps, summary] = await Promise.all([
      Order.aggregate([
        { $match: match },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: match },
        { $group: { _id: '$corporate', total: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'corporates', localField: '_id', foreignField: '_id', as: 'corporate' } },
        { $unwind: { path: '$corporate', preserveNullAndEmptyArrays: true } },
        { $project: { name: '$corporate.companyName', total: 1, orders: 1 } },
      ]),
      computeOrderSummary(match),
    ]);

    return sendSuccess(res, 200, 'Report overview fetched.', {
      salesData:  salesByDay.map(s => ({ day: s._id, total: s.total, orders: s.orders })),
      topClients: topCorps,
      summary,
    });
  } catch (e) { return sendError(res, 500, e.message); }
};

// ─── Sales report — per-day breakdown + top clients + summary ────────────────
const getSalesReport = async (req, res) => {
  try {
    const match = buildOrderMatch(req);

    const [rows, topClients, summary] = await Promise.all([
      Order.aggregate([
        { $match: match },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalOrders:   { $sum: 1 },
            totalRevenue:  { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' },
            delivered:     { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            cancelled:     { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        }},
        { $sort: { _id: 1 } },
        { $project: { _id: 0, day: '$_id', totalOrders: 1, totalRevenue: 1, avgOrderValue: 1, delivered: 1, cancelled: 1 } },
      ]),
      Order.aggregate([
        { $match: match },
        { $group: {
            _id: '$corporate',
            totalOrders:  { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
        }},
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'corporates', localField: '_id', foreignField: '_id', as: 'corporate' } },
        { $unwind: { path: '$corporate', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, companyName: '$corporate.companyName', totalOrders: 1, totalRevenue: 1 } },
      ]),
      computeOrderSummary(match),
    ]);

    return sendSuccess(res, 200, 'Sales report fetched.', { rows, topClients, summary });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── Delivery report — status counts + list ──────────────────────────────────
const getDeliveryReport = async (req, res) => {
  try {
    const { from, to, corporate } = req.query;
    const match = { business: req.businessId };
    if (from || to) {
      match.scheduledDate = {};
      if (from) match.scheduledDate.$gte = new Date(from);
      if (to)   match.scheduledDate.$lte = endOfDay(to);
    }
    if (corporate) {
      const mongoose = require('mongoose');
      match.corporate = new mongoose.Types.ObjectId(corporate);
    }

    const [statusRows, deliveries, summary] = await Promise.all([
      Delivery.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Delivery.find(match)
        .populate('order', 'orderNumber totalAmount')
        .populate('assignedTo', 'name')
        .populate('corporate', 'companyName')
        .sort({ scheduledDate: -1 })
        .limit(500)
        .lean(),
      computeOrderSummary(buildOrderMatch(req)),
    ]);

    const statusCounts = { scheduled: 0, in_transit: 0, delivered: 0, failed: 0, rescheduled: 0 };
    statusRows.forEach(r => { statusCounts[r._id] = r.count; });

    const rows = deliveries.map(d => ({
      orderNumber:   d.order?.orderNumber || '—',
      corporate:     d.corporate?.companyName || '—',
      assignedTo:    d.assignedTo?.name || '—',
      status:        d.status,
      scheduledDate: d.scheduledDate,
      deliveredAt:   d.deliveredAt || null,
    }));

    return sendSuccess(res, 200, 'Delivery report fetched.', { rows, statusCounts, summary });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── Clients report — per-corporate ranking ──────────────────────────────────
const getClientsReport = async (req, res) => {
  try {
    const match = buildOrderMatch(req);

    const [rows, summary] = await Promise.all([
      Order.aggregate([
        { $match: match },
        { $group: {
            _id: '$corporate',
            totalOrders:   { $sum: 1 },
            totalRevenue:  { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' },
            lastOrderDate: { $max: '$createdAt' },
        }},
        { $sort: { totalRevenue: -1 } },
        { $limit: 100 },
        { $lookup: { from: 'corporates', localField: '_id', foreignField: '_id', as: 'corporate' } },
        { $unwind: { path: '$corporate', preserveNullAndEmptyArrays: true } },
        { $project: {
            _id: 0,
            companyName:   '$corporate.companyName',
            totalOrders:   1,
            totalRevenue:  1,
            avgOrderValue: 1,
            lastOrderDate: 1,
        }},
      ]),
      computeOrderSummary(match),
    ]);

    return sendSuccess(res, 200, 'Clients report fetched.', { rows, summary });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── Products report — per-product best sellers ──────────────────────────────
const getProductsReport = async (req, res) => {
  try {
    const match = buildOrderMatch(req);

    const [rows, summary] = await Promise.all([
      Order.aggregate([
        { $match: match },
        { $unwind: '$items' },
        { $group: {
            _id:         '$items.product',
            productName: { $first: '$items.productName' },
            sku:         { $first: '$items.sku' },
            unitsSold:   { $sum: '$items.quantity' },
            revenue:     { $sum: '$items.totalPrice' },
        }},
        { $sort: { revenue: -1 } },
        { $limit: 100 },
        { $project: { _id: 0, productName: 1, sku: 1, unitsSold: 1, revenue: 1 } },
      ]),
      computeOrderSummary(match),
    ]);

    return sendSuccess(res, 200, 'Products report fetched.', { rows, summary });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Legacy /revenue endpoint preserved for backward compat ──────────────────────
const getRevenueReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = { business: req.businessId, status: 'paid' };
    if (from || to) {
      match.paidAt = {};
      if (from) match.paidAt.$gte = new Date(from);
      if (to)   match.paidAt.$lte = endOfDay(to);
    }
    const report = await Invoice.aggregate([
      { $match: match },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
          revenue: { $sum: '$totalAmount' },
          count:   { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);
    return sendSuccess(res, 200, 'Revenue report fetched.', { report });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── Export: XLSX or PDF for any of the 4 report types ───────────────────────
// Resolves to a canonical shape: { title, columns, rows } the formatters share.
async function buildExportDataset(req) {
  const type = (req.query.type || 'sales').toLowerCase();

  if (type === 'sales') {
    const match = buildOrderMatch(req);
    const rows = await Order.aggregate([
      { $match: match },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalOrders:   { $sum: 1 },
          totalRevenue:  { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          delivered:     { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          cancelled:     { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]);
    return {
      title:   'Sales Report',
      columns: ['SR. No.', 'Date', 'Orders', 'Revenue (₹)', 'Avg. Order Value (₹)', 'Delivered', 'Cancelled'],
      widths:  [8, 14, 10, 16, 20, 12, 12],
      rows: rows.map((r, i) => [
        i + 1,
        fmtGBP(r._id),
        r.totalOrders,
        Number((r.totalRevenue || 0).toFixed(2)),
        Number((r.avgOrderValue || 0).toFixed(2)),
        r.delivered,
        r.cancelled,
      ]),
    };
  }

  if (type === 'deliveries') {
    const { from, to, corporate } = req.query;
    const match = { business: req.businessId };
    if (from || to) {
      match.scheduledDate = {};
      if (from) match.scheduledDate.$gte = new Date(from);
      if (to)   match.scheduledDate.$lte = endOfDay(to);
    }
    if (corporate) {
      const mongoose = require('mongoose');
      match.corporate = new mongoose.Types.ObjectId(corporate);
    }
    const list = await Delivery.find(match)
      .populate('order', 'orderNumber')
      .populate('assignedTo', 'name')
      .populate('corporate', 'companyName')
      .sort({ scheduledDate: -1 })
      .lean();
    return {
      title:   'Delivery Report',
      columns: ['SR. No.', 'Order No.', 'Corporate', 'Assigned To', 'Status', 'Scheduled Date', 'Delivered On'],
      widths:  [8, 18, 22, 18, 14, 16, 16],
      rows: list.map((d, i) => [
        i + 1,
        d.order?.orderNumber || '—',
        d.corporate?.companyName || '—',
        d.assignedTo?.name || '—',
        (d.status || '').replace(/_/g, ' '),
        fmtGBP(d.scheduledDate),
        fmtGBP(d.deliveredAt),
      ]),
    };
  }

  if (type === 'clients') {
    const match = buildOrderMatch(req);
    const rows = await Order.aggregate([
      { $match: match },
      { $group: {
          _id: '$corporate',
          totalOrders:   { $sum: 1 },
          totalRevenue:  { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          lastOrderDate: { $max: '$createdAt' },
      }},
      { $sort: { totalRevenue: -1 } },
      { $lookup: { from: 'corporates', localField: '_id', foreignField: '_id', as: 'corporate' } },
      { $unwind: { path: '$corporate', preserveNullAndEmptyArrays: true } },
      { $project: {
          companyName:   '$corporate.companyName',
          totalOrders:   1,
          totalRevenue:  1,
          avgOrderValue: 1,
          lastOrderDate: 1,
      }},
    ]);
    return {
      title:   'Clients Report',
      columns: ['SR. No.', 'Corporate', 'Total Orders', 'Total Revenue (₹)', 'Avg. Order Value (₹)', 'Last Order Date'],
      widths:  [8, 26, 14, 20, 22, 16],
      rows: rows.map((r, i) => [
        i + 1,
        r.companyName || '—',
        r.totalOrders,
        Number((r.totalRevenue || 0).toFixed(2)),
        Number((r.avgOrderValue || 0).toFixed(2)),
        fmtGBP(r.lastOrderDate),
      ]),
    };
  }

  if (type === 'products') {
    const match = buildOrderMatch(req);
    const rows = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: {
          _id:         '$items.product',
          productName: { $first: '$items.productName' },
          sku:         { $first: '$items.sku' },
          unitsSold:   { $sum: '$items.quantity' },
          revenue:     { $sum: '$items.totalPrice' },
      }},
      { $sort: { revenue: -1 } },
    ]);
    return {
      title:   'Products Report',
      columns: ['SR. No.', 'Product Name', 'SKU', 'Units Sold', 'Revenue (₹)'],
      widths:  [8, 28, 16, 14, 18],
      rows: rows.map((r, i) => [
        i + 1,
        r.productName || '—',
        r.sku || '—',
        r.unitsSold,
        Number((r.revenue || 0).toFixed(2)),
      ]),
    };
  }

  // Legacy fallback: raw order list
  const match = buildOrderMatch(req);
  const orders = await Order.find(match).populate('corporate', 'companyName').lean();
  return {
    title:   'Orders Report',
    columns: ['SR. No.', 'Order No.', 'Corporate', 'Status', 'Total Amount (₹)', 'Delivery Date', 'Created On'],
    widths:  [8, 20, 22, 14, 18, 16, 16],
    rows: orders.map((o, i) => [
      i + 1,
      o.orderNumber,
      o.corporate?.companyName || '—',
      o.status,
      Number((o.totalAmount || 0).toFixed(2)),
      fmtGBP(o.deliveryDate),
      fmtGBP(o.createdAt),
    ]),
  };
}

function sendAsXLSX(res, { title, columns, widths, rows }, filename) {
  const aoa = [columns, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = (widths || columns.map(() => 18)).map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31) || 'Report');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Cache-Control', 'no-store');
  return res.send(buffer);
}

function sendAsPDF(res, { title, columns, rows }, { filename, dateRange, subtitle }) {
  const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape', bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.setHeader('Cache-Control', 'no-store');
  doc.pipe(res);

  // Header
  doc.fillColor('#0ea5e9').fontSize(20).text('B2B Corporate Bakery Platform', { align: 'left' });
  doc.fillColor('#111').fontSize(16).text(title);
  doc.fillColor('#555').fontSize(10).text(subtitle || dateRange || '');
  doc.moveDown(0.5);

  // Table
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const tableWidth = right - left;
  const colWidth = tableWidth / columns.length;
  const rowHeight = 18;

  function drawHeaderRow(y) {
    doc.save();
    doc.rect(left, y, tableWidth, rowHeight).fill('#1f2937');
    doc.restore();
    doc.fontSize(9).fillColor('#fff');
    columns.forEach((c, i) => {
      doc.text(String(c), left + i * colWidth + 4, y + 5, {
        width: colWidth - 8, ellipsis: true, lineBreak: false,
      });
    });
    doc.fillColor('#111');
  }

  let y = doc.y + 2;
  drawHeaderRow(y);
  y += rowHeight;

  if (rows.length === 0) {
    doc.fontSize(10).fillColor('#666').text('No records found.', left, y + 8, { width: tableWidth, align: 'center' });
  } else {
    rows.forEach((row, idx) => {
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeaderRow(y);
        y += rowHeight;
      }
      if (idx % 2 === 0) {
        doc.save();
        doc.rect(left, y, tableWidth, rowHeight).fill('#f3f4f6');
        doc.restore();
      }
      doc.fontSize(9).fillColor('#111');
      row.forEach((cell, i) => {
        const str = cell === null || cell === undefined ? '' : String(cell);
        doc.text(str, left + i * colWidth + 4, y + 5, {
          width: colWidth - 8, ellipsis: true, lineBreak: false,
        });
      });
      y += rowHeight;
    });
  }

  // Footer: timestamp + page numbers on every page
  const range = doc.bufferedPageRange();
  const generatedAt = new Date().toLocaleString('en-GB');
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - doc.page.margins.bottom + 6;
    doc.fontSize(8).fillColor('#666');
    doc.text(`Generated ${generatedAt}`, left, footerY, { width: 300, align: 'left', lineBreak: false });
    doc.text(`Page ${i + 1} of ${range.count}`, right - 120, footerY, { width: 120, align: 'right', lineBreak: false });
  }

  doc.end();
}

const exportReport = async (req, res) => {
  try {
    const type   = (req.query.type || 'sales').toLowerCase();
    const format = (req.query.format || 'xlsx').toLowerCase();
    const date   = new Date().toISOString().slice(0, 10);

    const dataset = await buildExportDataset(req);

    if (format === 'pdf') {
      const from = req.query.from ? fmtGBP(req.query.from) : null;
      const to   = req.query.to   ? fmtGBP(req.query.to)   : null;
      const dateRange = from && to ? `From ${from} to ${to}` : (from ? `From ${from}` : (to ? `Up to ${to}` : 'All time'));
      return sendAsPDF(res, dataset, {
        filename:  `${type}-report-${date}.pdf`,
        dateRange,
      });
    }

    return sendAsXLSX(res, dataset, `${type}-report-${date}.xlsx`);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getReportOverview,
  getSalesReport,
  getDeliveryReport,
  getClientsReport,
  getProductsReport,
  getRevenueReport,
  exportReport,
};
