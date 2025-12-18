import { User, Task, Story, Sprint, Project } from '../models/index.js'
import { getCurrentWorkload, calculateEffectiveCapacity } from './user.service.js'
import logger from '../utils/logger.js'

/**
 * Workload Service
 * Business logic for personal workload and capacity visualization
 */

/**
 * Get comprehensive workload data for a developer
 * @param {string} userId - User ID
 * @param {string} sprintId - Optional sprint ID for sprint-specific workload
 * @returns {Promise<Object>} Comprehensive workload data
 */
export const getDeveloperWorkload = async (userId, sprintId = null) => {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get user capacity
    const capacity = user.availability || 40 // Default 40 story points per sprint

    // Use stored currentWorkload if available, otherwise calculate
    let currentWorkloadStored = user.currentWorkload || 0
    
    // Get current workload (calculated - for verification)
    const workload = await getCurrentWorkload(userId)

    // Get tasks and stories with full details
    const tasks = await Task.find({
      assignedTo: userId,
      status: { $ne: 'done' },
    })
      .populate('story', 'title storyId storyPoints project priority status')
      .populate({
        path: 'story',
        populate: {
          path: 'project',
          select: 'name',
        },
      })

    const stories = await Story.find({
      assignedTo: userId,
      status: { $ne: 'done' },
    })
      .populate('project', 'name')
      .select('title storyId storyPoints status priority project')

    // Filter by sprint if specified
    let sprintTasks = tasks
    let sprintStories = stories

    if (sprintId) {
      const sprint = await Sprint.findById(sprintId).populate('stories', '_id')
      if (sprint && sprint.stories) {
        const sprintStoryIds = sprint.stories.map((s) => s._id.toString())
        sprintTasks = tasks.filter((t) => {
          const storyId = t.story?._id?.toString() || t.story?.toString()
          return storyId && sprintStoryIds.includes(storyId)
        })
        sprintStories = stories.filter((s) => {
          const storyId = s._id.toString()
          return sprintStoryIds.includes(storyId)
        })
      }
    }

    // Calculate story points for sprint-specific workload
    const taskPoints = sprintTasks.reduce((sum, t) => {
      const storyPoints = t.story?.storyPoints || 0
      const storyTasks = t.story?.tasks?.length || 1
      return sum + storyPoints / storyTasks
    }, 0)

    const storyPoints = sprintStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)
    const calculatedPoints = Math.round((taskPoints + storyPoints) * 100) / 100
    
    // Use stored value for overall workload, calculated for sprint-specific
    const assignedPoints = sprintId ? calculatedPoints : (currentWorkloadStored > 0 ? currentWorkloadStored : calculatedPoints)

    // Calculate utilization
    const utilization = capacity > 0 ? Math.round((assignedPoints / capacity) * 100) : 0
    const availablePoints = Math.max(0, capacity - assignedPoints)
    const isOverloaded = assignedPoints > capacity
    const isUnderutilized = utilization < 60

    // Breakdown by status
    // Tasks: 'todo', 'in-progress', 'done'
    // Stories: 'backlog', 'ready', 'in-progress', 'review', 'done'
    const byStatus = {
      todo: {
        tasks: sprintTasks.filter((t) => t.status === 'todo' || !t.status).length,
        stories: sprintStories.filter((s) => s.status === 'backlog' || s.status === 'ready' || !s.status).length,
        points: 0,
      },
      'in-progress': {
        tasks: sprintTasks.filter((t) => t.status === 'in-progress').length,
        stories: sprintStories.filter((s) => s.status === 'in-progress').length,
        points: 0,
      },
      review: {
        tasks: sprintTasks.filter((t) => t.status === 'review').length,
        stories: sprintStories.filter((s) => s.status === 'review').length,
        points: 0,
      },
    }

    // Calculate points by status
    sprintTasks.forEach((t) => {
      const storyPoints = t.story?.storyPoints || 0
      const storyTasks = t.story?.tasks?.length || 1
      const points = storyPoints / storyTasks
      let status = 'todo'
      if (t.status === 'in-progress') {
        status = 'in-progress'
      } else if (t.status === 'review') {
        status = 'review'
      }
      byStatus[status].points += points
    })

    sprintStories.forEach((s) => {
      let status = 'todo'
      if (s.status === 'in-progress') {
        status = 'in-progress'
      } else if (s.status === 'review') {
        status = 'review'
      } else {
        // backlog, ready, or undefined -> todo
        status = 'todo'
      }
      byStatus[status].points += s.storyPoints || 0
    })

    // Breakdown by priority
    const byPriority = {
      high: { tasks: 0, stories: 0, points: 0 },
      medium: { tasks: 0, stories: 0, points: 0 },
      low: { tasks: 0, stories: 0, points: 0 },
    }

    sprintTasks.forEach((t) => {
      const priority = t.priority || t.story?.priority || 'medium'
      const storyPoints = t.story?.storyPoints || 0
      const storyTasks = t.story?.tasks?.length || 1
      const points = storyPoints / storyTasks
      byPriority[priority].tasks += 1
      byPriority[priority].points += points
    })

    sprintStories.forEach((s) => {
      const priority = s.priority || 'medium'
      byPriority[priority].stories += 1
      byPriority[priority].points += s.storyPoints || 0
    })

    // Breakdown by project
    const byProject = {}
    sprintTasks.forEach((t) => {
      const project = t.story?.project
      if (project) {
        const projectId = project._id?.toString() || project.toString()
        const projectName = project.name || 'Unknown'
        if (!byProject[projectId]) {
          byProject[projectId] = { name: projectName, tasks: 0, stories: 0, points: 0 }
        }
        byProject[projectId].tasks += 1
        const storyPoints = t.story?.storyPoints || 0
        const storyTasks = t.story?.tasks?.length || 1
        byProject[projectId].points += storyPoints / storyTasks
      }
    })

    sprintStories.forEach((s) => {
      const project = s.project
      if (project) {
        const projectId = project._id?.toString() || project.toString()
        const projectName = project.name || 'Unknown'
        if (!byProject[projectId]) {
          byProject[projectId] = { name: projectName, tasks: 0, stories: 0, points: 0 }
        }
        byProject[projectId].stories += 1
        byProject[projectId].points += s.storyPoints || 0
      }
    })

    // Get current sprint if not specified
    let currentSprint = null
    if (!sprintId) {
      const userTeamId = user.team?._id || user.team
      if (userTeamId) {
        const projects = await Project.find({ team: userTeamId }).select('_id')
        currentSprint = await Sprint.findOne({
          project: { $in: projects.map((p) => p._id) },
          status: 'active',
        })
          .sort({ startDate: -1 })
          .select('name startDate endDate')
      }
    }

    // Calculate effective capacity if sprint exists
    let effectiveCapacity = capacity
    if (currentSprint || sprintId) {
      const sprint = sprintId ? await Sprint.findById(sprintId) : currentSprint
      if (sprint && sprint.startDate && sprint.endDate) {
        effectiveCapacity = calculateEffectiveCapacity(user, sprint.startDate, sprint.endDate)
      }
    }

    return {
      capacity: effectiveCapacity,
      assignedPoints,
      utilization,
      availablePoints,
      isOverloaded,
      isUnderutilized,
      breakdown: {
        byStatus,
        byPriority,
        byProject: Object.values(byProject),
      },
      tasks: sprintTasks.map((t) => ({
        id: t._id,
        title: t.title,
        status: t.status,
        priority: t.priority || t.story?.priority || 'medium',
        storyPoints: t.story?.storyPoints || 0,
        story: t.story,
      })),
      stories: sprintStories.map((s) => ({
        id: s._id,
        title: s.title,
        storyId: s.storyId,
        storyPoints: s.storyPoints,
        status: s.status,
        priority: s.priority || 'medium',
        project: s.project,
      })),
      sprint: currentSprint
        ? {
            id: currentSprint._id,
            name: currentSprint.name,
            startDate: currentSprint.startDate,
            endDate: currentSprint.endDate,
          }
        : null,
    }
  } catch (error) {
    logger.error('Error getting developer workload:', error)
    throw error
  }
}

/**
 * Get historical workload data
 * @param {string} userId - User ID
 * @param {number} limit - Number of weeks to include
 * @returns {Promise<Array>} Historical workload data
 */
export const getHistoricalWorkload = async (userId, limit = 8) => {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const capacity = user.availability || 40

    // Get completed sprints
    const userTeamId = user.team?._id || user.team
    const projects = userTeamId ? await Project.find({ team: userTeamId }).select('_id') : []
    const projectIds = projects.map((p) => p._id)

    const sprints = await Sprint.find({
      project: { $in: projectIds },
      status: 'completed',
    })
      .sort({ endDate: -1 })
      .limit(limit)
      .select('name startDate endDate stories')

    // For each sprint, calculate workload
    const historicalData = await Promise.all(
      sprints.map(async (sprint) => {
        // Get stories assigned to user in this sprint
        const sprintStories = await Story.find({
          _id: { $in: sprint.stories },
          assignedTo: userId,
        }).select('storyPoints status')

        // Get tasks assigned to user from these stories
        const sprintTasks = await Task.find({
          story: { $in: sprint.stories },
          assignedTo: userId,
        })
          .populate('story', 'storyPoints')
          .select('status story')

        // Calculate assigned points
        const taskPoints = sprintTasks.reduce((sum, t) => {
          const storyPoints = t.story?.storyPoints || 0
          const storyTasks = t.story?.tasks?.length || 1
          return sum + storyPoints / storyTasks
        }, 0)

        const storyPoints = sprintStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)
        const assignedPoints = Math.round((taskPoints + storyPoints) * 100) / 100

        // Calculate effective capacity for that sprint
        let effectiveCapacity = capacity
        if (sprint.startDate && sprint.endDate) {
          effectiveCapacity = calculateEffectiveCapacity(user, sprint.startDate, sprint.endDate)
        }

        const utilization = effectiveCapacity > 0
          ? Math.round((assignedPoints / effectiveCapacity) * 100)
          : 0

        return {
          sprintId: sprint._id,
          sprintName: sprint.name,
          week: sprint.endDate,
          capacity: effectiveCapacity,
          assigned: assignedPoints,
          utilization,
        }
      })
    )

    return historicalData.reverse() // Return in chronological order
  } catch (error) {
    logger.error('Error getting historical workload:', error)
    throw error
  }
}

/**
 * Get suggested tasks based on remaining capacity
 * @param {string} userId - User ID
 * @param {number} maxSuggestions - Maximum number of suggestions
 * @returns {Promise<Array>} Suggested tasks
 */
export const getSuggestedTasks = async (userId, maxSuggestions = 5) => {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get workload to calculate available capacity
    const workloadData = await getDeveloperWorkload(userId)
    const availablePoints = workloadData.availablePoints

    if (availablePoints <= 0) {
      return []
    }

    // Get user's team
    const userTeamId = user.team?._id || user.team
    if (!userTeamId) {
      return []
    }

    // Get active projects for user's team
    const projects = await Project.find({ team: userTeamId, isArchived: false }).select('_id')
    const projectIds = projects.map((p) => p._id)

    // Get active sprint
    const sprint = await Sprint.findOne({
      project: { $in: projectIds },
      status: 'active',
    })
      .sort({ startDate: -1 })
      .select('stories')

    if (!sprint || !sprint.stories || sprint.stories.length === 0) {
      return []
    }

    // Get unassigned stories from active sprint
    const unassignedStories = await Story.find({
      _id: { $in: sprint.stories },
      assignedTo: { $exists: false },
      status: { $ne: 'done' },
    })
      .populate('project', 'name')
      .select('title storyId storyPoints priority status project')
      .sort({ priority: -1, storyPoints: 1 }) // High priority, low points first
      .limit(maxSuggestions * 2) // Get more to filter by capacity

    // Filter by available capacity
    const suggestions = []
    let totalPoints = 0

    for (const story of unassignedStories) {
      if (totalPoints + story.storyPoints <= availablePoints && suggestions.length < maxSuggestions) {
        suggestions.push({
          id: story._id,
          title: story.title,
          storyId: story.storyId,
          storyPoints: story.storyPoints,
          priority: story.priority || 'medium',
          project: story.project,
        })
        totalPoints += story.storyPoints
      }
    }

    return suggestions
  } catch (error) {
    logger.error('Error getting suggested tasks:', error)
    throw error
  }
}

