import express from 'express'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import {
  getHealthOverview,
  getHealthStatus,
  getSlowQueryReport,
  getErrorInsights,
  getRequestHistoryReport,
} from '../controllers/health.controller.js'

const router = express.Router()

router.use(authenticateToken, authorizeRoles('admin'))

router.get('/', getHealthOverview)
router.get('/status', getHealthStatus)
router.get('/slow-queries', getSlowQueryReport)
router.get('/errors', getErrorInsights)
router.get('/requests', getRequestHistoryReport)

export default router

