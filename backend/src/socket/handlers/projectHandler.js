import eventEmitter from '../../services/eventEmitter.service.js'
import socketManager from '../socketManager.js'
import logger from '../../utils/logger.js'

/**
 * Project Handler
 * Listens to project events and emits to relevant rooms
 */
export const handleProjectEvents = () => {
  /**
   * Project created
   */
  eventEmitter.on('project:created', (data) => {
    const { project } = data

    // Broadcast to all clients (new project available)
    socketManager.broadcast('project:created', { project })
  })

  /**
   * Project updated
   */
  eventEmitter.on('project:updated', (data) => {
    const { project } = data

    if (project?._id) {
      socketManager.emitToProject(project._id.toString(), 'project:updated', { project })
    }
  })

  /**
   * Project deleted
   */
  eventEmitter.on('project:deleted', (data) => {
    const { projectId } = data

    if (projectId) {
      socketManager.emitToProject(projectId.toString(), 'project:deleted', { projectId })
      // Also broadcast to all
      socketManager.broadcast('project:deleted', { projectId })
    }
  })

  logger.info('Project event handlers registered')
}

