import { Project, Sprint, Task, Story, User, Team } from '../models/index.js'
import { successResponse } from '../utils/response.js'
import { BadRequestError } from '../utils/errors.js'
import logger from '../utils/logger.js'
import {
  predictVelocity,
  analyzeProjectRisks,
  analyzeSprintRisks,
  detectBottlenecks,
} from '../services/mlIntegration.service.js'

/**
 * Dashboard Controller
 * Returns role-specific dashboard statistics
 */

/**
 * Get dashboard statistics
 * GET /api/dashboard/stats
 * Returns different stats based on user role:
 * - Admin: Organization-wide metrics
 * - Manager: Team-specific metrics
 * - Developer: Personal task metrics
 * - Viewer: Read-only metrics
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const user = req.user
    const userRole = user.role
    const userId = user._id || user.id

    let stats = {}

    if (userRole === 'admin') {
      // Admin: Organization-wide metrics
      const [activeProjects, activeSprints, totalUsers] = await Promise.all([
        Project.countDocuments({ isArchived: false, status: 'active' }),
        Sprint.countDocuments({ status: 'active' }),
        User.countDocuments({ isActive: true }),
      ])

      // Calculate real team performance based on actual data (optimized)
      const teams = await Team.find({ isActive: true }).select('_id').lean()
      let teamPerformance = 0
      
      if (teams.length > 0) {
        const teamIds = teams.map(t => t._id)
        
        // Get all projects for all teams in one query
        const allProjects = await Project.find({ 
          team: { $in: teamIds }, 
          isArchived: false 
        }).select('_id team').lean()
        
        if (allProjects.length > 0) {
          const projectIds = allProjects.map(p => p._id)
          const projectTeamMap = new Map(allProjects.map(p => [p._id.toString(), p.team?.toString()]))
          
          // Get all completed sprints in one query
          const completedSprints = await Sprint.find({
            project: { $in: projectIds },
            status: 'completed'
          }).select('project velocity committedPoints completedPoints').lean()
          
          // Get all stories for task calculation
          const allStories = await Story.find({ project: { $in: projectIds } }).select('_id project').lean()
          const storyIds = allStories.map(s => s._id)
          const storyProjectMap = new Map(allStories.map(s => [s._id.toString(), s.project?.toString()]))
          
          // Get task counts in one query
          const [activeTasksCount, completedTasksCount] = await Promise.all([
            Task.countDocuments({ story: { $in: storyIds }, status: { $ne: 'done' } }),
            Task.countDocuments({ story: { $in: storyIds }, status: 'done' })
          ])
          
          // Calculate performance per team
          const teamStats = new Map()
          
          // Process sprints
          completedSprints.forEach(sprint => {
            const projectId = sprint.project?.toString()
            const teamId = projectTeamMap.get(projectId)
            if (teamId) {
              if (!teamStats.has(teamId)) {
                teamStats.set(teamId, { committed: 0, completed: 0 })
              }
              const stats = teamStats.get(teamId)
              stats.committed += (sprint.committedPoints || sprint.velocity || 0)
              stats.completed += (sprint.completedPoints || sprint.velocity || 0)
            }
          })
          
          // Calculate performance for each team
          const teamPerformances = []
          teamStats.forEach((stats, teamId) => {
            const completionRate = stats.committed > 0 
              ? Math.round((stats.completed / stats.committed) * 100)
              : 0
            
            // Calculate task completion rate for this team's projects
            const teamProjectIds = Array.from(projectTeamMap.entries())
              .filter(([pid, tid]) => tid === teamId)
              .map(([pid]) => pid)
            const teamStoryIds = Array.from(storyProjectMap.entries())
              .filter(([sid, pid]) => teamProjectIds.includes(pid))
              .map(([sid]) => sid)
            
            // For now, use overall task completion rate (can be optimized further)
            const totalTasks = activeTasksCount + completedTasksCount
            const taskCompletionRate = totalTasks > 0
              ? Math.round((completedTasksCount / totalTasks) * 100)
              : 0
            
            const performance = Math.round((completionRate * 0.6) + (taskCompletionRate * 0.4))
            teamPerformances.push(performance)
          })
          
          // Calculate average performance across all teams
          if (teamPerformances.length > 0) {
            teamPerformance = Math.round(
              teamPerformances.reduce((sum, p) => sum + p, 0) / teamPerformances.length
            )
          }
        }
      }

      stats = {
        activeProjects,
        activeSprints,
        totalUsers,
        teamPerformance,
        tasksAssignedToMe: 0, // Admin doesn't have personal tasks
        completedThisWeek: 0,
      }
    } else if (userRole === 'manager') {
      // Manager: Team-specific metrics
      const userTeamId = user.team?._id || user.team

      if (!userTeamId) {
        return successResponse(res, {
          activeProjects: 0,
          activeSprints: 0,
          teamMembers: 0,
          teamVelocity: 'N/A',
          tasksAssignedToMe: 0,
          completedThisWeek: 0,
        }, 'Dashboard stats retrieved successfully')
      }

      // Get projects for this team
      const teamProjects = await Project.find({ isArchived: false, team: userTeamId }).select('_id')
      const projectIds = teamProjects.map((p) => p._id)

      const [activeProjects, teamMembers] = await Promise.all([
        Project.countDocuments({ isArchived: false, status: 'active', team: userTeamId }),
        User.countDocuments({ team: userTeamId, isActive: true }),
      ])

      // Get active sprints for team's projects
      const activeSprints = await Sprint.countDocuments({
        status: 'active',
        project: { $in: projectIds },
      })

      // Get team velocity (simplified - average of completed sprints)
      const completedSprints = await Sprint.find({
        status: 'completed',
        project: { $in: projectIds },
      }).select('velocity')

      const teamVelocity =
        completedSprints.length > 0
          ? `${Math.round(completedSprints.reduce((sum, s) => sum + (s.velocity || 0), 0) / completedSprints.length)} SP`
          : 'N/A'

      stats = {
        activeProjects,
        activeSprints,
        teamMembers,
        teamVelocity,
        tasksAssignedToMe: 0,
        completedThisWeek: 0,
      }
    } else if (userRole === 'developer') {
      // Developer: Personal task metrics
      const [tasksAssignedToMe, completedThisWeek] = await Promise.all([
        Task.countDocuments({
          assignedTo: userId,
          status: { $ne: 'done' },
        }),
        Task.countDocuments({
          assignedTo: userId,
          status: 'done',
          updatedAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        }),
      ])

      stats = {
        activeProjects: 0,
        activeSprints: 0,
        tasksAssignedToMe,
        completedThisWeek,
      }
    } else if (userRole === 'viewer') {
      // Viewer: Read-only metrics
      const userTeamId = user.team?._id || user.team

      let activeProjects = 0
      let activeSprints = 0

      if (userTeamId) {
        const [projects, sprints] = await Promise.all([
          Project.countDocuments({ isArchived: false, status: 'active', team: userTeamId }),
          Sprint.countDocuments({ status: 'active' }).populate({
            path: 'project',
            match: { team: userTeamId },
          }),
        ])
        activeProjects = projects
        activeSprints = sprints.length
      }

      const completedThisWeek = await Task.countDocuments({
        status: 'done',
        updatedAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      })

      stats = {
        activeProjects,
        activeSprints,
        tasksAssignedToMe: 0,
        completedThisWeek,
      }
    } else {
      // Default: Empty stats
      stats = {
        activeProjects: 0,
        activeSprints: 0,
        tasksAssignedToMe: 0,
        completedThisWeek: 0,
      }
    }

    return successResponse(res, stats, 'Dashboard stats retrieved successfully')
  } catch (error) {
    logger.error('Error getting dashboard stats:', error)
    next(error)
  }
}

/**
 * Get AI-powered velocity forecast for dashboard
 * GET /api/dashboard/velocity-forecast
 */
export const getVelocityForecastDashboard = async (req, res, next) => {
  try {
    const { team, teamId, sprintCapacity } = await resolveTeamContext(req)
    const history = await getTeamVelocityHistory(teamId)

    const forecast = await predictVelocity(teamId.toString(), sprintCapacity || 80)

    return successResponse(
      res,
      {
        team: {
          id: teamId,
          name: team?.name || 'Team',
          members: team?.members?.length || 0,
        },
        capacity: {
          sprintCapacity,
          historicalAverage:
            history.length > 0 ? Math.round(history.reduce((sum, v) => sum + v, 0) / history.length) : 0,
        },
        history,
        forecast,
      },
      'Velocity forecast retrieved successfully'
    )
  } catch (error) {
    logger.error('Error getting dashboard velocity forecast:', error)
    next(error)
  }
}

/**
 * Get AI risk alerts for dashboard
 * GET /api/dashboard/risk-alerts
 */
export const getRiskAlertsDashboard = async (req, res, next) => {
  try {
    const { teamId, projects } = await resolveTeamContext(req, { includeProjects: true })

    if (!projects || projects.length === 0) {
      return successResponse(
        res,
        { alerts: [], bottlenecks: [] },
        'No projects found for risk analysis'
      )
    }

    const alerts = []

    for (const project of projects.slice(0, 3)) {
      const projectId = project._id.toString()
      try {
        const projectRisks = await analyzeProjectRisks(projectId)
        const riskItems = normalizeProjectRisks(project, projectRisks)
        alerts.push(...riskItems)

        const activeSprint = await Sprint.findOne({
          project: project._id,
          status: { $in: ['active', 'planned'] },
        }).sort({ startDate: -1 })

        if (activeSprint) {
          const sprintRisks = await analyzeSprintRisks(activeSprint._id.toString())
          alerts.push(...normalizeSprintRisks(activeSprint, sprintRisks))
        }
      } catch (mlError) {
        logger.warn(`Risk analysis failed for project ${projectId}: ${mlError.message}`)
      }
    }

    let bottlenecks = []
    try {
      bottlenecks = await detectBottlenecks(teamId.toString())
    } catch (mlError) {
      logger.warn(`Bottleneck detection failed for team ${teamId}: ${mlError.message}`)
    }

    return successResponse(
      res,
      {
        alerts,
        bottlenecks,
      },
      'Risk alerts retrieved successfully'
    )
  } catch (error) {
    logger.error('Error getting dashboard risk alerts:', error)
    next(error)
  }
}

/**
 * Get upcoming deadlines for dashboard
 * GET /api/dashboard/deadlines
 */
export const getUpcomingDeadlinesDashboard = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50)
    const days = Math.min(parseInt(req.query.days, 10) || 7, 30)
    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + days)

    const query = {
      dueDate: { $gte: startDate, $lte: endDate },
      status: { $ne: 'done' },
    }

    const userId = req.user._id || req.user.id
    const userRole = req.user.role

    if (userRole === 'developer') {
      query.assignedTo = userId
    }

    let tasks = await Task.find(query)
      .sort({ dueDate: 1 })
      .limit(limit * 2)
      .populate('assignedTo', 'name email avatar')
      .populate({
        path: 'story',
        select: 'title storyId project',
        populate: { path: 'project', select: 'name key team' },
      })
      .lean()

    const inferredTeamId =
      userRole === 'manager' ? req.user.team?._id || req.user.team || null : null
    const teamFilter = req.query.teamId || inferredTeamId

    if (teamFilter) {
      tasks = tasks.filter((task) => {
        const projectTeam = task.story?.project?.team
        return projectTeam && projectTeam.toString() === teamFilter.toString()
      })
    }

    const deadlines = tasks.slice(0, limit).map((task) => {
      const project = task.story?.project
      const story = task.story
      return {
        id: task._id.toString(),
        title: task.title,
        type: 'task',
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
        project: project
          ? {
              id: project._id?.toString(),
              name: project.name,
              key: project.key,
            }
          : null,
        story: story
          ? {
              id: story._id?.toString(),
              title: story.title,
              storyId: story.storyId,
            }
          : null,
        assignee: task.assignedTo
          ? {
              id: task.assignedTo._id?.toString(),
              name: task.assignedTo.name,
              email: task.assignedTo.email,
              avatar: task.assignedTo.avatar,
            }
          : null,
      }
    })

    return successResponse(
      res,
      { items: deadlines },
      'Upcoming deadlines retrieved successfully'
    )
  } catch (error) {
    logger.error('Error getting dashboard deadlines:', error)
    next(error)
  }
}

// -----------------------
// Helper Functions
// -----------------------

const resolveTeamContext = async (req, { includeProjects = false } = {}) => {
  const user = req.user
  const queryTeamId = req.query.teamId

  let teamId = null

  if (user.role === 'admin') {
    teamId = queryTeamId || user.team?._id || user.team || null
  } else if (user.role === 'manager') {
    teamId = user.team?._id || user.team || null
  } else {
    throw new BadRequestError('Only managers and admins can access this resource')
  }

  if (!teamId) {
    throw new BadRequestError('No team assigned. Please join or create a team first.')
  }

  const team = await Team.findById(teamId).populate('members', 'name availability skills email')
  if (!team) {
    throw new BadRequestError('Team not found')
  }

  const sprintCapacity =
    team.members.reduce((sum, member) => sum + (member.availability || 0), 0) || 80

  let projects = []
  if (includeProjects) {
    projects = await Project.find({ isArchived: false, team: teamId })
      .select('_id name key status')
      .limit(5)
  }

  return {
    team,
    teamId: team._id,
    sprintCapacity,
    members: team.members,
    projects,
  }
}

const getTeamVelocityHistory = async (teamId, limit = 8) => {
  const projects = await Project.find({ team: teamId, isArchived: false }).select('_id')
  const projectIds = projects.map((p) => p._id)

  if (projectIds.length === 0) {
    return []
  }

  // Get completed sprints first
  let sprints = await Sprint.find({
    project: { $in: projectIds },
    status: 'completed',
  })
    .sort({ endDate: -1 })
    .limit(limit)
    .select('velocity completedPoints committedPoints name startDate endDate')
    .lean()

  // If no completed sprints, get active sprints with current progress
  if (sprints.length === 0) {
    sprints = await Sprint.find({
      project: { $in: projectIds },
      status: 'active',
    })
      .sort({ startDate: -1 })
      .limit(limit)
      .populate('stories', 'storyPoints status')
      .select('velocity completedPoints committedPoints name startDate endDate stories')
      .lean()
    
    // Calculate current progress for active sprints
    sprints = sprints.map(sprint => {
      const stories = sprint.stories || []
      const completedPoints = stories
        .filter(s => s.status === 'done')
        .reduce((sum, s) => sum + (s.storyPoints || 0), 0)
      const committedPoints = stories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)
      
      return {
        ...sprint,
        completedPoints: completedPoints || sprint.completedPoints || 0,
        committedPoints: committedPoints || sprint.committedPoints || 0,
        velocity: completedPoints || sprint.velocity || 0,
      }
    })
  }

  return sprints
    .map((sprint) => {
      // Use completedPoints if available, otherwise velocity, otherwise committedPoints
      return sprint.completedPoints || sprint.velocity || sprint.committedPoints || 0
    })
    .filter((value) => typeof value === 'number' && value >= 0)
    .reverse()
}

const normalizeProjectRisks = (project, mlResponse) => {
  const alerts = mlResponse?.alerts || mlResponse?.risks || []
  if (!Array.isArray(alerts)) {
    return []
  }

  return alerts.map((alert, index) => ({
    id: `${project._id}-risk-${index}`,
    projectId: project._id.toString(),
    projectName: project.name,
    severity: alert.severity || alert.level || 'medium',
    type: alert.type || alert.category || 'general',
    message: alert.message || alert.description || 'Potential risk detected',
    recommendation: alert.recommendation || alert.action || '',
  }))
}

const normalizeSprintRisks = (sprint, mlResponse) => {
  const alerts = mlResponse?.alerts || mlResponse?.risks || []
  if (!Array.isArray(alerts)) {
    return []
  }

  return alerts.map((alert, index) => ({
    id: `${sprint._id}-risk-${index}`,
    sprintId: sprint._id.toString(),
    sprintName: sprint.name,
    severity: alert.severity || alert.level || 'medium',
    type: alert.type || alert.category || 'general',
    message: alert.message || alert.description || 'Sprint risk detected',
    recommendation: alert.recommendation || alert.action || '',
  }))
}

