import { addUser, removeUser, getUsers } from '../../services/presence.service.js'
import socketManager from '../socketManager.js'
import logger from '../../utils/logger.js'

/**
 * Collaboration Handler
 * Handles presence tracking and collaboration features
 */
export const handleCollaboration = (socket) => {
  const user = socket.user

  /**
   * User is viewing an entity
   */
  socket.on('user:viewing', (data) => {
    const { entityType, entityId } = data

    if (!entityType || !entityId) {
      socket.emit('error', { message: 'Entity type and ID are required' })
      return
    }

    // Add user to presence
    addUser(entityType, entityId, user.id)

    // Join entity room
    socket.join(`${entityType}:${entityId}`)

    // Get all users viewing this entity
    const viewingUsers = getUsers(entityType, entityId)

    // Broadcast presence update
    socketManager.broadcastPresence(entityType, entityId, viewingUsers)

    logger.debug(`User ${user.id} is viewing ${entityType}:${entityId}`)
  })

  /**
   * User stopped viewing an entity
   */
  socket.on('user:stopped-viewing', (data) => {
    const { entityType, entityId } = data

    if (entityType && entityId) {
      // Remove user from presence
      removeUser(entityType, entityId, user.id)

      // Leave entity room
      socket.leave(`${entityType}:${entityId}`)

      // Get remaining users
      const viewingUsers = getUsers(entityType, entityId)

      // Broadcast presence update
      socketManager.broadcastPresence(entityType, entityId, viewingUsers)

      logger.debug(`User ${user.id} stopped viewing ${entityType}:${entityId}`)
    }
  })

  /**
   * User is typing (for comments/chat)
   */
  socket.on('user:typing', (data) => {
    const { entityType, entityId } = data

    if (entityType && entityId) {
      // Broadcast to entity room (except sender)
      socket.to(`${entityType}:${entityId}`).emit('user:typing', {
        userId: user.id,
        userName: user.name,
        entityType,
        entityId,
      })
    }
  })

  /**
   * User stopped typing
   */
  socket.on('user:stopped-typing', (data) => {
    const { entityType, entityId } = data

    if (entityType && entityId) {
      socket.to(`${entityType}:${entityId}`).emit('user:stopped-typing', {
        userId: user.id,
        entityType,
        entityId,
      })
    }
  })
}

