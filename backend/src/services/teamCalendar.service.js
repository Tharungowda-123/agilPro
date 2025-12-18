import { Team, TeamCalendarEvent, User } from '../models/index.js'
import logger from '../utils/logger.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import { syncTeamGoogleCalendar } from './googleCalendar.service.js'
import { logTeamAction } from './audit.service.js'

const normalizeDateRange = (rangeStart, rangeEnd) => {
  const start = rangeStart ? new Date(rangeStart) : new Date()
  start.setHours(0, 0, 0, 0)
  const end = rangeEnd ? new Date(rangeEnd) : new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setHours(23, 59, 59, 999)

  if (end < start) {
    throw new BadRequestError('End date must be after start date')
  }

  return { start, end }
}

const eventAffectsUserOnDate = (event, userId, date) => {
  const affectsTeam = event.scope === 'team'
  const affectsUser =
    (event.user && event.user.toString() === userId.toString()) || affectsTeam
  if (!affectsUser) {
    return false
  }
  const eventStart = new Date(event.startDate)
  const eventEnd = new Date(event.endDate)
  const day = new Date(date)
  day.setHours(12, 0, 0, 0)
  return eventStart <= day && day <= eventEnd
}

const upsertCalendarAdjustmentForUser = async (userId, event) => {
  if (!userId) {
    return
  }

  const user = await User.findById(userId)
  if (!user) {
    return
  }

  const adjustments = user.capacityAdjustments || []
  const existing = adjustments.find(
    (item) => item.calendarEvent && item.calendarEvent.toString() === event._id.toString()
  )

  const payload = {
    type: ['vacation', 'holiday'].includes(event.type) ? 'vacation' : 'other',
    reason: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    adjustedCapacity:
      event.capacityImpact >= 100
        ? 0
        : Math.max(0, Math.round(((100 - event.capacityImpact) / 100) * (user.availability || 0))),
    source: 'calendar',
    calendarEvent: event._id,
  }

  if (existing) {
    Object.assign(existing, payload)
  } else {
    user.capacityAdjustments.push(payload)
  }

  await user.save()
}

const removeCalendarAdjustmentForEvent = async (eventId) => {
  await User.updateMany(
    { 'capacityAdjustments.calendarEvent': eventId },
    { $pull: { capacityAdjustments: { calendarEvent: eventId } } }
  )
}

export const getTeamCalendarData = async (teamId, { startDate, endDate }) => {
  const team = await Team.findById(teamId).populate('members', 'name email avatar availability')
  if (!team) {
    throw new NotFoundError('Team not found')
  }

  const { start, end } = normalizeDateRange(startDate, endDate)

  const events = await TeamCalendarEvent.find({
    team: teamId,
    startDate: { $lte: end },
    endDate: { $gte: start },
  })
    .populate('user', 'name email avatar role')
    .sort({ startDate: 1 })

  const unavailableMembers = new Set()
  const today = new Date()
  events.forEach((event) => {
    if (event.status === 'cancelled') return
    if (event.scope === 'team') {
      team.members.forEach((member) => unavailableMembers.add(member._id.toString()))
    } else if (event.user) {
      unavailableMembers.add(event.user._id.toString())
    }
  })

  return {
    events,
    summary: {
      totalMembers: team.members.length,
      unavailableToday: Array.from(unavailableMembers).length,
      range: { start, end },
    },
  }
}

export const createTeamCalendarEvent = async ({ teamId, payload, actor }) => {
  const team = await Team.findById(teamId)
  if (!team) {
    throw new NotFoundError('Team not found')
  }

  const { title, startDate, endDate } = payload
  if (!title || !startDate || !endDate) {
    throw new BadRequestError('Title, start date, and end date are required')
  }

  const event = await TeamCalendarEvent.create({
    team: teamId,
    user: payload.user || null,
    title: payload.title,
    description: payload.description,
    type: payload.type || 'custom',
    scope: payload.scope || (payload.user ? 'member' : 'team'),
    status: payload.status || 'confirmed',
    source: 'manual',
    startDate: payload.startDate,
    endDate: payload.endDate,
    allDay: payload.allDay ?? true,
    capacityImpact: payload.capacityImpact ?? 100,
    createdBy: actor._id || actor.id || actor,
  })

  if (event.scope === 'team') {
    const members = await User.find({ team: teamId }).select('_id')
    await Promise.all(members.map((member) => upsertCalendarAdjustmentForUser(member._id, event)))
  } else if (event.user) {
    await upsertCalendarAdjustmentForUser(event.user, event)
  }

  await logTeamAction(actor, 'team_updated', { _id: teamId, name: team.name }, {
    after: { calendarEvent: event.title },
  })

  return event
}

export const updateTeamCalendarEvent = async ({ teamId, eventId, updates, actor }) => {
  const event = await TeamCalendarEvent.findOne({ _id: eventId, team: teamId })
  if (!event) {
    throw new NotFoundError('Calendar event not found')
  }

  const team = await Team.findById(teamId)

  Object.assign(event, updates)
  await event.save()

  await removeCalendarAdjustmentForEvent(event._id)

  if (event.scope === 'team') {
    const members = await User.find({ team: teamId }).select('_id')
    await Promise.all(members.map((member) => upsertCalendarAdjustmentForUser(member._id, event)))
  } else if (event.user) {
    await upsertCalendarAdjustmentForUser(event.user, event)
  }

  await logTeamAction(actor, 'team_updated', { _id: teamId, name: team?.name || teamId }, {
    after: { calendarEvent: event.title },
  })

  return event
}

export const deleteTeamCalendarEvent = async ({ teamId, eventId, actor }) => {
  const event = await TeamCalendarEvent.findOneAndDelete({ _id: eventId, team: teamId })
  if (!event) {
    throw new NotFoundError('Calendar event not found')
  }

  const team = await Team.findById(teamId)

  await removeCalendarAdjustmentForEvent(event._id)

  await logTeamAction(actor, 'team_updated', { _id: teamId, name: team?.name || teamId }, {
    before: { calendarEvent: event.title },
  })

  return event
}

export const getAvailabilityForecast = async (teamId, { startDate, endDate }) => {
  const team = await Team.findById(teamId).populate('members', 'name availability capacityAdjustments')
  if (!team) {
    throw new NotFoundError('Team not found')
  }

  const { start, end } = normalizeDateRange(startDate, endDate)
  const events = await TeamCalendarEvent.find({
    team: teamId,
    startDate: { $lte: end },
    endDate: { $gte: start },
    status: { $ne: 'cancelled' },
  }).lean()

  const forecast = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const dateSnapshot = {
      date: new Date(cursor),
      totalCapacity: 0,
      availableCapacity: 0,
      unavailableMembers: [],
    }

    team.members.forEach((member) => {
      const baseCapacityPerDay = (member.availability || 0) / 5
      const memberEvents = events.filter((event) => eventAffectsUserOnDate(event, member._id, cursor))

      let adjustedCapacity = baseCapacityPerDay
      if (memberEvents.length > 0) {
        const maxImpact = Math.min(
          100,
          memberEvents.reduce((impact, event) => Math.max(impact, event.capacityImpact || 100), 0)
        )
        adjustedCapacity = baseCapacityPerDay * ((100 - maxImpact) / 100)
        dateSnapshot.unavailableMembers.push({
          userId: member._id,
          name: member.name,
          reason: memberEvents[0]?.title,
        })
      }

      dateSnapshot.totalCapacity += baseCapacityPerDay
      dateSnapshot.availableCapacity += adjustedCapacity
    })

    forecast.push({
      date: dateSnapshot.date,
      totalCapacity: Number(dateSnapshot.totalCapacity.toFixed(2)),
      availableCapacity: Number(dateSnapshot.availableCapacity.toFixed(2)),
      unavailableMembers: dateSnapshot.unavailableMembers,
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  return forecast
}

export const getAvailabilityDashboard = async (teamId) => {
  const team = await Team.findById(teamId).populate('members', 'name')
  if (!team) {
    throw new NotFoundError('Team not found')
  }

  const today = new Date()
  const nextMonth = new Date(today)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  const events = await TeamCalendarEvent.find({
    team: teamId,
    startDate: { $lte: nextMonth },
    endDate: { $gte: today },
    status: { $ne: 'cancelled' },
  })
    .populate('user', 'name avatar')
    .lean()

  const upcomingHolidays = events
    .filter((event) => event.type === 'holiday')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 3)

  const unavailableMembers = team.members
    .filter((member) => events.some((event) => eventAffectsUserOnDate(event, member._id, today)))
    .map((member) => member.name)

  return {
    totalMembers: team.members.length,
    currentlyUnavailable: unavailableMembers.length,
    unavailableMembers,
    upcomingHolidays,
    nextSync: team.integrations?.googleCalendar?.lastSyncedAt || null,
  }
}

export const triggerGoogleCalendarSync = async (teamId) => {
  return syncTeamGoogleCalendar(teamId)
}

