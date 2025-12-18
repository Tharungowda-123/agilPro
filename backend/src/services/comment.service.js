import { User, Notification, Story, Task, Project, Comment } from '../models/index.js'
import { sendMentionEmail, sendCommentAddedEmail } from './email.service.js'
import eventEmitter from './eventEmitter.service.js'
import logger from '../utils/logger.js'

/**
 * Comment Service
 * Handles comment-related business logic
 */

/**
 * Parse @mentions from content
 * @param {string} content - Comment content
 * @returns {Promise<Array<string>>} Array of user IDs mentioned
 */
export const parseMentions = async (content) => {
  try {
    // Regex to find @mentions (format: @username or @email)
    const mentionRegex = /@(\w+@?\w*\.?\w*)/g
    const matches = content.match(mentionRegex)

    if (!matches || matches.length === 0) {
      return []
    }

    // Extract usernames/emails (remove @ symbol)
    const identifiers = matches.map((match) => match.substring(1))

    // Find users by email or name
    const users = await User.find({
      $or: [
        { email: { $in: identifiers } },
        { name: { $in: identifiers } },
      ],
    }).select('_id')

    return users.map((user) => user._id.toString())
  } catch (error) {
    logger.error('Error parsing mentions:', error)
    return []
  }
}

/**
 * Send mention notifications
 * @param {Array<string>} mentionedUserIds - Array of mentioned user IDs
 * @param {Object} comment - Comment object
 * @param {string} entityType - Entity type (story or task)
 * @param {string} entityId - Entity ID
 */
export const sendMentionNotifications = async (mentionedUserIds, comment, entityType, entityId) => {
  try {
    if (!mentionedUserIds || mentionedUserIds.length === 0) {
      return
    }

    const commentUser = await User.findById(comment.user).select('name email')

    for (const userId of mentionedUserIds) {
      try {
        // Skip if user mentioned themselves
        if (userId === comment.user.toString()) {
          continue
        }

        await Notification.create({
          user: userId,
          type: 'mention',
          title: 'You were mentioned',
          message: `${commentUser.name} mentioned you in a comment`,
          entityType,
          entityId,
        })

        // Send email notification (async, don't wait)
        try {
          let entity = null
          let project = null
          let entityTitle = null

          if (entityType === 'story') {
            entity = await Story.findById(entityId).populate('project', 'name')
            project = entity?.project
            entityTitle = entity?.title || entity?.storyId
          } else if (entityType === 'task') {
            entity = await Task.findById(entityId).populate('story', 'title project').populate({
              path: 'story',
              populate: { path: 'project', select: 'name' },
            })
            project = entity?.story?.project
            entityTitle = entity?.title
          }

          sendMentionEmail(
            userId,
            commentUser,
            comment,
            entityType,
            entityId,
            entityTitle
          ).catch((err) => {
            logger.error('Error sending mention email:', err)
          })
        } catch (err) {
          logger.error('Error preparing mention email:', err)
        }

        // Emit notification event
        eventEmitter.emit('notification:created', {
          notification: {
            user: userId,
            type: 'mention',
            title: 'You were mentioned',
            message: `${commentUser.name} mentioned you in a comment`,
          },
        })
      } catch (error) {
        logger.error(`Error creating mention notification for user ${userId}:`, error)
      }
    }
  } catch (error) {
    logger.error('Error sending mention notifications:', error)
  }
}

export const notifyThreadParticipants = async ({
  threadId,
  actorId,
  comment,
  entityType,
  entityId,
}) => {
  try {
    if (!threadId) return

    const participants = await Comment.distinct('user', {
      threadId,
    })

    const recipientIds = participants.filter(
      (participantId) => participantId.toString() !== actorId.toString()
    )

    if (recipientIds.length === 0) {
      return
    }

    const actor = await User.findById(actorId).select('name')

    for (const userId of recipientIds) {
      await Notification.create({
        user: userId,
        type: 'comment_thread',
        title: 'New reply in thread',
        message: `${actor?.name || 'Someone'} replied in a comment thread you follow`,
        entityType,
        entityId,
        metadata: {
          threadId,
          commentId: comment._id,
        },
      })

      eventEmitter.emit('notification:created', {
        notification: {
          user: userId,
          type: 'comment_thread',
          title: 'New reply in thread',
          message: `${actor?.name || 'Someone'} replied in a comment thread you follow`,
        },
      })
    }
  } catch (error) {
    logger.error('Error notifying thread participants:', error)
  }
}

