import express from 'express'
import {
  createFeature,
  createFeatureStandalone,
  getFeatures,
  getFeature,
  updateFeature,
  deleteFeature,
  analyzeFeatureHandler,
  breakDownFeatureHandler,
  acceptBreakdown,
  autoBreakdownAndCreate,
  addStoryToFeature,
  getFeatureProgress,
} from '../controllers/feature.controller.js'
import { authenticateToken, authorizeRoles, checkProjectAccess } from '../middleware/auth.js'
import { validate, validateQuery } from '../middleware/validation.js'
import { createFeatureSchema, updateFeatureSchema, featureQuerySchema } from '../validators/feature.validator.js'

const router = express.Router()

/**
 * Feature Routes
 * All feature management endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// POST /api/features - Create feature (standalone)
router.post('/', authorizeRoles('admin', 'manager'), validate(createFeatureSchema), createFeatureStandalone)

// GET /api/features - List features (filtered by project, priority, status)
router.get('/', validateQuery(featureQuerySchema), getFeatures)

// POST /api/projects/:projectId/features - Create feature under project
router.post('/projects/:projectId/features', checkProjectAccess, authorizeRoles('admin', 'manager'), validate(createFeatureSchema), createFeature)

// GET /api/projects/:projectId/features - Get features for project
router.get('/projects/:projectId/features', checkProjectAccess, getFeatures)

// GET /api/features/:id - Get single feature with child stories
router.get('/:id', getFeature)

// PUT /api/features/:id - Update feature
router.put('/:id', authorizeRoles('admin', 'manager'), validate(updateFeatureSchema), updateFeature)

// DELETE /api/features/:id - Delete feature
router.delete('/:id', authorizeRoles('admin', 'manager'), deleteFeature)

// POST /api/features/:id/analyze - Analyze feature (NLP analysis only)
router.post('/:id/analyze', authorizeRoles('admin', 'manager'), analyzeFeatureHandler)

// POST /api/features/:id/breakdown - Generate breakdown suggestions (doesn't create)
router.post('/:id/breakdown', authorizeRoles('admin', 'manager'), breakDownFeatureHandler)

// POST /api/features/:id/break-down - Break down feature into stories (AI) - legacy
router.post('/:id/break-down', authorizeRoles('admin', 'manager'), breakDownFeatureHandler)

// POST /api/features/:id/accept-breakdown - Accept breakdown and create stories/tasks
router.post('/:id/accept-breakdown', authorizeRoles('admin', 'manager'), acceptBreakdown)

// POST /api/features/:id/auto-breakdown-and-create - One-click instant breakdown and create
router.post('/:id/auto-breakdown-and-create', authorizeRoles('admin', 'manager'), autoBreakdownAndCreate)

// POST /api/features/:id/stories - Add story manually to feature
router.post('/:id/stories', authorizeRoles('admin', 'manager'), addStoryToFeature)

// GET /api/features/:id/progress - Calculate completion progress
router.get('/:id/progress', getFeatureProgress)

export default router

