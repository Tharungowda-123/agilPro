import eventEmitter from '../../services/eventEmitter.service.js'
import socketManager from '../socketManager.js'
import logger from '../../utils/logger.js'

/**
 * Task Handler
 * Listens to task events and emits to relevant rooms
 */
export const handleTaskEvents = () => {
  /**
   * Task created
   */
  eventEmitter.on('task:created', (data) => {
    const { task, story } = data

    // Emit to story room
    if (story?.project) {
      socketManager.emitToProject(story.project.toString(), 'task:created', { task })
    }

    if (story?._id) {
      socketManager.emitToStory(story._id.toString(), 'task:created', { task })
    }

    if (story?.sprint) {
      socketManager.emitToSprint(story.sprint.toString(), 'task:created', { task })
    }
  })

  /**
   * Task updated
   */
  eventEmitter.on('task:updated', (data) => {
    const { task, story } = data

    if (story?.project) {
      socketManager.emitToProject(story.project.toString(), 'task:updated', { task })
    }

    if (story?._id) {
      socketManager.emitToStory(story._id.toString(), 'task:updated', { task })
    }

    if (story?.sprint) {
      socketManager.emitToSprint(story.sprint.toString(), 'task:updated', { task })
    }
  })

  /**
   * Task assigned
   */
  eventEmitter.on('task:assigned', (data) => {
    const { task, assignee, story } = data

    // Emit to assignee's personal room
    if (task.assignedTo) {
      socketManager.emitToUser(task.assignedTo.toString(), 'task:assigned', {
        task,
        assignee,
      })
    }

    // Emit to project room
    if (story?.project) {
      socketManager.emitToProject(story.project.toString(), 'task:assigned', {
        task,
        assignee,
      })
    }

    if (story?._id) {
      socketManager.emitToStory(story._id.toString(), 'task:assigned', { task, assignee })
    }
  })

  /**
   * Task status changed
   */
  eventEmitter.on('task:status-changed', (data) => {
    const { task, story, oldStatus, newStatus } = data

    if (story?.project) {
      socketManager.emitToProject(story.project.toString(), 'task:status-changed', {
        task,
        oldStatus,
        newStatus,
      })
    }

    if (story?._id) {
      socketManager.emitToStory(story._id.toString(), 'task:status-changed', {
        task,
        oldStatus,
        newStatus,
      })
    }

    if (story?.sprint) {
      socketManager.emitToSprint(story.sprint.toString(), 'task:status-changed', {
        task,
        oldStatus,
        newStatus,
      })
    }
  })

  /**
   * Task completed
   */
  eventEmitter.on('task:completed', (data) => {
    const { task, story } = data

    if (story?.project) {
      socketManager.emitToProject(story.project.toString(), 'task:completed', { task })
    }

    if (story?._id) {
      socketManager.emitToStory(story._id.toString(), 'task:completed', { task })
    }

    if (story?.sprint) {
      socketManager.emitToSprint(story.sprint.toString(), 'task:completed', { task })
    }
  })

  /**
   * Task deleted
   */
  eventEmitter.on('task:deleted', (data) => {
    const { taskId, story } = data

    if (story?.project) {
      socketManager.emitToProject(story.project.toString(), 'task:deleted', { taskId })
    }

    if (story?._id) {
      socketManager.emitToStory(story._id.toString(), 'task:deleted', { taskId })
    }
  })

  logger.info('Task event handlers registered')
}

