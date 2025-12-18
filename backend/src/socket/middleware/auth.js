import { verifyToken } from '../../config/jwt.js'
import { User } from '../../models/index.js'
import logger from '../../utils/logger.js'

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token and attaches user to socket
 */
export const socketAuth = async (socket, next) => {
  try {
    // Extract token from handshake (can be in auth.token or query.token)
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1]

    if (!token) {
      logger.warn('Socket connection rejected: No token provided')
      return next(new Error('Authentication error: No token provided'))
    }

    // Verify token
    const decoded = verifyToken(token)

    // Find user
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      logger.warn(`Socket connection rejected: User not found (${decoded.id})`)
      return next(new Error('Authentication error: User not found'))
    }

    if (!user.isActive) {
      logger.warn(`Socket connection rejected: User inactive (${decoded.id})`)
      return next(new Error('Authentication error: Account is deactivated'))
    }

    // Attach user to socket
    socket.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    }

    logger.info(`Socket authenticated: ${socket.user.email} (${socket.id})`)
    next()
  } catch (error) {
    logger.error('Socket authentication error:', error)
    next(new Error('Authentication error: Invalid token'))
  }
}

