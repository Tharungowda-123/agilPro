import axiosInstance from './api/axiosConfig'

/**
 * Notification Service
 * Handles notification-related API calls
 */
export const notificationService = {
  /**
   * Get notification icon based on type
   */
  getNotificationIcon: (type) => {
    const iconMap = {
      task_assigned: '✓',
      mention: '@',
      story_updated: '📖',
      sprint_started: '🏃',
      risk_detected: '⚠️',
      ai_recommendation: '✨',
      deadline_reminder: '⏰',
      comment_added: '💬',
      task_completed: '✅',
      project_created: '📁',
    }
    return iconMap[type] || '🔔'
  },

  /**
   * Get all notifications
   * @returns {Promise} Array of notifications
   */
  getNotifications: async (params = {}) => {
    const response = await axiosInstance.get('/notifications', { params })
    const notifications = response.data.data || response.data.notifications || response.data || []
    // Transform to match frontend format
    return {
      data: notifications.map((n) => ({
        id: n._id || n.id,
        type: n.type,
        message: n.message || n.content || `${n.type} notification`,
        userId: n.user?._id || n.user || n.userId,
        read: n.read || false,
        timestamp: n.createdAt || n.timestamp,
        url: n.url || n.link || null,
        icon: n.icon || notificationService.getNotificationIcon(n.type),
      })),
    }
  },

  /**
   * Mark notification as read
   * @param {string} id - Notification ID
   * @returns {Promise}
   */
  markAsRead: async (id) => {
    const response = await axiosInstance.put(`/notifications/${id}/read`)
    return response.data
  },

  /**
   * Mark all notifications as read
   * @returns {Promise}
   */
  markAllAsRead: async () => {
    const response = await axiosInstance.put('/notifications/mark-all-read')
    return response.data
  },

  /**
   * Delete notification
   * @param {string} id - Notification ID
   * @returns {Promise}
   */
  deleteNotification: async (id) => {
    const response = await axiosInstance.delete(`/notifications/${id}`)
    return response.data
  },
}

export default notificationService
