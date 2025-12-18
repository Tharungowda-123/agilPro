import express from 'express'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../controllers/notification.controller.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * Notification Routes
 * All notification endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// GET /api/notifications - Get notifications for current user
router.get('/', getNotifications)

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', markNotificationAsRead)

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', markAllNotificationsAsRead)

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', deleteNotification)

export default router

