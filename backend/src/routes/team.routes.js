import express from 'express'
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addMembers,
  removeMember,
  getTeamCapacityHandler,
  getTeamVelocityHandler,
  getTeamPerformanceHandler,
  getTeamCapacityPlanningHandler,
  getCapacityTrendsHandler,
  reassignTask,
  getRebalanceSuggestions,
  applyRebalancePlan,
  getRebalanceHistoryHandler,
} from '../controllers/team.controller.js'
import {
  getTeamCalendar,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getTeamAvailabilityForecast,
  getTeamAvailabilityDashboard,
  syncTeamCalendarWithGoogle,
} from '../controllers/teamCalendar.controller.js'
import {
  authenticateToken,
  authorizeRoles,
  checkTeamAccess,
} from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import {
  createTeamSchema,
  updateTeamSchema,
  addMembersSchema,
} from '../validators/team.validator.js'
import { reassignTaskSchema } from '../validators/user.validator.js'

const router = express.Router()

/**
 * Team Routes
 * All team management endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// GET /api/teams - List teams (auto-filtered by user's team unless admin)
router.get('/', getTeams)

// POST /api/teams - Create team (admin only)
router.post('/', authorizeRoles('admin'), validate(createTeamSchema), createTeam)

// GET /api/teams/:id - Get single team (with access check)
router.get('/:id', checkTeamAccess, getTeam)

// PUT /api/teams/:id - Update team (admin/manager only, with access check)
router.put(
  '/:id',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  validate(updateTeamSchema),
  updateTeam
)

// DELETE /api/teams/:id - Delete team (admin only, with access check)
router.delete('/:id', authorizeRoles('admin'), checkTeamAccess, deleteTeam)

// POST /api/teams/:id/members - Add members (admin/manager only, with access check)
router.post(
  '/:id/members',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  validate(addMembersSchema),
  addMembers
)

// DELETE /api/teams/:id/members/:userId - Remove member (admin/manager only, with access check)
router.delete(
  '/:id/members/:userId',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  removeMember
)

// GET /api/teams/:id/capacity - Get team capacity (with access check)
router.get('/:id/capacity', checkTeamAccess, getTeamCapacityHandler)

// GET /api/teams/:id/velocity - Get team velocity (with access check)
router.get('/:id/velocity', checkTeamAccess, getTeamVelocityHandler)

// GET /api/teams/:id/performance - Get team performance (with access check)
router.get('/:id/performance', checkTeamAccess, getTeamPerformanceHandler)

// GET /api/teams/:id/capacity-planning - Get capacity planning data (manager/admin only)
router.get(
  '/:id/capacity-planning',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  getTeamCapacityPlanningHandler
)

// GET /api/teams/:id/capacity-trends - Get capacity utilization trends (manager/admin only)
router.get(
  '/:id/capacity-trends',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  getCapacityTrendsHandler
)

// GET /api/teams/:id/rebalance-suggestions - Get AI rebalance suggestions (manager/admin only)
router.get(
  '/:id/rebalance-suggestions',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  getRebalanceSuggestions
)

// POST /api/teams/:id/rebalance/apply - Apply workload rebalance plan
router.post(
  '/:id/rebalance/apply',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  applyRebalancePlan
)

// GET /api/teams/:id/rebalance/history - Get rebalance history
router.get(
  '/:id/rebalance/history',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  getRebalanceHistoryHandler
)

// Calendar & availability endpoints
router.get(
  '/:id/calendar',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  getTeamCalendar
)

router.post(
  '/:id/calendar/events',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  createCalendarEvent
)

router.put(
  '/:id/calendar/events/:eventId',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  updateCalendarEvent
)

router.delete(
  '/:id/calendar/events/:eventId',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  deleteCalendarEvent
)

router.post(
  '/:id/calendar/sync/google',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  syncTeamCalendarWithGoogle
)

router.get(
  '/:id/availability/forecast',
  // Allow developers to view their own team's forecast via checkTeamAccess
  authorizeRoles('admin', 'manager', 'developer'),
  checkTeamAccess,
  getTeamAvailabilityForecast
)

router.get(
  '/:id/availability/dashboard',
  // Allow developers to view their own team's dashboard via checkTeamAccess
  authorizeRoles('admin', 'manager', 'developer'),
  checkTeamAccess,
  getTeamAvailabilityDashboard
)

// PUT /api/teams/:id/reassign-task - Reassign task to different user (manager/admin only)
router.put(
  '/:id/reassign-task',
  authorizeRoles('admin', 'manager'),
  checkTeamAccess,
  validate(reassignTaskSchema),
  reassignTask
)

export default router

