import express from 'express'
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectMetricsHandler,
  getTeamPerformanceHandler,
} from '../controllers/project.controller.js'
import { getSprints, createSprint } from '../controllers/sprint.controller.js'
import { getProjectActivities } from '../controllers/activity.controller.js'
import {
  authenticateToken,
  authorizeRoles,
  checkProjectAccess,
  checkManagerPermission,
} from '../middleware/auth.js'
import { validate, validateQuery } from '../middleware/validation.js'
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
} from '../validators/project.validator.js'
import { sprintQuerySchema } from '../validators/sprint.validator.js'
import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache.js'

const router = express.Router()

/**
 * Project Routes
 * All project management endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// GET /api/projects - List projects with pagination and filters (auto-filtered by team unless admin)
router.get(
  '/',
  validateQuery(projectQuerySchema),
  cacheMiddleware({ ttl: 300, keyPrefix: 'projects' }), // 5 min cache
  getProjects
)

// POST /api/projects - Create new project (admin/manager only)
router.post(
  '/',
  authorizeRoles('admin', 'manager'),
  validate(createProjectSchema),
  invalidateCacheMiddleware(['projects:*']),
  createProject
)

// GET /api/projects/:projectId/activities - Get project activities (must be before /:id)
router.get('/:projectId/activities', checkProjectAccess, getProjectActivities)

// GET /api/projects/:projectId/sprints - Proxy to sprint list for a project
router.get('/:projectId/sprints', checkProjectAccess, validateQuery(sprintQuerySchema), getSprints)

// POST /api/projects/:projectId/sprints - Proxy to create sprint
router.post(
  '/:projectId/sprints',
  checkProjectAccess,
  checkManagerPermission,
  createSprint
)

// GET /api/projects/:id - Get single project (with access check)
router.get(
  '/:id',
  checkProjectAccess,
  cacheMiddleware({
    ttl: 180,
    keyPrefix: 'project',
    generateKey: (req) => `project:${req.params.id}`,
  }), // 3 min cache
  getProject
)

// PUT /api/projects/:id - Update project (with access and manager permission check)
router.put(
  '/:id',
  checkProjectAccess,
  checkManagerPermission,
  validate(updateProjectSchema),
  invalidateCacheMiddleware([
    'projects:*',
    (req) => `project:${req.params.id}*`,
  ]),
  updateProject
)

// DELETE /api/projects/:id - Delete project (admin only)
router.delete(
  '/:id',
  authorizeRoles('admin'),
  checkProjectAccess,
  invalidateCacheMiddleware(['projects:*', 'project:*']),
  deleteProject
)

// GET /api/projects/:id/metrics - Get project metrics (with access check)
router.get('/:id/metrics', checkProjectAccess, getProjectMetricsHandler)

// GET /api/projects/:id/team-performance - Get team performance (with access check)
router.get('/:id/team-performance', checkProjectAccess, getTeamPerformanceHandler)

export default router

