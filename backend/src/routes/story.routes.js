import express from 'express'
import {
  createStory,
  getStories,
  getStory,
  updateStory,
  deleteStory,
  analyzeStory,
  estimateStoryPoints,
  findSimilarStoriesHandler,
  addDependency,
  removeDependency,
} from '../controllers/story.controller.js'
import { getTasks, createTask } from '../controllers/task.controller.js'
import {
  uploadStoryAttachments,
  deleteStoryAttachment,
  downloadAttachment,
} from '../controllers/attachment.controller.js'
import { getStoryActivities } from '../controllers/activity.controller.js'
import { upload, checkTotalSize } from '../middleware/upload.js'
import {
  authenticateToken,
  authorizeRoles,
  checkProjectAccess,
  checkResourceOwnership,
} from '../middleware/auth.js'
import { validate, validateQuery } from '../middleware/validation.js'
import { createTaskSchema } from '../validators/task.validator.js'
import {
  createStorySchema,
  updateStorySchema,
  storyQuerySchema,
  addDependencySchema,
} from '../validators/story.validator.js'

const router = express.Router()

/**
 * Story Routes
 * All story management endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// POST /api/features/:featureId/stories - Create story under feature
// Note: Project access will be checked in controller by fetching feature's project
router.post('/features/:featureId/stories', validate(createStorySchema), createStory)

// POST /api/projects/:projectId/stories - Create story directly (with project access check)
router.post(
  '/projects/:projectId/stories',
  checkProjectAccess,
  validate(createStorySchema),
  createStory
)

// GET /api/projects/:projectId/stories - Get stories with filters (with project access check)
router.get(
  '/projects/:projectId/stories',
  checkProjectAccess,
  validateQuery(storyQuerySchema),
  getStories
)

// GET /api/stories/:storyId/activities - Get story activities (must be before /:id)
router.get('/:storyId/activities', checkResourceOwnership, getStoryActivities)

// GET /api/stories/:storyId/tasks - Get tasks for story (must be before /:id)
router.get('/:storyId/tasks', checkResourceOwnership, getTasks)

// POST /api/stories/:storyId/tasks - Create task for story (must be before /:id)
router.post('/:storyId/tasks', checkResourceOwnership, validate(createTaskSchema), createTask)

// GET /api/stories/:id - Get single story (with access check)
router.get('/:id', checkResourceOwnership, getStory)

// PUT /api/stories/:id - Update story (with access check)
router.put('/:id', checkResourceOwnership, validate(updateStorySchema), updateStory)

// DELETE /api/stories/:id - Delete story (admin/manager only)
router.delete('/:id', authorizeRoles('admin', 'manager'), checkResourceOwnership, deleteStory)

// POST /api/stories/:id/analyze - Analyze story complexity (AI) (with access check)
router.post('/:id/analyze', checkResourceOwnership, analyzeStory)

// POST /api/stories/:id/estimate-points - Estimate story points (AI) (with access check)
router.post('/:id/estimate-points', checkResourceOwnership, estimateStoryPoints)

// GET /api/stories/:id/similar - Find similar stories (AI) (with access check)
router.get('/:id/similar', checkResourceOwnership, findSimilarStoriesHandler)

// POST /api/stories/:id/dependencies - Add dependency (with access check)
router.post('/:id/dependencies', checkResourceOwnership, validate(addDependencySchema), addDependency)

// DELETE /api/stories/:id/dependencies/:dependencyId - Remove dependency (with access check)
router.delete('/:id/dependencies/:dependencyId', checkResourceOwnership, removeDependency)

// File attachment routes
// POST /api/stories/:storyId/attachments - Upload files to story
router.post(
  '/:storyId/attachments',
  checkResourceOwnership,
  checkTotalSize,
  upload.array('files', 10),
  uploadStoryAttachments
)

// DELETE /api/stories/:storyId/attachments/:attachmentId - Delete attachment
router.delete('/:storyId/attachments/:attachmentId', checkResourceOwnership, deleteStoryAttachment)

// GET /api/stories/:storyId/attachments/:attachmentId/download - Download attachment
router.get('/:storyId/attachments/:attachmentId/download', checkResourceOwnership, downloadAttachment)

export default router

