import mongoose from 'mongoose'
import { ProgramIncrement, Project, Feature, Sprint, Team, Story, Task, User } from '../models/index.js'
import { createActivity } from '../services/project.service.js'
import eventEmitter from '../services/eventEmitter.service.js'
import { successResponse, paginatedResponse } from '../utils/response.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import logger from '../utils/logger.js'
import { breakDownFeature, getTaskAssignmentRecommendations } from '../services/mlIntegration.service.js'

/**
 * Program Increment Controller
 * HTTP request handlers for Program Increments (PI Planning)
 */

/**
 * Create Program Increment
 * POST /api/projects/:projectId/program-increments
 */
export const createProgramIncrement = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const piData = req.body

    // Check if project exists
    const project = await Project.findById(projectId)
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    // Validate dates
    if (piData.startDate && piData.endDate) {
      const startDate = new Date(piData.startDate)
      const endDate = new Date(piData.endDate)
      const diffTime = Math.abs(endDate - startDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const weeks = diffDays / 7

      if (weeks < 8 || weeks > 12) {
        throw new BadRequestError('Program Increment must be between 8 and 12 weeks')
      }
    }

    // Set project and createdBy
    piData.project = projectId
    piData.createdBy = req.user.id

    // Initialize metrics
    if (!piData.metrics) {
      piData.metrics = {
        predictedVelocity: 0,
        actualVelocity: 0,
        featuresCompleted: 0,
        featuresPlanned: 0,
      }
    }

    // Create PI
    const programIncrement = new ProgramIncrement(piData)
    await programIncrement.save()

    // Populate references
    await programIncrement.populate('project', 'name key')
    await programIncrement.populate('createdBy', 'name email avatar')

    // Create activity log
    await createActivity({
      type: 'created',
      entityType: 'project',
      entityId: projectId,
      user: req.user.id,
      description: `Program Increment "${programIncrement.name}" created`,
    })

    // Emit event via event emitter
    eventEmitter.emit('pi:created', { programIncrement: programIncrement.toObject() })

    return successResponse(
      res,
      { programIncrement: programIncrement.toObject() },
      'Program Increment created successfully',
      201
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get Program Increments for project
 * GET /api/projects/:projectId/program-increments
 */
export const getProgramIncrements = async (req, res, next) => {
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
    if (status) {
      query.status = status
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const limitNum = parseInt(limit) || 10

    // Get PIs
    const [programIncrements, total] = await Promise.all([
      ProgramIncrement.find(query)
        .populate('features', 'title status priority')
        .populate('sprints', 'name status startDate endDate')
        .populate('createdBy', 'name email avatar')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ProgramIncrement.countDocuments(query),
    ])

    const totalPages = Math.ceil(total / limitNum)
    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      total,
      totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1,
    }

    return paginatedResponse(
      res,
      programIncrements,
      pagination,
      'Program Increments retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get single Program Increment
 * GET /api/program-increments/:id
 */
export const getProgramIncrement = async (req, res, next) => {
  try {
    const { id } = req.params

    const programIncrement = await ProgramIncrement.findById(id)
      .populate('project', 'name key')
      .populate('features', 'title description status priority estimatedStoryPoints actualStoryPoints')
      .populate('sprints', 'name status startDate endDate capacity velocity')
      .populate({
        path: 'objectives.assignedTo',
        select: 'name',
      })
      .populate({
        path: 'risks.owner',
        select: 'name email',
      })
      .populate({
        path: 'dependencies.fromFeature',
        select: 'title',
      })
      .populate({
        path: 'dependencies.toFeature',
        select: 'title',
      })
      .populate('createdBy', 'name email avatar')

    if (!programIncrement) {
      throw new NotFoundError('Program Increment not found')
    }

    return successResponse(
      res,
      { programIncrement: programIncrement.toObject() },
      'Program Increment retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Update Program Increment
 * PUT /api/program-increments/:id
 */
export const updateProgramIncrement = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Find PI
    const programIncrement = await ProgramIncrement.findById(id)
    if (!programIncrement) {
      throw new NotFoundError('Program Increment not found')
    }

    // Validate dates if updated
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate ? new Date(updateData.startDate) : programIncrement.startDate
      const endDate = updateData.endDate ? new Date(updateData.endDate) : programIncrement.endDate
      const diffTime = Math.abs(endDate - startDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const weeks = diffDays / 7

      if (weeks < 8 || weeks > 12) {
        throw new BadRequestError('Program Increment must be between 8 and 12 weeks')
      }
    }

    // Update PI
    Object.assign(programIncrement, updateData)
    await programIncrement.save()

    // Populate references
    await programIncrement.populate('project', 'name key')
    await programIncrement.populate('features', 'title status')
    await programIncrement.populate('sprints', 'name status')

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'project',
      entityId: programIncrement.project,
      user: req.user.id,
      description: `Program Increment "${programIncrement.name}" updated`,
    })

    // Emit event via event emitter
    eventEmitter.emit('pi:updated', { programIncrement: programIncrement.toObject() })

    return successResponse(
      res,
      { programIncrement: programIncrement.toObject() },
      'Program Increment updated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Delete Program Increment
 * DELETE /api/program-increments/:id
 */
export const deleteProgramIncrement = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find PI
    const programIncrement = await ProgramIncrement.findById(id)
    if (!programIncrement) {
      throw new NotFoundError('Program Increment not found')
    }

    const projectId = programIncrement.project

    // Remove PI reference from features
    if (programIncrement.features && programIncrement.features.length > 0) {
      await Feature.updateMany(
        { _id: { $in: programIncrement.features } },
        { $unset: { programIncrement: 1 } }
      )
    }

    // Delete PI
    await ProgramIncrement.findByIdAndDelete(id)

    // Create activity log
    await createActivity({
      type: 'deleted',
      entityType: 'project',
      entityId: projectId,
      user: req.user.id,
      description: `Program Increment "${programIncrement.name}" deleted`,
    })

    // Emit event via event emitter
    eventEmitter.emit('pi:deleted', {
      programIncrementId: id,
      projectId,
    })

    return successResponse(res, null, 'Program Increment deleted successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Add feature to PI
 * POST /api/program-increments/:id/features
 */
export const addFeatureToPI = async (req, res, next) => {
  try {
    const { id } = req.params
    const { featureId } = req.body

    // Find PI
    const programIncrement = await ProgramIncrement.findById(id)
    if (!programIncrement) {
      throw new NotFoundError('Program Increment not found')
    }

    // Find feature
    const feature = await Feature.findById(featureId)
    if (!feature) {
      throw new NotFoundError('Feature not found')
    }

    // Check if feature belongs to same project
    if (feature.project.toString() !== programIncrement.project.toString()) {
      throw new BadRequestError('Feature must belong to the same project as the Program Increment')
    }

    // Add feature to PI if not already added
    if (!programIncrement.features.includes(featureId)) {
      programIncrement.features.push(featureId)
      await programIncrement.save()
    }

    // Update feature's programIncrement reference
    feature.programIncrement = programIncrement._id
    await feature.save()

    // Populate references
    await programIncrement.populate('features', 'title status priority')

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'project',
      entityId: programIncrement.project,
      user: req.user.id,
      description: `Feature "${feature.title}" added to Program Increment "${programIncrement.name}"`,
    })

    return successResponse(
      res,
      { programIncrement: programIncrement.toObject() },
      'Feature added to Program Increment successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Add sprint to PI
 * POST /api/program-increments/:id/sprints
 */
export const addSprintToPI = async (req, res, next) => {
  try {
    const { id } = req.params
    const { sprintId } = req.body

    // Find PI
    const programIncrement = await ProgramIncrement.findById(id)
    if (!programIncrement) {
      throw new NotFoundError('Program Increment not found')
    }

    // Find sprint
    const sprint = await Sprint.findById(sprintId)
    if (!sprint) {
      throw new NotFoundError('Sprint not found')
    }

    // Check if sprint belongs to same project
    if (sprint.project.toString() !== programIncrement.project.toString()) {
      throw new BadRequestError('Sprint must belong to the same project as the Program Increment')
    }

    // Add sprint to PI if not already added
    if (!programIncrement.sprints.includes(sprintId)) {
      programIncrement.sprints.push(sprintId)
      await programIncrement.save()
    }

    // Populate references
    await programIncrement.populate('sprints', 'name status startDate endDate')

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'project',
      entityId: programIncrement.project,
      user: req.user.id,
      description: `Sprint "${sprint.name}" added to Program Increment "${programIncrement.name}"`,
    })

    return successResponse(
      res,
      { programIncrement: programIncrement.toObject() },
      'Sprint added to Program Increment successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Calculate PI capacity
 * GET /api/program-increments/:id/capacity
 */
export const getPICapacity = async (req, res, next) => {
  try {
    const { id } = req.params

    const programIncrement = await ProgramIncrement.findById(id)
      .populate('sprints', 'capacity velocity')
      .populate('features', 'estimatedStoryPoints actualStoryPoints')

    if (!programIncrement) {
      throw new NotFoundError('Program Increment not found')
    }

    // Calculate total capacity from sprints
    const sprints = programIncrement.sprints || []
    const totalCapacity = sprints.reduce((sum, sprint) => sum + (sprint.capacity || sprint.velocity || 0), 0)

    // Calculate allocated points from features
    const features = programIncrement.features || []
    const allocatedPoints = features.reduce(
      (sum, feature) => sum + (feature.estimatedStoryPoints || feature.actualStoryPoints || 0),
      0
    )

    // Update PI capacity
    programIncrement.capacity.totalStoryPoints = totalCapacity
    programIncrement.capacity.allocatedStoryPoints = allocatedPoints
    await programIncrement.save()

    return successResponse(
      res,
      {
        capacity: programIncrement.capacity,
        utilization: totalCapacity > 0 ? Math.round((allocatedPoints / totalCapacity) * 100) : 0,
      },
      'PI capacity calculated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Optimize PI feature distribution using AI
 * POST /api/program-increments/:id/optimize
 */
export const optimizePI = async (req, res, next) => {
  try {
    const { id } = req.params

    const programIncrement = await ProgramIncrement.findById(id)
      .populate('features', 'title estimatedStoryPoints priority status')
      .populate('sprints', 'name capacity startDate endDate')

    if (!programIncrement) {
      throw new NotFoundError('Program Increment not found')
    }

    // Call ML service to optimize
    const { optimizePIFeatures } = await import('../services/mlIntegration.service.js')
    
    let optimizationResult = null
    try {
      optimizationResult = await optimizePIFeatures({
        features: programIncrement.features.map((f) => ({
          id: f._id.toString(),
          title: f.title,
          points: f.estimatedStoryPoints || 0,
          priority: f.priority,
          status: f.status,
        })),
        sprints: programIncrement.sprints.map((s) => ({
          id: s._id.toString(),
          name: s.name,
          capacity: s.capacity || 0,
          startDate: s.startDate,
          endDate: s.endDate,
        })),
        dependencies: programIncrement.dependencies || [],
      })
    } catch (mlError) {
      logger.error('ML service error:', mlError)
      throw new BadRequestError('Failed to optimize PI. ML service unavailable.')
    }

    return successResponse(
      res,
      { optimization: optimizationResult },
      'PI optimization completed successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Start Program Increment
 * POST /api/program-increments/:id/start
 */
export const startPI = async (req, res, next) => {
  try {
    const { id } = req.params

    const programIncrement = await ProgramIncrement.findById(id)
    if (!programIncrement) {
      throw new NotFoundError('Program Increment not found')
    }

    if (programIncrement.status === 'active') {
      throw new BadRequestError('Program Increment is already active')
    }

    if (programIncrement.status === 'completed') {
      throw new BadRequestError('Cannot start a completed Program Increment')
    }

    // Update status
    programIncrement.status = 'active'
    await programIncrement.save()

    // Start all planned sprints
    if (programIncrement.sprints && programIncrement.sprints.length > 0) {
      const Sprint = mongoose.model('Sprint')
      await Sprint.updateMany(
        { _id: { $in: programIncrement.sprints }, status: 'planned' },
        { status: 'active' }
      )
    }

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'project',
      entityId: programIncrement.project,
      user: req.user.id,
      description: `Program Increment "${programIncrement.name}" started`,
    })

    // Emit event via event emitter
    eventEmitter.emit('pi:started', { programIncrement: programIncrement.toObject() })

    return successResponse(
      res,
      { programIncrement: programIncrement.toObject() },
      'Program Increment started successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Complete Program Increment
 * POST /api/program-increments/:id/complete
 */
export const completePI = async (req, res, next) => {
  try {
    const { id } = req.params

    const programIncrement = await ProgramIncrement.findById(id)
      .populate('sprints', 'status')
    if (!programIncrement) {
      throw new NotFoundError('Program Increment not found')
    }

    if (programIncrement.status === 'completed') {
      throw new BadRequestError('Program Increment is already completed')
    }

    // Check if all sprints are completed
    const sprints = programIncrement.sprints || []
    const incompleteSprints = sprints.filter((s) => s.status !== 'completed')
    if (incompleteSprints.length > 0) {
      throw new BadRequestError(
        `Cannot complete PI. ${incompleteSprints.length} sprint(s) are not completed.`
      )
    }

    // Update status
    programIncrement.status = 'completed'
    
    // Calculate actual metrics
    const Feature = mongoose.model('Feature')
    if (programIncrement.features && programIncrement.features.length > 0) {
      const features = await Feature.find({ _id: { $in: programIncrement.features } }).select('status actualStoryPoints')
      programIncrement.metrics.featuresCompleted = features.filter((f) => f.status === 'completed').length
      programIncrement.metrics.actualVelocity = features.reduce(
        (sum, f) => sum + (f.actualStoryPoints || 0),
        0
      )
    }

    await programIncrement.save()

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'project',
      entityId: programIncrement.project,
      user: req.user.id,
      description: `Program Increment "${programIncrement.name}" completed`,
    })

    // Emit event via event emitter
    eventEmitter.emit('pi:completed', { programIncrement: programIncrement.toObject() })

    return successResponse(
      res,
      { programIncrement: programIncrement.toObject() },
      'Program Increment completed successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Break down features into stories, create tasks, and assign them using AI
 * POST /api/program-increments/:id/breakdown-and-assign
 */
export const breakdownAndAssign = async (req, res, next) => {
  try {
    const { id } = req.params
    const { featureIds, autoAssign = true } = req.body

    // Find PI
    const programIncrement = await ProgramIncrement.findById(id)
      .populate('project', 'name key team')
      .populate('features', 'title description businessValue acceptanceCriteria')
    
    if (!programIncrement) {
      throw new NotFoundError('Program Increment not found')
    }

    // Get features to break down
    const featuresToBreakdown = featureIds && featureIds.length > 0
      ? await Feature.find({ _id: { $in: featureIds }, project: programIncrement.project._id })
      : programIncrement.features || []

    if (featuresToBreakdown.length === 0) {
      throw new BadRequestError('No features found to break down')
    }

    // Get project team members
    const project = await Project.findById(programIncrement.project._id).populate('team')
    let teamMembers = []
    if (project.team) {
      const team = await Team.findById(project.team._id || project.team).populate('members')
      if (team && team.members) {
        teamMembers = team.members.map((m) => m._id.toString())
      }
    }

    if (teamMembers.length === 0 && autoAssign) {
      throw new BadRequestError('No team members available for task assignment. Please assign a team to the project.')
    }

    const projectKey = project.key
    const results = {
      features: [],
      totalStories: 0,
      totalTasks: 0,
      assignments: [],
      errors: [],
    }

    // Process each feature
    for (const feature of featuresToBreakdown) {
      try {
        // Step 1: Break down feature into stories
        let breakdownResult
        try {
          breakdownResult = await breakDownFeature({
            title: feature.title,
            description: feature.description,
            businessValue: feature.businessValue || '',
            acceptanceCriteria: feature.acceptanceCriteria || [],
          })
        } catch (mlError) {
          logger.error(`ML service error for feature ${feature._id}:`, mlError)
          results.errors.push(`Failed to break down feature "${feature.title}": ML service unavailable`)
          continue
        }

        const suggestedStories = breakdownResult.suggested_breakdown?.stories || breakdownResult.stories || []
        if (suggestedStories.length === 0) {
          results.errors.push(`No stories generated for feature "${feature.title}"`)
          continue
        }

        // Step 2: Pre-calculate storyIds
        const lastStory = await Story.findOne({ project: feature.project, storyId: { $exists: true } })
          .sort({ storyId: -1 })
          .select('storyId')
          .lean()
        
        let storyNumber = 1
        if (lastStory && lastStory.storyId) {
          const match = lastStory.storyId.match(/-(\d+)$/)
          if (match) {
            storyNumber = parseInt(match[1], 10) + 1
          }
        }

        const featureResult = {
          featureId: feature._id.toString(),
          featureTitle: feature.title,
          stories: [],
          tasks: [],
          assignments: [],
        }

        // Step 3: Create stories and tasks
        for (const suggestion of suggestedStories) {
          const storyId = `${projectKey}-${storyNumber}`
          storyNumber++

          const story = new Story({
            storyId,
            title: suggestion.title || 'Untitled Story',
            description: suggestion.description || '',
            acceptanceCriteria: suggestion.acceptance_criteria || suggestion.acceptanceCriteria || [],
            project: feature.project,
            feature: feature._id,
            storyPoints: suggestion.estimated_points || suggestion.estimatedPoints || 0,
            priority: suggestion.priority || 'medium',
            status: 'backlog',
            createdBy: req.user.id,
          })

          await story.save()
          featureResult.stories.push(story.toObject())
          results.totalStories++

          // Create tasks for this story
          const tasks = suggestion.tasks || []
          for (const taskSuggestion of tasks) {
            const task = new Task({
              title: taskSuggestion.title || 'Untitled Task',
              description: taskSuggestion.description || '',
              story: story._id,
              project: feature.project,
              estimatedHours: taskSuggestion.estimated_hours || taskSuggestion.estimatedHours || 2,
              status: 'todo',
              createdBy: req.user.id,
            })

            await task.save()
            featureResult.tasks.push(task.toObject())
            results.totalTasks++

            // Step 4: Get AI recommendations and assign if autoAssign is true
            if (autoAssign && teamMembers.length > 0) {
              try {
                const recommendations = await getTaskAssignmentRecommendations(
                  {
                    id: task._id.toString(),
                    title: task.title,
                    description: task.description,
                    priority: task.priority || 'medium',
                    estimatedHours: task.estimatedHours,
                  },
                  teamMembers
                )

                if (recommendations.length > 0) {
                  const topRecommendation = recommendations[0]
                  const recommendedUserId = topRecommendation.userId || topRecommendation.user_id

                  if (recommendedUserId) {
                    task.assignedTo = recommendedUserId
                    await task.save()

                    featureResult.assignments.push({
                      taskId: task._id.toString(),
                      taskTitle: task.title,
                      assignedTo: recommendedUserId,
                      confidence: topRecommendation.confidence || 0,
                      reasoning: topRecommendation.reasoning || '',
                    })
                    results.assignments.push({
                      taskId: task._id.toString(),
                      taskTitle: task.title,
                      assignedTo: recommendedUserId,
                      userName: topRecommendation.userName || topRecommendation.user?.name || 'Unknown',
                      confidence: topRecommendation.confidence || 0,
                    })
                  }
                }
              } catch (assignError) {
                logger.error(`Error assigning task ${task._id}:`, assignError)
                // Continue without assignment
              }
            }

            // Add task to story
            if (!story.tasks) {
              story.tasks = []
            }
            story.tasks.push(task._id)
          }

          await story.save()
          if (!feature.stories) {
            feature.stories = []
          }
          feature.stories.push(story._id)
        }

        // Update feature
        feature.aiInsights = {
          complexity: breakdownResult.analysis?.complexity || 0,
          suggestedBreakdown: suggestedStories,
          identifiedPersonas: breakdownResult.analysis?.personas || [],
          extractedRequirements: breakdownResult.analysis?.requirements || [],
          analyzedAt: new Date(),
        }
        feature.status = 'broken-down'
        await feature.save()

        results.features.push(featureResult)
      } catch (error) {
        logger.error(`Error processing feature ${feature._id}:`, error)
        results.errors.push(`Error processing feature "${feature.title}": ${error.message}`)
      }
    }

    // Update PI
    await programIncrement.populate('features', 'title status')

    // Create activity log
    await createActivity({
      type: 'created',
      entityType: 'project',
      entityId: programIncrement.project._id,
      user: req.user.id,
      description: `PI Planning: Created ${results.totalStories} stories and ${results.totalTasks} tasks from ${results.features.length} features`,
    })

    return successResponse(
      res,
      results,
      `Successfully processed ${results.features.length} features: ${results.totalStories} stories, ${results.totalTasks} tasks created${autoAssign ? `, ${results.assignments.length} tasks assigned` : ''}`,
      201
    )
  } catch (error) {
    next(error)
  }
}

