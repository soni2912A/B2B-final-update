const crypto = require('crypto');
const User = require('../../models/User.model');
const gc = require('../../services/googleCalendar.service');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

// Frontend base URL to redirect back to after OAuth dance. Prefers the first
// CLIENT_URL entry (matches how auth.controller resolves email links).
function clientBase() {
  return (process.env.CLIENT_URL || '').split(',')[0].trim() || 'http://localhost:5173';
}

// GET /auth/google/connect — authenticated. Generates a one-time `state`
// token, stashes it on the user row, and returns { url } for the frontend to
// redirect to. We don't 302 here because the request comes in via fetch() with
// an Authorization header, which wouldn't survive a browser-level redirect.
const startGoogleConnect = async (req, res) => {
  try {
    if (!gc.isConfigured()) {
      return sendError(res, 503, 'Google Calendar is not configured on this server.');
    }
    const state = crypto.randomBytes(16).toString('hex');
    await User.findByIdAndUpdate(req.user._id, {
      'googleCalendar.pendingState': state,
    });
    const url = gc.getAuthUrl(`${req.user._id}:${state}`);
    return sendSuccess(res, 200, 'OAuth URL generated.', { url });
  } catch (err) {
    console.error('[googleConnect] error:', err.message);
    return sendError(res, 500, err.message);
  }
};

// GET /auth/google/callback?code=…&state=… — public. Google redirects the
// user's browser here after consent. We parse `state` to identify the user,
// exchange the code for tokens, persist them, then 302 to the frontend
// Settings page with a ?google=connected flag (or ?google=error=…).
const handleGoogleCallback = async (req, res) => {
  const home = `${clientBase()}/?page=admin-settings`;

  try {
    if (!gc.isConfigured()) {
      return res.redirect(`${home}&google=error&google_reason=not_configured`);
    }
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${home}&google=error&google_reason=${encodeURIComponent(error)}`);
    }
    if (!code || !state || !state.includes(':')) {
      return res.redirect(`${home}&google=error&google_reason=missing_params`);
    }
    const [userId, stateToken] = String(state).split(':');

    // Validate state against the user row to prevent CSRF. We selected the
    // field via + because `pendingState` isn't a top-level tokens field but is
    // still not returned by default projections (nested under googleCalendar).
    const user = await User.findById(userId).select('+googleCalendar.pendingState');
    if (!user || user.googleCalendar?.pendingState !== stateToken) {
      return res.redirect(`${home}&google=error&google_reason=state_mismatch`);
    }

    const { tokens, email } = await gc.exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Google only issues a refresh token on first consent (or re-consent via
      // prompt=consent). If absent, surface an error so we don't persist half-
      // configured state that can't refresh.
      return res.redirect(`${home}&google=error&google_reason=no_refresh_token`);
    }

    user.googleCalendar = {
      email,
      connectedAt: new Date(),
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    };
    // pendingState is a one-shot — clear it so it can't be replayed.
    user.markModified('googleCalendar');
    await user.save({ validateBeforeSave: false });

    return res.redirect(`${home}&google=connected`);
  } catch (err) {
    console.error('[googleCallback] error:', err.message);
    const home2 = `${clientBase()}/?page=admin-settings`;
    return res.redirect(`${home2}&google=error&google_reason=${encodeURIComponent(err.message)}`);
  }
};

// POST /auth/google/disconnect — authenticated. Revokes with Google (best
// effort), then clears the stored tokens regardless of whether the remote
// revoke succeeded.
const disconnectGoogle = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+googleCalendar.refreshToken');
    if (user?.googleCalendar?.refreshToken) {
      await gc.revokeTokens(user.googleCalendar.refreshToken);
    }
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { googleCalendar: '' },
    });
    return sendSuccess(res, 200, 'Google Calendar disconnected.');
  } catch (err) {
    console.error('[googleDisconnect] error:', err.message);
    return sendError(res, 500, err.message);
  }
};

// GET /auth/google/status — authenticated. Tells the frontend whether the
// feature is configured AND whether this user has connected. Cheap — safe to
// call on every Settings page open.
const getGoogleStatus = async (req, res) => {
  try {
    const configured = gc.isConfigured();
    const user = await User.findById(req.user._id).select('googleCalendar.email googleCalendar.connectedAt');
    return sendSuccess(res, 200, 'Google status', {
      configured,
      connected: !!user?.googleCalendar?.email,
      email: user?.googleCalendar?.email || null,
      connectedAt: user?.googleCalendar?.connectedAt || null,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = {
  startGoogleConnect,
  handleGoogleCallback,
  disconnectGoogle,
  getGoogleStatus,
};
