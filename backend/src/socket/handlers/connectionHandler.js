import logger from '../../utils/logger.js'
import { removeUserFromAll } from '../../services/presence.service.js'
import socketManager from '../socketManager.js'

/**
 * Connection Handler
 * Handles socket connection and disconnection
 */
export const handleConnection = (socket) => {
  const user = socket.user

  logger.info(`User connected: ${user.name} (${user.email}) - Socket: ${socket.id}`)

  // Join user's personal room for notifications
  socket.join(`user:${user.id}`)
  logger.debug(`User ${user.id} joined personal room: user:${user.id}`)

  // Send welcome message
  socket.emit('connected', {
    message: 'Connected to real-time server',
    userId: user.id,
    socketId: socket.id,
  })

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    logger.info(`User disconnected: ${user.name} (${user.email}) - Reason: ${reason}`)

    // Remove user from all presence tracking
    removeUserFromAll(user.id)

    // Notify relevant rooms that user left
    socket.broadcast.emit('user:disconnected', {
      userId: user.id,
      name: user.name,
    })
  })

  // Handle errors
  socket.on('error', (error) => {
    logger.error(`Socket error for user ${user.id}:`, error)
  })
}

