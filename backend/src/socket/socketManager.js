import logger from '../utils/logger.js'

/**
 * Socket Manager
 * Central manager for socket operations
 */
class SocketManager {
  constructor() {
    this.io = null
  }

  /**
   * Initialize Socket Manager with io instance
   * @param {Object} io - Socket.IO server instance
   */
  initialize(io) {
    this.io = io
    logger.info('Socket Manager initialized')
  }

  /**
   * Emit event to project room
   * @param {string} projectId - Project ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToProject(projectId, event, data) {
    if (!this.io) {
      logger.warn('Socket.IO not initialized, cannot emit event')
      return
    }

    this.io.to(`project:${projectId}`).emit(event, data)
    logger.debug(`Emitted ${event} to project:${projectId}`)
  }

  /**
   * Emit event to sprint room
   * @param {string} sprintId - Sprint ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToSprint(sprintId, event, data) {
    if (!this.io) {
      logger.warn('Socket.IO not initialized, cannot emit event')
      return
    }

    this.io.to(`sprint:${sprintId}`).emit(event, data)
    logger.debug(`Emitted ${event} to sprint:${sprintId}`)
  }

  /**
   * Emit event to story room
   * @param {string} storyId - Story ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToStory(storyId, event, data) {
    if (!this.io) {
      logger.warn('Socket.IO not initialized, cannot emit event')
      return
    }

    this.io.to(`story:${storyId}`).emit(event, data)
    logger.debug(`Emitted ${event} to story:${storyId}`)
  }

  /**
   * Emit event to user's personal room
   * @param {string} userId - User ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToUser(userId, event, data) {
    if (!this.io) {
      logger.warn('Socket.IO not initialized, cannot emit event')
      return
    }

    this.io.to(`user:${userId}`).emit(event, data)
    logger.debug(`Emitted ${event} to user:${userId}`)
  }

  /**
   * Broadcast presence update to entity room
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Array} users - Array of user objects
   */
  broadcastPresence(entityType, entityId, users) {
    if (!this.io) {
      return
    }

    const room = `${entityType}:${entityId}`
    this.io.to(room).emit('presence:updated', {
      entityType,
      entityId,
      users,
    })
    logger.debug(`Broadcasted presence update to ${room}`)
  }

  /**
   * Emit to all connected clients
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  broadcast(event, data) {
    if (!this.io) {
      logger.warn('Socket.IO not initialized, cannot broadcast')
      return
    }

    this.io.emit(event, data)
    logger.debug(`Broadcasted ${event} to all clients`)
  }

  /**
   * Get number of connected clients
   * @returns {number} Number of connected clients
   */
  getConnectedCount() {
    if (!this.io) {
      return 0
    }

    return this.io.sockets.sockets.size
  }
}

// Export singleton instance
const socketManager = new SocketManager()
export default socketManager

