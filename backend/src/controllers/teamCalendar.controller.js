import {
  getTeamCalendarData,
  createTeamCalendarEvent,
  updateTeamCalendarEvent,
  deleteTeamCalendarEvent,
  getAvailabilityForecast,
  getAvailabilityDashboard,
  triggerGoogleCalendarSync,
} from '../services/teamCalendar.service.js'
import { successResponse } from '../utils/response.js'

export const getTeamCalendar = async (req, res, next) => {
  try {
    const data = await getTeamCalendarData(req.params.id, {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    })

    return successResponse(res, data, 'Team calendar retrieved successfully')
  } catch (error) {
    next(error)
  }
}

export const createCalendarEvent = async (req, res, next) => {
  try {
    const event = await createTeamCalendarEvent({
      teamId: req.params.id,
      payload: req.body,
      actor: req.user,
    })

    return successResponse(res, { event }, 'Calendar event created successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const updateCalendarEvent = async (req, res, next) => {
  try {
    const event = await updateTeamCalendarEvent({
      teamId: req.params.id,
      eventId: req.params.eventId,
      updates: req.body,
      actor: req.user,
    })

    return successResponse(res, { event }, 'Calendar event updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteCalendarEvent = async (req, res, next) => {
  try {
    await deleteTeamCalendarEvent({
      teamId: req.params.id,
      eventId: req.params.eventId,
      actor: req.user,
    })

    return successResponse(res, {}, 'Calendar event deleted successfully')
  } catch (error) {
    next(error)
  }
}

export const getTeamAvailabilityForecast = async (req, res, next) => {
  try {
    const forecast = await getAvailabilityForecast(req.params.id, {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    })

    return successResponse(res, { forecast }, 'Availability forecast generated successfully')
  } catch (error) {
    next(error)
  }
}

export const getTeamAvailabilityDashboard = async (req, res, next) => {
  try {
    const dashboard = await getAvailabilityDashboard(req.params.id)
    return successResponse(res, { dashboard }, 'Availability dashboard retrieved successfully')
  } catch (error) {
    next(error)
  }
}

export const syncTeamCalendarWithGoogle = async (req, res, next) => {
  try {
    const result = await triggerGoogleCalendarSync(req.params.id)
    return successResponse(res, { result }, 'Calendar synchronization completed')
  } catch (error) {
    next(error)
  }
}

