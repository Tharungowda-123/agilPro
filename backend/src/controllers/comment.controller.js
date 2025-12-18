import { Comment, Story, Task, Project, Notification } from '../models/index.js'
import { logCommentAction, getChanges } from '../services/audit.service.js'
import {
  parseMentions,
  sendMentionNotifications,
  notifyThreadParticipants,
} from '../services/comment.service.js'
import { sendCommentAddedEmail } from '../services/email.service.js'
import { logActivity } from '../services/activity.service.js'
import { sanitizeHTML } from '../utils/sanitize.js'
import eventEmitter from '../services/eventEmitter.service.js'
import { successResponse } from '../utils/response.js'
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js'
import logger from '../utils/logger.js'
import { recordCommentContribution } from '../services/gamification.service.js'

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉']

const buildReactionSummary = (commentReactions = [], viewerId = null) => {
  return commentReactions.map((reaction) => {
    const users = reaction.users || []
    const reacted =
      viewerId && users.some((userId) => userId?.toString() === viewerId?.toString())

    return {
      emoji: reaction.emoji,
      count: users.length,
      reacted,
      users: users.map((userId) => userId?.toString?.() || userId),
    }
  })
}

const toCommentResponse = (comment, viewerId = null) => {
  if (!comment) return null

  return {
    id: comment._id?.toString(),
    content: comment.content,
    entityType: comment.entityType,
    entityId: comment.entityId,
    user: comment.user,
    mentions: comment.mentions,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    isEdited: comment.isEdited,
    parentComment: comment.parentComment,
    threadId: comment.threadId || comment._id,
    reactions: buildReactionSummary(comment.reactions, viewerId),
    editHistory: comment.editHistory,
    resolved: comment.resolved,
    resolvedBy: comment.resolvedBy,
    resolvedAt: comment.resolvedAt,
    pinned: comment.pinned,
    pinnedBy: comment.pinnedBy,
    pinnedAt: comment.pinnedAt,
  }
}

const ensureCanManageThread = (reqUser, comment) => {
  const isAdmin = reqUser.role === 'admin'
  const isManager = reqUser.role === 'manager'
  const isOwner = comment.user.toString() === reqUser.id

  if (!isAdmin && !isManager && !isOwner) {
    throw new ForbiddenError('You do not have permission to manage this thread')
  }
}

/**
 * Comment Controller
 * HTTP request handlers for comments
 */

/**
 * Create comment
 * POST /api/stories/:storyId/comments or POST /api/tasks/:taskId/comments
 */
export const createComment = async (req, res, next) => {
  try {
    const { storyId, taskId } = req.params
    const { content, parentCommentId } = req.body

    // Determine entity type and ID
    let entityType = null
    let entityId = null
    let entity = null

    if (storyId) {
      entityType = 'story'
      entityId = storyId
      entity = await Story.findById(storyId).populate('project')
      if (!entity) {
        throw new NotFoundError('Story not found')
      }
    } else if (taskId) {
      entityType = 'task'
      entityId = taskId
      entity = await Task.findById(taskId).populate('story')
      if (!entity) {
        throw new NotFoundError('Task not found')
      }
    } else {
      throw new NotFoundError('Story ID or Task ID is required')
    }

    // Sanitize HTML content
    const sanitizedContent = sanitizeHTML(content)

    // Parse mentions
    const mentionedUserIds = await parseMentions(sanitizedContent)

    let parentComment = null
    let threadId = null

    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId)
      if (!parentComment) {
        throw new NotFoundError('Parent comment not found')
      }

      if (
        parentComment.entityType !== entityType ||
        parentComment.entityId.toString() !== entityId.toString()
      ) {
        throw new BadRequestError('Parent comment does not belong to this entity')
      }

      threadId = parentComment.threadId || parentComment._id
    }

    // Create comment
    const comment = new Comment({
      content: sanitizedContent,
      entityType,
      entityId,
      user: req.user.id,
      mentions: mentionedUserIds,
      parentComment: parentComment?._id || null,
      threadId,
    })

    await comment.save()

    if (!comment.threadId) {
      comment.threadId = comment._id
      await comment.save()
    }

    // Populate user
    await comment.populate('user', 'name email avatar role')
    await comment.populate('mentions', 'name email avatar')

    // Send mention notifications
    await sendMentionNotifications(mentionedUserIds, comment, entityType, entityId)

    // Send email to entity owner if comment added (not by owner)
    try {
      let entityOwner = null
      let entityTitle = null
      let project = null

      if (entityType === 'story') {
        entityOwner = entity.assignedTo
        entityTitle = entity.title || entity.storyId
        project = entity.project
      } else if (entityType === 'task') {
        entityOwner = entity.assignedTo
        entityTitle = entity.title
        if (entity.story) {
          const story = await Story.findById(entity.story._id || entity.story).populate('project', 'name')
          project = story?.project
        }
      }

      // Send email if entity has owner and comment is not from owner
      if (entityOwner && entityOwner.toString() !== req.user.id) {
        sendCommentAddedEmail(
          entityOwner._id || entityOwner,
          comment,
          entityType,
          entityId,
          entityTitle,
          project
        ).catch((err) => {
          logger.error('Error sending comment added email:', err)
        })
      }
    } catch (err) {
      logger.error('Error preparing comment added email:', err)
    }

    // Log activity
    await logActivity(
      'commented',
      entityType,
      entityId,
      req.user.id,
      `Comment added to ${entityType}`
    )

    await recordCommentContribution({ userId: req.user.id })

    // Notify thread participants for replies
    if (comment.parentComment) {
      await notifyThreadParticipants({
        threadId: comment.threadId,
        actorId: req.user.id,
        comment,
        entityType,
        entityId,
      })
    }

    // Emit socket event
    eventEmitter.emit('comment:added', {
      comment: comment.toObject(),
      entityType,
      entityId,
      projectId: entity.project?._id || entity.story?.project,
    })

    return successResponse(
      res,
      { comment: toCommentResponse(comment, req.user.id) },
      'Comment created successfully',
      201
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get comments for entity
 * GET /api/stories/:storyId/comments or GET /api/tasks/:taskId/comments
 */
export const getComments = async (req, res, next) => {
  try {
    const { storyId, taskId } = req.params

    // Determine entity type and ID
    let entityType = null
    let entityId = null

    if (storyId) {
      entityType = 'story'
      entityId = storyId
      const story = await Story.findById(storyId)
      if (!story) {
        throw new NotFoundError('Story not found')
      }
    } else if (taskId) {
      entityType = 'task'
      entityId = taskId
      const task = await Task.findById(taskId)
      if (!task) {
        throw new NotFoundError('Task not found')
      }
    } else {
      throw new NotFoundError('Story ID or Task ID is required')
    }

    // Get comments
    const comments = await Comment.find({ entityType, entityId })
      .populate('user', 'name email avatar role')
      .populate('mentions', 'name email avatar')
      .populate('resolvedBy', 'name email avatar')
      .populate('pinnedBy', 'name email avatar')
      .sort({ createdAt: 1 })
      .lean()

    const threadMap = new Map()

    comments.forEach((commentDoc) => {
      const threadKey = (commentDoc.threadId || commentDoc._id).toString()
      const formattedComment = toCommentResponse(commentDoc, req.user?.id)

      if (!commentDoc.parentComment) {
        threadMap.set(threadKey, {
          threadId: threadKey,
          root: formattedComment,
          replies: [],
          resolved: commentDoc.resolved,
          resolvedBy: commentDoc.resolvedBy,
          resolvedAt: commentDoc.resolvedAt,
          pinned: commentDoc.pinned,
          pinnedBy: commentDoc.pinnedBy,
          pinnedAt: commentDoc.pinnedAt,
        })
      } else {
        const existingThread = threadMap.get(threadKey) || {
          threadId: threadKey,
          root: null,
          replies: [],
          resolved: false,
          pinned: false,
        }
        existingThread.replies.push(formattedComment)
        threadMap.set(threadKey, existingThread)
      }
    })

    const threads = Array.from(threadMap.values()).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.root?.createdAt || 0) - new Date(a.root?.createdAt || 0)
    })

    return successResponse(res, { threads }, 'Comment threads retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Update comment
 * PUT /api/comments/:id
 */
export const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params
    const { content } = req.body

    // Find comment
    const comment = await Comment.findById(id)
    if (!comment) {
      throw new NotFoundError('Comment not found')
    }

    // Check if user is comment owner
    if (comment.user.toString() !== req.user.id) {
      throw new ForbiddenError('You can only edit your own comments')
    }

    // Sanitize HTML content
    const sanitizedContent = sanitizeHTML(content)

    // Track edit history
    comment.editHistory = comment.editHistory || []
    comment.editHistory.push({
      content: comment.content,
      editedAt: new Date(),
    })

    // Update comment
    comment.content = sanitizedContent
    comment.isEdited = true
    await comment.save()

    // Populate user
    await comment.populate('user', 'name email avatar role')

    // Emit socket event
    eventEmitter.emit('comment:updated', {
      comment: comment.toObject(),
      entityType: comment.entityType,
      entityId: comment.entityId,
    })

    return successResponse(
      res,
      { comment: toCommentResponse(comment, req.user.id) },
      'Comment updated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Delete comment
 * DELETE /api/comments/:id
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find comment
    const comment = await Comment.findById(id)
    if (!comment) {
      throw new NotFoundError('Comment not found')
    }

    // Check if user is comment owner or admin
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager'
    const isOwner = comment.user.toString() === req.user.id

    if (!isAdmin && !isOwner) {
      throw new ForbiddenError('You can only delete your own comments')
    }

    if (!comment.parentComment) {
      await Comment.deleteMany({ threadId: comment.threadId })
    } else {
      await Comment.findByIdAndDelete(id)
    }

    // Emit socket event
    eventEmitter.emit('comment:deleted', {
      commentId: id,
      entityType: comment.entityType,
      entityId: comment.entityId,
    })

    return successResponse(res, null, 'Comment deleted successfully')
  } catch (error) {
    next(error)
  }
}

export const addReaction = async (req, res, next) => {
  try {
    const { id } = req.params
    const { emoji } = req.body

    if (!REACTION_EMOJIS.includes(emoji)) {
      throw new BadRequestError('Invalid reaction emoji')
    }

    const comment = await Comment.findById(id).populate('user', 'name email avatar role')
    if (!comment) {
      throw new NotFoundError('Comment not found')
    }

    const reaction = comment.reactions.find((r) => r.emoji === emoji)
    if (reaction) {
      const alreadyReacted = reaction.users.some((userId) => userId.toString() === req.user.id)
      if (!alreadyReacted) {
        reaction.users.push(req.user.id)
      }
    } else {
      comment.reactions.push({
        emoji,
        users: [req.user.id],
      })
    }

    await comment.save()

    return successResponse(
      res,
      { comment: toCommentResponse(comment, req.user.id) },
      'Reaction added'
    )
  } catch (error) {
    next(error)
  }
}

export const removeReaction = async (req, res, next) => {
  try {
    const { id } = req.params
    const { emoji } = req.body

    const comment = await Comment.findById(id).populate('user', 'name email avatar role')
    if (!comment) {
      throw new NotFoundError('Comment not found')
    }

    const reaction = comment.reactions.find((r) => r.emoji === emoji)
    if (reaction) {
      reaction.users = reaction.users.filter((userId) => userId.toString() !== req.user.id)
      if (reaction.users.length === 0) {
        comment.reactions = comment.reactions.filter((r) => r.emoji !== emoji)
      }
      await comment.save()
    }

    return successResponse(
      res,
      { comment: toCommentResponse(comment, req.user.id) },
      'Reaction removed'
    )
  } catch (error) {
    next(error)
  }
}

export const getCommentHistory = async (req, res, next) => {
  try {
    const { id } = req.params
    const comment = await Comment.findById(id)
      .populate('user', 'name email avatar')
      .lean()

    if (!comment) {
      throw new NotFoundError('Comment not found')
    }

    return successResponse(res, { editHistory: comment.editHistory || [] }, 'History retrieved')
  } catch (error) {
    next(error)
  }
}

export const setThreadResolved = async (req, res, next) => {
  try {
    const { id } = req.params
    const { resolved } = req.body

    const comment = await Comment.findById(id)
    if (!comment) {
      throw new NotFoundError('Comment not found')
    }

    if (comment.parentComment) {
      throw new BadRequestError('Only thread starters can be resolved')
    }

    ensureCanManageThread(req.user, comment)

    comment.resolved = resolved
    comment.resolvedBy = resolved ? req.user.id : null
    comment.resolvedAt = resolved ? new Date() : null

    await comment.save()

    return successResponse(
      res,
      { comment: toCommentResponse(comment, req.user.id) },
      resolved ? 'Thread resolved' : 'Thread reopened'
    )
  } catch (error) {
    next(error)
  }
}

export const setCommentPinned = async (req, res, next) => {
  try {
    const { id } = req.params
    const { pinned } = req.body

    const comment = await Comment.findById(id)
    if (!comment) {
      throw new NotFoundError('Comment not found')
    }

    const isAdmin = req.user.role === 'admin'
    const isManager = req.user.role === 'manager'
    if (!isAdmin && !isManager) {
      throw new ForbiddenError('Only admins or managers can pin comments')
    }

    comment.pinned = pinned
    comment.pinnedBy = pinned ? req.user.id : null
    comment.pinnedAt = pinned ? new Date() : null

    await comment.save()

    return successResponse(
      res,
      { comment: toCommentResponse(comment, req.user.id) },
      pinned ? 'Comment pinned' : 'Comment unpinned'
    )
  } catch (error) {
    next(error)
  }
}

