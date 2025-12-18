import { google } from 'googleapis'
import { Team, TeamCalendarEvent } from '../models/index.js'
import logger from '../utils/logger.js'
import { NotFoundError } from '../utils/errors.js'

const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

const buildOAuthClient = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return null
  }

  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
}

const normalizeGoogleDate = (googleDateTime) => {
  if (!googleDateTime) {
    return null
  }

  if (googleDateTime.dateTime) {
    return new Date(googleDateTime.dateTime)
  }

  if (googleDateTime.date) {
    return new Date(`${googleDateTime.date}T00:00:00.000Z`)
  }

  return null
}

export const syncTeamGoogleCalendar = async (teamId) => {
  const team = await Team.findById(teamId).populate('members', '_id')
  if (!team) {
    throw new NotFoundError('Team not found')
  }

  const integration = team.integrations?.googleCalendar
  if (!integration?.enabled) {
    return {
      synced: false,
      message: 'Google Calendar integration is not enabled for this team.',
    }
  }

  const oauthClient = buildOAuthClient()
  if (!oauthClient) {
    return {
      synced: false,
      message: 'Google Calendar credentials are not configured on the server.',
    }
  }

  if (!integration.accessToken) {
    return {
      synced: false,
      message: 'Google Calendar access token is missing. Please reconnect integration.',
    }
  }

  try {
    oauthClient.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: integration.tokenExpiry ? new Date(integration.tokenExpiry).getTime() : null,
      scope: GOOGLE_SCOPES.join(' '),
    })

    const calendar = google.calendar({ version: 'v3', auth: oauthClient })
    const now = new Date()
    const horizon = new Date(now)
    horizon.setMonth(horizon.getMonth() + 2)

    const response = await calendar.events.list({
      calendarId: integration.calendarId || 'primary',
      timeMin: now.toISOString(),
      timeMax: horizon.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    const googleEvents = response.data.items || []
    let upserted = 0
    const fallbackCreator = team.members?.[0]?._id

    for (const gEvent of googleEvents) {
      const startDate = normalizeGoogleDate(gEvent.start)
      const endDate = normalizeGoogleDate(gEvent.end)

      if (!startDate || !endDate) {
        continue
      }

      await TeamCalendarEvent.findOneAndUpdate(
        { team: team._id, externalId: gEvent.id },
        {
          team: team._id,
          title: gEvent.summary || 'Google Calendar Event',
          description: gEvent.description,
          type: 'holiday',
          scope: 'team',
          status: gEvent.status === 'cancelled' ? 'cancelled' : 'confirmed',
          source: 'google',
          startDate,
          endDate,
          allDay: !!gEvent.start?.date,
          capacityImpact: 100,
          metadata: {
            syncToken: gEvent.etag,
            iCalUID: gEvent.iCalUID,
            htmlLink: gEvent.htmlLink,
          },
          createdBy: fallbackCreator,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      )

      upserted += 1
    }

    team.integrations.googleCalendar.lastSyncedAt = new Date()
    await team.save()

    return {
      synced: true,
      imported: upserted,
      message: `Synchronized ${upserted} Google events.`,
    }
  } catch (error) {
    logger.error('Error syncing Google Calendar:', error)
    return {
      synced: false,
      message: error.message || 'Failed to sync with Google Calendar',
    }
  }
}

