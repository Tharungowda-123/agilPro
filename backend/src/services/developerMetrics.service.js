import { User, Task, Story, Sprint } from '../models/index.js'
import logger from '../utils/logger.js'

/**
 * Developer Metrics Service
 * Automatically updates developer metrics (workload, velocity, performance) when tasks/stories are completed
 */

/**
 * Recalculate and update developer's current workload
 * @param {string} userId - User ID
 * @returns {Promise<number>} Updated current workload (story points)
 */
export const updateDeveloperWorkload = async (userId) => {
  try {
    if (!userId) return 0

    const user = await User.findById(userId)
    if (!user) {
      logger.warn(`User ${userId} not found for workload update`)
      return 0
    }

    // Get incomplete tasks assigned to user
    const incompleteTasks = await Task.find({
      assignedTo: userId,
      status: { $ne: 'done' },
    }).populate('story', 'storyPoints tasks')

    // Get incomplete stories assigned to user
    const incompleteStories = await Story.find({
      assignedTo: userId,
      status: { $ne: 'done' },
    }).select('storyPoints')

    // Calculate task points (distribute story points across tasks)
    const taskPoints = incompleteTasks.reduce((sum, task) => {
      const storyPoints = task.story?.storyPoints || 0
      const storyTasks = task.story?.tasks?.length || 1
      return sum + (storyPoints / storyTasks)
    }, 0)

    // Calculate story points
    const storyPoints = incompleteStories.reduce((sum, story) => {
      return sum + (story.storyPoints || 0)
    }, 0)

    // Total current workload
    const currentWorkload = Math.round((taskPoints + storyPoints) * 100) / 100

    // Update user
    user.currentWorkload = currentWorkload
    await user.save()

    logger.debug(`Updated workload for user ${userId}: ${currentWorkload} points`)
    return currentWorkload
  } catch (error) {
    logger.error(`Error updating developer workload for ${userId}:`, error)
    return 0
  }
}

/**
 * Recalculate and update developer's velocity
 * @param {string} userId - User ID
 * @returns {Promise<number>} Updated velocity (average story points per sprint)
 */
export const updateDeveloperVelocity = async (userId) => {
  try {
    if (!userId) return 0

    const user = await User.findById(userId)
    if (!user) {
      logger.warn(`User ${userId} not found for velocity update`)
      return 0
    }

    // Get all completed stories assigned to user
    const completedStories = await Story.find({
      assignedTo: userId,
      status: 'done',
    }).select('storyPoints completedAt sprint')

    if (completedStories.length === 0) {
      user.velocity = 0
      await user.save()
      return 0
    }

    // Get unique sprints user has worked in
    const sprintIds = [...new Set(completedStories
      .map(s => s.sprint?.toString() || s.sprint)
      .filter(Boolean)
    )]

    if (sprintIds.length === 0) {
      // Calculate velocity from completed stories (estimate 1 sprint per 2 weeks)
      const totalPoints = completedStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)
      const estimatedSprints = Math.max(1, Math.ceil(completedStories.length / 5)) // Estimate
      user.velocity = Math.round((totalPoints / estimatedSprints) * 100) / 100
      await user.save()
      return user.velocity
    }

    // Get sprints and calculate velocity per sprint
    const sprints = await Sprint.find({ _id: { $in: sprintIds } })
      .select('startDate endDate status')
      .lean()

    // Calculate points per sprint
    const sprintPoints = {}
    completedStories.forEach(story => {
      const sprintId = story.sprint?.toString() || story.sprint
      if (sprintId && sprintPoints[sprintId]) {
        sprintPoints[sprintId] += (story.storyPoints || 0)
      } else if (sprintId) {
        sprintPoints[sprintId] = (story.storyPoints || 0)
      }
    })

    // Calculate average velocity
    const velocities = Object.values(sprintPoints)
    const averageVelocity = velocities.length > 0
      ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
      : 0

    user.velocity = Math.round(averageVelocity * 100) / 100
    await user.save()

    logger.debug(`Updated velocity for user ${userId}: ${averageVelocity} points/sprint`)
    return user.velocity
  } catch (error) {
    logger.error(`Error updating developer velocity for ${userId}:`, error)
    return 0
  }
}

/**
 * Recalculate and update developer's performance metrics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated performance metrics
 */
export const updateDeveloperPerformance = async (userId) => {
  try {
    if (!userId) return null

    const user = await User.findById(userId)
    if (!user) {
      logger.warn(`User ${userId} not found for performance update`)
      return null
    }

    // Get all tasks assigned to user
    const tasks = await Task.find({ assignedTo: userId })
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'done')
    const completedCount = completedTasks.length

    // Calculate completion rate
    const completionRate = totalTasks > 0
      ? Math.round((completedCount / totalTasks) * 100 * 100) / 100
      : 0

    // Calculate on-time delivery (tasks completed before or on estimated completion)
    const tasksWithDeadlines = completedTasks.filter(t => t.estimatedHours && t.actualHours)
    let onTimeCount = 0
    tasksWithDeadlines.forEach(task => {
      // If actual hours <= estimated hours * 1.1 (10% buffer), consider on-time
      if (task.actualHours <= task.estimatedHours * 1.1) {
        onTimeCount++
      }
    })
    const onTimeDelivery = tasksWithDeadlines.length > 0
      ? Math.round((onTimeCount / tasksWithDeadlines.length) * 100 * 100) / 100
      : 50 // Default to 50% if no data

    // Calculate time accuracy (how close estimates are to actual)
    let timeAccuracy = 50 // Default
    if (tasksWithDeadlines.length > 0) {
      let totalAccuracy = 0
      tasksWithDeadlines.forEach(task => {
        const accuracy = Math.min(100, (task.estimatedHours / task.actualHours) * 100)
        totalAccuracy += accuracy
      })
      timeAccuracy = Math.round((totalAccuracy / tasksWithDeadlines.length) * 100) / 100
    }

    // Quality score (default to 80% if no reviews/feedback system)
    // This can be enhanced with actual review data later
    const qualityScore = user.qualityScore || 80

    // Update user
    user.completionRate = completionRate
    user.onTimeDelivery = onTimeDelivery
    user.timeAccuracy = timeAccuracy
    user.qualityScore = qualityScore
    await user.save()

    logger.debug(`Updated performance for user ${userId}:`, {
      completionRate,
      onTimeDelivery,
      timeAccuracy,
      qualityScore,
    })

    return {
      completionRate,
      onTimeDelivery,
      timeAccuracy,
      qualityScore,
    }
  } catch (error) {
    logger.error(`Error updating developer performance for ${userId}:`, error)
    return null
  }
}

/**
 * Update all developer metrics (workload, velocity, performance)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated metrics
 */
export const updateAllDeveloperMetrics = async (userId) => {
  try {
    const [workload, velocity, performance] = await Promise.all([
      updateDeveloperWorkload(userId),
      updateDeveloperVelocity(userId),
      updateDeveloperPerformance(userId),
    ])

    return {
      currentWorkload: workload,
      velocity,
      ...performance,
    }
  } catch (error) {
    logger.error(`Error updating all developer metrics for ${userId}:`, error)
    return null
  }
}

/**
 * Update metrics for multiple developers (batch operation)
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Promise<void>}
 */
export const updateMultipleDeveloperMetrics = async (userIds) => {
  try {
    await Promise.all(userIds.map(userId => updateAllDeveloperMetrics(userId)))
    logger.info(`Updated metrics for ${userIds.length} developers`)
  } catch (error) {
    logger.error('Error updating multiple developer metrics:', error)
  }
}

