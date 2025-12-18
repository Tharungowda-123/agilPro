import eventEmitter from '../../services/eventEmitter.service.js'
import socketManager from '../socketManager.js'
import { Notification } from '../../models/index.js'
import logger from '../../utils/logger.js'

/**
 * Comment Handler
 * Handles comment events and notifications
 */
export const handleCommentEvents = () => {
  /**
   * Comment added
   */
  eventEmitter.on('comment:added', async (data) => {
    const { comment, entityType, entityId, projectId } = data

    // Emit to entity room
    socketManager.emitToStory(entityId.toString(), 'comment:added', { comment })

    // Emit to project room
    if (projectId) {
      socketManager.emitToProject(projectId.toString(), 'comment:added', {
        comment,
        entityType,
        entityId,
      })
    }

    // Send notifications to mentioned users
    if (comment.mentions && comment.mentions.length > 0) {
      for (const userId of comment.mentions) {
        try {
          await Notification.create({
            user: userId,
            type: 'mention',
            title: 'You were mentioned',
            message: `${comment.user.name} mentioned you in a comment`,
            entityType,
            entityId,
          })

          // Emit notification to user
          socketManager.emitToUser(userId.toString(), 'notification:new', {
            type: 'mention',
            message: `${comment.user.name} mentioned you in a comment`,
          })
        } catch (error) {
          logger.error('Error creating mention notification:', error)
        }
      }
    }
  })

  /**
   * Comment updated
   */
  eventEmitter.on('comment:updated', (data) => {
    const { comment, entityType, entityId, projectId } = data

    socketManager.emitToStory(entityId.toString(), 'comment:updated', { comment })

    if (projectId) {
      socketManager.emitToProject(projectId.toString(), 'comment:updated', {
        comment,
        entityType,
        entityId,
      })
    }
  })

  /**
   * Comment deleted
   */
  eventEmitter.on('comment:deleted', (data) => {
    const { commentId, entityType, entityId, projectId } = data

    socketManager.emitToStory(entityId.toString(), 'comment:deleted', { commentId })

    if (projectId) {
      socketManager.emitToProject(projectId.toString(), 'comment:deleted', {
        commentId,
        entityType,
        entityId,
      })
    }
  })

  logger.info('Comment event handlers registered')
}

