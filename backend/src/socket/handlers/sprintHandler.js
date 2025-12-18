import eventEmitter from '../../services/eventEmitter.service.js'
import socketManager from '../socketManager.js'
import logger from '../../utils/logger.js'

/**
 * Sprint Handler
 * Listens to sprint events and emits to relevant rooms
 */
export const handleSprintEvents = () => {
  /**
   * Sprint started
   */
  eventEmitter.on('sprint:started', (data) => {
    const { sprint } = data

    if (sprint?.project) {
      socketManager.emitToProject(sprint.project.toString(), 'sprint:started', { sprint })
    }

    if (sprint?._id) {
      socketManager.emitToSprint(sprint._id.toString(), 'sprint:started', { sprint })
    }
  })

  /**
   * Sprint completed
   */
  eventEmitter.on('sprint:completed', (data) => {
    const { sprint, sprintId, sprintName, projectId, velocity, status } = data
    const projectIdStr = projectId || sprint?.project?._id?.toString() || sprint?.project?.toString()
    const sprintIdStr = sprintId || sprint?._id?.toString()

    // Emit with all necessary data for frontend updates
    const eventData = {
      sprint: sprint || data.sprint,
      sprintId: sprintIdStr,
      sprintName: sprintName || sprint?.name,
      projectId: projectIdStr,
      velocity: velocity || sprint?.velocity,
      status: status || sprint?.status || 'completed',
    }

    if (projectIdStr) {
      socketManager.emitToProject(projectIdStr, 'sprint:completed', eventData)
    }

    if (sprintIdStr) {
      socketManager.emitToSprint(sprintIdStr, 'sprint:completed', eventData)
    }

    // Also emit globally for sprints list updates
    socketManager.emitToAll('sprint:completed', eventData)
  })

  /**
   * Sprint velocity updated
   */
  eventEmitter.on('sprint:velocity-updated', (data) => {
    const { sprintId, velocity, projectId } = data

    if (projectId) {
      socketManager.emitToProject(projectId.toString(), 'sprint:velocity-updated', {
        sprintId,
        velocity,
      })
    }

    if (sprintId) {
      socketManager.emitToSprint(sprintId.toString(), 'sprint:velocity-updated', {
        sprintId,
        velocity,
      })
    }
  })

  /**
   * Sprint burndown updated
   */
  eventEmitter.on('sprint:burndown-updated', (data) => {
    const { sprintId, burndownData, projectId } = data

    if (projectId) {
      socketManager.emitToProject(projectId.toString(), 'sprint:burndown-updated', {
        sprintId,
        burndownData,
      })
    }

    if (sprintId) {
      socketManager.emitToSprint(sprintId.toString(), 'sprint:burndown-updated', {
        sprintId,
        burndownData,
      })
    }
  })

  /**
   * Sprint created
   */
  eventEmitter.on('sprint:created', (data) => {
    const { sprint } = data

    if (sprint?.project) {
      socketManager.emitToProject(sprint.project.toString(), 'sprint:created', { sprint })
    }
  })

  /**
   * Sprint updated
   */
  eventEmitter.on('sprint:updated', (data) => {
    const { sprint } = data

    if (sprint?.project) {
      socketManager.emitToProject(sprint.project.toString(), 'sprint:updated', { sprint })
    }

    if (sprint?._id) {
      socketManager.emitToSprint(sprint._id.toString(), 'sprint:updated', { sprint })
    }
  })

  /**
   * Stories assigned to sprint
   */
  eventEmitter.on('sprint:stories-assigned', (data) => {
    const { sprintId, storyIds, projectId } = data

    if (projectId) {
      socketManager.emitToProject(projectId.toString(), 'sprint:stories-assigned', {
        sprintId,
        storyIds,
      })
    }

    if (sprintId) {
      socketManager.emitToSprint(sprintId.toString(), 'sprint:stories-assigned', {
        sprintId,
        storyIds,
      })
    }
  })

  logger.info('Sprint event handlers registered')
}

