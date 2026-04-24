const Staff = require('../../models/Staff.model');
const Corporate = require('../../models/Corporate.model');
const importExportService = require('../../services/importExport.service');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

const toDateOrUndef = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const exportStaff = async (req, res) => {
  try {
    const { format = 'xlsx' } = req.query;
    if (!['xlsx', 'csv'].includes(String(format).toLowerCase())) {
      return sendError(res, 400, 'Invalid format. Supported: xlsx, csv.');
    }
    const staff = await Staff.find({ business: req.businessId })
      .populate('corporate', 'companyName email')
      .sort({ createdAt: -1 })
      .lean();
    const dataset = {
      title: 'Staff',
      columns: ['Corporate', 'First Name', 'Last Name', 'Email', 'Phone', 'Department', 'Designation', 'Employee ID', 'Date of Birth', 'Date of Joining', 'Status'],
      widths: [22, 14, 14, 24, 14, 16, 16, 14, 14, 16, 10],
      rows: staff.map(s => [
        s.corporate?.companyName || '—',
        s.firstName || '—',
        s.lastName || '—',
        s.email || '—',
        s.phone || '—',
        s.department || '—',
        s.designation || '—',
        s.employeeId || '—',
        s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().slice(0, 10) : '—',
        s.dateOfJoining ? new Date(s.dateOfJoining).toISOString().slice(0, 10) : '—',
        s.status || '—',
      ]),
    };
    const handled = importExportService.sendExport(res, format, dataset, `staff-${Date.now()}`);
    if (!handled) return sendError(res, 400, 'Invalid format.');
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    console.error('[exportStaff] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

const importStaff = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'No file uploaded');
    const rows = importExportService.parseExcel(req.file.buffer);
    if (!Array.isArray(rows) || rows.length === 0) return sendError(res, 400, 'File is empty.');

    const corporateEmails = Array.from(new Set(rows
      .map(r => String(r.corporateEmail || '').trim().toLowerCase())
      .filter(Boolean)));
    const corporates = await Corporate.find({
      business: req.businessId,
      email: { $in: corporateEmails },
    }).select('_id email').lean();

    
    const countByEmail = new Map();
    for (const c of corporates) countByEmail.set(c.email, (countByEmail.get(c.email) || 0) + 1);
    const ambiguousEmails = new Set(
      [...countByEmail.entries()].filter(([, n]) => n > 1).map(([email]) => email)
    );
    const corporateMap = new Map();
    for (const c of corporates) {
      if (!ambiguousEmails.has(c.email)) corporateMap.set(c.email, c._id);
    }

    const errors = [];
    const cleaned = [];

    rows.forEach((row, i) => {
      const line = i + 2;
      const firstName = String(row.firstName || '').trim();
      const lastName = String(row.lastName || '').trim();
      const corporateEmail = String(row.corporateEmail || '').trim().toLowerCase();
      if (!firstName)      return errors.push({ row: line, field: 'firstName', error: 'required' });
      if (!lastName)       return errors.push({ row: line, field: 'lastName', error: 'required' });
      if (!corporateEmail) return errors.push({ row: line, field: 'corporateEmail', error: 'required' });
      if (ambiguousEmails.has(corporateEmail)) {
        return errors.push({ row: line, field: 'corporateEmail', error: `multiple corporates share this email — disambiguate in the Corporates list before importing` });
      }
      const corporateId = corporateMap.get(corporateEmail);
      if (!corporateId) return errors.push({ row: line, field: 'corporateEmail', error: `no corporate with email ${corporateEmail}` });

      const email = row.email ? String(row.email).trim().toLowerCase() : undefined;
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return errors.push({ row: line, field: 'email', error: 'invalid format' });
      }
      const dob = toDateOrUndef(row.dateOfBirth);
      if (dob === null) return errors.push({ row: line, field: 'dateOfBirth', error: 'invalid date' });
      const doj = toDateOrUndef(row.dateOfJoining);
      if (doj === null) return errors.push({ row: line, field: 'dateOfJoining', error: 'invalid date' });

      cleaned.push({
        business: req.businessId,
        corporate: corporateId,
        firstName,
        lastName,
        email,
        phone: row.phone ? String(row.phone).trim() : undefined,
        department: row.department ? String(row.department).trim() : undefined,
        designation: row.designation ? String(row.designation).trim() : undefined,
        employeeId: row.employeeId ? String(row.employeeId).trim() : undefined,
        dateOfBirth: dob,
        dateOfJoining: doj,
      });
    });

    if (errors.length > 0) return sendError(res, 400, 'Validation failed', errors);

    const inserted = await Staff.insertMany(cleaned, { ordered: true });
    return sendSuccess(res, 201, `Imported ${inserted.length} staff member(s).`, { imported: inserted.length });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return sendError(res, 400, error.message);
    }
    console.error('[importStaff] unexpected error:', error);
    return sendError(res, 500, error.message);
  }
};

const staffTemplate = (req, res) => {
  const buffer = importExportService.getStaffTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="staff-template.xlsx"');
  res.setHeader('Cache-Control', 'no-store');
  return res.send(buffer);
};

module.exports = { exportStaff, importStaff, staffTemplate };
