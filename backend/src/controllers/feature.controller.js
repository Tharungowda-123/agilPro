import mongoose from 'mongoose'
import { Feature, Project, Story, Task } from '../models/index.js'
import { breakDownFeature, analyzeFeature } from '../services/mlIntegration.service.js'
import { createActivity } from '../services/project.service.js'
import eventEmitter from '../services/eventEmitter.service.js'
import { successResponse, paginatedResponse } from '../utils/response.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * Feature Controller
 * HTTP request handlers for features
 */

/**
 * Create feature
 * POST /api/projects/:projectId/features
 */
export const createFeature = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const featureData = req.body

    // Check if project exists
    const project = await Project.findById(projectId)
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    // Set project and createdBy
    featureData.project = projectId
    featureData.createdBy = req.user.id

    // Create feature
    const feature = new Feature(featureData)
    await feature.save()

    // Populate references
    await feature.populate('project', 'name key')
    await feature.populate('createdBy', 'name email avatar')

    // Create activity log
    await createActivity({
      type: 'created',
      entityType: 'project',
      entityId: projectId,
      user: req.user.id,
      description: `Feature "${feature.title}" created`,
    })

    // Emit event via event emitter
    eventEmitter.emit('feature:created', { feature: feature.toObject() })

    return successResponse(res, { feature: feature.toObject() }, 'Feature created successfully', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * Create feature (standalone endpoint)
 * POST /api/features
 */
export const createFeatureStandalone = async (req, res, next) => {
  try {
    const featureData = req.body
    const { projectId } = featureData

    if (!projectId) {
      throw new BadRequestError('Project ID is required')
    }

    // Check if project exists
    const project = await Project.findById(projectId)
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    // Set project and createdBy
    featureData.project = projectId
    featureData.createdBy = req.user.id

    // Create feature
    const feature = new Feature(featureData)
    await feature.save()

    // Populate references
    await feature.populate('project', 'name key')
    await feature.populate('createdBy', 'name email avatar')

    // Create activity log
    await createActivity({
      type: 'created',
      entityType: 'project',
      entityId: projectId,
      user: req.user.id,
      description: `Feature "${feature.title}" created`,
    })

    // Emit event via event emitter
    eventEmitter.emit('feature:created', { feature: feature.toObject() })

    return successResponse(res, { feature: feature.toObject() }, 'Feature created successfully', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * Get features with filters
 * GET /api/features (with query params) or GET /api/projects/:projectId/features
 */
export const getFeatures = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { project, priority, status, search, page = 1, limit = 10 } = req.query

    // Build query
    const query = {}

    // Project filter - from params or query
    const projectFilter = projectId || project
    if (projectFilter) {
      // Check if project exists
      const projectDoc = await Project.findById(projectFilter)
      if (!projectDoc) {
        throw new NotFoundError('Project not found')
      }
      query.project = projectFilter
    }

    if (priority) {
      query.priority = priority
    }

    if (status) {
      query.status = status
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const limitNum = parseInt(limit) || 10

    // Get features with pagination
    const [features, total] = await Promise.all([
      Feature.find(query)
        .populate('stories', 'title storyId status storyPoints')
        .populate('project', 'name key')
        .populate('createdBy', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Feature.countDocuments(query),
    ])

    // Calculate progress for each feature
    const featuresWithProgress = features.map((feature) => {
      const stories = feature.stories || []
      const completedStories = stories.filter((s) => s.status === 'done').length
      const totalStories = stories.length
      const progress = totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0

      return {
        ...feature,
        progress,
        completedStories,
        totalStories,
      }
    })

    const totalPages = Math.ceil(total / limitNum)
    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      total,
      totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1,
    }

    return paginatedResponse(res, featuresWithProgress, pagination, 'Features retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get single feature
 * GET /api/features/:id
 */
export const getFeature = async (req, res, next) => {
  try {
    const { id } = req.params

    const feature = await Feature.findById(id)
      .populate('project', 'name key')
      .populate({
        path: 'stories',
        populate: {
          path: 'assignedTo',
          select: 'name email avatar',
        },
      })
      .populate('createdBy', 'name email avatar')

    if (!feature) {
      throw new NotFoundError('Feature not found')
    }

    return successResponse(res, { feature: feature.toObject() }, 'Feature retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Update feature
 * PUT /api/features/:id
 */
export const updateFeature = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Find feature
    const feature = await Feature.findById(id)
    if (!feature) {
      throw new NotFoundError('Feature not found')
    }

    // Update feature
    Object.assign(feature, updateData)
    await feature.save()

    // Populate references
    await feature.populate('project', 'name key')
    await feature.populate('stories', 'title storyId status')

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'project',
      entityId: feature.project,
      user: req.user.id,
      description: `Feature "${feature.title}" updated`,
    })

    // Emit event via event emitter
    eventEmitter.emit('feature:updated', { feature: feature.toObject() })

    return successResponse(res, { feature: feature.toObject() }, 'Feature updated successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Delete feature
 * DELETE /api/features/:id
 * Supports deleteChildren query param: if true, deletes child stories; if false, orphans them
 */
export const deleteFeature = async (req, res, next) => {
  try {
    const { id } = req.params
    const { deleteChildren } = req.query

    // Find feature
    const feature = await Feature.findById(id).populate('stories')
    if (!feature) {
      throw new NotFoundError('Feature not found')
    }

    const projectId = feature.project

    // Handle child stories
    if (feature.stories && feature.stories.length > 0) {
      if (deleteChildren === 'true') {
        // Delete all child stories and their tasks
        for (const storyId of feature.stories) {
          const story = await Story.findById(storyId).populate('tasks')
          if (story) {
            // Delete all tasks for this story
            if (story.tasks && story.tasks.length > 0) {
              const Task = mongoose.model('Task')
              await Task.deleteMany({ _id: { $in: story.tasks } })
            }
            // Delete the story
            await Story.findByIdAndDelete(storyId)
          }
        }
      } else {
        // Orphan stories: remove feature reference but keep stories
        await Story.updateMany(
          { _id: { $in: feature.stories } },
          { $unset: { feature: 1 } }
        )
      }
    }

    // Delete feature
    await Feature.findByIdAndDelete(id)

    // Create activity log
    await createActivity({
      type: 'deleted',
      entityType: 'project',
      entityId: projectId,
      user: req.user.id,
      description: `Feature "${feature.title}" deleted${deleteChildren === 'true' ? ' with all child stories' : ''}`,
    })

    // Emit event via event emitter
    eventEmitter.emit('feature:deleted', {
      featureId: id,
      projectId,
    })

    return successResponse(res, null, 'Feature deleted successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Analyze feature using AI (NLP analysis only, no creation)
 * POST /api/features/:id/analyze
 */
export const analyzeFeatureHandler = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find feature
    const feature = await Feature.findById(id).populate('project', 'name key')
    if (!feature) {
      throw new NotFoundError('Feature not found')
    }

    // Call ML service to analyze feature
    let analysis = null
    try {
      const result = await analyzeFeature({
        title: feature.title,
        description: feature.description,
        acceptanceCriteria: feature.acceptanceCriteria || [],
        businessValue: feature.businessValue || '',
      })
      analysis = result.analysis || result
    } catch (mlError) {
      logger.error('ML service error:', mlError)
      throw new BadRequestError('Failed to analyze feature. ML service unavailable.')
    }

    // Update feature with AI insights
    feature.aiInsights = {
      complexity: analysis.complexity || 0,
      suggestedBreakdown: [],
      identifiedPersonas: analysis.personas || [],
      extractedRequirements: analysis.requirements || [],
      analyzedAt: new Date(),
    }
    await feature.save()

    return successResponse(res, { analysis }, 'Feature analyzed successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Break down feature into stories and tasks using AI (returns suggestions, doesn't create)
 * POST /api/features/:id/breakdown
 */
export const breakDownFeatureHandler = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find feature
    const feature = await Feature.findById(id).populate('project', 'name key')
    if (!feature) {
      throw new NotFoundError('Feature not found')
    }

    // Call ML service to break down feature
    let breakdownResult = null
    try {
      breakdownResult = await breakDownFeature({
        title: feature.title,
        description: feature.description,
        acceptanceCriteria: feature.acceptanceCriteria || [],
        businessValue: feature.businessValue || '',
      })
    } catch (mlError) {
      logger.error('ML service error:', mlError)
      throw new BadRequestError('Failed to break down feature. ML service unavailable.')
    }

    const analysis = breakdownResult.analysis || {}
    const suggestedBreakdown = breakdownResult.suggested_breakdown || breakdownResult

    // Update feature with AI insights
    feature.aiInsights = {
      complexity: analysis.complexity || 0,
      suggestedBreakdown: suggestedBreakdown.stories || [],
      identifiedPersonas: analysis.personas || [],
      extractedRequirements: analysis.requirements || [],
      analyzedAt: new Date(),
    }
    feature.status = 'in-breakdown'
    await feature.save()

    return successResponse(
      res,
      {
        analysis,
        suggestedBreakdown,
        confidence: breakdownResult.confidence || 0.85,
      },
      'Feature breakdown generated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Auto-breakdown and create (one-click instant breakdown)
 * POST /api/features/:id/auto-breakdown-and-create
 */
export const autoBreakdownAndCreate = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find feature
    const feature = await Feature.findById(id).populate('project', 'name key')
    if (!feature) {
      throw new NotFoundError('Feature not found')
    }

    // Step 1: Get breakdown from ML service
    let breakdownResult
    try {
      breakdownResult = await breakDownFeature({
        title: feature.title,
        description: feature.description,
        businessValue: feature.businessValue || '',
        acceptanceCriteria: feature.acceptanceCriteria || [],
      })
    } catch (mlError) {
      logger.error('ML service error:', mlError)
      throw new BadRequestError('Failed to break down feature. ML service unavailable.')
    }

    const suggestedStories = breakdownResult.suggested_breakdown?.stories || breakdownResult.stories || []

    if (suggestedStories.length === 0) {
      throw new BadRequestError('No stories generated. Please try again.')
    }

    // Step 2: Pre-calculate storyIds to avoid race conditions
    const projectKey = feature.project.key
    const lastStory = await Story.findOne({ project: feature.project._id, storyId: { $exists: true } })
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

    // Step 3: Immediately create all stories and tasks
    const createdStories = []
    const createdTasks = []
    let totalPoints = 0

    for (const suggestion of suggestedStories) {
      // Generate unique storyId
      const storyId = `${projectKey}-${storyNumber}`
      storyNumber++

      // Create story with pre-calculated storyId
      const story = new Story({
        storyId, // Set explicitly to avoid race condition in pre-save hook
        title: suggestion.title || 'Untitled Story',
        description: suggestion.description || '',
        acceptanceCriteria: suggestion.acceptance_criteria || suggestion.acceptanceCriteria || [],
        project: feature.project._id,
        feature: feature._id,
        storyPoints: suggestion.estimated_points || suggestion.estimatedPoints || 0,
        priority: suggestion.priority || 'medium',
        status: 'backlog',
        createdBy: req.user.id,
      })

      await story.save()
      createdStories.push(story)
      totalPoints += story.storyPoints

      // Create tasks for this story
      const tasks = suggestion.tasks || []
      for (const taskSuggestion of tasks) {
        const task = new Task({
          title: taskSuggestion.title || 'Untitled Task',
          description: taskSuggestion.description || '',
          story: story._id,
          project: feature.project._id,
          estimatedHours: taskSuggestion.estimated_hours || taskSuggestion.estimatedHours || 2,
          status: 'todo',
          createdBy: req.user.id,
        })

        await task.save()
        createdTasks.push(task)
        story.tasks.push(task._id)
      }

      await story.save()
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

    // Create activity log
    await createActivity({
      type: 'created',
      entityType: 'project',
      entityId: feature.project._id,
      user: req.user.id,
      description: `Auto-created ${createdStories.length} stories and ${createdTasks.length} tasks for feature "${feature.title}"`,
    })

    // Emit events
    eventEmitter.emit('feature:broken-down', {
      featureId: id,
      storiesCount: createdStories.length,
      tasksCount: createdTasks.length,
    })

    return successResponse(
      res,
      {
        stories: createdStories.map((s) => s.toObject()),
        tasksCount: createdTasks.length,
        totalPoints,
      },
      `Created ${createdStories.length} stories and ${createdTasks.length} tasks successfully`,
      201
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Accept breakdown and create stories with tasks
 * POST /api/features/:id/accept-breakdown
 */
export const acceptBreakdown = async (req, res, next) => {
  try {
    const { id } = req.params
    const { storyIds, createAll = false } = req.body

    // Find feature
    const feature = await Feature.findById(id).populate('project', 'name key')
    if (!feature) {
      throw new NotFoundError('Feature not found')
    }

    if (!feature.aiInsights || !feature.aiInsights.suggestedBreakdown) {
      throw new BadRequestError('No breakdown suggestions available. Please run breakdown first.')
    }

    const suggestedStories = feature.aiInsights.suggestedBreakdown
    const storiesToCreate = createAll
      ? suggestedStories
      : suggestedStories.filter((story, index) => storyIds?.includes(index) || storyIds?.includes(story.title))

    if (storiesToCreate.length === 0) {
      throw new BadRequestError('No stories selected to create')
    }

    // Pre-calculate storyIds to avoid race conditions
    const projectKey = feature.project.key
    const lastStory = await Story.findOne({ project: feature.project._id, storyId: { $exists: true } })
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

    const createdStories = []
    const createdTasks = []
    let totalPoints = 0

    // Create stories and tasks
    for (const suggestion of storiesToCreate) {
      // Generate unique storyId
      const storyId = `${projectKey}-${storyNumber}`
      storyNumber++

      // Create story with pre-calculated storyId
      const story = new Story({
        storyId, // Set explicitly to avoid race condition in pre-save hook
        title: suggestion.title || 'Untitled Story',
        description: suggestion.description || '',
        acceptanceCriteria: suggestion.acceptance_criteria || suggestion.acceptanceCriteria || [],
        project: feature.project._id,
        feature: feature._id,
        storyPoints: suggestion.estimated_points || suggestion.estimatedPoints || 0,
        priority: suggestion.priority || 'medium',
        status: 'backlog',
        createdBy: req.user.id,
      })

      await story.save()
      createdStories.push(story)
      totalPoints += story.storyPoints

      // Create tasks for this story
      const tasks = suggestion.tasks || []
      for (const taskSuggestion of tasks) {
        const task = new Task({
          title: taskSuggestion.title || 'Untitled Task',
          description: taskSuggestion.description || '',
          story: story._id,
          project: feature.project._id,
          estimatedHours: taskSuggestion.estimated_hours || taskSuggestion.estimatedHours || 2,
          status: 'todo',
          createdBy: req.user.id,
        })

        await task.save()
        createdTasks.push(task)

        // Add task to story
        if (!story.tasks) {
          story.tasks = []
        }
        story.tasks.push(task._id)
      }

      await story.save()

      // Add story to feature
      feature.stories.push(story._id)
    }

    // Update feature
    feature.status = 'broken-down'
    feature.estimatedStoryPoints = totalPoints
    await feature.save()

    // Populate created stories
    await Story.populate(createdStories, {
      path: 'assignedTo',
      select: 'name email avatar',
    })

    // Create activity log
    await createActivity({
      type: 'created',
      entityType: 'project',
      entityId: feature.project._id,
      user: req.user.id,
      description: `Feature "${feature.title}" broken down: ${createdStories.length} stories, ${createdTasks.length} tasks created`,
    })

    // Emit event via event emitter
    eventEmitter.emit('feature:broken-down', {
      featureId: id,
      projectId: feature.project._id,
      stories: createdStories.map((s) => s.toObject()),
      tasks: createdTasks.length,
    })

    return successResponse(
      res,
      {
        stories: createdStories.map((s) => s.toObject()),
        tasksCount: createdTasks.length,
        totalPoints,
      },
      `Created ${createdStories.length} stories with ${createdTasks.length} tasks successfully`,
      201
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Add story to feature manually
 * POST /api/features/:id/stories
 */
export const addStoryToFeature = async (req, res, next) => {
  try {
    const { id } = req.params
    const { storyId } = req.body

    // Find feature
    const feature = await Feature.findById(id)
    if (!feature) {
      throw new NotFoundError('Feature not found')
    }

    // Find story
    const story = await Story.findById(storyId)
    if (!story) {
      throw new NotFoundError('Story not found')
    }

    // Check if story belongs to same project
    if (story.project.toString() !== feature.project.toString()) {
      throw new BadRequestError('Story must belong to the same project as the feature')
    }

    // Add story to feature if not already added
    if (!feature.stories.includes(storyId)) {
      feature.stories.push(storyId)
      await feature.save()
    }

    // Update story's feature reference
    story.feature = feature._id
    await story.save()

    // Populate references
    await feature.populate('stories', 'title storyId status storyPoints')
    await feature.populate('project', 'name key')

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'project',
      entityId: feature.project,
      user: req.user.id,
      description: `Story "${story.title}" added to feature "${feature.title}"`,
    })

    // Emit event via event emitter
    eventEmitter.emit('feature:story-added', {
      featureId: id,
      storyId,
      feature: feature.toObject(),
    })

    return successResponse(res, { feature: feature.toObject() }, 'Story added to feature successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get feature progress
 * GET /api/features/:id/progress
 */
export const getFeatureProgress = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find feature with stories
    const feature = await Feature.findById(id)
      .populate('stories', 'title storyId status storyPoints')
      .populate('project', 'name key')

    if (!feature) {
      throw new NotFoundError('Feature not found')
    }

    const stories = feature.stories || []
    const totalStories = stories.length
    const completedStories = stories.filter((s) => s.status === 'done').length
    const inProgressStories = stories.filter((s) => s.status === 'in-progress').length
    const readyStories = stories.filter((s) => s.status === 'ready').length
    const backlogStories = stories.filter((s) => s.status === 'backlog').length

    // Calculate story points
    const estimatedPoints = feature.estimatedStoryPoints || 0
    const actualPoints = stories.reduce((sum, story) => sum + (story.storyPoints || 0), 0)
    const completedPoints = stories
      .filter((s) => s.status === 'done')
      .reduce((sum, story) => sum + (story.storyPoints || 0), 0)

    // Calculate progress percentage
    const progress = totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0
    const pointsProgress = estimatedPoints > 0 ? Math.round((completedPoints / estimatedPoints) * 100) : 0

    const progressData = {
      feature: {
        id: feature._id,
        title: feature.title,
        status: feature.status,
      },
      stories: {
        total: totalStories,
        completed: completedStories,
        inProgress: inProgressStories,
        ready: readyStories,
        backlog: backlogStories,
      },
      storyPoints: {
        estimated: estimatedPoints,
        actual: actualPoints,
        completed: completedPoints,
      },
      progress: {
        byStories: progress,
        byPoints: pointsProgress,
      },
    }

    return successResponse(res, progressData, 'Feature progress retrieved successfully')
  } catch (error) {
    next(error)
  }
}

