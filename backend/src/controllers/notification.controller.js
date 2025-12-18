import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from '../services/notification.service.js'
import { Notification } from '../models/index.js'
import { successResponse, paginatedResponse } from '../utils/response.js'
import { NotFoundError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * Notification Controller
 * HTTP request handlers for notifications
 */

/**
 * Get notifications for current user
 * GET /api/notifications
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query

    const result = await getUserNotifications(req.user.id, {
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      page,
      limit,
    })

    return paginatedResponse(
      res,
      result.notifications,
      result.pagination,
      'Notifications retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params

    const notification = await markAsRead(id, req.user.id)

    return successResponse(res, { notification: notification.toObject() }, 'Notification marked as read')
  } catch (error) {
    if (error.message === 'Notification not found') {
      return next(new NotFoundError('Notification not found'))
    }
    next(error)
  }
}

/**
 * Mark all notifications as read
 * PUT /api/notifications/mark-all-read
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const count = await markAllAsRead(req.user.id)

    return successResponse(res, { count }, `${count} notifications marked as read`)
  } catch (error) {
    next(error)
  }
}

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find notification
    const notification = await Notification.findOne({
      _id: id,
      user: req.user.id,
    })

    if (!notification) {
      throw new NotFoundError('Notification not found')
    }

    // Delete notification
    await Notification.findByIdAndDelete(id)

    return successResponse(res, null, 'Notification deleted successfully')
  } catch (error) {
    next(error)
  }
}

