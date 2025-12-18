import { Sprint, Story } from '../models/index.js'
import { NotFoundError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * Sprint Service
 * Business logic for sprints
 */

/**
 * Calculate burndown chart data
 * @param {Object} sprint - Sprint object
 * @returns {Array} Burndown data array
 */
export const calculateBurndown = async (sprint) => {
  try {
    if (!sprint.startDate || !sprint.endDate) {
      return []
    }

    const startDate = new Date(sprint.startDate)
    const endDate = new Date(sprint.endDate)
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) // days

    if (duration <= 0) {
      return []
    }

    // Get all stories for the sprint
    const stories = await Story.find({ sprint: sprint._id })

    // Calculate initial committed points
    const initialPoints = sprint.committedPoints || stories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)

    // Generate ideal burndown line
    const idealBurndown = generateIdealBurndown(initialPoints, duration)

    // Calculate actual burndown from stories
    const actualBurndown = []
    const currentDate = new Date(startDate)

    for (let day = 0; day <= duration; day++) {
      const date = new Date(currentDate)
      date.setDate(date.getDate() + day)

      // Calculate remaining points at this date
      // Stories that are 'done' are considered completed
      const completedStories = stories.filter((story) => {
        if (story.status !== 'done') return false
        // Check if story was completed before or on this date
        return story.updatedAt && new Date(story.updatedAt) <= date
      })

      const completedPoints = completedStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)
      const remainingPoints = Math.max(0, initialPoints - completedPoints)

      actualBurndown.push({
        date: date.toISOString(),
        remainingPoints,
        idealPoints: idealBurndown[day] || 0,
      })
    }

    return actualBurndown
  } catch (error) {
    logger.error('Error calculating burndown:', error)
    throw error
  }
}

/**
 * Generate ideal burndown line
 * @param {number} capacity - Total story points
 * @param {number} duration - Sprint duration in days
 * @returns {Array} Ideal points for each day
 */
export const generateIdealBurndown = (capacity, duration) => {
  if (duration <= 0) {
    return [capacity]
  }

  const idealPoints = []
  const pointsPerDay = capacity / duration

  for (let day = 0; day <= duration; day++) {
    const ideal = Math.max(0, capacity - pointsPerDay * day)
    idealPoints.push(Math.round(ideal * 100) / 100)
  }

  return idealPoints
}

/**
 * Calculate sprint velocity (completed story points)
 * @param {Object} sprint - Sprint object
 * @returns {Promise<number>} Velocity (completed points)
 */
export const calculateVelocity = async (sprint) => {
  try {
    // Get all stories for the sprint
    const stories = await Story.find({ sprint: sprint._id })

    // Calculate completed points (stories with status 'done')
    const completedPoints = stories
      .filter((story) => story.status === 'done')
      .reduce((sum, story) => sum + (story.storyPoints || 0), 0)

    return completedPoints
  } catch (error) {
    logger.error('Error calculating sprint velocity:', error)
    throw error
  }
}

/**
 * Recalculate and update sprint velocity
 * Call this when stories are completed to keep velocity up-to-date
 * @param {string} sprintId - Sprint ID
 * @returns {Promise<number>} Updated velocity
 */
export const updateSprintVelocity = async (sprintId) => {
  try {
    const sprint = await Sprint.findById(sprintId)
    if (!sprint) {
      logger.warn(`Sprint ${sprintId} not found for velocity update`)
      return 0
    }

    const velocity = await calculateVelocity(sprint)
    sprint.velocity = velocity
    sprint.completedPoints = velocity
    await sprint.save()

    logger.debug(`Updated velocity for sprint ${sprintId}: ${velocity} points`)
    return velocity
  } catch (error) {
    logger.error(`Error updating sprint velocity for ${sprintId}:`, error)
    return 0
  }
}

/**
 * Get next sprint number for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<number>} Next sprint number
 */
export const getNextSprintNumber = async (projectId) => {
  try {
    const lastSprint = await Sprint.findOne({ project: projectId })
      .sort({ sprintNumber: -1 })
      .select('sprintNumber')

    if (!lastSprint || !lastSprint.sprintNumber) {
      return 1
    }

    return lastSprint.sprintNumber + 1
  } catch (error) {
    logger.error('Error getting next sprint number:', error)
    return 1
  }
}

