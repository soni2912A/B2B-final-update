// Google Calendar OAuth + event-creation helpers.
//
// Design:
//   - `isConfigured()` exposes whether env vars are present. Every caller
//     should check this and 503 early if not — same pattern as email.service.js
//     which stubs to console when SMTP is missing.
//   - `createOAuthClient()` is per-call (not a module-level singleton) because
//     each user has their own access + refresh tokens. Reusing a client across
//     users would cross-contaminate credentials.
//   - Access-token refresh is handled by the googleapis library automatically
//     when we set the refresh_token; we persist the new access token after use.

const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

function isConfigured() {
  return !!(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );
}

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI,
  );
}

// Step 1 — generate the URL the user's browser should be redirected to. We
// include a one-time `state` so the callback can verify the request came from
// our consent flow (CSRF protection). The caller should persist the state in
// the user's DB row before issuing this URL.
function getAuthUrl(state) {
  const oAuth2Client = createOAuthClient();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',      // request refresh token
    prompt: 'consent',            // force refresh-token issuance on re-consent
    scope: SCOPES,
    state,
  });
}

// Step 2 — exchange the `code` from the callback for tokens. Returns the raw
// token set plus the user's Google email (pulled from the id_token).
async function exchangeCodeForTokens(code) {
  const oAuth2Client = createOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  // id_token is returned when the 'email' scope is implied — for calendar
  // scopes it isn't, so we fetch the email via the userinfo endpoint instead.
  oAuth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
  const { data: profile } = await oauth2.userinfo.get();
  return { tokens, email: profile?.email || null };
}

// Step 3 — create an all-day event on the user's primary calendar for a given
// Occasion. Loads stored tokens, hydrates the OAuth client, calls the Calendar
// API. If the access token is expired, googleapis transparently refreshes it
// using the stored refresh_token and emits a 'tokens' event — we persist the
// new access token so future calls skip the refresh round-trip.
async function createEventForOccasion({ user, occasion }) {
  if (!user?.googleCalendar?.refreshToken) {
    throw new Error('User is not connected to Google Calendar.');
  }

  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials({
    access_token: user.googleCalendar.accessToken,
    refresh_token: user.googleCalendar.refreshToken,
    expiry_date: user.googleCalendar.expiresAt
      ? new Date(user.googleCalendar.expiresAt).getTime()
      : undefined,
  });

  // Persist refreshed tokens back to the User doc if googleapis silently
  // refreshed. Attached once per client (this one is request-scoped).
  let refreshed = null;
  oAuth2Client.on('tokens', (t) => { refreshed = t; });

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  const dateOnly = new Date(occasion.date).toISOString().slice(0, 10);
  const descriptionLines = [
    occasion.notes ? occasion.notes : null,
    occasion.recurringYearly ? 'Recurring yearly' : null,
    'Synced from B2B Corporate Bakery Platform',
  ].filter(Boolean);

  const { data: event } = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: occasion.title,
      description: descriptionLines.join('\n'),
      start: { date: dateOnly },    // all-day event
      end:   { date: dateOnly },
      // Annual recurrence: we always know the user's occasion list has the
      // current date; adding RRULE=YEARLY lets Google handle subsequent years
      // without needing a re-sync every 12 months.
      ...(occasion.recurringYearly ? { recurrence: ['RRULE:FREQ=YEARLY'] } : {}),
      // Reminder 2 days before — matches the in-app reminderDaysBefore default.
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 60 * 24 * (occasion.reminderDaysBefore || 2) }],
      },
    },
  });

  return { event, refreshed };
}

// Revoke the refresh token with Google. Best-effort — some tokens may already
// be invalid on Google's side (user revoked via account settings). We swallow
// the error; the caller always clears the local token record afterward.
async function revokeTokens(refreshToken) {
  if (!refreshToken) return;
  try {
    const oAuth2Client = createOAuthClient();
    await oAuth2Client.revokeToken(refreshToken);
  } catch (err) {
    console.error('[googleCalendar.revoke] ignored:', err.message);
  }
}

module.exports = {
  isConfigured,
  getAuthUrl,
  exchangeCodeForTokens,
  createEventForOccasion,
  revokeTokens,
};
