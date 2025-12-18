import { Team, User, Task, Story } from '../models/index.js'
import {
  getTeamCapacity,
  getTeamVelocity,
  getTeamPerformance,
  getTeamCapacityPlanning,
  getCapacityTrends,
  generateRebalancePlan,
  applyRebalancePlan as applyRebalancePlanService,
  getRebalanceHistory,
} from '../services/team.service.js'
import { logActivity } from '../services/activity.service.js'
import eventEmitter from '../services/eventEmitter.service.js'
import { successResponse, paginatedResponse } from '../utils/response.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * Team Controller
 * HTTP request handlers for teams
 */

/**
 * Get teams
 * GET /api/teams
 */
export const getTeams = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query

    // Build query
    const query = { isActive: true }

    // Role-based filtering: Non-admins can only see their own team
    if (req.user.role !== 'admin') {
      if (req.user.team) {
        query._id = req.user.team._id || req.user.team
      } else {
        // User has no team, return empty results
        return paginatedResponse(
          res,
          [],
          {
            page: 1,
            limit: limitNum,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
          'Teams retrieved successfully'
        )
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const limitNum = parseInt(limit)

    // Execute query
    const [teams, total] = await Promise.all([
      Team.find(query)
        .populate('members', 'name email avatar')
        .populate('organization', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Team.countDocuments(query),
    ])

    // Get project counts and velocity for each team (optimized batch query)
    const { Project, Sprint } = await import('../models/index.js')
    const teamIds = teams.map(t => t._id || t.id)
    
    // Get project counts for all teams in one query
    const projectCounts = await Project.aggregate([
      { $match: { team: { $in: teamIds }, isArchived: false } },
      { $group: { _id: '$team', count: { $sum: 1 } } }
    ])
    const projectCountMap = new Map(projectCounts.map(pc => [pc._id.toString(), pc.count]))
    
    // Get projects for velocity calculation
    const projects = await Project.find({ team: { $in: teamIds }, isArchived: false })
      .select('_id team')
      .lean()
    const projectIds = projects.map(p => p._id)
    const projectTeamMap = new Map(projects.map(p => [p._id.toString(), p.team?.toString()]))
    
    // Get sprints for velocity calculation
    const sprints = await Sprint.find({ project: { $in: projectIds } })
      .select('project velocity capacity')
      .lean()
    
    // Calculate velocity per team
    const teamVelocityMap = new Map()
    sprints.forEach(sprint => {
      const projectId = sprint.project?.toString()
      const teamId = projectTeamMap.get(projectId)
      if (teamId) {
        if (!teamVelocityMap.has(teamId)) {
          teamVelocityMap.set(teamId, [])
        }
        if (sprint.velocity) {
          teamVelocityMap.get(teamId).push(sprint.velocity)
        }
      }
    })
    
    // Calculate average velocity for each team
    const teamsWithStats = teams.map(team => {
      const teamId = (team._id || team.id).toString()
      const projectCount = projectCountMap.get(teamId) || 0
      const velocities = teamVelocityMap.get(teamId) || []
      const avgVelocity = velocities.length > 0
        ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
        : 0
      
      return {
        ...team,
        currentProjects: projectCount,
        averageVelocity: Math.round(avgVelocity * 10) / 10, // Round to 1 decimal
      }
    })

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum)
    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      total,
      totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1,
    }

    return paginatedResponse(res, teamsWithStats, pagination, 'Teams retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get single team
 * GET /api/teams/:id
 */
export const getTeam = async (req, res, next) => {
  // Team access is already checked by checkTeamAccess middleware
  // Use req.team if available
  try {
    let team = req.team
    if (!team) {
      team = await Team.findById(req.params.id)
    }
    
    if (!team) {
      throw new NotFoundError('Team not found')
    }

    // Populate members with full user details
    await team.populate('members', 'name email avatar skills availability role isActive')
    await team.populate('organization', 'name domain')

    // Get project count and velocity for this team
    const { Project, Sprint } = await import('../models/index.js')
    const teamId = team._id || team.id
    
    const [projectCount, projects] = await Promise.all([
      Project.countDocuments({ team: teamId, isArchived: false }),
      Project.find({ team: teamId, isArchived: false }).select('_id').lean()
    ])
    
    const projectIds = projects.map(p => p._id)
    const sprints = await Sprint.find({ project: { $in: projectIds } })
      .select('velocity')
      .lean()
    
    const velocities = sprints.filter(s => s.velocity).map(s => s.velocity)
    const avgVelocity = velocities.length > 0
      ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
      : 0

    const teamData = team.toObject()
    teamData.currentProjects = projectCount
    teamData.averageVelocity = Math.round(avgVelocity * 10) / 10

    return successResponse(res, { team: teamData }, 'Team retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Create team
 * POST /api/teams
 */
export const createTeam = async (req, res, next) => {
  try {
    const teamData = req.body

    // Create team
    const team = new Team(teamData)
    await team.save()

    // Update members' team field
    if (teamData.members && teamData.members.length > 0) {
      await User.updateMany(
        { _id: { $in: teamData.members } },
        { $set: { team: team._id } }
      )
    }

    // Populate references
    await team.populate('members', 'name email avatar')
    await team.populate('organization', 'name')

    // Log activity
    await logActivity(
      'created',
      'project',
      team.organization || team._id,
      req.user.id,
      `Team "${team.name}" created`
    )

    return successResponse(res, { team: team.toObject() }, 'Team created successfully', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * Update team
 * PUT /api/teams/:id
 */
export const updateTeam = async (req, res, next) => {
  try {
    // Team access already checked by checkTeamAccess middleware
    const team = req.team || (await Team.findById(req.params.id))
    if (!team) {
      throw new NotFoundError('Team not found')
    }
    
    const updateData = req.body

    // Update team
    Object.assign(team, updateData)
    await team.save()

    // Populate references
    await team.populate('members', 'name email avatar')
    await team.populate('organization', 'name')

    // Log activity
    await logActivity(
      'updated',
      'project',
      team.organization || team._id,
      req.user.id,
      `Team "${team.name}" updated`
    )

    return successResponse(res, { team: team.toObject() }, 'Team updated successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Delete team
 * DELETE /api/teams/:id
 */
export const deleteTeam = async (req, res, next) => {
  try {
    // Team access already checked by checkTeamAccess middleware
    const team = req.team || (await Team.findById(req.params.id))
    if (!team) {
      throw new NotFoundError('Team not found')
    }

    // Remove team from users
    await User.updateMany({ team: team._id }, { $unset: { team: 1 } })

    // Soft delete
    team.isActive = false
    await team.save()

    // Log activity
    await logActivity(
      'deleted',
      'project',
      team.organization || team._id,
      req.user.id,
      `Team "${team.name}" deleted`
    )

    return successResponse(res, null, 'Team deleted successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Add members to team
 * POST /api/teams/:id/members
 */
export const addMembers = async (req, res, next) => {
  try {
    // Team access already checked by checkTeamAccess middleware
    const team = req.team || (await Team.findById(req.params.id))
    if (!team) {
      throw new NotFoundError('Team not found')
    }
    
    const { userIds } = req.body

    // Validate users exist
    const users = await User.find({ _id: { $in: userIds } })
    if (users.length !== userIds.length) {
      throw new BadRequestError('Some users were not found')
    }

    // Add members (avoid duplicates)
    const existingMemberIds = team.members.map((m) => m.toString())
    const newMemberIds = userIds.filter((uid) => !existingMemberIds.includes(uid))

    team.members = [...team.members, ...newMemberIds]
    await team.save()

    // Update users' team field
    await User.updateMany({ _id: { $in: newMemberIds } }, { $set: { team: team._id } })

    // Populate members
    await team.populate('members', 'name email avatar')

    // Log activity
    await logActivity(
      'updated',
      'project',
      team.organization || team._id,
      req.user.id,
      `${newMemberIds.length} members added to team "${team.name}"`
    )

    return successResponse(res, { team: team.toObject() }, 'Members added successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Remove member from team
 * DELETE /api/teams/:id/members/:userId
 */
export const removeMember = async (req, res, next) => {
  try {
    // Team access already checked by checkTeamAccess middleware
    let team = req.team
    if (!team) {
      team = await Team.findById(req.params.id)
    }
    if (!team) {
      throw new NotFoundError('Team not found')
    }
    
    const { userId } = req.params

    if (!userId) {
      throw new BadRequestError('User ID is required')
    }

    // Remove member (handle both ObjectId and string comparisons)
    const userIdStr = userId.toString()
    team.members = team.members.filter((m) => {
      const memberId = m?._id?.toString() || m?.toString() || m
      return memberId.toString() !== userIdStr
    })
    await team.save()

    // Update user's team field
    await User.findByIdAndUpdate(userId, { $unset: { team: 1 } })

    // Populate members with full details
    await team.populate('members', 'name email avatar skills availability role isActive')

    // Log activity
    await logActivity(
      'updated',
      'project',
      team.organization || team._id,
      req.user.id,
      `Member removed from team "${team.name}"`
    )

    return successResponse(res, { team: team.toObject() }, 'Member removed successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get team capacity
 * GET /api/teams/:id/capacity
 */
export const getTeamCapacityHandler = async (req, res, next) => {
  try {
    // Team access already checked by checkTeamAccess middleware
    const teamId = req.team?._id?.toString() || req.params.id
    const capacity = await getTeamCapacity(teamId)

    return successResponse(res, { capacity }, 'Team capacity retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get team velocity
 * GET /api/teams/:id/velocity
 */
export const getTeamVelocityHandler = async (req, res, next) => {
  try {
    // Team access already checked by checkTeamAccess middleware
    const teamId = req.team?._id?.toString() || req.params.id
    const velocity = await getTeamVelocity(teamId)

    return successResponse(res, { velocity }, 'Team velocity retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get team performance
 * GET /api/teams/:id/performance
 */
export const getTeamPerformanceHandler = async (req, res, next) => {
  try {
    // Team access already checked by checkTeamAccess middleware
    const teamId = req.team?._id?.toString() || req.params.id
    const performance = await getTeamPerformance(teamId)

    return successResponse(res, { performance }, 'Team performance retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get team capacity planning data
 * GET /api/teams/:id/capacity-planning
 */
export const getTeamCapacityPlanningHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const { sprintId } = req.query

    const capacityData = await getTeamCapacityPlanning(id, sprintId || null)

    return successResponse(
      res,
      { capacityPlanning: capacityData },
      'Capacity planning data retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get capacity utilization trends
 * GET /api/teams/:id/capacity-trends
 */
export const getCapacityTrendsHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const { limit = 10 } = req.query

    const trends = await getCapacityTrends(id, parseInt(limit))

    return successResponse(
      res,
      { trends },
      'Capacity trends retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Reassign task to different user
 * PUT /api/teams/:id/reassign-task
 */
export const reassignTask = async (req, res, next) => {
  try {
    // Check if user is manager or admin
    if (!['admin', 'manager'].includes(req.user.role)) {
      throw new BadRequestError('Only managers and admins can reassign tasks')
    }

    const { taskId, newUserId } = req.body

    // Find task
    const task = await Task.findById(taskId).populate('story', 'project')
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    // Verify new user exists and is in the same team
    const newUser = await User.findById(newUserId)
    if (!newUser) {
      throw new NotFoundError('User not found')
    }

    // Check team access (manager can only reassign within their team)
    if (req.user.role === 'manager') {
      const userTeamId = req.user.team?._id || req.user.team
      const newUserTeamId = newUser.team?._id || newUser.team

      if (userTeamId?.toString() !== newUserTeamId?.toString()) {
        throw new BadRequestError('Can only reassign tasks within your team')
      }
    }

    // Reassign task
    const oldUserId = task.assignedTo
    task.assignedTo = newUserId
    await task.save()

    // Log activity
    await logActivity(
      'moved',
      'task',
      task._id,
      req.user.id,
      `Task "${task.title}" reassigned from user to ${newUser.name}`,
      { oldUserId, newUserId }
    )

    // Emit event
    eventEmitter.emit('task:reassigned', {
      taskId: task._id,
      oldUserId,
      newUserId,
    })

    return successResponse(res, { task: task.toObject() }, 'Task reassigned successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get AI rebalance suggestions
 * GET /api/teams/:id/rebalance-suggestions
 */
export const getRebalanceSuggestions = async (req, res, next) => {
  try {
    const { id } = req.params
    const { sprintId } = req.query

    const planData = await generateRebalancePlan(id, sprintId || null)

    return successResponse(
      res,
      {
        analysis: planData.imbalance,
        plan: planData.plan,
        suggestions: planData.suggestions,
        capacity: {
          totals: planData.capacityData.totals,
          warnings: planData.capacityData.warnings,
          sprint: planData.capacityData.sprint,
        },
      },
      'Rebalance analysis retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Apply workload rebalance plan
 * POST /api/teams/:id/rebalance/apply
 */
export const applyRebalancePlan = async (req, res, next) => {
  try {
    const { id } = req.params
    const { plan, sprintId, manualOverride = false, imbalance } = req.body

    if (!Array.isArray(plan) || plan.length === 0) {
      throw new BadRequestError('No workload moves provided')
    }

    const result = await applyRebalancePlanService({
      teamId: id,
      triggeredBy: req.user,
      sprintId: sprintId || null,
      planMoves: plan,
      manualOverride,
      imbalance: imbalance || {},
    })

    return successResponse(
      res,
      {
        historyRecord: result.record,
        results: result.results,
      },
      'Workload rebalance applied successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get workload rebalance history
 * GET /api/teams/:id/rebalance/history
 */
export const getRebalanceHistoryHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const { limit = 20 } = req.query

    const history = await getRebalanceHistory(id, parseInt(limit, 10) || 20)

    return successResponse(res, { history }, 'Rebalance history retrieved successfully')
  } catch (error) {
    next(error)
  }
}

