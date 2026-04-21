const LoginLog = require('../../models/LoginLog.model');
const User = require('../../models/User.model');
const importExportService = require('../../services/importExport.service');
const { sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;

const parseDevice = (ua) => {
  if (!ua) return 'Unknown';
  if (/iPhone|iPad|iPod/.test(ua))       return 'iOS';
  if (/Android/.test(ua))                return 'Android';
  if (/Windows/.test(ua))                return 'Windows';
  if (/Mac OS X/.test(ua))               return 'macOS';
  if (/CrOS/.test(ua))                   return 'ChromeOS';
  if (/Linux/.test(ua))                  return 'Linux';
  return 'Other';
};

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

// Cross-tenant filter — super-admin sees events across every business.
const buildFilter = async (req) => {
  const filter = {};
  const { search, status, from, to, userId } = req.query;

  if (status && status !== 'all') filter.status = status;
  if (userId) filter.user = userId;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (search && search.trim()) {
    const re = new RegExp(search.trim().replace(ESCAPE_RE, '\\$&'), 'i');
    const users = await User.find({
      $or: [{ name: re }, { email: re }],
    }).select('_id');
    const userIds = users.map(u => u._id);
    filter.$or = [
      { user: { $in: userIds } },
      { attemptedEmail: re },
      { ipAddress: re },
    ];
  }

  return filter;
};

const shapeLog = (l) => ({
  ...l,
  device: l.device || parseDevice(l.userAgent),
});

const getAllLoginLogs = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = await buildFilter(req);
    const [logs, total] = await Promise.all([
      LoginLog.find(filter)
        .sort({ loggedAt: -1 })
        .skip(skip).limit(limit)
        .populate('user', 'name email role')
        .lean(),
      LoginLog.countDocuments(filter),
    ]);
    return sendPaginated(res, logs.map(shapeLog), total, page, limit, 'logs');
  } catch (error) {
    return handleError(res, error, 'saGetAllLoginLogs');
  }
};

const exportLoginLogs = async (req, res) => {
  try {
    const { format = 'xlsx' } = req.query;
    if (!['xlsx', 'csv'].includes(String(format).toLowerCase())) {
      return sendError(res, 400, 'Invalid format. Supported: xlsx, csv.');
    }
    const filter = await buildFilter(req);
    const logs = await LoginLog.find(filter)
      .sort({ loggedAt: -1 })
      .populate('user', 'name email role')
      .lean();

    const dataset = {
      title: 'Platform Login Logs',
      columns: ['User', 'Email', 'Role', 'Status', 'Failure Reason', 'IP Address', 'Device', 'User Agent', 'Date & Time'],
      widths: [20, 24, 14, 10, 20, 18, 12, 40, 20],
      rows: logs.map(l => [
        l.user?.name || l.attemptedEmail || '—',
        l.user?.email || l.attemptedEmail || '—',
        l.user?.role || '—',
        l.status || '—',
        l.failureReason || '',
        l.ipAddress || '—',
        parseDevice(l.userAgent),
        l.userAgent || '—',
        l.loggedAt ? new Date(l.loggedAt).toISOString() : '',
      ]),
    };

    const handled = importExportService.sendExport(res, format, dataset, `platform-login-logs-${Date.now()}`);
    if (!handled) return sendError(res, 400, 'Invalid format.');
  } catch (error) {
    return handleError(res, error, 'saExportLoginLogs');
  }
};

module.exports = { getAllLoginLogs, exportLoginLogs };
