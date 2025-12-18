import { Sprint, Story, Project, Activity, Team, User, Task, MLFeedback, Notification } from '../models/index.js'
import {
  calculateBurndown,
  calculateVelocity,
  generateIdealBurndown,
  getNextSprintNumber,
} from '../services/sprint.service.js'
import { createActivity } from '../services/project.service.js'
import { sendSprintStartedEmail, sendSprintCompletedEmail } from '../services/email.service.js'
import eventEmitter from '../services/eventEmitter.service.js'
import { successResponse } from '../utils/response.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import logger from '../utils/logger.js'
import { applyTemplateToSprintData } from '../services/sprintTemplate.service.js'
import { recordPerfectSprintContributors } from '../services/gamification.service.js'
import {
  optimizeSprintPlan as optimizeSprintPlanML,
  predictSprintVelocity as predictSprintVelocityML,
  suggestSprintStories as suggestSprintStoriesML,
  simulateSprintOutcome as simulateSprintOutcomeML,
  predictCompletion as predictCompletionML,
  autoGenerateSprintPlan,
} from '../services/mlIntegration.service.js'

/**
 * Sprint Controller
 * HTTP request handlers for sprints
 */

/**
 * Create sprint
 * POST /api/projects/:projectId/sprints
 */
export const createSprint = async (req, res, next) => {
  try {
    const { projectId } = req.params
    let sprintData = { ...req.body }

    // Check if project exists
    const project = await Project.findById(projectId).populate('team', '_id')
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    const storyIdsFromTemplate = []
    const { templateId, autoSelectStories = true } = sprintData
    delete sprintData.templateId
    delete sprintData.autoSelectStories

    // Calculate sprint number
    sprintData.sprintNumber = await getNextSprintNumber(projectId)

    // Set project
    sprintData.project = projectId

    // Apply default template if none passed
    let appliedTemplateId = templateId || project.defaultSprintTemplate
    if (appliedTemplateId) {
      const { payload } = await applyTemplateToSprintData({
        templateId: appliedTemplateId,
        sprintData,
        projectId,
        autoSelectStories,
      })
      sprintData = payload
      if (payload.stories) {
        storyIdsFromTemplate.push(...payload.stories)
        delete sprintData.stories
      }
    }

    if (!sprintData.startDate) {
      sprintData.startDate = new Date()
      if (!sprintData.endDate) {
        const end = new Date(sprintData.startDate)
        end.setDate(end.getDate() + 14)
        sprintData.endDate = end
      }
    }

    // Create sprint
    const sprint = new Sprint(sprintData)
    await sprint.save()

    if (storyIdsFromTemplate.length > 0) {
      await Story.updateMany({ _id: { $in: storyIdsFromTemplate } }, { sprint: sprint._id })
      sprint.stories = storyIdsFromTemplate
      await sprint.save()
    }

    // Populate references
    await sprint.populate('project', 'name key')

    // Create activity log
    await createActivity({
      type: 'created',
      entityType: 'sprint',
      entityId: sprint._id,
      user: req.user.id,
      description: `Sprint "${sprint.name}" created for project "${project.name}"`,
    })

    // Emit event via event emitter
    eventEmitter.emit('sprint:created', { sprint: sprint.toObject() })

    return successResponse(res, { sprint: sprint.toObject() }, 'Sprint created successfully', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * Get all sprints (across all projects) or sprints for a specific project
 * GET /api/sprints (all sprints)
 * GET /api/projects/:projectId/sprints (project sprints)
 */
export const getAllSprints = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query
    const user = req.user
    const userRole = user.role

    // Build query - filter by user's access
    let query = {}

    // For non-admins, filter by team
    if (userRole !== 'admin') {
      const userTeamId = user.team?._id || user.team
      if (userTeamId) {
        // Get projects for user's team
        const teamProjects = await Project.find({ 
          team: userTeamId, 
          isArchived: false 
        }).select('_id')
        const projectIds = teamProjects.map(p => p._id)
        
        if (projectIds.length > 0) {
          query.project = { $in: projectIds }
        } else {
          // No projects for this team, return empty
          return successResponse(
            res,
            { sprints: [], pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
            'Sprints retrieved successfully'
          )
        }
      } else {
        // No team assigned, return empty
        return successResponse(
          res,
          { sprints: [], pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
          'Sprints retrieved successfully'
        )
      }
    }

    if (status && status !== 'all') {
      query.status = status
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const limitNum = parseInt(limit)

    // Execute query
    const [sprints, total] = await Promise.all([
      Sprint.find(query)
        .populate('project', 'name key team')
        .populate('stories', 'title storyId status storyPoints assignedTo')
        .sort({ sprintNumber: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Sprint.countDocuments(query),
    ])

    // Recalculate velocity for sprints where velocity is 0 but might have completed stories
    // This fixes sprints that were completed before the auto-update feature was added
    const sprintsWithVelocity = await Promise.all(
      sprints.map(async (sprint) => {
        // If velocity is 0 but sprint is completed, recalculate
        if (sprint.velocity === 0 && sprint.status === 'completed') {
          try {
            const velocity = await calculateVelocity({ _id: sprint._id })
            if (velocity > 0) {
              // Update in database
              await Sprint.findByIdAndUpdate(sprint._id, { velocity, completedPoints: velocity })
              sprint.velocity = velocity
              sprint.completedPoints = velocity
            }
          } catch (error) {
            logger.error(`Error recalculating velocity for sprint ${sprint._id}:`, error)
          }
        }
        return sprint
      })
    )

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

    return successResponse(
      res,
      { sprints: sprintsWithVelocity, pagination },
      'Sprints retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get sprints for a project
 * GET /api/projects/:projectId/sprints
 */
export const getSprints = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { status, page = 1, limit = 10 } = req.query

    // Check if project exists
    const project = await Project.findById(projectId)
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    // Build query
    const query = { project: projectId }

    if (status && status !== 'all') {
      query.status = status
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const limitNum = parseInt(limit)

    // Execute query
    const [sprints, total] = await Promise.all([
      Sprint.find(query)
        .populate('stories', 'title storyId status storyPoints assignedTo')
        .sort({ sprintNumber: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Sprint.countDocuments(query),
    ])

    // Recalculate velocity for sprints where velocity is 0 but might have completed stories
    const sprintsWithVelocity = await Promise.all(
      sprints.map(async (sprint) => {
        // If velocity is 0 but sprint is completed, recalculate
        if (sprint.velocity === 0 && sprint.status === 'completed') {
          try {
            const velocity = await calculateVelocity({ _id: sprint._id })
            if (velocity > 0) {
              // Update in database
              await Sprint.findByIdAndUpdate(sprint._id, { velocity, completedPoints: velocity })
              sprint.velocity = velocity
              sprint.completedPoints = velocity
            }
          } catch (error) {
            logger.error(`Error recalculating velocity for sprint ${sprint._id}:`, error)
          }
        }
        return sprint
      })
    )

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

    return successResponse(
      res,
      { sprints: sprintsWithVelocity, pagination },
      'Sprints retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get single sprint
 * GET /api/sprints/:id
 */
export const getSprint = async (req, res, next) => {
  try {
    const { id } = req.params

    const sprint = await Sprint.findById(id)
      .populate('project', 'name key')
      .populate({
        path: 'stories',
        populate: {
          path: 'assignedTo',
          select: 'name email avatar',
        },
      })

    if (!sprint) {
      throw new NotFoundError('Sprint not found')
    }

    return successResponse(res, { sprint: sprint.toObject() }, 'Sprint retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Update sprint
 * PUT /api/sprints/:id
 */
export const updateSprint = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Find sprint
    const sprint = await Sprint.findById(id)
    if (!sprint) {
      throw new NotFoundError('Sprint not found')
    }

    // Update sprint
    Object.assign(sprint, updateData)
    await sprint.save()

    // Populate references
    await sprint.populate('project', 'name key')
    await sprint.populate('stories', 'title storyId status storyPoints')

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'sprint',
      entityId: sprint._id,
      user: req.user.id,
      description: `Sprint "${sprint.name}" updated`,
      metadata: { changes: updateData },
    })

    // Emit event via event emitter
    eventEmitter.emit('sprint:updated', { sprint: sprint.toObject() })

    return successResponse(res, { sprint: sprint.toObject() }, 'Sprint updated successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Start sprint
 * POST /api/sprints/:id/start
 */
export const startSprint = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find sprint
    const sprint = await Sprint.findById(id)
    if (!sprint) {
      throw new NotFoundError('Sprint not found')
    }

    // Check if sprint is in 'planned' status
    if (sprint.status !== 'planned') {
      throw new BadRequestError('Sprint can only be started if it is in planned status')
    }

    // Update sprint
    sprint.status = 'active'
    sprint.startDate = new Date()
    await sprint.save()

    // Populate references
    await sprint.populate('project', 'name key team')

    // Get team members to send emails
    try {
      const project = await Project.findById(sprint.project._id || sprint.project)
        .populate('team', 'members')
        .select('team')
      
      if (project?.team) {
        const team = await Team.findById(project.team._id || project.team)
          .populate('members', '_id')
          .select('members')
        
        if (team?.members) {
          // Send email to all team members (async, don't wait)
          team.members.forEach((member) => {
            sendSprintStartedEmail(member._id || member, sprint, sprint.project).catch((err) => {
              logger.error('Error sending sprint started email:', err)
            })
          })
        }
      }
    } catch (err) {
      logger.error('Error preparing sprint started emails:', err)
    }

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'sprint',
      entityId: sprint._id,
      user: req.user.id,
      description: `Sprint "${sprint.name}" started`,
    })

    // Emit event via event emitter
    eventEmitter.emit('sprint:started', { sprint: sprint.toObject() })

    return successResponse(res, { sprint: sprint.toObject() }, 'Sprint started successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Complete sprint
 * POST /api/sprints/:id/complete
 */
export const completeSprint = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find sprint
    const sprint = await Sprint.findById(id)
    if (!sprint) {
      throw new NotFoundError('Sprint not found')
    }

    // Check if sprint is in 'active' status
    if (sprint.status !== 'active') {
      throw new BadRequestError('Sprint can only be completed if it is in active status')
    }

    // Calculate final velocity
    const velocity = await calculateVelocity(sprint)

    // Update completed points from stories
    const stories = await Story.find({ sprint: id })
    const completedPoints = stories
      .filter((story) => story.status === 'done')
      .reduce((sum, story) => sum + (story.storyPoints || 0), 0)

    // Update sprint
    sprint.status = 'completed'
    sprint.completedPoints = completedPoints
    sprint.velocity = velocity
    await sprint.save()

    // Update developer metrics for all team members who worked on this sprint
    const { updateAllDeveloperMetrics } = await import('../services/developerMetrics.service.js')
    const assigneeIds = [...new Set(stories
      .map(s => s.assignedTo?.toString() || s.assignedTo)
      .filter(Boolean)
    )]
    if (assigneeIds.length > 0) {
      await Promise.all(assigneeIds.map(userId => updateAllDeveloperMetrics(userId)))
    }

    // Populate references
    await sprint.populate('project', 'name key team')

    // Get team members to send emails
    try {
      const project = await Project.findById(sprint.project._id || sprint.project)
        .populate('team', 'members')
        .select('team')
      
      if (project?.team) {
        const team = await Team.findById(project.team._id || project.team)
          .populate('members', '_id')
          .select('members')
        
        if (team?.members) {
          // Send email to all team members (async, don't wait)
          team.members.forEach((member) => {
            sendSprintCompletedEmail(member._id || member, sprint, sprint.project).catch((err) => {
              logger.error('Error sending sprint completed email:', err)
            })
          })
        }
      }
    } catch (err) {
      logger.error('Error preparing sprint completed emails:', err)
    }

    // Create activity log
    await createActivity({
      type: 'completed',
      entityType: 'sprint',
      entityId: sprint._id,
      user: req.user.id,
      description: `Sprint "${sprint.name}" completed with velocity ${velocity}`,
    })

    // Emit event via event emitter with all necessary data
    const sprintData = sprint.toObject()
    eventEmitter.emit('sprint:completed', { 
      sprint: sprintData,
      sprintId: sprint._id.toString(),
      sprintName: sprint.name,
      projectId: sprint.project?._id?.toString() || sprint.project?.toString() || sprint.project,
      velocity: sprint.velocity,
      status: sprint.status,
    })

    await recordPerfectSprintContributors(sprint)

    // Collect feedback for ML learning (async, don't wait)
    try {
      const actualCompletion = stories.length > 0 
        ? stories.filter(s => s.status === 'done').length / stories.length 
        : 0

      // If there was a prediction, record feedback
      if (sprint.predictedVelocity || sprint.predictedCompletion) {
        const predictedVelocity = sprint.predictedVelocity || 0
        const predictedCompletion = sprint.predictedCompletion || 0.9

        // Calculate accuracy
        const velocityAccuracy = predictedVelocity > 0
          ? Math.max(0, 1 - Math.abs(predictedVelocity - velocity) / predictedVelocity)
          : 0
        const completionAccuracy = Math.max(0, 1 - Math.abs(predictedCompletion - actualCompletion))
        const overallAccuracy = (velocityAccuracy + completionAccuracy) / 2

        await MLFeedback.create({
          modelType: 'velocity_forecast',
          predictionId: `sprint-${sprint._id}`,
          prediction: {
            velocity: predictedVelocity,
            completion: predictedCompletion,
          },
          actualOutcome: {
            velocity: velocity,
            completion: actualCompletion,
            factors: {
              totalStories: stories.length,
              completedStories: stories.filter(s => s.status === 'done').length,
            },
          },
          accuracy: overallAccuracy,
          context: {
            sprint: sprint._id,
            team: sprint.project?.team || project?.team,
            project: sprint.project?._id || sprint.project,
          },
          metadata: {
            predictionTimestamp: sprint.startDate || new Date(),
            outcomeTimestamp: new Date(),
          },
        })

        // Calculate time to outcome
        const feedback = await MLFeedback.findOne({ predictionId: `sprint-${sprint._id}` })
        if (feedback && feedback.metadata.predictionTimestamp) {
          feedback.metadata.timeToOutcome =
            (feedback.metadata.outcomeTimestamp - feedback.metadata.predictionTimestamp) / 1000
          await feedback.save()
        }
      }
    } catch (feedbackError) {
      logger.warn('Failed to record sprint outcome feedback:', feedbackError)
      // Don't fail the request if feedback recording fails
    }

    return successResponse(res, { sprint: sprint.toObject() }, 'Sprint completed successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get sprint burndown data
 * GET /api/sprints/:id/burndown
 */
export const getSprintBurndown = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find sprint
    const sprint = await Sprint.findById(id)
    if (!sprint) {
      throw new NotFoundError('Sprint not found')
    }

    // Calculate burndown data
    const burndownData = await calculateBurndown(sprint)

    return successResponse(res, { burndownData }, 'Burndown data retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get sprint velocity
 * GET /api/sprints/:id/velocity
 */
export const getSprintVelocity = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find sprint
    const sprint = await Sprint.findById(id)
    if (!sprint) {
      throw new NotFoundError('Sprint not found')
    }

    // Calculate velocity
    const velocity = await calculateVelocity(sprint)

    return successResponse(res, { velocity }, 'Sprint velocity retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Assign stories to sprint
 * POST /api/sprints/:id/stories
 */
export const assignStoriesToSprint = async (req, res, next) => {
  try {
    const { id } = req.params
    const { storyIds } = req.body

    // Find sprint
    const sprint = await Sprint.findById(id)
    if (!sprint) {
      throw new NotFoundError('Sprint not found')
    }

    // Validate story IDs
    const stories = await Story.find({
      _id: { $in: storyIds },
      project: sprint.project,
    })

    if (stories.length !== storyIds.length) {
      throw new BadRequestError('Some stories were not found or do not belong to this project')
    }

    // Update stories with sprint reference
    await Story.updateMany(
      { _id: { $in: storyIds } },
      { $set: { sprint: id } }
    )

    // Update sprint stories array
    const existingStoryIds = sprint.stories ? sprint.stories.map((s) => s.toString()) : []
    sprint.stories = [...new Set([...existingStoryIds, ...storyIds.map((s) => s.toString())])]

    // Recalculate committed points with all sprint stories
    const allSprintStories = await Story.find({ _id: { $in: sprint.stories } }).select('storyPoints')
    const committedPoints = allSprintStories.reduce((sum, story) => sum + (story.storyPoints || 0), 0)
    sprint.committedPoints = committedPoints

    await sprint.save()

    // Create activity log
    await createActivity({
      type: 'moved',
      entityType: 'sprint',
      entityId: sprint._id,
      user: req.user.id,
      description: `${stories.length} stories assigned to sprint "${sprint.name}"`,
    })

    // Emit event via event emitter
    eventEmitter.emit('sprint:stories-assigned', {
      sprintId: id,
      storyIds,
      projectId: sprint.project,
    })

    return successResponse(res, null, 'Stories assigned to sprint successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Generate AI sprint plan
 * POST /api/sprints/:id/ai/optimize-plan
 */
export const generateSprintAIPlan = async (req, res, next) => {
  try {
    const { id } = req.params
    const { sprint, project, teamInfo, backlog } = await buildSprintAIContext(id, { includeBacklog: true })

    const plan = await optimizeSprintPlanML(
      {
        sprintId: sprint._id.toString(),
        capacity: sprint.capacity || teamInfo.totalCapacity,
        mustIncludeStories: (sprint.stories || []).map((storyId) => storyId.toString()),
      },
      teamInfo.members,
      backlog
    )

    return successResponse(
      res,
      {
        plan,
        backlogSize: backlog.length,
        teamCapacity: teamInfo.totalCapacity,
      },
      'Sprint optimization generated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Predict sprint velocity with AI
 * POST /api/sprints/:id/ai/predict-velocity
 */
export const getSprintVelocityForecast = async (req, res, next) => {
  try {
    const { id } = req.params
    const { sprint, project, teamInfo } = await buildSprintAIContext(id)

    const history = await getVelocityHistory(project._id || project.id, sprint._id)

    const forecast = await predictSprintVelocityML({
      team_id: (project.team?._id || project.team || '').toString(),
      team_capacity: sprint.capacity || teamInfo.totalCapacity,
      historical_velocities: history,
    })

    return successResponse(
      res,
      {
        forecast,
        history,
      },
      'Velocity forecast generated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get AI story suggestions for sprint
 * POST /api/sprints/:id/ai/suggest-stories
 */
export const getSprintAISuggestions = async (req, res, next) => {
  try {
    const { id } = req.params
    const { teamInfo, backlog } = await buildSprintAIContext(id, { includeBacklog: true })

    const suggestions = await suggestSprintStoriesML({
      available_stories: backlog,
      team_capacity: teamInfo.totalCapacity,
      team_members: teamInfo.members,
    })

    return successResponse(
      res,
      {
        suggestedStories: suggestions?.suggested_stories || [],
      },
      'AI story suggestions generated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Simulate sprint outcome
 * POST /api/sprints/:id/ai/simulate
 */
export const simulateSprintOutcome = async (req, res, next) => {
  try {
    const { id } = req.params
    const { sprint, project, teamInfo } = await buildSprintAIContext(id, { includeBacklog: true })

    const plannedStories = await buildPlannedStoriesPayload({
      supplied: req.body?.stories,
      fallbackIds: sprint.stories,
    })

    const payload = {
      sprint_id: sprint._id.toString(),
      sprint_goal: sprint.goal || '',
      team_id: (project.team?._id || project.team || '').toString(),
      sprint_capacity: sprint.capacity || teamInfo.totalCapacity,
      sprint_window: {
        start_date: sprint.startDate,
        end_date: sprint.endDate,
      },
      planned_stories: plannedStories,
      risk_tolerance: req.body?.riskTolerance || 'balanced',
      include_dependencies: true,
    }

    const simulation = await simulateSprintOutcomeML(payload)

    return successResponse(
      res,
      {
        simulation,
        metadata: {
          plannedStories: plannedStories.length,
          teamMembers: teamInfo.members.length,
        },
      },
      'Sprint simulation generated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Predict sprint completion date
 * POST /api/sprints/:id/ai/predict-completion
 */
/**
 * Auto-generate sprint plan instantly
 * POST /api/sprints/:id/auto-generate
 */
export const autoGeneratePlan = async (req, res, next) => {
  try {
    const { id } = req.params

    // Get sprint
    const sprint = await Sprint.findById(id).populate('project', 'team')
    if (!sprint) {
      throw new NotFoundError('Sprint not found')
    }

    // Get project team
    const project = sprint.project
    if (!project || !project.team) {
      throw new BadRequestError('Sprint must belong to a project with a team')
    }

    const Team = mongoose.model('Team')
    const team = await Team.findById(project.team).populate('members', 'name email skills currentWorkload capacity velocity')
    if (!team) {
      throw new NotFoundError('Team not found')
    }

    // Get available stories from backlog
    const backlogStories = await Story.find({
      project: sprint.project,
      status: { $in: ['backlog', 'ready'] },
      sprint: { $exists: false },
    }).select('title description storyPoints priority status dependencies')

    if (backlogStories.length === 0) {
      throw new BadRequestError('No available stories in backlog')
    }

    // Prepare team members data
    const teamMembers = (team.members || []).map((member) => ({
      id: member._id.toString(),
      name: member.name,
      email: member.email,
      skills: member.skills || [],
      currentWorkload: member.currentWorkload || 0,
      capacity: member.capacity || 40,
      velocity: member.velocity || 0,
    }))

    // Prepare available stories data
    const availableStories = backlogStories.map((story) => ({
      id: story._id.toString(),
      title: story.title,
      description: story.description || '',
      storyPoints: story.storyPoints || 0,
      points: story.storyPoints || 0,
      priority: story.priority || 'medium',
      status: story.status || 'backlog',
      dependencies: story.dependencies || [],
    }))

    // Call ML service to generate plan
    let generatedPlan
    try {
      const mlResponse = await autoGenerateSprintPlan({
        sprintId: id,
        capacity: sprint.capacity || 80,
        teamMembers,
        availableStories,
      })
      generatedPlan = mlResponse.generated_plan || mlResponse.data?.generated_plan || mlResponse
    } catch (mlError) {
      logger.error('ML service error:', mlError)
      throw new BadRequestError('Failed to generate sprint plan. ML service unavailable.')
    }

    return successResponse(
      res,
      { generatedPlan },
      'Sprint plan generated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Accept generated sprint plan
 * POST /api/sprints/:id/accept-generated-plan
 */
export const acceptGeneratedPlan = async (req, res, next) => {
  try {
    const { id } = req.params
    const { generatedPlan } = req.body

    if (!generatedPlan || !generatedPlan.selected_stories) {
      throw new BadRequestError('Generated plan is required')
    }

    // Get sprint
    const sprint = await Sprint.findById(id).populate('project', 'team')
    if (!sprint) {
      throw new NotFoundError('Sprint not found')
    }

    const storyIds = []
    const taskIds = []

    // Process each selected story
    for (const storyData of generatedPlan.selected_stories) {
      const story = storyData.story
      const storyId = story.id || story._id

      // Update story to assign to sprint
      await Story.findByIdAndUpdate(storyId, {
        sprint: sprint._id,
        status: 'in-progress',
      })
      storyIds.push(storyId)

      // Create tasks for the story
      for (const taskData of storyData.tasks || []) {
        const taskInfo = taskData.task
        const assignedTo = taskData.assigned_to

        const newTask = new Task({
          title: taskInfo.title,
          description: taskInfo.description || '',
          story: storyId,
          sprint: sprint._id,
          project: sprint.project,
          assignedTo: assignedTo,
          estimatedHours: taskInfo.estimated_hours || 4,
          status: 'todo',
          type: taskInfo.type || 'development',
        })

        await newTask.save()
        taskIds.push(newTask._id)
      }
    }

    // Update sprint with stories
    sprint.stories = storyIds
    await sprint.save()

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'sprint',
      entityId: sprint._id,
      user: req.user.id,
      description: `Auto-generated sprint plan applied: ${storyIds.length} stories, ${taskIds.length} tasks`,
    })

    // Send notifications to assigned team members
    const assignedUserIds = [...new Set(generatedPlan.selected_stories.flatMap((s) => 
      (s.tasks || []).map((t) => t.assigned_to).filter(Boolean)
    ))]

    for (const userId of assignedUserIds) {
      await Notification.create({
        user: userId,
        type: 'task_assigned',
        title: 'Tasks assigned from auto-generated sprint plan',
        message: `You have been assigned tasks in sprint "${sprint.name}"`,
        entityType: 'sprint',
        entityId: sprint._id,
      })
    }

    // Emit event via event emitter
    eventEmitter.emit('sprint:plan-generated', {
      sprintId: sprint._id,
      storiesCount: storyIds.length,
      tasksCount: taskIds.length,
    })

    return successResponse(
      res,
      {
        sprint: sprint.toObject(),
        storiesCreated: storyIds.length,
        tasksCreated: taskIds.length,
      },
      `Sprint plan created! ${storyIds.length} stories, ${taskIds.length} tasks in ${generatedPlan.generation_time || 'seconds'} ⚡`
    )
  } catch (error) {
    next(error)
  }
}

export const predictSprintCompletion = async (req, res, next) => {
  try {
    const { id } = req.params
    const { sprint, project, teamInfo } = await buildSprintAIContext(id)

    const remainingStoryPoints =
      typeof req.body?.remainingStoryPoints === 'number'
        ? req.body.remainingStoryPoints
        : calculateRemainingStoryPoints(sprint)

    const payload = {
      team_id: (project.team?._id || project.team || '').toString(),
      remaining_story_points: remainingStoryPoints,
      sprint_capacity: req.body?.sprintCapacity || sprint.capacity || teamInfo.totalCapacity,
      sprint_days_remaining: req.body?.daysRemaining ?? getDaysRemaining(sprint.endDate),
      work_calibration_factor: req.body?.calibrationFactor ?? 1,
    }

    const prediction = await predictCompletionML(
      payload.team_id,
      payload.remaining_story_points,
      payload.sprint_capacity
    )

    return successResponse(
      res,
      {
        prediction,
        payload,
      },
      'Sprint completion prediction generated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Helper: Build sprint AI context
 */
const buildSprintAIContext = async (sprintId, { includeBacklog = false } = {}) => {
  const sprint = await Sprint.findById(sprintId)
    .populate('project', 'name key team capacity startDate endDate status')

  if (!sprint) {
    throw new NotFoundError('Sprint not found')
  }

  const projectId = sprint.project?._id || sprint.project
  const project = await Project.findById(projectId).populate('team', 'name members')
  if (!project) {
    throw new NotFoundError('Project not found')
  }

  if (!project.team) {
    throw new BadRequestError('Assign a team to this project before running AI planning')
  }

  const team = await Team.findById(project.team._id || project.team).populate(
    'members',
    'name email availability skills role'
  )

  if (!team || team.members.length === 0) {
    throw new BadRequestError('Team must have members before running AI planning')
  }

  const teamInfo = await buildTeamMemberProfiles(team)
  const backlog = includeBacklog ? await fetchBacklogStories(projectId, sprint._id) : []

  return { sprint, project, teamInfo, backlog }
}

/**
 * Helper: Build team member profiles for AI payload
 */
const buildTeamMemberProfiles = async (team) => {
  const memberDocs = team.members || []
  const memberIds = memberDocs.map((member) => member._id)

  const tasks = await Task.find({
    assignedTo: { $in: memberIds },
    status: { $nin: ['done', 'completed'] },
  })
    .select('assignedTo storyPoints estimatedHours title story')
    .lean()

  const workloadMap = new Map()
  tasks.forEach((task) => {
    const ownerId = task.assignedTo?.toString()
    if (!ownerId) return
    const points =
      task.storyPoints ??
      (typeof task.estimatedHours === 'number' ? Math.max(1, task.estimatedHours / 2) : 1)
    workloadMap.set(ownerId, (workloadMap.get(ownerId) || 0) + points)
  })

  const members = memberDocs.map((member) => ({
    user_id: member._id.toString(),
    name: member.name,
    email: member.email,
    skills: member.skills || [],
    capacity: member.availability || 40,
    current_workload: workloadMap.get(member._id.toString()) || 0,
  }))

  const totalCapacity = members.reduce((sum, member) => sum + (member.capacity || 0), 0)

  return { members, totalCapacity }
}

/**
 * Helper: Fetch backlog stories for AI planner
 */
const fetchBacklogStories = async (projectId, sprintId) => {
  const backlogStories = await Story.find({
    project: projectId,
    $or: [{ sprint: null }, { sprint: { $exists: false } }, { sprint: { $ne: sprintId } }],
    status: { $in: ['backlog', 'ready', 'todo'] },
  })
    .select(
      'title description storyPoints priority businessValue dependencies acceptanceCriteria aiInsights requiredSkills'
    )
    .lean()

  return backlogStories.map((story) => ({
    story_id: story._id.toString(),
    title: story.title,
    description: story.description,
    story_points: story.storyPoints || 0,
    priority: story.priority || 'medium',
    business_value: story.businessValue || 1,
    complexity: story.aiInsights?.complexityLevel || story.aiInsights?.complexity || 'medium',
    required_skills: story.requiredSkills || story.skills || [],
    dependencies: (story.dependencies || []).map((dep) => dep.toString()),
  }))
}

/**
 * Helper: Get historical velocity values
 */
const getVelocityHistory = async (projectId, excludeSprintId) => {
  const historicalSprints = await Sprint.find({
    project: projectId,
    status: 'completed',
    _id: { $ne: excludeSprintId },
  })
    .sort({ endDate: -1 })
    .limit(8)
    .select('velocity completedPoints committedPoints')
    .lean()

  return historicalSprints
    .map((sprint) => sprint.velocity || sprint.completedPoints || sprint.committedPoints || 0)
    .filter((value) => typeof value === 'number' && value > 0)
}

const buildPlannedStoriesPayload = async ({ supplied, fallbackIds }) => {
  if (Array.isArray(supplied) && supplied.length > 0) {
    return supplied.map((story) => ({
      story_id: story.story_id || story.storyId || story._id?.toString() || story.id,
      title: story.title,
      story_points: story.story_points || story.storyPoints || 0,
      priority: story.priority || 'medium',
      status: story.status || 'backlog',
      estimated_hours: story.estimated_hours || story.estimatedHours || null,
      dependencies: story.dependencies?.map((dep) => dep.toString()) || [],
    }))
  }

  if (!fallbackIds || fallbackIds.length === 0) {
    return []
  }

  const stories = await Story.find({ _id: { $in: fallbackIds } })
    .select('title storyPoints priority status estimatedHours dependencies')
    .lean()

  return stories.map((story) => ({
    story_id: story._id.toString(),
    title: story.title,
    story_points: story.storyPoints || 0,
    priority: story.priority || 'medium',
    status: story.status || 'backlog',
    estimated_hours: story.estimatedHours || null,
    dependencies: (story.dependencies || []).map((dep) => dep.toString()),
  }))
}

const calculateRemainingStoryPoints = (sprint) => {
  if (typeof sprint.remainingPoints === 'number') return sprint.remainingPoints
  if (typeof sprint.committedPoints === 'number' && typeof sprint.completedPoints === 'number') {
    return Math.max(0, sprint.committedPoints - sprint.completedPoints)
  }
  if (Array.isArray(sprint.stories) && sprint.stories.length > 0) {
    return sprint.stories.reduce((sum, story) => {
      if (typeof story?.storyPoints === 'number') return sum + story.storyPoints
      return sum
    }, 0)
  }
  return 0
}

const getDaysRemaining = (endDate) => {
  if (!endDate) return 5
  const end = new Date(endDate)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(diff, 1)
}

/**
 * Save or update sprint retrospective
 * POST /api/sprints/:id/retrospective
 */
export const saveRetrospective = async (req, res, next) => {
  try {
    const { id } = req.params
    const { whatWentWell, whatDidntGoWell, actionItems } = req.body

    // Check if user is manager or admin
    if (!['admin', 'manager'].includes(req.user.role)) {
      throw new BadRequestError('Only managers and admins can save retrospectives')
    }

    // Find sprint
    const sprint = await Sprint.findById(id)
    if (!sprint) {
      throw new NotFoundError('Sprint not found')
    }

    // Check if sprint is completed or can be edited
    // Allow editing if sprint is completed or active (for early retrospective)
    if (sprint.status === 'planned') {
      throw new BadRequestError('Retrospective can only be created for active or completed sprints')
    }

    // Prepare retrospective data
    const retrospectiveData = {
      whatWentWell: whatWentWell || [],
      whatDidntGoWell: whatDidntGoWell || [],
      actionItems: actionItems || [],
      updatedAt: new Date(),
      updatedBy: req.user.id,
    }

    // If retrospective doesn't exist, set createdBy and createdAt
    if (!sprint.retrospective || !sprint.retrospective.createdAt) {
      retrospectiveData.createdAt = new Date()
      retrospectiveData.createdBy = req.user.id
    }

    // Update sprint with retrospective
    sprint.retrospective = retrospectiveData
    await sprint.save()

    // Populate references
    await sprint.populate('project', 'name key')
    await sprint.populate('retrospective.createdBy', 'name email')
    await sprint.populate('retrospective.updatedBy', 'name email')
    if (sprint.retrospective.actionItems) {
      await sprint.populate('retrospective.actionItems.completedBy', 'name email')
    }

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'sprint',
      entityId: sprint._id,
      user: req.user.id,
      description: `Retrospective saved for sprint "${sprint.name}"`,
    })

    // Emit event via event emitter
    eventEmitter.emit('sprint:retrospective-saved', { sprint: sprint.toObject() })

    return successResponse(
      res,
      { sprint: sprint.toObject() },
      'Retrospective saved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Update action item completion status
 * PUT /api/sprints/:id/retrospective/action-items/:itemId
 */
export const updateActionItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params
    const { completed } = req.body

    // Check if user is manager or admin
    if (!['admin', 'manager'].includes(req.user.role)) {
      throw new BadRequestError('Only managers and admins can update action items')
    }

    // Find sprint
    const sprint = await Sprint.findById(id)
    if (!sprint) {
      throw new NotFoundError('Sprint not found')
    }

    if (!sprint.retrospective || !sprint.retrospective.actionItems) {
      throw new BadRequestError('Retrospective not found')
    }

    // Find and update action item
    const actionItem = sprint.retrospective.actionItems.id(itemId)
    if (!actionItem) {
      throw new NotFoundError('Action item not found')
    }

    actionItem.completed = completed
    if (completed) {
      actionItem.completedAt = new Date()
      actionItem.completedBy = req.user.id
    } else {
      actionItem.completedAt = undefined
      actionItem.completedBy = undefined
    }

    sprint.retrospective.updatedAt = new Date()
    sprint.retrospective.updatedBy = req.user.id

    await sprint.save()

    // Populate references
    await sprint.populate('retrospective.actionItems.completedBy', 'name email')
    await sprint.populate('retrospective.updatedBy', 'name email')

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'sprint',
      entityId: sprint._id,
      user: req.user.id,
      description: `Action item ${completed ? 'completed' : 'marked as incomplete'} in sprint "${sprint.name}"`,
    })

    return successResponse(
      res,
      { sprint: sprint.toObject() },
      'Action item updated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get past retrospectives for comparison
 * GET /api/projects/:projectId/retrospectives
 */
export const getPastRetrospectives = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { limit = 5 } = req.query

    // Check if project exists
    const project = await Project.findById(projectId)
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    // Get completed sprints with retrospectives
    const sprints = await Sprint.find({
      project: projectId,
      status: 'completed',
      'retrospective.createdAt': { $exists: true },
    })
      .select('name sprintNumber endDate retrospective createdAt')
      .populate('retrospective.createdBy', 'name email')
      .sort({ endDate: -1 })
      .limit(parseInt(limit))
      .lean()

    return successResponse(
      res,
      { retrospectives: sprints },
      'Past retrospectives retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

