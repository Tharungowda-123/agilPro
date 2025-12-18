import { User, Task, Story, Sprint } from '../models/index.js'
import logger from '../utils/logger.js'

/**
 * User Service
 * Business logic for user operations
 */

/**
 * Calculate user performance metrics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Performance metrics
 */
export const calculateUserPerformance = async (userId) => {
  try {
    // Get user with stored metrics
    const user = await User.findById(userId).select('currentWorkload velocity completionRate onTimeDelivery qualityScore timeAccuracy')
    
    // Get all tasks assigned to user
    const tasks = await Task.find({ assignedTo: userId })

    // Get all stories assigned to user
    const stories = await Story.find({ assignedTo: userId })

    // Calculate metrics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === 'done').length
    const totalStories = stories.length
    const completedStories = stories.filter((s) => s.status === 'done').length

    // Calculate total story points
    const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)
    const completedPoints = stories
      .filter((s) => s.status === 'done')
      .reduce((sum, s) => sum + (s.storyPoints || 0), 0)

    // Calculate average time (from tasks with actual hours)
    const tasksWithHours = tasks.filter((t) => t.actualHours && t.status === 'done')
    const avgTime =
      tasksWithHours.length > 0
        ? tasksWithHours.reduce((sum, t) => sum + t.actualHours, 0) / tasksWithHours.length
        : 0

    // Calculate completion rate
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    const storyCompletionRate = totalStories > 0 ? (completedStories / totalStories) * 100 : 0

    // Get sprints user participated in
    const userSprints = await Sprint.find({
      'stories': { $in: stories.map((s) => s._id) },
    }).distinct('_id')

    return {
      totalTasks,
      completedTasks,
      totalStories,
      completedStories,
      totalPoints,
      completedPoints,
      avgTime: Math.round(avgTime * 100) / 100,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
      storyCompletionRate: Math.round(storyCompletionRate * 100) / 100,
      sprintsParticipated: userSprints.length,
      // Include stored metrics
      currentWorkload: user?.currentWorkload || 0,
      velocity: user?.velocity || 0,
      completionRate: user?.completionRate || 0,
      onTimeDelivery: user?.onTimeDelivery || 0,
      qualityScore: user?.qualityScore || 0,
      timeAccuracy: user?.timeAccuracy || 0,
    }
  } catch (error) {
    logger.error('Error calculating user performance:', error)
    throw error
  }
}

/**
 * Get current workload (assigned incomplete tasks/stories)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Workload data
 */
export const getCurrentWorkload = async (userId) => {
  try {
    // Get incomplete tasks
    const incompleteTasks = await Task.find({
      assignedTo: userId,
      status: { $ne: 'done' },
    }).populate('story', 'title storyId')

    // Get incomplete stories
    const incompleteStories = await Story.find({
      assignedTo: userId,
      status: { $ne: 'done' },
    }).select('title storyId storyPoints status')

    // Calculate total story points
    const taskPoints = incompleteTasks.reduce((sum, t) => {
      return sum + (t.story?.storyPoints || 0) / (t.story?.tasks?.length || 1)
    }, 0)

    const storyPoints = incompleteStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)

    const totalPoints = Math.round((taskPoints + storyPoints) * 100) / 100

    // Get estimated hours
    const estimatedHours = incompleteTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)

    return {
      tasks: incompleteTasks.map((t) => ({
        id: t._id,
        title: t.title,
        status: t.status,
        estimatedHours: t.estimatedHours,
        story: t.story,
      })),
      stories: incompleteStories.map((s) => ({
        id: s._id,
        title: s.title,
        storyId: s.storyId,
        storyPoints: s.storyPoints,
        status: s.status,
      })),
      totalPoints,
      estimatedHours,
      taskCount: incompleteTasks.length,
      storyCount: incompleteStories.length,
    }
  } catch (error) {
    logger.error('Error getting user workload:', error)
    throw error
  }
}

/**
 * Get available users for assignment
 * @param {string} teamId - Team ID
 * @param {Array<string>} requiredSkills - Required skills
 * @returns {Promise<Array>} Available users
 */
export const getAvailableUsers = async (teamId, requiredSkills = []) => {
  try {
    // Build query
    const query = { isActive: true }

    if (teamId) {
      query.team = teamId
    }

    // Get users
    let users = await User.find(query).select('name email avatar skills availability team')

    // Filter by skills if provided
    if (requiredSkills.length > 0) {
      users = users.filter((user) => {
        const userSkills = user.skills || []
        return requiredSkills.some((skill) =>
          userSkills.some((us) => us.toLowerCase().includes(skill.toLowerCase()))
        )
      })
    }

    // Calculate availability for each user
    const usersWithAvailability = await Promise.all(
      users.map(async (user) => {
        const workload = await getCurrentWorkload(user._id.toString())
        const availablePoints = Math.max(0, (user.availability || 0) - workload.totalPoints)

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          skills: user.skills,
          totalAvailability: user.availability || 0,
          currentWorkload: workload.totalPoints,
          availablePoints,
          availabilityPercentage:
            user.availability > 0
              ? Math.round((availablePoints / user.availability) * 100)
              : 0,
        }
      })
    )

    // Sort by availability (most available first)
    return usersWithAvailability.sort((a, b) => b.availablePoints - a.availablePoints)
  } catch (error) {
    logger.error('Error getting available users:', error)
    throw error
  }
}

/**
 * Calculate effective capacity considering adjustments
 * @param {Object} user - User object
 * @param {Date} sprintStartDate - Sprint start date
 * @param {Date} sprintEndDate - Sprint end date
 * @returns {number} Effective capacity for the sprint period
 */
export const calculateEffectiveCapacity = (user, sprintStartDate, sprintEndDate) => {
  let effectiveCapacity = user.availability || 0

  if (!user.capacityAdjustments || user.capacityAdjustments.length === 0) {
    return effectiveCapacity
  }

  // Check for overlapping adjustments
  const activeAdjustments = user.capacityAdjustments.filter((adjustment) => {
    const adjStart = new Date(adjustment.startDate)
    const adjEnd = new Date(adjustment.endDate)
    const sprintStart = new Date(sprintStartDate)
    const sprintEnd = new Date(sprintEndDate)

    // Check if adjustment overlaps with sprint period
    return adjStart <= sprintEnd && adjEnd >= sprintStart
  })

  if (activeAdjustments.length === 0) {
    return effectiveCapacity
  }

  // Calculate total days in sprint
  const sprintDays = Math.ceil(
    (new Date(sprintEndDate) - new Date(sprintStartDate)) / (1000 * 60 * 60 * 24)
  )

  // Calculate adjusted capacity based on overlapping days
  let totalAdjustedDays = 0
  activeAdjustments.forEach((adjustment) => {
    const adjStart = new Date(adjustment.startDate)
    const adjEnd = new Date(adjustment.endDate)
    const sprintStart = new Date(sprintStartDate)
    const sprintEnd = new Date(sprintEndDate)

    // Calculate overlap days
    const overlapStart = adjStart > sprintStart ? adjStart : sprintStart
    const overlapEnd = adjEnd < sprintEnd ? adjEnd : sprintEnd
    const overlapDays = Math.max(
      0,
      Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24))
    )

    // If adjusted capacity is 0, reduce by full overlap
    // If adjusted capacity is > 0, reduce proportionally
    if (adjustment.adjustedCapacity === 0) {
      totalAdjustedDays += overlapDays
    } else {
      const reductionRatio = 1 - adjustment.adjustedCapacity / effectiveCapacity
      totalAdjustedDays += overlapDays * reductionRatio
    }
  })

  // Calculate effective capacity
  const reductionRatio = totalAdjustedDays / sprintDays
  effectiveCapacity = effectiveCapacity * (1 - reductionRatio)

  return Math.max(0, Math.round(effectiveCapacity * 100) / 100)
}

