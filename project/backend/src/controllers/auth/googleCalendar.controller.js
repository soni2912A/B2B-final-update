const crypto = require('crypto');
const User = require('../../models/User.model');
const gc = require('../../services/googleCalendar.service');
const { sendSuccess, sendError } = require('../../utils/responseHelper');


function clientBase() {
  return (process.env.CLIENT_URL || '').split(',')[0].trim() || 'http://localhost:5173';
}


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

    
    const user = await User.findById(userId).select('+googleCalendar.pendingState');
    if (!user || user.googleCalendar?.pendingState !== stateToken) {
      return res.redirect(`${home}&google=error&google_reason=state_mismatch`);
    }

    const { tokens, email } = await gc.exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
     
      return res.redirect(`${home}&google=error&google_reason=no_refresh_token`);
    }

    user.googleCalendar = {
      email,
      connectedAt: new Date(),
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    };
   
    user.markModified('googleCalendar');
    await user.save({ validateBeforeSave: false });

    return res.redirect(`${home}&google=connected`);
  } catch (err) {
    console.error('[googleCallback] error:', err.message);
    const home2 = `${clientBase()}/?page=admin-settings`;
    return res.redirect(`${home2}&google=error&google_reason=${encodeURIComponent(err.message)}`);
  }
};


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
