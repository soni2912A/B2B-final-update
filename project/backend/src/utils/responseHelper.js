const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const sendError = (res, statusCode = 500, message = 'Server Error', errors = null) => {
  return res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });
};

// key = frontend-expected plural key (e.g. 'orders', 'corporates', 'invoices')
const sendPaginated = (res, items, total, page, limit, key = 'items') => {
  return res.status(200).json({
    success: true,
    data: { [key]: items },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit) || 1,
    },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
