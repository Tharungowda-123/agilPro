import express from 'express'
import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
  getCommentHistory,
  setThreadResolved,
  setCommentPinned,
} from '../controllers/comment.controller.js'
import { authenticateToken } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import {
  createCommentSchema,
  updateCommentSchema,
  commentReactionSchema,
  threadResolutionSchema,
  pinCommentSchema,
} from '../validators/comment.validator.js'

const router = express.Router()

/**
 * Comment Routes
 * All comment endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// POST /api/stories/:storyId/comments - Create comment on story
router.post('/stories/:storyId/comments', validate(createCommentSchema), createComment)

// POST /api/tasks/:taskId/comments - Create comment on task
router.post('/tasks/:taskId/comments', validate(createCommentSchema), createComment)

// GET /api/stories/:storyId/comments - Get comments for story
router.get('/stories/:storyId/comments', getComments)

// GET /api/tasks/:taskId/comments - Get comments for task
router.get('/tasks/:taskId/comments', getComments)

// PUT /api/comments/:id - Update comment
router.put('/:id', validate(updateCommentSchema), updateComment)

// DELETE /api/comments/:id - Delete comment
router.delete('/:id', deleteComment)

// POST /api/comments/:id/reactions - Add reaction
router.post('/:id/reactions', validate(commentReactionSchema), addReaction)

// DELETE /api/comments/:id/reactions - Remove reaction
router.delete('/:id/reactions', validate(commentReactionSchema), removeReaction)

// GET /api/comments/:id/history - View edit history
router.get('/:id/history', getCommentHistory)

// PATCH /api/comments/:id/resolve - Resolve/unresolve thread
router.patch('/:id/resolve', validate(threadResolutionSchema), setThreadResolved)

// PATCH /api/comments/:id/pin - Pin/unpin comment
router.patch('/:id/pin', validate(pinCommentSchema), setCommentPinned)

export default router

