// Google-Calendar sync for an Occasion. Separate file (not inside admin or
// corporate occasion.controller.js) so the existing reminder/notification
// logic in those files stays untouched.
//
// Two flavours: syncAdmin / syncCorporate — same logic, different ownership
// filter. Kept in one file behind factory functions to keep the permission
// check per-role-correct without duplicating the body.

const User = require('../../models/User.model');
const Occasion = require('../../models/Occasion.model');
const gc = require('../../services/googleCalendar.service');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

// Shared sync body. Callers already loaded the occasion (to enforce scope).
async function syncOccasion(req, res, occasion) {
  try {
    if (!gc.isConfigured()) {
      return sendError(res, 503, 'Google Calendar is not configured on this server.');
    }

    // Hydrate the caller's Google tokens. accessToken/refreshToken/expiresAt
    // are select:false, so an explicit projection is required.
    const user = await User.findById(req.user._id)
      .select('+googleCalendar.accessToken +googleCalendar.refreshToken +googleCalendar.expiresAt');
    if (!user?.googleCalendar?.refreshToken) {
      return sendError(res, 400, 'Connect your Google account from Settings before syncing.');
    }

    const { event, refreshed } = await gc.createEventForOccasion({ user, occasion });

    // Persist the event reference on the Occasion so the UI can show "synced"
    // and link out. Also remember *who* synced so we know whose calendar the
    // event lives on when multiple users sync the same occasion (last-wins).
    occasion.googleEventId   = event.id;
    occasion.googleEventLink = event.htmlLink || null;
    occasion.googleSyncedAt  = new Date();
    occasion.googleSyncedBy  = user._id;
    await occasion.save();

    // If googleapis silently refreshed the access token, persist it so future
    // calls skip the refresh round-trip.
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
    // The googleapis error object carries a .code sometimes; surface any
    // useful .message verbatim so the toast can explain to the user.
    const msg = err?.response?.data?.error?.message || err.message || 'Sync failed.';
    return sendError(res, 500, msg);
  }
}

// POST /admin/occasions/:id/sync-to-google
const syncAdmin = async (req, res) => {
  const occasion = await Occasion.findOne({ _id: req.params.id, business: req.businessId });
  if (!occasion) return sendError(res, 404, 'Occasion not found.');
  return syncOccasion(req, res, occasion);
};

// POST /corporate/occasions/:id/sync-to-google
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
