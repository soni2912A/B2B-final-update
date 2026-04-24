const Staff = require('../../models/Staff.model');
const Occasion = require('../../models/Occasion.model');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination, buildSortQuery, buildSearchQuery } = require('../../utils/pagination');
const XLSX = require('xlsx');

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  if (error && error.code === 11000) {
    return sendError(res, 400, 'A staff member with this email already exists.');
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

const getAllStaff = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const sort = buildSortQuery(req.query);
    const search = buildSearchQuery(req.query, ['firstName', 'lastName', 'email', 'employeeId', 'department']);
    const filter = { corporate: req.user.corporate, business: req.businessId, ...search };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.department) filter.department = req.query.department;

    const [staff, total] = await Promise.all([
      Staff.find(filter).sort(sort).skip(skip).limit(limit),
      Staff.countDocuments(filter),
    ]);
    return sendPaginated(res, staff, total, page, limit, 'staff');
  } catch (error) { return handleError(res, error, 'getAllStaff'); }
};

const getStaffMember = async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, corporate: req.user.corporate });
    if (!staff) return sendError(res, 404, 'Staff member not found');
    return sendSuccess(res, 200, 'Staff member fetched', { staff });
  } catch (error) { return handleError(res, error, 'getStaffMember'); }
};

const createStaff = async (req, res) => {
  try {
    const staff = await Staff.create({
      ...req.body,
      corporate: req.user.corporate,
      business: req.businessId,
    });
    if (staff.dateOfBirth) {
      await Occasion.create({
        business: req.businessId, corporate: req.user.corporate,
        staff: staff._id, title: `${staff.firstName}'s Birthday`,
        type: 'birthday', date: staff.dateOfBirth, recurringYearly: true,
      });
    }
    if (staff.anniversary) {
      await Occasion.create({
        business: req.businessId, corporate: req.user.corporate,
        staff: staff._id, title: `${staff.firstName}'s Work Anniversary`,
        type: 'anniversary', date: staff.anniversary, recurringYearly: true,
      });
    }
    return sendSuccess(res, 201, 'Staff member added', { staff });
  } catch (error) { return handleError(res, error, 'createStaff'); }
};

const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, corporate: req.user.corporate },
      req.body,
      { new: true, runValidators: true },
    );
    if (!staff) return sendError(res, 404, 'Staff member not found');
    return sendSuccess(res, 200, 'Staff member updated', { staff });
  } catch (error) { return handleError(res, error, 'updateStaff'); }
};

const updateStaffStatus = async (req, res) => {
  try {
    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, corporate: req.user.corporate },
      { status: req.body.status },
      { new: true },
    );
    if (!staff) return sendError(res, 404, 'Staff member not found');
    return sendSuccess(res, 200, 'Status updated', { staff });
  } catch (error) { return handleError(res, error, 'updateStaffStatus'); }
};


function parseStaffRows(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet).map((row, i) => {
    const line = i + 2;
    const firstName = String(row.firstName || '').trim();
    const lastName  = String(row.lastName || '').trim();
    const email     = String(row.email || '').trim();
    const errors = [];
    if (!firstName) errors.push('firstName required');
    if (!email)     errors.push('email required');
    return {
      line,
      firstName, lastName, email,
      phone: row.phone ? String(row.phone) : '',
      department: row.department ? String(row.department) : '',
      designation: row.designation ? String(row.designation) : '',
      employeeId: row.employeeId ? String(row.employeeId) : '',
      errors,
    };
  });
}


const previewImportStaff = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'No file uploaded');
    const rows = parseStaffRows(req.file.buffer);
    if (rows.length === 0) return sendError(res, 400, 'File is empty.');
    const valid   = rows.filter(r => r.errors.length === 0).length;
    const invalid = rows.length - valid;
    return sendSuccess(res, 200, 'Preview generated', {
      total: rows.length,
      valid,
      invalid,
      rows,
    });
  } catch (error) { return handleError(res, error, 'previewImportStaff'); }
};

const bulkImportStaff = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'No file uploaded');
    const rows = parseStaffRows(req.file.buffer);

    const results = { success: 0, failed: 0, errors: [] };
    for (const row of rows) {
      
      if (row.errors.length > 0) {
        results.failed++;
        results.errors.push({ row: row.email || row.firstName || `line ${row.line}`, error: row.errors.join('; ') });
        continue;
      }
      try {
        await Staff.create({
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone || undefined,
          department: row.department || undefined,
          designation: row.designation || undefined,
          employeeId: row.employeeId || undefined,
          corporate: req.user.corporate,
          business: req.businessId,
        });
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ row: row.email || row.firstName, error: err.message });
      }
    }
    return sendSuccess(res, 200, 'Import completed', { results });
  } catch (error) { return handleError(res, error, 'bulkImportStaff'); }
};

const exportStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ corporate: req.user.corporate }).lean();
    const data = staff.map(s => ({
      firstName: s.firstName, lastName: s.lastName, email: s.email,
      phone: s.phone, department: s.department, designation: s.designation,
      employeeId: s.employeeId, status: s.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=staff.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (error) { return handleError(res, error, 'exportStaff'); }
};

const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findOneAndDelete({ _id: req.params.id, corporate: req.user.corporate });
    if (!staff) return sendError(res, 404, 'Staff member not found');
    await Occasion.deleteMany({ staff: req.params.id, corporate: req.user.corporate });
    return sendSuccess(res, 200, 'Staff member deleted');
  } catch (error) { return handleError(res, error, 'deleteStaff'); }
};

module.exports = {
  getAllStaff, getStaffMember, createStaff, updateStaff, updateStaffStatus,
  deleteStaff, bulkImportStaff, previewImportStaff, exportStaff,
};
