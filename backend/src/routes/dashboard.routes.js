import express from 'express'
import {
  getDashboardStats,
  getVelocityForecastDashboard,
  getRiskAlertsDashboard,
  getUpcomingDeadlinesDashboard,
} from '../controllers/dashboard.controller.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = express.Router()

/**
 * Dashboard Routes
 * Role-specific dashboard endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// GET /api/dashboard/stats - Get dashboard statistics (role-specific)
router.get('/stats', getDashboardStats)

// GET /api/dashboard/velocity-forecast - AI-driven velocity forecast
router.get(
  '/velocity-forecast',
  // Allow developers to view their own team's forecast; access enforced in controller via team context
  authorizeRoles('admin', 'manager', 'developer'),
  getVelocityForecastDashboard
)

// GET /api/dashboard/risk-alerts - AI risk alerts
router.get(
  '/risk-alerts',
  // Allow read-only access for developer and viewer; controller resolves team context
  authorizeRoles('admin', 'manager', 'developer', 'viewer'),
  getRiskAlertsDashboard
)

// GET /api/dashboard/deadlines - Upcoming deadlines for dashboard
router.get('/deadlines', getUpcomingDeadlinesDashboard)

export default router

