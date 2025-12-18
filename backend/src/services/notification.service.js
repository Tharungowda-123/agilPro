import { Notification } from '../models/index.js'
import eventEmitter from './eventEmitter.service.js'
import logger from '../utils/logger.js'

/**
 * Notification Service
 * Handles notification creation and management
 */

/**
 * Create notification
 * @param {string} userId - User ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} entityType - Entity type (optional)
 * @param {string} entityId - Entity ID (optional)
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (
  userId,
  type,
  title,
  message,
  entityType = null,
  entityId = null
) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      entityType,
      entityId,
    })

    await notification.save()

    // Emit socket event
    eventEmitter.emit('notification:created', { notification: notification.toObject() })

    return notification
  } catch (error) {
    logger.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Get notifications for user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Notifications and pagination
 */
export const getUserNotifications = async (userId, options = {}) => {
  try {
    const { isRead, page = 1, limit = 20 } = options

    // Build query
    const query = { user: userId }

    if (isRead !== undefined) {
      query.isRead = isRead
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const limitNum = parseInt(limit)

    // Execute query
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(query),
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum)

    return {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    }
  } catch (error) {
    logger.error('Error getting user notifications:', error)
    throw error
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated notification
 */
export const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    })

    if (!notification) {
      throw new Error('Notification not found')
    }

    notification.isRead = true
    await notification.save()

    // Emit event
    eventEmitter.emit('notification:read', {
      notificationId,
      userId,
    })

    return notification
  } catch (error) {
    logger.error('Error marking notification as read:', error)
    throw error
  }
}

/**
 * Mark all notifications as read
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of notifications updated
 */
export const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    )

    // Emit event
    eventEmitter.emit('notifications:all-read', { userId })

    return result.modifiedCount
  } catch (error) {
    logger.error('Error marking all notifications as read:', error)
    throw error
  }
}

