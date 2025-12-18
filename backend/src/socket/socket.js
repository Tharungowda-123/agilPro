import { Server } from 'socket.io'
import { socketAuth } from './middleware/auth.js'
import { handleConnection } from './handlers/connectionHandler.js'
import { handleRooms } from './handlers/roomHandler.js'
import { handleCollaboration } from './handlers/collaborationHandler.js'
import { handleTaskEvents } from './handlers/taskHandler.js'
import { handleStoryEvents } from './handlers/storyHandler.js'
import { handleSprintEvents } from './handlers/sprintHandler.js'
import { handleCommentEvents } from './handlers/commentHandler.js'
import { handleNotificationEvents } from './handlers/notificationHandler.js'
import { handleProjectEvents } from './handlers/projectHandler.js'
import { handleFeatureEvents } from './handlers/featureHandler.js'
import socketManager from './socketManager.js'
import logger from '../utils/logger.js'

/**
 * Socket.IO Server Setup
 * Initializes Socket.IO with authentication and event handlers
 */

let io = null

/**
 * Initialize Socket.IO
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
export const initializeSocket = (httpServer) => {
  // Initialize Socket.IO
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Initialize Socket Manager
  socketManager.initialize(io)

  // Authentication middleware
  io.use(socketAuth)

  // Connection handler
  io.on('connection', (socket) => {
    // Handle connection
    handleConnection(socket)

    // Handle rooms
    handleRooms(socket)

    // Handle collaboration
    handleCollaboration(socket)
  })

  // Register event handlers
  handleProjectEvents()
  handleFeatureEvents()
  handleTaskEvents()
  handleStoryEvents()
  handleSprintEvents()
  handleCommentEvents()
  handleNotificationEvents()

  logger.info('Socket.IO server initialized')

  return io
}

/**
 * Get Socket.IO instance
 * @returns {Object} Socket.IO server instance
 */
export const getIO = () => {
  return io
}

export default { initializeSocket, getIO }

