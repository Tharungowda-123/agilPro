import eventEmitter from '../../services/eventEmitter.service.js'
import socketManager from '../socketManager.js'
import logger from '../../utils/logger.js'

/**
 * Notification Handler
 * Handles notification events
 */
export const handleNotificationEvents = () => {
  /**
   * New notification created
   */
  eventEmitter.on('notification:created', (data) => {
    const { notification } = data

    if (notification?.user) {
      // Emit to user's personal room
      socketManager.emitToUser(notification.user.toString(), 'notification:new', {
        notification,
      })
    }
  })

  /**
   * Notification read
   */
  eventEmitter.on('notification:read', (data) => {
    const { notificationId, userId } = data

    if (userId) {
      socketManager.emitToUser(userId.toString(), 'notification:read', {
        notificationId,
      })
    }
  })

  /**
   * All notifications read
   */
  eventEmitter.on('notifications:all-read', (data) => {
    const { userId } = data

    if (userId) {
      socketManager.emitToUser(userId.toString(), 'notifications:all-read', {})
    }
  })

  logger.info('Notification event handlers registered')
}

