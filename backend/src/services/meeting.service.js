import { addMinutes } from 'date-fns'
import {
  Sprint,
  SprintMeeting,
  Project,
  Team,
  User,
} from '../models/index.js'
import { BadRequestError, NotFoundError } from '../utils/errors.js'
import {
  createTeamCalendarEvent,
  deleteTeamCalendarEvent,
  updateTeamCalendarEvent,
} from './teamCalendar.service.js'
import { logMeetingAction, logSprintAction } from './audit.service.js'
import { sendMeetingInviteEmail } from './email.service.js'
import logger from '../utils/logger.js'

const DEFAULT_DURATION_MINUTES = 60

const normalizeDate = (value, field) => {
  if (!value) {
    throw new BadRequestError(`${field} is required`)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError(`${field} must be a valid date`)
  }
  return date
}

const buildInvitees = async (userIds = [], extraEmails = []) => {
  const invitees = []
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))]

  if (uniqueUserIds.length > 0) {
    const users = await User.find({ _id: { $in: uniqueUserIds } }).select('name email')
    users.forEach((user) => {
      if (user.email) {
        invitees.push({
          user: user._id,
          email: user.email,
        })
      }
    })
  }

  extraEmails
    .filter((email) => !!email)
    .forEach((email) => {
      invitees.push({ email })
    })

  return invitees
}

const normalizeAgendaItems = (items = []) => {
  if (!Array.isArray(items)) return []
  return items
    .filter((item) => item?.title)
    .map((item, index) => ({
      title: item.title.trim(),
      description: item.description?.trim(),
      owner: item.owner || null,
      durationMinutes: item.durationMinutes || 0,
      order: item.order ?? index,
      completed: Boolean(item.completed),
    }))
}

const generateRecurrenceDates = (startTime, recurrence = {}) => {
  if (!recurrence?.enabled || recurrence.frequency === 'none') {
    return []
  }
  const dates = []
  const frequency = recurrence.frequency || 'weekly'
  const interval = recurrence.interval || 1
  const maxOccurrences = Math.min(recurrence.endAfterOccurrences || 4, 12)
  let cursor = new Date(startTime)
  let occurrences = 1

  while (occurrences < maxOccurrences) {
    switch (frequency) {
      case 'daily':
        cursor = addMinutes(cursor, interval * 24 * 60)
        break
      case 'weekly':
        cursor = addMinutes(cursor, interval * 7 * 24 * 60)
        break
      case 'biweekly':
        cursor = addMinutes(cursor, interval * 14 * 24 * 60)
        break
      case 'monthly':
        {
          const next = new Date(cursor)
          next.setMonth(next.getMonth() + interval)
          cursor = next
        }
        break
      default:
        cursor = addMinutes(cursor, interval * 7 * 24 * 60)
    }

    if (recurrence.endDate && cursor > new Date(recurrence.endDate)) {
      break
    }
    dates.push(new Date(cursor))
    occurrences += 1
  }

  return dates
}

const attachCalendarEvent = async ({ meeting, teamId, actor }) => {
  if (!teamId) return null
  try {
    const event = await createTeamCalendarEvent({
      teamId,
      payload: {
        title: meeting.title,
        description: meeting.description,
        type: 'meeting',
        scope: 'team',
        status: 'confirmed',
        source: 'manual',
        startDate: meeting.startTime,
        endDate: meeting.endTime,
        allDay: false,
        capacityImpact: 0,
        metadata: {
          linkedMeeting: meeting._id,
        },
      },
      actor,
    })
    return event
  } catch (error) {
    logger.warn('Failed to sync meeting with team calendar:', error.message)
    return null
  }
}

const updateCalendarEvent = async ({ meeting, actor }) => {
  if (!meeting.calendarEventId || !meeting.team) return null
  try {
    return await updateTeamCalendarEvent({
      teamId: meeting.team,
      eventId: meeting.calendarEventId,
      updates: {
        title: meeting.title,
        description: meeting.description,
        startDate: meeting.startTime,
        endDate: meeting.endTime,
        status: meeting.status === 'cancelled' ? 'cancelled' : 'confirmed',
      },
      actor,
    })
  } catch (error) {
    logger.warn('Failed to update calendar event for meeting:', error.message)
    return null
  }
}

const detachCalendarEvent = async ({ meeting, actor }) => {
  if (!meeting.calendarEventId || !meeting.team) return
  try {
    await deleteTeamCalendarEvent({
      teamId: meeting.team,
      eventId: meeting.calendarEventId,
      actor,
    })
  } catch (error) {
    logger.warn('Failed to delete calendar event for meeting:', error.message)
  }
}

const notifyInvitees = async ({ meeting, sprint, project, organizer }) => {
  const invites = meeting.invitees || []
  await Promise.all(
    invites
      .filter((invitee) => invitee.email)
      .map((invitee) =>
        sendMeetingInviteEmail({
          to: invitee.email,
          meeting,
          sprint,
          project,
          organizer,
        })
      )
  )
}

export const scheduleSprintMeeting = async ({ sprintId, payload, actor, req }) => {
  const sprint = await Sprint.findById(sprintId).populate('project')
  if (!sprint) {
    throw new NotFoundError('Sprint not found')
  }

  const project =
    sprint.project?._id && sprint.project.name ? sprint.project : await Project.findById(sprint.project)
  if (!project) {
    throw new NotFoundError('Project not found for sprint')
  }

  const team = project.team ? await Team.findById(project.team) : null

  const startTime = normalizeDate(payload.startTime, 'startTime')
  const endTime = payload.endTime
    ? normalizeDate(payload.endTime, 'endTime')
    : addMinutes(startTime, payload.durationMinutes || DEFAULT_DURATION_MINUTES)

  if (endTime <= startTime) {
    throw new BadRequestError('End time must be after start time')
  }

  const invitees = await buildInvitees(payload.inviteeIds, payload.inviteeEmails)
  if (invitees.length === 0) {
    throw new BadRequestError('At least one invitee email is required')
  }

  const meeting = new SprintMeeting({
    sprint: sprint._id,
    project: project._id,
    team: team?._id || null,
    type: payload.type || 'planning',
    title: payload.title || `${payload.type || 'Sprint'} Meeting`,
    description: payload.description,
    startTime,
    endTime,
    timezone: payload.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    organizer: actor._id || actor.id,
    invitees,
    location: payload.location,
    videoConferenceLink: payload.videoConferenceLink,
    agendaItems: normalizeAgendaItems(payload.agendaItems),
    recurrence: {
      enabled: payload.recurrence?.enabled || false,
      frequency: payload.recurrence?.frequency || 'none',
      interval: payload.recurrence?.interval || 1,
      endAfterOccurrences: payload.recurrence?.endAfterOccurrences || 4,
      endDate: payload.recurrence?.endDate || null,
      weekdays: payload.recurrence?.weekdays || [],
      generatedDates: [],
    },
    notes: payload.initialNotes
      ? [
          {
            author: actor._id || actor.id,
            content: payload.initialNotes,
          },
        ]
      : [],
  })

  if (meeting.recurrence.enabled) {
    meeting.recurrence.generatedDates = generateRecurrenceDates(startTime, meeting.recurrence)
  }

  const calendarEvent = await attachCalendarEvent({ meeting, teamId: team?._id, actor })
  if (calendarEvent) {
    meeting.calendarEventId = calendarEvent._id
  }

  await meeting.save()

  await logMeetingAction(actor, 'meeting_scheduled', meeting, {}, req)
  await logSprintAction(actor, 'sprint_updated', sprint, { after: { meeting: meeting.title } }, req)

  if (payload.sendInvites !== false) {
    await notifyInvitees({ meeting, sprint, project, organizer: actor })
    meeting.lastInviteSentAt = new Date()
    await meeting.save()
  }

  return meeting
}

export const getSprintMeetings = async (sprintId) => {
  return SprintMeeting.find({ sprint: sprintId })
    .sort({ startTime: 1 })
    .populate('organizer', 'name email avatar')
    .populate('invitees.user', 'name email avatar role')
}

export const updateSprintMeeting = async ({ meetingId, payload, actor, req }) => {
  const meeting = await SprintMeeting.findById(meetingId)
  if (!meeting) {
    throw new NotFoundError('Meeting not found')
  }

  if (payload.title) meeting.title = payload.title
  if (payload.description !== undefined) meeting.description = payload.description
  if (payload.type) meeting.type = payload.type
  if (payload.location !== undefined) meeting.location = payload.location
  if (payload.videoConferenceLink !== undefined) meeting.videoConferenceLink = payload.videoConferenceLink
  if (payload.status) meeting.status = payload.status

  if (payload.startTime) {
    meeting.startTime = normalizeDate(payload.startTime, 'startTime')
  }
  if (payload.endTime) {
    meeting.endTime = normalizeDate(payload.endTime, 'endTime')
  }

  if (meeting.endTime <= meeting.startTime) {
    throw new BadRequestError('End time must be after start time')
  }

  if (payload.agendaItems) {
    meeting.agendaItems = normalizeAgendaItems(payload.agendaItems)
    meeting.agendaPreparedBy = actor._id || actor.id
    meeting.agendaUpdatedAt = new Date()
  }

  if (Array.isArray(payload.inviteeIds) || Array.isArray(payload.inviteeEmails)) {
    meeting.invitees = await buildInvitees(payload.inviteeIds, payload.inviteeEmails)
  }

  if (payload.recurrence) {
    const existingRecurrence =
      typeof meeting.recurrence?.toObject === 'function'
        ? meeting.recurrence.toObject()
        : meeting.recurrence || {}
    meeting.recurrence = {
      ...existingRecurrence,
      ...payload.recurrence,
    }
    if (meeting.recurrence.enabled) {
      meeting.recurrence.generatedDates = generateRecurrenceDates(meeting.startTime, meeting.recurrence)
    }
  }

  await meeting.save()
  await updateCalendarEvent({ meeting, actor })
  await logMeetingAction(actor, 'meeting_updated', meeting, {}, req)

  return meeting
}

export const deleteSprintMeeting = async ({ meetingId, actor, req }) => {
  const meeting = await SprintMeeting.findById(meetingId)
  if (!meeting) {
    throw new NotFoundError('Meeting not found')
  }

  meeting.status = 'cancelled'
  await meeting.save()
  await detachCalendarEvent({ meeting, actor })
  await logMeetingAction(actor, 'meeting_cancelled', meeting, {}, req)
  return meeting
}

export const addMeetingNote = async ({ meetingId, content, author, req }) => {
  if (!content || !content.trim()) {
    throw new BadRequestError('Note content is required')
  }

  const meeting = await SprintMeeting.findById(meetingId)
  if (!meeting) {
    throw new NotFoundError('Meeting not found')
  }

  meeting.notes.push({
    author: author._id || author.id,
    content: content.trim(),
  })

  await meeting.save()
  await logMeetingAction(author, 'meeting_notes_added', meeting, {}, req)

  return meeting
}

export const addMeetingAgendaItem = async ({ meetingId, item, actor, req }) => {
  if (!item || !item.title) {
    throw new BadRequestError('Agenda item title is required')
  }

  const meeting = await SprintMeeting.findById(meetingId)
  if (!meeting) {
    throw new NotFoundError('Meeting not found')
  }

  meeting.agendaItems.push({
    title: item.title.trim(),
    description: item.description?.trim(),
    owner: item.owner || null,
    durationMinutes: item.durationMinutes || 0,
    order: meeting.agendaItems.length,
  })

  meeting.agendaPreparedBy = actor._id || actor.id
  meeting.agendaUpdatedAt = new Date()

  await meeting.save()
  await logMeetingAction(actor, 'meeting_agenda_updated', meeting, {}, req)
  return meeting
}

export const resendMeetingInvites = async ({ meetingId, actor }) => {
  const meeting = await SprintMeeting.findById(meetingId)
    .populate('sprint')
    .populate('project')
  if (!meeting) {
    throw new NotFoundError('Meeting not found')
  }

  await notifyInvitees({
    meeting,
    sprint: meeting.sprint,
    project: meeting.project,
    organizer: actor,
  })

  meeting.lastInviteSentAt = new Date()
  await meeting.save()
  return meeting
}

