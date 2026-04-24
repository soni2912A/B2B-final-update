

const User = require('../../models/User.model');
const gc   = require('../../services/googleCalendar.service');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

const getGoogleEvents = async (req, res) => {
  try {
    if (!gc.isConfigured()) {
      return sendSuccess(res, 200, 'Google Calendar not configured.', {
        events: [], configured: false, connected: false,
      });
    }

    const user = await User.findById(req.user._id)
      .select('+googleCalendar.accessToken +googleCalendar.refreshToken +googleCalendar.expiresAt');

    if (!user?.googleCalendar?.refreshToken) {
      return sendSuccess(res, 200, 'Google account not connected.', {
        events: [], configured: true, connected: false,
      });
    }

    const now  = new Date();
    const from = req.query.from
      ? new Date(req.query.from)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const to   = req.query.to
      ? new Date(req.query.to + 'T23:59:59')
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const { events, refreshed } = await gc.fetchGoogleEvents({ user, timeMin: from, timeMax: to });

    if (refreshed?.access_token) {
      user.googleCalendar.accessToken = refreshed.access_token;
      if (refreshed.expiry_date) user.googleCalendar.expiresAt = new Date(refreshed.expiry_date);
      await user.save({ validateBeforeSave: false });
    }

    return sendSuccess(res, 200, 'Google events fetched.', {
      events, configured: true, connected: true,
    });
  } catch (err) {
    console.error('[corp.getGoogleEvents]', err.message);
    if (err.code === 401 || /invalid_grant|Token has been expired/i.test(err.message)) {
      return sendSuccess(res, 200, 'Google token expired. Reconnect in Settings.', {
        events: [], configured: true, connected: false, tokenExpired: true,
      });
    }
    return sendError(res, 500, err.message);
  }
};

module.exports = { getGoogleEvents };
