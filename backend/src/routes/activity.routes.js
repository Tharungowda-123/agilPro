import express from 'express'
import {
  getActivities,
  getProjectActivities,
  getSprintActivities,
  getStoryActivities,
  getUserActivities,
} from '../controllers/activity.controller.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * Activity Routes
 * All activity endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// GET /api/activities - Get global activities with filters
router.get('/', getActivities)

export default router

