import eventEmitter from '../../services/eventEmitter.service.js'
import socketManager from '../socketManager.js'
import logger from '../../utils/logger.js'

/**
 * Story Handler
 * Listens to story events and emits to relevant rooms
 */
export const handleStoryEvents = () => {
  /**
   * Story created
   */
  eventEmitter.on('story:created', (data) => {
    const { story } = data

    if (story?.project) {
      socketManager.emitToProject(story.project.toString(), 'story:created', { story })
    }

    if (story?.sprint) {
      socketManager.emitToSprint(story.sprint.toString(), 'story:created', { story })
    }

    if (story?.feature) {
      // Emit to feature room if exists
      socketManager.emitToProject(story.project.toString(), 'feature:story-added', {
        featureId: story.feature,
        story,
      })
    }
  })

  /**
   * Story updated
   */
  eventEmitter.on('story:updated', (data) => {
    const { story } = data

    if (story?.project) {
      socketManager.emitToProject(story.project.toString(), 'story:updated', { story })
    }

    if (story?.sprint) {
      socketManager.emitToSprint(story.sprint.toString(), 'story:updated', { story })
    }

    if (story?._id) {
      socketManager.emitToStory(story._id.toString(), 'story:updated', { story })
    }
  })

  /**
   * Story moved (sprint changed)
   */
  eventEmitter.on('story:moved', (data) => {
    const { story, oldSprintId, newSprintId } = data

    // Emit to old sprint room
    if (oldSprintId) {
      socketManager.emitToSprint(oldSprintId.toString(), 'story:removed', {
        storyId: story._id,
        story,
      })
    }

    // Emit to new sprint room
    if (newSprintId) {
      socketManager.emitToSprint(newSprintId.toString(), 'story:added', { story })
    }

    // Emit to project room
    if (story?.project) {
      socketManager.emitToProject(story.project.toString(), 'story:moved', {
        story,
        oldSprintId,
        newSprintId,
      })
    }
  })

  /**
   * Story AI analyzed
   */
  eventEmitter.on('story:ai-analyzed', (data) => {
    const { storyId, story, aiInsights } = data

    if (story?.project) {
      socketManager.emitToProject(story.project.toString(), 'story:ai-analyzed', {
        storyId,
        aiInsights,
      })
    }

    if (story?._id) {
      socketManager.emitToStory(story._id.toString(), 'story:ai-analyzed', {
        storyId,
        aiInsights,
      })
    }
  })

  /**
   * Story deleted
   */
  eventEmitter.on('story:deleted', (data) => {
    const { storyId, projectId, sprintId } = data

    if (projectId) {
      socketManager.emitToProject(projectId.toString(), 'story:deleted', { storyId })
    }

    if (sprintId) {
      socketManager.emitToSprint(sprintId.toString(), 'story:deleted', { storyId })
    }
  })

  logger.info('Story event handlers registered')
}

