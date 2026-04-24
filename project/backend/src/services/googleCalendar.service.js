

const { google } = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

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

function getAuthUrl(state) {
  const oAuth2Client = createOAuthClient();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt:      'consent',
    scope:       SCOPES,
    state,
  });
}


async function exchangeCodeForTokens(code) {
  const oAuth2Client = createOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
  const { data: profile } = await oauth2.userinfo.get();
  return { tokens, email: profile?.email || null };
}

async function createEventForOccasion({ user, occasion }) {
  if (!user?.googleCalendar?.refreshToken) {
    throw new Error('User is not connected to Google Calendar.');
  }

  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials({
    access_token:  user.googleCalendar.accessToken,
    refresh_token: user.googleCalendar.refreshToken,
    expiry_date:   user.googleCalendar.expiresAt
      ? new Date(user.googleCalendar.expiresAt).getTime()
      : undefined,
  });

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
      summary:     occasion.title,
      description: descriptionLines.join('\n'),
      start: { date: dateOnly },
      end:   { date: dateOnly },
      ...(occasion.recurringYearly ? { recurrence: ['RRULE:FREQ=YEARLY'] } : {}),
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 60 * 24 * (occasion.reminderDaysBefore || 2) }],
      },
    },
  });

  return { event, refreshed };
}


async function fetchGoogleEvents({ user, timeMin, timeMax, maxResults = 250 }) {
  if (!user?.googleCalendar?.refreshToken) {
    throw new Error('User is not connected to Google Calendar.');
  }

  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials({
    access_token:  user.googleCalendar.accessToken,
    refresh_token: user.googleCalendar.refreshToken,
    expiry_date:   user.googleCalendar.expiresAt
      ? new Date(user.googleCalendar.expiresAt).getTime()
      : undefined,
  });

  let refreshed = null;
  oAuth2Client.on('tokens', (t) => { refreshed = t; });

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  const { data } = await calendar.events.list({
    calendarId:   'primary',
    timeMin:      timeMin instanceof Date ? timeMin.toISOString() : timeMin,
    timeMax:      timeMax instanceof Date ? timeMax.toISOString() : timeMax,
    maxResults,
    singleEvents: true,
    orderBy:      'startTime',
  });

  const events = (data.items || []).map(ev => ({
    _id:             `google_${ev.id}`,
    googleEventId:   ev.id,
    googleEventLink: ev.htmlLink || null,
    title:           ev.summary || '(No title)',
    date:            ev.start?.date
      ? new Date(ev.start.date + 'T00:00:00')
      : new Date(ev.start?.dateTime),
    notes:           ev.description || '',
    source:          'google',
    type:            detectEventType(ev.summary || ''),
  }));

  return { events, refreshed };
}

function detectEventType(title) {
  const t = title.toLowerCase();
  if (t.includes('birthday') || t.includes('bday'))    return 'birthday';
  if (t.includes('anniversary'))                        return 'anniversary';
  if (t.includes('holiday') || t.includes('vacation')) return 'holiday';
  return 'custom';
}

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
  fetchGoogleEvents,
  revokeTokens,
};
