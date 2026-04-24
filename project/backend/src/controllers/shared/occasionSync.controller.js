

const User = require('../../models/User.model');
const Occasion = require('../../models/Occasion.model');
const gc = require('../../services/googleCalendar.service');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

async function syncOccasion(req, res, occasion) {
  try {
    if (!gc.isConfigured()) {
      return sendError(res, 503, 'Google Calendar is not configured on this server.');
    }

    
    const user = await User.findById(req.user._id)
      .select('+googleCalendar.accessToken +googleCalendar.refreshToken +googleCalendar.expiresAt');
    if (!user?.googleCalendar?.refreshToken) {
      return sendError(res, 400, 'Connect your Google account from Settings before syncing.');
    }

    const { event, refreshed } = await gc.createEventForOccasion({ user, occasion });

  
    occasion.googleEventId   = event.id;
    occasion.googleEventLink = event.htmlLink || null;
    occasion.googleSyncedAt  = new Date();
    occasion.googleSyncedBy  = user._id;
    await occasion.save();

    if (refreshed?.access_token) {
      user.googleCalendar.accessToken = refreshed.access_token;
      if (refreshed.expiry_date) user.googleCalendar.expiresAt = new Date(refreshed.expiry_date);
      await user.save({ validateBeforeSave: false });
    }

    return sendSuccess(res, 200, 'Occasion synced to Google Calendar.', {
      occasion: {
        _id: occasion._id,
        googleEventId: occasion.googleEventId,
        googleEventLink: occasion.googleEventLink,
        googleSyncedAt: occasion.googleSyncedAt,
      },
    });
  } catch (err) {
    console.error('[occasionSync] error:', err.message);
 
    const msg = err?.response?.data?.error?.message || err.message || 'Sync failed.';
    return sendError(res, 500, msg);
  }
}

const syncAdmin = async (req, res) => {
  const occasion = await Occasion.findOne({ _id: req.params.id, business: req.businessId });
  if (!occasion) return sendError(res, 404, 'Occasion not found.');
  return syncOccasion(req, res, occasion);
};

const syncCorporate = async (req, res) => {
  const occasion = await Occasion.findOne({
    _id: req.params.id,
    business: req.businessId,
    corporate: req.user.corporate,
  });
  if (!occasion) return sendError(res, 404, 'Occasion not found.');
  return syncOccasion(req, res, occasion);
};

module.exports = { syncAdmin, syncCorporate };
