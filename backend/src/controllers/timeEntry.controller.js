import {
  startTimer,
  stopTimer,
  pauseTimer,
  resumeTimer,
  getActiveTimer,
  createTimeEntry,
  getTimeEntriesForTask,
  getTimeEntriesForUser,
  updateTimeEntry,
  deleteTimeEntry,
  getTimeTrackingSummary,
} from '../services/timeEntry.service.js'
import { logActivity } from '../services/activity.service.js'
import { successResponse, paginatedResponse } from '../utils/response.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * TimeEntry Controller
 * HTTP request handlers for time tracking
 */

/**
 * Start timer for a task
 * POST /api/tasks/:taskId/timer/start
 */
export const startTimerHandler = async (req, res, next) => {
  try {
    const { taskId } = req.params
    const userId = req.user.id

    const timeEntry = await startTimer(taskId, userId)

    // Log activity
    await logActivity(
      'created',
      'task',
      taskId,
      userId,
      `Timer started for task`
    )

    return successResponse(res, { timeEntry: timeEntry.toObject() }, 'Timer started successfully')
  } catch (error) {
    if (error.message.includes('already have an active timer')) {
      return next(new BadRequestError(error.message))
    }
    next(error)
  }
}

/**
 * Stop timer
 * POST /api/time-entries/:id/timer/stop
 */
export const stopTimerHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Get time entry to verify ownership
    const { TimeEntry } = await import('../models/index.js')
    const timeEntry = await TimeEntry.findById(id)

    if (!timeEntry) {
      throw new NotFoundError('Time entry not found')
    }

    // Verify ownership
    if (timeEntry.user.toString() !== userId) {
      throw new ForbiddenError('You can only stop your own timer')
    }

    const updatedEntry = await stopTimer(id)

    // Log activity
    await logActivity(
      'updated',
      'task',
      updatedEntry.task._id || updatedEntry.task,
      userId,
      `Timer stopped: ${updatedEntry.hours.toFixed(2)} hours logged`
    )

    return successResponse(res, { timeEntry: updatedEntry.toObject() }, 'Timer stopped successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Pause timer
 * POST /api/time-entries/:id/timer/pause
 */
export const pauseTimerHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Get time entry to verify ownership
    const { TimeEntry } = await import('../models/index.js')
    const timeEntry = await TimeEntry.findById(id)

    if (!timeEntry) {
      throw new NotFoundError('Time entry not found')
    }

    // Verify ownership
    if (timeEntry.user.toString() !== userId) {
      throw new ForbiddenError('You can only pause your own timer')
    }

    const updatedEntry = await pauseTimer(id)

    return successResponse(res, { timeEntry: updatedEntry.toObject() }, 'Timer paused successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Resume timer
 * POST /api/time-entries/:id/timer/resume
 */
export const resumeTimerHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const updatedEntry = await resumeTimer(id)

    // Verify ownership
    if (updatedEntry.user._id.toString() !== userId && updatedEntry.user.toString() !== userId) {
      throw new ForbiddenError('You can only resume your own timer')
    }

    return successResponse(res, { timeEntry: updatedEntry.toObject() }, 'Timer resumed successfully')
  } catch (error) {
    if (error.message.includes('already have an active timer')) {
      return next(new BadRequestError(error.message))
    }
    next(error)
  }
}

/**
 * Get active timer
 * GET /api/time-entries/active
 */
export const getActiveTimerHandler = async (req, res, next) => {
  try {
    const userId = req.user.id

    const timeEntry = await getActiveTimer(userId)

    if (!timeEntry) {
      return successResponse(res, { timeEntry: null }, 'No active timer')
    }

    return successResponse(res, { timeEntry: timeEntry.toObject() }, 'Active timer retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Create manual time entry
 * POST /api/tasks/:taskId/time-entries
 */
export const createTimeEntryHandler = async (req, res, next) => {
  try {
    const { taskId } = req.params
    const userId = req.user.id
    const { hours, date, description } = req.body

    const timeEntry = await createTimeEntry({
      task: taskId,
      user: userId,
      hours,
      date: date ? new Date(date) : new Date(),
      description,
    })

    // Log activity
    await logActivity(
      'created',
      'task',
      taskId,
      userId,
      `Logged ${hours} hours manually`
    )

    return successResponse(
      res,
      { timeEntry: timeEntry.toObject() },
      'Time entry created successfully',
      201
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get time entries for a task
 * GET /api/tasks/:taskId/time-entries
 */
export const getTimeEntriesForTaskHandler = async (req, res, next) => {
  try {
    const { taskId } = req.params
    const { page = 1, limit = 50 } = req.query

    const result = await getTimeEntriesForTask(taskId, {
      page: parseInt(page),
      limit: parseInt(limit),
    })

    return paginatedResponse(
      res,
      result.timeEntries.map((entry) => entry.toObject()),
      result.pagination,
      'Time entries retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get time entries for current user
 * GET /api/time-entries
 */
export const getTimeEntriesForUserHandler = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { dateFrom, dateTo, taskId, projectId, page = 1, limit = 100 } = req.query

    const result = await getTimeEntriesForUser(userId, {
      dateFrom,
      dateTo,
      taskId,
      projectId,
      page: parseInt(page),
      limit: parseInt(limit),
    })

    return paginatedResponse(
      res,
      result.timeEntries.map((entry) => entry.toObject()),
      result.pagination,
      'Time entries retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Update time entry
 * PUT /api/time-entries/:id
 */
export const updateTimeEntryHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { hours, date, description } = req.body

    // Get time entry to verify ownership
    const { TimeEntry } = await import('../models/index.js')
    const timeEntry = await TimeEntry.findById(id)

    if (!timeEntry) {
      throw new NotFoundError('Time entry not found')
    }

    // Verify ownership
    if (timeEntry.user.toString() !== userId) {
      throw new ForbiddenError('You can only update your own time entries')
    }

    const updatedEntry = await updateTimeEntry(id, {
      hours,
      date: date ? new Date(date) : undefined,
      description,
    })

    // Log activity
    await logActivity(
      'updated',
      'task',
      updatedEntry.task._id || updatedEntry.task,
      userId,
      `Time entry updated`
    )

    return successResponse(res, { timeEntry: updatedEntry.toObject() }, 'Time entry updated successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Delete time entry
 * DELETE /api/time-entries/:id
 */
export const deleteTimeEntryHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Get time entry to verify ownership
    const { TimeEntry } = await import('../models/index.js')
    const timeEntry = await TimeEntry.findById(id)

    if (!timeEntry) {
      throw new NotFoundError('Time entry not found')
    }

    // Verify ownership
    if (timeEntry.user.toString() !== userId) {
      throw new ForbiddenError('You can only delete your own time entries')
    }

    // Get task ID before deleting
    const taskId = timeEntry.task._id || timeEntry.task

    await deleteTimeEntry(id)

    // Log activity
    await logActivity(
      'deleted',
      'task',
      taskId,
      userId,
      `Time entry deleted`
    )

    return successResponse(res, null, 'Time entry deleted successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get time tracking summary
 * GET /api/time-entries/summary
 */
export const getTimeTrackingSummaryHandler = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { dateFrom, dateTo } = req.query

    const summary = await getTimeTrackingSummary(userId, {
      dateFrom,
      dateTo,
    })

    return successResponse(res, { summary }, 'Time tracking summary retrieved successfully')
  } catch (error) {
    next(error)
  }
}

