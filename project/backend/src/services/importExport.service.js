const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

const PDF_ROW_CAP = 500;


const parseExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
};



function sendXlsx(res, { title, columns, rows, widths }, filename) {
  const aoa = [columns, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = (widths || columns.map(() => 18)).map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (title || 'Sheet').slice(0, 31));
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Cache-Control', 'no-store');
  return res.send(buffer);
}

function sendCsv(res, { columns, rows }, filename) {
  const aoa = [columns, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const csv = XLSX.utils.sheet_to_csv(ws);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.send('\uFEFF' + csv); 
}

function sendPdf(res, { title, columns, rows }, filename, opts = {}) {
  const truncated = rows.length > PDF_ROW_CAP;
  const renderRows = truncated ? rows.slice(0, PDF_ROW_CAP) : rows;

  const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape', bufferPages: true });

  doc.on('error', (err) => console.error('[sendPdf] pdf stream error:', err.message));
  res.on('error', (err) => console.error('[sendPdf] response stream error:', err.message));
  res.on('close', () => { if (!res.writableEnded) { try { doc.end(); } catch (_) {} } });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  doc.pipe(res);

  
  doc.fillColor('#0ea5e9').fontSize(20).text('B2B Corporate Bakery Platform', { align: 'left' });
  doc.fillColor('#111').fontSize(16).text(title || 'Report');
  if (opts.subtitle) doc.fillColor('#555').fontSize(10).text(opts.subtitle);
  doc.moveDown(0.5);

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

  if (renderRows.length === 0) {
    doc.fontSize(10).fillColor('#666').text('No records found.', left, y + 8, { width: tableWidth, align: 'center' });
  } else {
    renderRows.forEach((row, idx) => {
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 30) {
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

  if (truncated) {
    doc.moveDown(1);
    doc.fontSize(9).fillColor('#b91c1c')
      .text(`Truncated at ${PDF_ROW_CAP} rows — use XLSX for full export.`, left, y + 10, { width: tableWidth, align: 'center' });
  }

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
  return true;
}


function sendExport(res, format, dataset, basename, opts = {}) {
  const fmt = String(format || 'xlsx').toLowerCase();
  if (fmt === 'csv')  { sendCsv(res, dataset, `${basename}.csv`);   return true; }
  if (fmt === 'xlsx') { sendXlsx(res, dataset, `${basename}.xlsx`); return true; }
  if (fmt === 'pdf')  { sendPdf(res, dataset, `${basename}.pdf`, opts); return true; }
  return false;
}



function buildTemplate(columns, exampleRow, sheetName) {
  const ws = XLSX.utils.aoa_to_sheet([columns, exampleRow]);
  ws['!cols'] = columns.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (sheetName || 'Template').slice(0, 31));
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

const getStaffTemplate = () => buildTemplate(
  ['corporateEmail', 'firstName', 'lastName', 'email', 'phone', 'department', 'designation', 'employeeId', 'dateOfBirth', 'dateOfJoining'],
  ['acme@example.com', 'John', 'Doe', 'john.doe@acme.com', '9999999999', 'Engineering', 'Developer', 'EMP001', '1990-05-15', '2023-03-01'],
  'Staff Template',
);

const getProductTemplate = () => buildTemplate(
  ['name', 'sku', 'description', 'category', 'basePrice', 'taxRate', 'stockQuantity', 'unit'],
  ['Sample Product', 'SKU001', 'Sample description', 'General', 100, 18, 50, 'pcs'],
  'Product Template',
);

const getCorporateTemplate = () => buildTemplate(
  ['companyName', 'contactPerson', 'email', 'phone', 'creditLimit', 'paymentTerms'],
  ['Acme Corp', 'Jane Smith', 'acme@example.com', '9999999999', 50000, 30],
  'Corporate Template',
);

module.exports = {
  parseExcel,
  generateExcel: (data, sheetName) => buildTemplate([], data, sheetName), // legacy
  sendXlsx,
  sendCsv,
  sendPdf,
  sendExport,
  getStaffTemplate,
  getProductTemplate,
  getCorporateTemplate,
  PDF_ROW_CAP,
};
