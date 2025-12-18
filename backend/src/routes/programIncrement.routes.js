import express from 'express'
import {
  createProgramIncrement,
  getProgramIncrements,
  getProgramIncrement,
  updateProgramIncrement,
  deleteProgramIncrement,
  addFeatureToPI,
  addSprintToPI,
  getPICapacity,
  optimizePI,
  startPI,
  completePI,
  breakdownAndAssign,
} from '../controllers/programIncrement.controller.js'
import { authenticateToken, authorizeRoles, checkProjectAccess } from '../middleware/auth.js'
import { validate, validateQuery } from '../middleware/validation.js'
import {
  createPISchema,
  updatePISchema,
  piQuerySchema,
} from '../validators/programIncrement.validator.js'

const router = express.Router()

/**
 * Program Increment Routes
 * All PI Planning endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// POST /api/projects/:projectId/program-increments - Create PI
router.post(
  '/projects/:projectId/program-increments',
  checkProjectAccess,
  authorizeRoles('admin', 'manager'),
  validate(createPISchema),
  createProgramIncrement
)

// GET /api/projects/:projectId/program-increments - Get PIs for project
router.get('/projects/:projectId/program-increments', checkProjectAccess, validateQuery(piQuerySchema), getProgramIncrements)

// GET /api/program-increments/:id - Get single PI
router.get('/:id', getProgramIncrement)

// PUT /api/program-increments/:id - Update PI
router.put('/:id', authorizeRoles('admin', 'manager'), validate(updatePISchema), updateProgramIncrement)

// DELETE /api/program-increments/:id - Delete PI
router.delete('/:id', authorizeRoles('admin', 'manager'), deleteProgramIncrement)

// POST /api/program-increments/:id/features - Add feature to PI
router.post('/:id/features', authorizeRoles('admin', 'manager'), addFeatureToPI)

// POST /api/program-increments/:id/sprints - Add sprint to PI
router.post('/:id/sprints', authorizeRoles('admin', 'manager'), addSprintToPI)

// GET /api/program-increments/:id/capacity - Calculate PI capacity
router.get('/:id/capacity', getPICapacity)

// POST /api/program-increments/:id/optimize - AI optimize feature distribution
router.post('/:id/optimize', authorizeRoles('admin', 'manager'), optimizePI)

// POST /api/program-increments/:id/start - Start PI
router.post('/:id/start', authorizeRoles('admin', 'manager'), startPI)

// POST /api/program-increments/:id/complete - Complete PI
router.post('/:id/complete', authorizeRoles('admin', 'manager'), completePI)

// POST /api/program-increments/:id/breakdown-and-assign - Break down features and assign tasks
router.post('/:id/breakdown-and-assign', authorizeRoles('admin', 'manager'), breakdownAndAssign)

export default router

