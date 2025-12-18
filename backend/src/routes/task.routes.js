import express from 'express'
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  assignTask,
  assignTaskWithAI,
  getAssignmentRecommendations,
  startTask,
  completeTask,
  addTaskDependency,
  removeTaskDependency,
  getTaskDependencyGraph,
  getTaskDependencyImpactHandler,
  getTaskCommits,
  linkTaskCommit,
  scanTaskCommits,
  submitTaskRecommendationFeedback,
  getTaskModelStats,
} from '../controllers/task.controller.js'
import {
  startTimerHandler,
  createTimeEntryHandler,
  getTimeEntriesForTaskHandler,
} from '../controllers/timeEntry.controller.js'
import {
  uploadTaskAttachments,
  deleteTaskAttachment,
  downloadAttachment,
} from '../controllers/attachment.controller.js'
import { upload, checkTotalSize } from '../middleware/upload.js'
import {
  authenticateToken,
  authorizeRoles,
  checkResourceOwnership,
  checkManagerPermission,
} from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  taskDependencySchema,
  taskCommitSchema,
  taskCommitScanSchema,
} from '../validators/task.validator.js'
import { createTimeEntrySchema } from '../validators/timeEntry.validator.js'

const router = express.Router()

/**
 * Task Routes
 * All task management endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// GET /api/tasks/ai/model-stats - Model health overview
router.get('/ai/model-stats', authorizeRoles('admin', 'manager'), getTaskModelStats)

// POST /api/stories/:storyId/tasks - Create task
router.post('/stories/:storyId/tasks', validate(createTaskSchema), createTask)

// GET /api/stories/:storyId/tasks - Get tasks for story
router.get('/stories/:storyId/tasks', getTasks)

// GET /api/tasks/:id - Get single task (with ownership check)
router.get('/:id', checkResourceOwnership, getTask)

// PUT /api/tasks/:id - Update task (with ownership check)
router.put('/:id', checkResourceOwnership, validate(updateTaskSchema), updateTask)

// DELETE /api/tasks/:id - Delete task (admin/manager only)
router.delete('/:id', authorizeRoles('admin', 'manager'), checkResourceOwnership, deleteTask)

// POST /api/tasks/:id/assign - Assign task to user (manager permission required)
router.post(
  '/:id/assign',
  checkManagerPermission,
  validate(assignTaskSchema),
  assignTask
)

// POST /api/tasks/:id/assign-ai - Assign task using AI recommendation (manager permission required)
router.post('/:id/assign-ai', checkManagerPermission, assignTaskWithAI)

// GET /api/tasks/:id/recommendations - Get assignment recommendations (with ownership check)
router.get('/:id/recommendations', checkResourceOwnership, getAssignmentRecommendations)

// POST /api/tasks/:id/ai/feedback - Capture feedback on AI sugg
router.post('/:id/ai/feedback', checkManagerPermission, submitTaskRecommendationFeedback)

// Dependency management
router.get('/:id/dependencies/graph', checkResourceOwnership, getTaskDependencyGraph)
router.get('/:id/dependencies/impact', checkResourceOwnership, getTaskDependencyImpactHandler)
router.post('/:id/dependencies', checkResourceOwnership, validate(taskDependencySchema), addTaskDependency)
router.delete('/:id/dependencies/:dependencyId', checkResourceOwnership, removeTaskDependency)

// Commit linking
router.get('/:id/commits', checkResourceOwnership, getTaskCommits)
router.post('/:id/commits', checkResourceOwnership, validate(taskCommitSchema), linkTaskCommit)
router.post(
  '/:id/commits/scan',
  checkResourceOwnership,
  validate(taskCommitScanSchema),
  scanTaskCommits
)

// POST /api/tasks/:id/start - Start task (with ownership check)
router.post('/:id/start', checkResourceOwnership, startTask)

// POST /api/tasks/:id/complete - Complete task (with ownership check)
router.post('/:id/complete', checkResourceOwnership, validate(updateTaskSchema), completeTask)

// Time tracking routes
// POST /api/tasks/:taskId/timer/start - Start timer
router.post('/:taskId/timer/start', checkResourceOwnership, startTimerHandler)

// POST /api/tasks/:taskId/time-entries - Create manual time entry
router.post('/:taskId/time-entries', checkResourceOwnership, validate(createTimeEntrySchema), createTimeEntryHandler)

// GET /api/tasks/:taskId/time-entries - Get time entries for task
router.get('/:taskId/time-entries', checkResourceOwnership, getTimeEntriesForTaskHandler)

// File attachment routes
// POST /api/tasks/:taskId/attachments - Upload files to task
router.post(
  '/:taskId/attachments',
  checkResourceOwnership,
  checkTotalSize,
  upload.array('files', 10),
  uploadTaskAttachments
)

// DELETE /api/tasks/:taskId/attachments/:attachmentId - Delete attachment
router.delete('/:taskId/attachments/:attachmentId', checkResourceOwnership, deleteTaskAttachment)

// GET /api/tasks/:taskId/attachments/:attachmentId/download - Download attachment
router.get('/:taskId/attachments/:attachmentId/download', checkResourceOwnership, downloadAttachment)

export default router

