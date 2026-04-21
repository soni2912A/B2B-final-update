const path = require('path');
const fs = require('fs');
const Business = require('../../models/Business.model');
const { LOGO_DIR } = require('../../middleware/upload.middleware');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  if (error && error.code === 11000) {
    return sendError(res, 400, 'A business with that email already exists.');
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

const getBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.businessId);
    if (!business) return sendError(res, 404, 'Business not found.');
    return sendSuccess(res, 200, 'Business fetched.', { business });
  } catch (error) { return handleError(res, error, 'getBusiness'); }
};

// Allowlist: name, email, phone, address, currency, timezone, dateFormat.
// Explicitly NOT updatable via this endpoint: subscription, taxRate, invoice*,
// isActive, _id, timestamps.
const updateBusiness = async (req, res) => {
  try {
    const { name, email, phone, address, currency, timezone, dateFormat } = req.body;
    const patch = {};
    if (name      !== undefined) patch.name      = String(name).trim();
    if (email     !== undefined) patch.email     = String(email).trim().toLowerCase();
    if (phone     !== undefined) patch.phone     = phone === null ? null : String(phone).trim();
    if (currency  !== undefined) patch.currency  = String(currency);
    if (timezone  !== undefined) patch.timezone  = String(timezone);
    if (dateFormat!== undefined) patch.dateFormat= String(dateFormat);
    if (address   !== undefined) {
      if (typeof address !== 'object' || address === null || Array.isArray(address)) {
        return sendError(res, 400, 'Address must be an object with street/city/state/pincode/country.');
      }
      patch.address = {
        street:  address.street  || '',
        city:    address.city    || '',
        state:   address.state   || '',
        pincode: address.pincode || '',
        country: address.country || 'India',
      };
    }
    if (Object.keys(patch).length === 0) return sendError(res, 400, 'No updatable fields provided.');

    const business = await Business.findByIdAndUpdate(
      req.businessId, patch, { new: true, runValidators: true },
    );
    if (!business) return sendError(res, 404, 'Business not found.');
    return sendSuccess(res, 200, 'Business updated.', { business });
  } catch (error) { return handleError(res, error, 'updateBusiness'); }
};

const uploadLogo = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'No logo file uploaded.');

    const business = await Business.findById(req.businessId);
    if (!business) {
      // Clean up the just-saved file since we can't persist it.
      fs.unlink(req.file.path, () => {});
      return sendError(res, 404, 'Business not found.');
    }

    // Delete the old logo if it lives under our own uploads dir.
    const oldLogo = business.logo;
    if (oldLogo && oldLogo.startsWith('/uploads/logos/')) {
      const oldFilename = path.basename(oldLogo);
      const oldPath = path.join(LOGO_DIR, oldFilename);
      fs.unlink(oldPath, (err) => {
        if (err && err.code !== 'ENOENT') console.error('[uploadLogo] old-logo unlink failed:', err.message);
      });
    }

    business.logo = `/uploads/logos/${path.basename(req.file.path)}`;
    await business.save();

    return sendSuccess(res, 200, 'Logo uploaded.', { logo: business.logo });
  } catch (error) {
    // On any failure, try to clean up the new file so we don't leak disk.
    if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
    return handleError(res, error, 'uploadLogo');
  }
};

module.exports = { getBusiness, updateBusiness, uploadLogo };
