import express from 'express'
import {
  getLeaderboard,
  getMyGamification,
  updateGamificationPreferences,
} from '../controllers/gamification.controller.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/leaderboard', getLeaderboard)
router.get('/me', getMyGamification)
router.patch('/preferences', updateGamificationPreferences)

export default router

