import eventEmitter from '../../services/eventEmitter.service.js'
import socketManager from '../socketManager.js'
import logger from '../../utils/logger.js'

/**
 * Feature Handler
 * Listens to feature events and emits to relevant rooms
 */
export const handleFeatureEvents = () => {
  /**
   * Feature created
   */
  eventEmitter.on('feature:created', (data) => {
    const { feature } = data

    if (feature?.project) {
      socketManager.emitToProject(feature.project.toString(), 'feature:created', { feature })
    }
  })

  /**
   * Feature updated
   */
  eventEmitter.on('feature:updated', (data) => {
    const { feature } = data

    if (feature?.project) {
      socketManager.emitToProject(feature.project.toString(), 'feature:updated', { feature })
    }
  })

  /**
   * Feature deleted
   */
  eventEmitter.on('feature:deleted', (data) => {
    const { featureId, projectId } = data

    if (projectId) {
      socketManager.emitToProject(projectId.toString(), 'feature:deleted', { featureId })
    }
  })

  /**
   * Feature broken down into stories
   */
  eventEmitter.on('feature:broken-down', (data) => {
    const { featureId, stories, projectId } = data

    if (projectId) {
      socketManager.emitToProject(projectId.toString(), 'feature:broken-down', {
        featureId,
        stories,
      })
    }
  })

  logger.info('Feature event handlers registered')
}

