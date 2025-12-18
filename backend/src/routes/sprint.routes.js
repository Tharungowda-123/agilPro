import express from 'express'
import {
  createSprint,
  getSprints,
  getAllSprints,
  getSprint,
  updateSprint,
  startSprint,
  completeSprint,
  getSprintBurndown,
  getSprintVelocity,
  assignStoriesToSprint,
  saveRetrospective,
  updateActionItem,
  getPastRetrospectives,
  generateSprintAIPlan,
  getSprintVelocityForecast,
  getSprintAISuggestions,
  simulateSprintOutcome,
  predictSprintCompletion,
  autoGeneratePlan,
  acceptGeneratedPlan,
} from '../controllers/sprint.controller.js'
import { getSprintActivities } from '../controllers/activity.controller.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { validate, validateQuery } from '../middleware/validation.js'
import {
  createSprintSchema,
  updateSprintSchema,
  assignStoriesSchema,
  sprintQuerySchema,
  saveRetrospectiveSchema,
  updateActionItemSchema,
} from '../validators/sprint.validator.js'

const router = express.Router()

/**
 * Sprint Routes
 * All sprint management endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// GET /api/sprints - Get all sprints (must be before /:id routes)
router.get('/', validateQuery(sprintQuerySchema), getAllSprints)

// POST /api/projects/:projectId/sprints - Create sprint
router.post('/projects/:projectId/sprints', validate(createSprintSchema), createSprint)

// GET /api/projects/:projectId/sprints - Get sprints for project
router.get('/projects/:projectId/sprints', validateQuery(sprintQuerySchema), getSprints)

// GET /api/projects/:projectId/retrospectives - Get past retrospectives (must be before /:id)
router.get('/projects/:projectId/retrospectives', getPastRetrospectives)

// GET /api/sprints/:sprintId/activities - Get sprint activities (must be before /:id)
router.get('/:sprintId/activities', getSprintActivities)

// GET /api/sprints/:id - Get single sprint
router.get('/:id', getSprint)

// PUT /api/sprints/:id - Update sprint
router.put('/:id', validate(updateSprintSchema), updateSprint)

// POST /api/sprints/:id/start - Start sprint
router.post('/:id/start', startSprint)

// POST /api/sprints/:id/complete - Complete sprint
router.post('/:id/complete', completeSprint)

// GET /api/sprints/:id/burndown - Get burndown data
router.get('/:id/burndown', getSprintBurndown)

// GET /api/sprints/:id/velocity - Get sprint velocity
router.get('/:id/velocity', getSprintVelocity)

// POST /api/sprints/:id/stories - Assign stories to sprint
router.post('/:id/stories', validate(assignStoriesSchema), assignStoriesToSprint)

// POST /api/sprints/:id/retrospective - Save or update retrospective
router.post('/:id/retrospective', validate(saveRetrospectiveSchema), saveRetrospective)

// PUT /api/sprints/:id/retrospective/action-items/:itemId - Update action item status
router.put('/:id/retrospective/action-items/:itemId', validate(updateActionItemSchema), updateActionItem)

// AI Sprint Planning endpoints (manager/admin)
router.post(
  '/:id/ai/optimize-plan',
  authorizeRoles('admin', 'manager'),
  generateSprintAIPlan
)

router.post(
  '/:id/ai/predict-velocity',
  authorizeRoles('admin', 'manager'),
  getSprintVelocityForecast
)

router.post(
  '/:id/ai/suggest-stories',
  authorizeRoles('admin', 'manager'),
  getSprintAISuggestions
)

router.post(
  '/:id/ai/simulate',
  authorizeRoles('admin', 'manager'),
  simulateSprintOutcome
)

router.post(
  '/:id/ai/predict-completion',
  authorizeRoles('admin', 'manager'),
  predictSprintCompletion
)

// Auto-generate sprint plan (instant generation)
router.post(
  '/:id/auto-generate',
  authorizeRoles('admin', 'manager'),
  autoGeneratePlan
)

// Accept generated sprint plan
router.post(
  '/:id/accept-generated-plan',
  authorizeRoles('admin', 'manager'),
  acceptGeneratedPlan
)

export default router

