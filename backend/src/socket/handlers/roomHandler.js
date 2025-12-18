import logger from '../../utils/logger.js'

/**
 * Room Handler
 * Handles joining and leaving rooms
 */
export const handleRooms = (socket) => {
  const user = socket.user

  /**
   * Join project room
   */
  socket.on('join-project', (data) => {
    const { projectId } = data

    if (!projectId) {
      socket.emit('error', { message: 'Project ID is required' })
      return
    }

    socket.join(`project:${projectId}`)
    logger.debug(`User ${user.id} joined project room: project:${projectId}`)

    socket.emit('joined-project', { projectId })
  })

  /**
   * Leave project room
   */
  socket.on('leave-project', (data) => {
    const { projectId } = data

    if (projectId) {
      socket.leave(`project:${projectId}`)
      logger.debug(`User ${user.id} left project room: project:${projectId}`)
      socket.emit('left-project', { projectId })
    }
  })

  /**
   * Join sprint room
   */
  socket.on('join-sprint', (data) => {
    const { sprintId } = data

    if (!sprintId) {
      socket.emit('error', { message: 'Sprint ID is required' })
      return
    }

    socket.join(`sprint:${sprintId}`)
    logger.debug(`User ${user.id} joined sprint room: sprint:${sprintId}`)

    socket.emit('joined-sprint', { sprintId })
  })

  /**
   * Leave sprint room
   */
  socket.on('leave-sprint', (data) => {
    const { sprintId } = data

    if (sprintId) {
      socket.leave(`sprint:${sprintId}`)
      logger.debug(`User ${user.id} left sprint room: sprint:${sprintId}`)
      socket.emit('left-sprint', { sprintId })
    }
  })

  /**
   * Join story room
   */
  socket.on('join-story', (data) => {
    const { storyId } = data

    if (!storyId) {
      socket.emit('error', { message: 'Story ID is required' })
      return
    }

    socket.join(`story:${storyId}`)
    logger.debug(`User ${user.id} joined story room: story:${storyId}`)

    socket.emit('joined-story', { storyId })
  })

  /**
   * Leave story room
   */
  socket.on('leave-story', (data) => {
    const { storyId } = data

    if (storyId) {
      socket.leave(`story:${storyId}`)
      logger.debug(`User ${user.id} left story room: story:${storyId}`)
      socket.emit('left-story', { storyId })
    }
  })
}

