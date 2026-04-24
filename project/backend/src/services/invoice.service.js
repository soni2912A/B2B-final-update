const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice.model');
const Business = require('../models/Business.model');

const generateInvoice = async (order) => {
  
  const existing = await Invoice.findOne({ order: order._id });
  if (existing) return existing;

 
  const business = await Business.findByIdAndUpdate(
    order.business,
    { $inc: { invoiceCounter: 1 } },
    { new: true },
  );
  if (!business) throw new Error('Business not found for invoice generation');
  const invoiceNumber = `${business.invoicePrefix || 'INV'}-${business.invoiceCounter}`;


  const termDays = Number.isFinite(business.paymentTerms) ? business.paymentTerms : 30;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + termDays);

  try {
    const invoice = await Invoice.create({
      business: order.business,
      corporate: order.corporate,
      order: order._id,
      invoiceNumber,
      invoiceDate: new Date(),
      dueDate,
      lineItems: order.items.map(i => ({
        description: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
        taxAmount: i.taxAmount,
        total: i.totalPrice,
      })),
      subtotal: order.subtotal,
      taxAmount: order.items.reduce((s, i) => s + (i.taxAmount || 0), 0),
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      status: 'sent',
    });
    return invoice;
  } catch (err) {
  
    if (err && err.code === 11000) {
      const winner = await Invoice.findOne({ order: order._id });
      if (winner) return winner;
    }
    throw err;
  }
};

const generatePdf = (invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(20).text('INVOICE', { align: 'right' });
    doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, { align: 'right' });
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, { align: 'right' });

    doc.moveDown();
    doc.fontSize(14).text('Bill To:');
    doc.fontSize(12).text(invoice.corporate?.companyName || '');
    doc.text(invoice.corporate?.email || '');

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold');
    doc.text('Description', 50, doc.y, { width: 200 });
    doc.text('Qty', 260, doc.y - doc.currentLineHeight(), { width: 60, align: 'right' });
    doc.text('Unit Price', 330, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
    doc.text('Total', 460, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
    doc.font('Helvetica');
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    for (const item of invoice.lineItems) {
      const y = doc.y;
      doc.text(item.description, 50, y, { width: 200 });
      doc.text(item.quantity.toString(), 260, y, { width: 60, align: 'right' });
      doc.text(`${item.unitPrice.toFixed(2)}`, 330, y, { width: 80, align: 'right' });
      doc.text(`${item.total.toFixed(2)}`, 460, y, { width: 80, align: 'right' });
      doc.moveDown();
    }

    doc.moveDown();
    doc.moveTo(350, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.text(`Subtotal: ${invoice.subtotal.toFixed(2)}`, { align: 'right' });
    if (invoice.discountAmount > 0) doc.text(`Discount: -${invoice.discountAmount.toFixed(2)}`, { align: 'right' });
    if (invoice.taxAmount > 0) doc.text(`Tax: ${invoice.taxAmount.toFixed(2)}`, { align: 'right' });
    doc.font('Helvetica-Bold').fontSize(13).text(`Total: ${invoice.totalAmount.toFixed(2)}`, { align: 'right' });

    doc.end();
  });
};

module.exports = { generateInvoice, generatePdf };
