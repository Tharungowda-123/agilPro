import express from 'express'
import {
  startTimerHandler,
  stopTimerHandler,
  pauseTimerHandler,
  resumeTimerHandler,
  getActiveTimerHandler,
  createTimeEntryHandler,
  getTimeEntriesForTaskHandler,
  getTimeEntriesForUserHandler,
  updateTimeEntryHandler,
  deleteTimeEntryHandler,
  getTimeTrackingSummaryHandler,
} from '../controllers/timeEntry.controller.js'
import { authenticateToken } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import {
  createTimeEntrySchema,
  updateTimeEntrySchema,
} from '../validators/timeEntry.validator.js'

const router = express.Router()

/**
 * TimeEntry Routes
 * All time tracking endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// Timer routes
// GET /api/time-entries/active - Get active timer
router.get('/active', getActiveTimerHandler)

// POST /api/tasks/:taskId/timer/start - Start timer (handled in task routes)
// POST /api/time-entries/:id/timer/stop - Stop timer
router.post('/:id/timer/stop', stopTimerHandler)

// POST /api/time-entries/:id/timer/pause - Pause timer
router.post('/:id/timer/pause', pauseTimerHandler)

// POST /api/time-entries/:id/timer/resume - Resume timer
router.post('/:id/timer/resume', resumeTimerHandler)

// Time entry CRUD
// GET /api/time-entries - Get time entries for current user
router.get('/', getTimeEntriesForUserHandler)

// GET /api/time-entries/summary - Get time tracking summary
router.get('/summary', getTimeTrackingSummaryHandler)

// PUT /api/time-entries/:id - Update time entry
router.put('/:id', validate(updateTimeEntrySchema), updateTimeEntryHandler)

// DELETE /api/time-entries/:id - Delete time entry
router.delete('/:id', deleteTimeEntryHandler)

export default router

