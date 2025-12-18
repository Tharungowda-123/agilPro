import logger from '../utils/logger.js'

const socketHandler = (socket, io) => {
  logger.info(`Client connected: ${socket.id}`)

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })

  // Add your socket event handlers here
  socket.on('join-room', (roomId) => {
    socket.join(roomId)
    logger.info(`Socket ${socket.id} joined room ${roomId}`)
  })

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId)
    logger.info(`Socket ${socket.id} left room ${roomId}`)
  })
}

export default socketHandler

