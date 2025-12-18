import { Project, Story, Sprint, Team, Activity } from '../models/index.js'
import { NotFoundError, ForbiddenError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * Project Service
 * Business logic for projects
 */

/**
 * Generate unique project key from name
 * @param {string} name - Project name
 * @returns {Promise<string>} Unique project key
 */
export const generateProjectKey = async (name) => {
  // Extract uppercase letters and numbers from name
  let key = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 10)

  if (!key) {
    key = 'PROJ'
  }

  // Check if key exists, append number if needed
  let uniqueKey = key
  let counter = 1

  while (await Project.findOne({ key: uniqueKey })) {
    uniqueKey = `${key}${counter}`
    counter++
  }

  return uniqueKey
}

/**
 * Calculate project progress percentage
 * @param {string} projectId - Project ID
 * @returns {Promise<number>} Progress percentage (0-100)
 */
export const calculateProjectProgress = async (projectId) => {
  try {
    const project = await Project.findById(projectId)
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    // Get all stories for the project
    const stories = await Story.find({ project: projectId })

    if (stories.length === 0) {
      return 0
    }

    // Count completed stories (status: 'done')
    const completedStories = stories.filter((story) => story.status === 'done').length

    // Calculate progress percentage
    const progress = (completedStories / stories.length) * 100

    return Math.round(progress * 100) / 100 // Round to 2 decimal places
  } catch (error) {
    logger.error('Error calculating project progress:', error)
    throw error
  }
}

/**
 * Update and save project progress
 * Recalculates progress and updates the project document
 * @param {string} projectId - Project ID
 * @returns {Promise<number>} Updated progress percentage (0-100)
 */
export const updateProjectProgress = async (projectId) => {
  try {
    const project = await Project.findById(projectId)
    if (!project) {
      logger.warn(`Project ${projectId} not found for progress update`)
      return 0
    }

    const progress = await calculateProjectProgress(projectId)
    project.progress = progress
    await project.save()

    logger.debug(`Updated progress for project ${projectId}: ${progress}%`)
    return progress
  } catch (error) {
    logger.error(`Error updating project progress for ${projectId}:`, error)
    return 0
  }
}

/**
 * Get project velocity (average velocity from completed sprints)
 * @param {string} projectId - Project ID
 * @returns {Promise<number>} Average velocity
 */
export const getProjectVelocity = async (projectId) => {
  try {
    const completedSprints = await Sprint.find({
      project: projectId,
      status: 'completed',
      velocity: { $gt: 0 },
    }).select('velocity')

    if (completedSprints.length === 0) {
      return 0
    }

    // Calculate average velocity
    const totalVelocity = completedSprints.reduce((sum, sprint) => sum + sprint.velocity, 0)
    const averageVelocity = totalVelocity / completedSprints.length

    return Math.round(averageVelocity * 100) / 100 // Round to 2 decimal places
  } catch (error) {
    logger.error('Error calculating project velocity:', error)
    throw error
  }
}

/**
 * Check if user is authorized to access/modify project
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @returns {Promise<boolean>} True if user is authorized
 */
export const isUserAuthorized = async (userId, projectId) => {
  try {
    const project = await Project.findById(projectId).populate('team')

    if (!project) {
      return false
    }

    // Check if user is project creator
    if (project.createdBy.toString() === userId) {
      return true
    }

    // Check if user is in the project's team
    if (project.team && project.team.members) {
      const teamMembers = project.team.members.map((member) => member.toString())
      if (teamMembers.includes(userId)) {
        return true
      }
    }

    return false
  } catch (error) {
    logger.error('Error checking user authorization:', error)
    return false
  }
}

/**
 * Create activity log
 * @param {Object} activityData - Activity data
 * @returns {Promise<Object>} Created activity
 */
export const createActivity = async (activityData) => {
  try {
    // Import activity service to avoid circular dependency
    const { logActivity } = await import('./activity.service.js')
    return await logActivity(
      activityData.type,
      activityData.entityType,
      activityData.entityId,
      activityData.user,
      activityData.description,
      activityData.metadata
    )
  } catch (error) {
    logger.error('Error creating activity:', error)
    // Don't throw error, just log it (activity logging shouldn't break the flow)
    return null
  }
}

/**
 * Get project metrics
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Project metrics
 */
export const getProjectMetrics = async (projectId) => {
  try {
    const project = await Project.findById(projectId)
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    // Get all stories for the project
    const stories = await Story.find({ project: projectId })

    // Calculate total story points
    const totalStoryPoints = stories.reduce((sum, story) => sum + (story.storyPoints || 0), 0)

    // Calculate completed story points
    const completedStoryPoints = stories
      .filter((story) => story.status === 'done')
      .reduce((sum, story) => sum + (story.storyPoints || 0), 0)

    // Aggregate stories by status
    const storiesByStatus = {
      backlog: stories.filter((s) => s.status === 'backlog').length,
      ready: stories.filter((s) => s.status === 'ready').length,
      'in-progress': stories.filter((s) => s.status === 'in-progress').length,
      review: stories.filter((s) => s.status === 'review').length,
      done: stories.filter((s) => s.status === 'done').length,
    }

    // Get project velocity
    const velocity = await getProjectVelocity(projectId)

    // Calculate completion rate
    const completionRate =
      totalStoryPoints > 0 ? (completedStoryPoints / totalStoryPoints) * 100 : 0

    // Get sprints count
    const sprintsCount = await Sprint.countDocuments({ project: projectId })
    const activeSprintsCount = await Sprint.countDocuments({
      project: projectId,
      status: 'active',
    })
    const completedSprintsCount = await Sprint.countDocuments({
      project: projectId,
      status: 'completed',
    })

    return {
      totalStories: stories.length,
      totalStoryPoints,
      completedStoryPoints,
      remainingStoryPoints: totalStoryPoints - completedStoryPoints,
      storiesByStatus,
      velocity,
      completionRate: Math.round(completionRate * 100) / 100,
      sprintsCount,
      activeSprintsCount,
      completedSprintsCount,
    }
  } catch (error) {
    logger.error('Error getting project metrics:', error)
    throw error
  }
}

/**
 * Get team performance for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Team performance data
 */
export const getTeamPerformance = async (projectId) => {
  try {
    const project = await Project.findById(projectId).populate('team')
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    if (!project.team) {
      return []
    }

    // Get team members
    const team = await Team.findById(project.team._id).populate('members')
    if (!team || !team.members) {
      return []
    }

    // Get all stories for the project
    const stories = await Story.find({ project: projectId })

    // Calculate performance for each team member
    const performanceData = await Promise.all(
      team.members.map(async (member) => {
        // Get stories assigned to this member
        const memberStories = stories.filter(
          (story) => story.assignedTo && story.assignedTo.toString() === member._id.toString()
        )

        // Calculate metrics
        const totalStories = memberStories.length
        const completedStories = memberStories.filter((s) => s.status === 'done').length
        const totalPoints = memberStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)
        const completedPoints = memberStories
          .filter((s) => s.status === 'done')
          .reduce((sum, s) => sum + (s.storyPoints || 0), 0)

        const completionRate = totalStories > 0 ? (completedStories / totalStories) * 100 : 0

        return {
          userId: member._id,
          name: member.name,
          email: member.email,
          avatar: member.avatar,
          totalStories,
          completedStories,
          totalPoints,
          completedPoints,
          completionRate: Math.round(completionRate * 100) / 100,
        }
      })
    )

    return performanceData
  } catch (error) {
    logger.error('Error getting team performance:', error)
    throw error
  }
}

