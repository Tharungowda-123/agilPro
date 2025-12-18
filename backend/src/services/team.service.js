import { Team, User, Sprint, Story, Task, WorkloadRebalance, TeamCalendarEvent } from '../models/index.js'
import { logActivity } from './activity.service.js'
import { logTeamAction } from './audit.service.js'
import logger from '../utils/logger.js'
import { BadRequestError } from '../utils/errors.js'

/**
 * Team Service
 * Business logic for team operations
 */

/**
 * Calculate team capacity (sum of member availabilities)
 * @param {string} teamId - Team ID
 * @returns {Promise<number>} Total capacity
 */
export const getTeamCapacity = async (teamId) => {
  try {
    const team = await Team.findById(teamId).populate('members', 'availability')

    if (!team) {
      throw new Error('Team not found')
    }

    // Sum member availabilities
    const capacity = team.members.reduce((sum, member) => {
      return sum + (member.availability || 0)
    }, 0)

    return capacity
  } catch (error) {
    logger.error('Error calculating team capacity:', error)
    throw error
  }
}

/**
 * Calculate team velocity (average from completed sprints)
 * @param {string} teamId - Team ID
 * @returns {Promise<number>} Average velocity
 */
export const getTeamVelocity = async (teamId) => {
  try {
    // Get projects for this team
    const { Project } = await import('../models/index.js')
    const projects = await Project.find({ team: teamId }).select('_id')

    if (projects.length === 0) {
      return 0
    }

    // Get completed sprints for these projects
    const completedSprints = await Sprint.find({
      project: { $in: projects.map((p) => p._id) },
      status: 'completed',
      velocity: { $gt: 0 },
    }).select('velocity')

    if (completedSprints.length === 0) {
      return 0
    }

    // Calculate average velocity
    const totalVelocity = completedSprints.reduce((sum, sprint) => sum + sprint.velocity, 0)
    const averageVelocity = totalVelocity / completedSprints.length

    return Math.round(averageVelocity * 100) / 100
  } catch (error) {
    logger.error('Error calculating team velocity:', error)
    throw error
  }
}

/**
 * Get team performance metrics
 * @param {string} teamId - Team ID
 * @returns {Promise<Object>} Performance metrics
 */
export const getTeamPerformance = async (teamId) => {
  try {
    const team = await Team.findById(teamId).populate('members', 'name email avatar availability')

    if (!team) {
      throw new Error('Team not found')
    }

    // Get projects for this team
    const { Project } = await import('../models/index.js')
    const projects = await Project.find({ team: teamId }).select('_id')

    // Get all stories for team projects
    const stories = await Story.find({
      project: { $in: projects.map((p) => p._id) },
    })

    // Calculate team metrics
    const totalStories = stories.length
    const completedStories = stories.filter((s) => s.status === 'done').length
    const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)
    const completedPoints = stories
      .filter((s) => s.status === 'done')
      .reduce((sum, s) => sum + (s.storyPoints || 0), 0)

    // Get velocity
    const velocity = await getTeamVelocity(teamId)

    // Calculate member performance
    const memberPerformance = await Promise.all(
      team.members.map(async (member) => {
        const memberStories = stories.filter(
          (s) => s.assignedTo && s.assignedTo.toString() === member._id.toString()
        )

        const memberCompleted = memberStories.filter((s) => s.status === 'done').length
        const memberPoints = memberStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)
        const memberCompletedPoints = memberStories
          .filter((s) => s.status === 'done')
          .reduce((sum, s) => sum + (s.storyPoints || 0), 0)

        return {
          userId: member._id,
          name: member.name,
          email: member.email,
          avatar: member.avatar,
          totalStories: memberStories.length,
          completedStories: memberCompleted,
          totalPoints: memberPoints,
          completedPoints: memberCompletedPoints,
          completionRate:
            memberStories.length > 0 ? (memberCompleted / memberStories.length) * 100 : 0,
        }
      })
    )

    return {
      teamId: team._id,
      teamName: team.name,
      memberCount: team.members.length,
      totalStories,
      completedStories,
      totalPoints,
      completedPoints,
      velocity,
      completionRate: totalStories > 0 ? (completedStories / totalStories) * 100 : 0,
      memberPerformance,
    }
  } catch (error) {
    logger.error('Error getting team performance:', error)
    throw error
  }
}

/**
 * Get team capacity planning data
 * @param {string} teamId - Team ID
 * @param {string} sprintId - Optional sprint ID for specific sprint planning
 * @returns {Promise<Object>} Capacity planning data
 */
export const getTeamCapacityPlanning = async (teamId, sprintId = null) => {
  try {
    const team = await Team.findById(teamId).populate('members', 'name email avatar availability capacityAdjustments')

    if (!team) {
      throw new Error('Team not found')
    }

    let sprint = null
    let sprintStartDate = null
    let sprintEndDate = null

    if (sprintId) {
      sprint = await Sprint.findById(sprintId)
      if (sprint) {
        sprintStartDate = sprint.startDate
        sprintEndDate = sprint.endDate
      }
    }

    // Get current sprint if no sprint specified
    if (!sprint) {
      const { Project } = await import('../models/index.js')
      const projects = await Project.find({ team: teamId }).select('_id')
      sprint = await Sprint.findOne({
        project: { $in: projects.map((p) => p._id) },
        status: 'active',
      }).sort({ startDate: -1 })

      if (sprint) {
        sprintStartDate = sprint.startDate
        sprintEndDate = sprint.endDate
      }
    }

    const planningWindowStart = sprintStartDate ? new Date(sprintStartDate) : new Date()
    const planningWindowEnd = sprintEndDate
      ? new Date(sprintEndDate)
      : new Date(planningWindowStart.getTime() + 14 * 24 * 60 * 60 * 1000)

    const calendarEvents = await TeamCalendarEvent.find({
      team: teamId,
      startDate: { $lte: planningWindowEnd },
      endDate: { $gte: planningWindowStart },
      status: { $ne: 'cancelled' },
    }).lean()

    const windowDurationDays = Math.max(
      1,
      Math.ceil((planningWindowEnd - planningWindowStart) / (1000 * 60 * 60 * 24))
    )

    const calculateCalendarMultiplier = (memberId) => {
      const relevantEvents = calendarEvents.filter(
        (event) =>
          event.scope === 'team' ||
          (event.user && event.user.toString() === memberId.toString())
      )

      if (relevantEvents.length === 0) {
        return 1
      }

      let impactAccumulator = 0
      relevantEvents.forEach((event) => {
        const eventStart = new Date(event.startDate)
        const eventEnd = new Date(event.endDate)
        const overlapStart = eventStart > planningWindowStart ? eventStart : planningWindowStart
        const overlapEnd = eventEnd < planningWindowEnd ? eventEnd : planningWindowEnd
        const overlapDays = Math.max(
          0,
          Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24))
        )

        if (overlapDays <= 0) {
          return
        }

        const capacityLoss = (event.capacityImpact || 100) / 100
        impactAccumulator += capacityLoss * (overlapDays / windowDurationDays)
      })

      impactAccumulator = Math.min(1, impactAccumulator)
      return 1 - impactAccumulator
    }

    // Calculate capacity and workload for each member
    const { getCurrentWorkload, calculateEffectiveCapacity } = await import('./user.service.js')
    const { Task, Story } = await import('../models/index.js')

    const memberCapacityData = await Promise.all(
      team.members.map(async (member) => {
        const workload = await getCurrentWorkload(member._id.toString())
        
        // Calculate effective capacity
        let effectiveCapacity = member.availability || 0
        if (sprintStartDate && sprintEndDate) {
          effectiveCapacity = calculateEffectiveCapacity(member, sprintStartDate, sprintEndDate)
        }

        const calendarMultiplier = calculateCalendarMultiplier(member._id)
        effectiveCapacity = Math.max(0, effectiveCapacity * calendarMultiplier)

        // Get tasks assigned to member
        const tasks = await Task.find({
          assignedTo: member._id,
          status: { $ne: 'done' },
        })
          .populate('story', 'title storyId storyPoints')
          .select('title status estimatedHours story')

        // Get stories assigned to member
        const stories = await Story.find({
          assignedTo: member._id,
          status: { $ne: 'done' },
        }).select('title storyId storyPoints status')

        const utilization = effectiveCapacity > 0
          ? Math.round((workload.totalPoints / effectiveCapacity) * 100)
          : 0

        const isOverloaded = workload.totalPoints > effectiveCapacity
        const availablePoints = Math.max(0, effectiveCapacity - workload.totalPoints)

        return {
          userId: member._id,
          name: member.name,
          email: member.email,
          avatar: member.avatar,
          baseCapacity: member.availability || 0,
          effectiveCapacity,
          currentWorkload: workload.totalPoints,
          utilization,
          availablePoints,
          isOverloaded,
          tasks: tasks.map((t) => ({
            id: t._id,
            title: t.title,
            status: t.status,
            estimatedHours: t.estimatedHours,
            story: t.story,
            storyPoints: t.story?.storyPoints || 0,
          })),
          stories: stories.map((s) => ({
            id: s._id,
            title: s.title,
            storyId: s.storyId,
            storyPoints: s.storyPoints,
            status: s.status,
          })),
          taskCount: tasks.length,
          storyCount: stories.length,
        }
      })
    )

    // Calculate team totals
    const totalCapacity = memberCapacityData.reduce((sum, m) => sum + m.effectiveCapacity, 0)
    const totalWorkload = memberCapacityData.reduce((sum, m) => sum + m.currentWorkload, 0)
    const totalUtilization = totalCapacity > 0
      ? Math.round((totalWorkload / totalCapacity) * 100)
      : 0

    // Get sprint commitment if sprint exists
    let sprintCommitment = 0
    if (sprint) {
      sprintCommitment = sprint.committedPoints || sprint.capacity || 0
    }

    // Check for overload warnings
    const overloadedMembers = memberCapacityData.filter((m) => m.isOverloaded)
    const teamOverloaded = totalWorkload > totalCapacity

    return {
      teamId: team._id,
      teamName: team.name,
      sprint: sprint
        ? {
            id: sprint._id,
            name: sprint.name,
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            committedPoints: sprintCommitment,
          }
        : null,
      members: memberCapacityData,
      totals: {
        totalCapacity,
        totalWorkload,
        totalUtilization,
        sprintCommitment,
        availableCapacity: Math.max(0, totalCapacity - totalWorkload),
      },
      warnings: {
        teamOverloaded,
        overloadedMembers: overloadedMembers.map((m) => ({
          userId: m.userId,
          name: m.name,
          overload: m.currentWorkload - m.effectiveCapacity,
        })),
        capacityExceeded: sprintCommitment > totalCapacity,
      },
    }
  } catch (error) {
    logger.error('Error getting team capacity planning:', error)
    throw error
  }
}

/**
 * Get historical capacity utilization trends
 * @param {string} teamId - Team ID
 * @param {number} limit - Number of sprints to include
 * @returns {Promise<Array>} Historical capacity data
 */
export const getCapacityTrends = async (teamId, limit = 10) => {
  try {
    const { Project } = await import('../models/index.js')
    const projects = await Project.find({ team: teamId }).select('_id')
    const projectIds = projects.map((p) => p._id)

    // Get completed sprints
    const sprints = await Sprint.find({
      project: { $in: projectIds },
      status: 'completed',
    })
      .sort({ endDate: -1 })
      .limit(limit)
      .select('name startDate endDate capacity committedPoints completedPoints velocity')

    const team = await Team.findById(teamId).populate('members', 'name availability')

    // For each sprint, calculate capacity utilization
    const trends = await Promise.all(
      sprints.map(async (sprint) => {
        // Calculate team capacity at sprint time
        // For historical data, we'll use base availability (simplified)
        const sprintCapacity = team.members.reduce((sum, member) => {
          return sum + (member.availability || 0)
        }, 0)

        const utilization = sprintCapacity > 0
          ? Math.round((sprint.committedPoints / sprintCapacity) * 100)
          : 0

        return {
          sprintId: sprint._id,
          sprintName: sprint.name,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          capacity: sprintCapacity,
          committed: sprint.committedPoints || 0,
          completed: sprint.completedPoints || 0,
          velocity: sprint.velocity || 0,
          utilization,
        }
      })
    )

    return trends.reverse() // Return in chronological order
  } catch (error) {
    logger.error('Error getting capacity trends:', error)
    throw error
  }
}

/**
 * Analyze workload imbalance and build automatic rebalancing plan
 */
export const generateRebalancePlan = async (teamId, sprintId = null) => {
  const capacityData = await getTeamCapacityPlanning(teamId, sprintId)

  const overloadedMembers = capacityData.members
    .filter((m) => m.currentWorkload > m.effectiveCapacity)
    .map((m) => ({
      userId: m.userId,
      name: m.name,
      overload: m.currentWorkload - m.effectiveCapacity,
      utilization: m.utilization,
      currentWorkload: m.currentWorkload,
      effectiveCapacity: m.effectiveCapacity,
      availablePoints: m.availablePoints,
      tasks: [...(m.tasks || [])],
    }))

  const underutilizedMembers = capacityData.members
    .filter((m) => m.utilization < 80 && m.availablePoints > 2)
    .map((m) => ({
      userId: m.userId,
      name: m.name,
      availablePoints: m.availablePoints,
      utilization: m.utilization,
      currentWorkload: m.currentWorkload,
      effectiveCapacity: m.effectiveCapacity,
    }))

  const imbalanceScore = overloadedMembers.reduce((sum, m) => sum + m.overload, 0)

  const moves = []
  const underQueue = [...underutilizedMembers]

  const getTaskPoints = (task) => {
    if (task.storyPoints) return task.storyPoints
    if (task.estimatedHours) return Math.max(1, task.estimatedHours / 2)
    return 1
  }

  overloadedMembers.forEach((overloaded) => {
    let overloadRemaining = overloaded.overload
    if (overloadRemaining <= 0) {
      return
    }

    const candidateTasks = [...(overloaded.tasks || [])].sort(
      (a, b) => getTaskPoints(b) - getTaskPoints(a)
    )

    candidateTasks.forEach((task) => {
      if (overloadRemaining <= 0) return
      if (underQueue.length === 0) return

      underQueue.sort((a, b) => b.availablePoints - a.availablePoints)
      const target = underQueue.find((u) => u.availablePoints > 0)
      if (!target) return

      const taskPoints = getTaskPoints(task)
      if (taskPoints <= 0) return

      const fromBefore = Math.round((overloaded.currentWorkload / overloaded.effectiveCapacity) * 100)
      const toBefore = Math.round((target.currentWorkload / target.effectiveCapacity) * 100)

      overloadRemaining -= taskPoints
      overloaded.currentWorkload = Math.max(0, overloaded.currentWorkload - taskPoints)
      target.currentWorkload += taskPoints
      target.availablePoints = Math.max(0, target.availablePoints - taskPoints)

      const fromAfter = Math.round((overloaded.currentWorkload / overloaded.effectiveCapacity) * 100)
      const toAfter = Math.round((target.currentWorkload / target.effectiveCapacity) * 100)

      moves.push({
        taskId: task.id || task._id,
        taskTitle: task.title,
        storyId: task.story?.storyId || task.storyId,
        storyPoints: taskPoints,
        from: {
          userId: overloaded.userId,
          name: overloaded.name,
        },
        to: {
          userId: target.userId,
          name: target.name,
        },
        pointsMoved: taskPoints,
        reason: `${overloaded.name} is overloaded by ${overloaded.overload.toFixed(
          1
        )} pts while ${target.name} has ${target.availablePoints.toFixed(1)} pts available`,
        impact: {
          fromBefore,
          fromAfter,
          toBefore,
          toAfter,
        },
      })
    })
  })

  const suggestions = []
  if (moves.length === 0) {
    if (overloadedMembers.length === 0) {
      suggestions.push({
        type: 'balanced',
        priority: 'low',
        message: 'Workload appears balanced across the team.',
      })
    } else {
      suggestions.push({
        type: 'insufficient_capacity',
        priority: 'high',
        message:
          'Unable to find suitable underutilized members for rebalancing. Consider adjusting capacity or sprint scope.',
      })
    }
  } else {
    suggestions.push({
      type: 'rebalance_plan',
      priority: 'high',
      message: `Detected ${overloadedMembers.length} overloaded and ${underutilizedMembers.length} underutilized members.`,
      recommendation: `Move ${moves.length} task(s) totaling ${moves
        .reduce((sum, move) => sum + move.pointsMoved, 0)
        .toFixed(1)} pts to restore balance.`,
    })
  }

  return {
    capacityData,
    imbalance: {
      score: Math.round(imbalanceScore * 10) / 10,
      overloadedMembers: overloadedMembers.map((m) => ({
        userId: m.userId,
        name: m.name,
        overload: Math.round(m.overload * 10) / 10,
        utilization: m.utilization,
      })),
      underutilizedMembers: underutilizedMembers.map((m) => ({
        userId: m.userId,
        name: m.name,
        availablePoints: Math.round(m.availablePoints * 10) / 10,
        utilization: m.utilization,
      })),
      imbalanceDetected: overloadedMembers.length > 0 && underutilizedMembers.length > 0,
    },
    plan: {
      moves,
      totalMoves: moves.length,
      totalPointsMoved: Math.round(moves.reduce((sum, move) => sum + move.pointsMoved, 0) * 10) / 10,
    },
    suggestions,
  }
}

/**
 * Apply workload rebalance plan and persist history
 */
export const applyRebalancePlan = async ({
  teamId,
  triggeredBy,
  sprintId = null,
  planMoves = [],
  manualOverride = false,
  imbalance = {},
}) => {
  if (!planMoves || !Array.isArray(planMoves) || planMoves.length === 0) {
    throw new BadRequestError('Rebalance plan is empty')
  }

  const results = []
  let totalPointsMoved = 0

  for (const move of planMoves) {
    const result = {
      taskId: move.taskId,
      taskTitle: move.taskTitle,
      from: move.from,
      to: move.to,
      pointsMoved: move.pointsMoved,
      status: 'pending',
    }

    try {
      const task = await Task.findById(move.taskId)
      if (!task) {
        result.status = 'skipped'
        result.failureReason = 'Task not found'
        results.push(result)
        continue
      }

      if (move.from?.userId && task.assignedTo?.toString() !== move.from.userId.toString()) {
        result.status = 'skipped'
        result.failureReason = 'Task assignment changed since plan was generated'
        results.push(result)
        continue
      }

      const newAssignee = await User.findById(move.to?.userId)
      if (!newAssignee) {
        result.status = 'skipped'
        result.failureReason = 'Target user not found'
        results.push(result)
        continue
      }

      const oldAssignee = task.assignedTo
      task.assignedTo = newAssignee._id
      await task.save()

      result.status = 'applied'
      totalPointsMoved += move.pointsMoved || 0

      await logActivity(
        'moved',
        'task',
        task._id,
        triggeredBy.id || triggeredBy._id || triggeredBy,
        `Task "${task.title}" automatically reassigned to ${newAssignee.name}`,
        {
          oldUserId: oldAssignee,
          newUserId: newAssignee._id,
          reason: move.reason,
        }
      )
    } catch (error) {
      logger.error('Error applying rebalance move:', error)
      result.status = 'skipped'
      result.failureReason = error.message
    }

    results.push(result)
  }

  const appliedMoves = results.filter((r) => r.status === 'applied').length
  const failedMoves = results.filter((r) => r.status !== 'applied').length

  const record = new WorkloadRebalance({
    team: teamId,
    sprint: sprintId || null,
    triggeredBy: triggeredBy.id || triggeredBy._id || triggeredBy,
    imbalanceScore: imbalance.score || null,
    summary: {
      totalMoves: appliedMoves,
      totalPointsMoved: Math.round(totalPointsMoved * 10) / 10,
      overloadedResolved: imbalance.overloadedMembers ? imbalance.overloadedMembers.length : 0,
      manualOverride,
    },
    moves: results,
    imbalanceSnapshot: {
      overloadedMembers: imbalance.overloadedMembers || [],
      underutilizedMembers: imbalance.underutilizedMembers || [],
    },
    status: failedMoves > 0 && appliedMoves > 0 ? 'partial' : failedMoves > 0 ? 'failed' : 'applied',
    appliedAt: new Date(),
  })

  await record.save()

  await logTeamAction(
    triggeredBy,
    'team_updated',
    { _id: teamId, name: 'team' },
    {
      before: { imbalanceScore: imbalance.score },
      after: { imbalanceScore: 0 },
    }
  )

  return {
    record,
    results,
  }
}

/**
 * Fetch rebalance history for a team
 */
export const getRebalanceHistory = async (teamId, limit = 20) => {
  const history = await WorkloadRebalance.find({ team: teamId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('triggeredBy', 'name email')
    .lean()

  return history
}

