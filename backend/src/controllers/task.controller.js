import { Task, Story, User, Notification, Activity, Team, Project, MLFeedback } from '../models/index.js'
import { logTaskAction, getChanges } from '../services/audit.service.js'
import {
  getTaskAssignmentRecommendations,
  submitTaskAssignmentFeedback,
  fetchTaskModelStats,
} from '../services/mlIntegration.service.js'
import { createActivity } from '../services/project.service.js'
import { sanitizeHTML } from '../utils/sanitize.js'
import eventEmitter from '../services/eventEmitter.service.js'
import { sendTaskAssignedEmail, sendTaskStatusChangedEmail } from '../services/email.service.js'
import { successResponse } from '../utils/response.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import logger from '../utils/logger.js'
import {
  checkTaskCircularDependency,
  buildTaskDependencyGraph,
  getTaskDependencyImpact,
} from '../services/dependency.service.js'
import {
  fetchCommitFromGitHub,
  searchCommitsOnGitHub,
  parseCommitUrl,
} from '../services/github.service.js'
import { recordTaskCompletion } from '../services/gamification.service.js'

/**
 * Task Controller
 * HTTP request handlers for tasks
 */

/**
 * Create task
 * POST /api/stories/:storyId/tasks
 */
export const createTask = async (req, res, next) => {
  try {
    const { storyId } = req.params
    const taskData = req.body

    // Check if story exists
    const story = await Story.findById(storyId)
    if (!story) {
      throw new NotFoundError('Story not found')
    }

    // Set story and createdBy
    taskData.story = storyId
    taskData.createdBy = req.user.id

    // Create task
    const task = new Task(taskData)
    await task.save()

    // Update story's tasks array
    story.tasks.push(task._id)
    await story.save()

    // Populate references
    await task.populate('story', 'title storyId')
    await task.populate('assignedTo', 'name email avatar')
    await task.populate('createdBy', 'name email avatar')

    // Create activity log
    await createActivity({
      type: 'created',
      entityType: 'task',
      entityId: task._id,
      user: req.user.id,
      description: `Task "${task.title}" created`,
    })

    // Emit event via event emitter
    eventEmitter.emit('task:created', {
      task: task.toObject(),
      story: task.story,
    })

    return successResponse(res, { task: task.toObject() }, 'Task created successfully', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * Get tasks for story
 * GET /api/stories/:storyId/tasks
 */
export const getTasks = async (req, res, next) => {
  try {
    const { storyId } = req.params
    const user = req.user

    // Check if story exists
    const story = await Story.findById(storyId)
    if (!story) {
      throw new NotFoundError('Story not found')
    }

    // Build query
    const query = { story: storyId }

    // For developers, only show tasks assigned to them
    if (user.role === 'developer') {
      const userId = user._id || user.id
      query.assignedTo = userId
    }

    // Get tasks
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('dependencies', 'title status')
      .sort({ createdAt: -1 })
      .lean()

    return successResponse(res, { tasks }, 'Tasks retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get single task
 * GET /api/tasks/:id
 */
export const getTask = async (req, res, next) => {
  try {
    const { id } = req.params

    const task = await Task.findById(id)
      .populate('story', 'title storyId status')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('dependencies', 'title status')

    if (!task) {
      throw new NotFoundError('Task not found')
    }

    return successResponse(res, { task: task.toObject() }, 'Task retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Update task
 * PUT /api/tasks/:id
 */
export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body // Data is already normalized by validator

    // Find task
    const task = await Task.findById(id)
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    // Track status change for email and metrics
    const oldStatus = task.status
    const oldAssigneeId = task.assignedTo?.toString()
    const statusChanged = updateData.status && updateData.status !== oldStatus

    // Sanitize HTML content if description is being updated
    if (updateData.description) {
      updateData.description = sanitizeHTML(updateData.description)
    }
    
    // Update task
    Object.assign(task, updateData)
    await task.save()

    // Update developer metrics if status or assignee changed
    if (oldStatus !== task.status || oldAssigneeId !== (task.assignedTo?.toString() || task.assignedTo)) {
      const { updateDeveloperWorkload } = await import('../services/developerMetrics.service.js')
      
      // Update old assignee if changed
      if (oldAssigneeId && oldAssigneeId !== (task.assignedTo?.toString() || task.assignedTo)) {
        await updateDeveloperWorkload(oldAssigneeId)
      }
      
      // Update new/current assignee
      if (task.assignedTo) {
        const assigneeId = task.assignedTo._id?.toString() || task.assignedTo.toString() || task.assignedTo
        await updateDeveloperWorkload(assigneeId)
      }
    }

    // Populate references
    await task.populate('story', 'title storyId project')
    await task.populate('assignedTo', 'name email avatar')

    // Send email if status changed and task is assigned
    if (statusChanged && task.assignedTo) {
      try {
        const project = await Project.findById(task.story?.project || task.story?.project?._id).select('name')
        sendTaskStatusChangedEmail(
          task.assignedTo._id || task.assignedTo,
          task,
          oldStatus,
          updateData.status,
          project
        ).catch((err) => {
          logger.error('Error sending task status changed email:', err)
        })
      } catch (err) {
        logger.error('Error preparing task status changed email:', err)
      }
    }

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'task',
      entityId: task._id,
      user: req.user.id,
      description: `Task "${task.title}" updated`,
      metadata: { changes: updateData },
    })

    // Emit event via event emitter
    eventEmitter.emit('task:updated', {
      task: task.toObject(),
      story: task.story,
    })

    return successResponse(res, { task: task.toObject() }, 'Task updated successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Delete task
 * DELETE /api/tasks/:id
 */
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find task
    const task = await Task.findById(id)
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    // Remove from story's tasks array
    await Story.findByIdAndUpdate(task.story, {
      $pull: { tasks: id },
    })

    // Delete task
    await Task.findByIdAndDelete(id)

    // Create activity log
    await createActivity({
      type: 'deleted',
      entityType: 'task',
      entityId: id,
      user: req.user.id,
      description: `Task "${task.title}" deleted`,
    })

    // Emit event via event emitter
    eventEmitter.emit('task:deleted', {
      taskId: id,
      story: task.story,
    })

    return successResponse(res, null, 'Task deleted successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Add task dependency
 * POST /api/tasks/:id/dependencies
 */
export const addTaskDependency = async (req, res, next) => {
  try {
    const { id } = req.params
    const { dependencyId } = req.body

    if (!dependencyId) {
      throw new BadRequestError('dependencyId is required')
    }

    const task = await Task.findById(id).populate('story', 'title project')
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    const dependencyTask = await Task.findById(dependencyId)
    if (!dependencyTask) {
      throw new NotFoundError('Dependency task not found')
    }

    if (task.story.toString() !== dependencyTask.story.toString()) {
      throw new BadRequestError('Dependencies must belong to the same story')
    }

    const alreadyLinked = task.dependencies.some(
      (dep) => dep.toString() === dependencyId.toString()
    )
    if (alreadyLinked) {
      throw new BadRequestError('Dependency already exists for this task')
    }

    const isCircular = await checkTaskCircularDependency(id, dependencyId)
    if (isCircular) {
      throw new BadRequestError('Circular dependency detected. Cannot add dependency.')
    }

    task.dependencies.push(dependencyId)
    await task.save()

    await createActivity({
      type: 'updated',
      entityType: 'task',
      entityId: task._id,
      user: req.user.id,
      description: `Added dependency "${dependencyTask.title}" to task "${task.title}"`,
    })

    await logTaskAction(req.user, 'task_updated', task, {
      after: { dependencyAdded: dependencyTask._id },
    })

    return successResponse(res, { task }, 'Dependency added successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Remove task dependency
 * DELETE /api/tasks/:id/dependencies/:dependencyId
 */
export const removeTaskDependency = async (req, res, next) => {
  try {
    const { id, dependencyId } = req.params

    const task = await Task.findById(id).populate('story', 'title')
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    const dependencyTask = await Task.findById(dependencyId)
    if (!dependencyTask) {
      throw new NotFoundError('Dependency task not found')
    }

    const hasDependency = task.dependencies.some(
      (dep) => dep.toString() === dependencyId.toString()
    )
    if (!hasDependency) {
      throw new BadRequestError('Dependency not found on task')
    }

    task.dependencies = task.dependencies.filter(
      (dep) => dep.toString() !== dependencyId.toString()
    )
    await task.save()

    await createActivity({
      type: 'updated',
      entityType: 'task',
      entityId: task._id,
      user: req.user.id,
      description: `Removed dependency "${dependencyTask.title}" from task "${task.title}"`,
    })

    await logTaskAction(req.user, 'task_updated', task, {
      after: { dependencyRemoved: dependencyTask._id },
    })

    return successResponse(res, { task }, 'Dependency removed successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get dependency graph for task
 * GET /api/tasks/:id/dependencies/graph
 */
export const getTaskDependencyGraph = async (req, res, next) => {
  try {
    const { id } = req.params
    const graph = await buildTaskDependencyGraph(id)
    return successResponse(res, { graph }, 'Task dependency graph retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get dependency impact analysis
 * GET /api/tasks/:id/dependencies/impact
 */
export const getTaskDependencyImpactHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const impact = await getTaskDependencyImpact(id)
    return successResponse(res, { impact }, 'Task dependency impact retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get linked commits for a task
 * GET /api/tasks/:id/commits
 */
export const getTaskCommits = async (req, res, next) => {
  try {
    const { id } = req.params
    const task = await Task.findById(id).select('gitCommits')
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    return successResponse(res, { commits: task.gitCommits || [] }, 'Task commits retrieved')
  } catch (error) {
    next(error)
  }
}

/**
 * Link a GitHub commit to a task
 * POST /api/tasks/:id/commits
 */
export const linkTaskCommit = async (req, res, next) => {
  try {
    const { id } = req.params
    const { commitUrl, sha: bodySha, repo: bodyRepo } = req.body

    if (!commitUrl && !bodySha) {
      throw new BadRequestError('Either commit URL or SHA is required')
    }

    let parsed = null
    if (commitUrl) {
      parsed = parseCommitUrl(commitUrl)
      if (!parsed) {
        throw new BadRequestError('Invalid GitHub commit URL')
      }
    }

    const sha = parsed?.sha || bodySha
    const repo = parsed?.repo || bodyRepo
    const owner = parsed?.owner

    const commitData = await fetchCommitFromGitHub({ repo, owner, sha })
    const task = await Task.findById(id)
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    task.gitCommits = task.gitCommits || []
    const alreadyLinked = task.gitCommits.some((commit) => commit.sha === commitData.sha)
    if (alreadyLinked) {
      throw new BadRequestError('This commit is already linked to the task')
    }

    const commitRecord = {
      ...commitData,
      linkedBy: req.user.id,
      source: 'manual',
      linkedAt: new Date(),
    }

    task.gitCommits.push(commitRecord)
    await task.save()

    await createActivity({
      type: 'updated',
      entityType: 'task',
      entityId: task._id,
      user: req.user.id,
      description: `Linked commit ${commitData.sha.slice(0, 7)} to task "${task.title}"`,
    })

    await logTaskAction(req.user, 'task_updated', task, {
      after: { commitLinked: commitData.sha },
    })

    return successResponse(res, { commit: commitRecord }, 'Commit linked successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Auto-detect GitHub commits referencing the task
 * POST /api/tasks/:id/commits/scan
 */
export const scanTaskCommits = async (req, res, next) => {
  try {
    const { id } = req.params
    const { repo, owner } = req.body || {}

    const task = await Task.findById(id).populate('story', 'storyId title')
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    const identifiers = []
    if (task.story?.storyId) {
      identifiers.push(`"${task.story.storyId}"`)
    }
    identifiers.push(task._id.toString())
    identifiers.push(`"${task.title}"`)

    const searchQuery = identifiers.join(' OR ')
    const searchResults = await searchCommitsOnGitHub({
      repo,
      owner,
      query: searchQuery,
      perPage: 5,
    })

    if (!searchResults.length) {
      return successResponse(res, { commits: [] }, 'No matching commits found')
    }

    task.gitCommits = task.gitCommits || []
    const existingShas = new Set(task.gitCommits.map((commit) => commit.sha))
    const newlyLinked = []

    for (const result of searchResults) {
      if (existingShas.has(result.sha)) {
        continue
      }

      try {
        const commitDetails = await fetchCommitFromGitHub({
          repo: result.repo?.split('/')?.[1],
          owner: result.repo?.split('/')?.[0],
          sha: result.sha,
        })

        const commitRecord = {
          ...commitDetails,
          linkedBy: req.user.id,
          source: 'auto',
          linkedAt: new Date(),
        }

        task.gitCommits.push(commitRecord)
        newlyLinked.push(commitRecord)
        existingShas.add(result.sha)
      } catch (commitError) {
        logger.error('Error linking commit during scan:', commitError)
      }
    }

    if (newlyLinked.length > 0) {
      await task.save()

      await createActivity({
        type: 'updated',
        entityType: 'task',
        entityId: task._id,
        user: req.user.id,
        description: `Auto-linked ${newlyLinked.length} commit(s) to task "${task.title}"`,
      })

      await logTaskAction(req.user, 'task_updated', task, {
        after: { commitsLinked: newlyLinked.map((commit) => commit.sha) },
      })
    }

    return successResponse(
      res,
      { commits: newlyLinked },
      newlyLinked.length ? 'Commits linked successfully' : 'No new commits linked'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Assign task to user
 * POST /api/tasks/:id/assign
 */
export const assignTask = async (req, res, next) => {
  try {
    const { id } = req.params
    const { userId } = req.body

    // Find task
    const task = await Task.findById(id).populate('story', 'title')
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Update task
    const oldAssigneeId = task.assignedTo?.toString()
    task.assignedTo = userId
    await task.save()

    // Update developer metrics for both old and new assignees
    const { updateDeveloperWorkload } = await import('../services/developerMetrics.service.js')
    if (oldAssigneeId && oldAssigneeId !== userId.toString()) {
      // Remove workload from old assignee
      await updateDeveloperWorkload(oldAssigneeId)
    }
    // Add workload to new assignee
    await updateDeveloperWorkload(userId)

    // Populate references
    await task.populate('assignedTo', 'name email avatar')
    await task.populate('story', 'title storyId')

    // Create notification
    await Notification.create({
      user: userId,
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `You have been assigned to task "${task.title}" in story "${task.story.title}"`,
      entityType: 'task',
      entityId: task._id,
    })

    // Send email notification (async, don't wait)
    try {
      const project = await Project.findById(task.story.project || task.story.project?._id).select('name')
      sendTaskAssignedEmail(userId, task, project).catch((err) => {
        logger.error('Error sending task assigned email:', err)
      })
    } catch (err) {
      logger.error('Error preparing task assigned email:', err)
    }

    // Create activity log
    await createActivity({
      type: 'assigned',
      entityType: 'task',
      entityId: task._id,
      user: req.user.id,
      description: `Task "${task.title}" assigned to ${user.name}`,
    })

    // Emit event via event emitter
    eventEmitter.emit('task:assigned', {
      task: task.toObject(),
      assignee: user.toObject(),
      story: task.story,
    })

    return successResponse(res, { task: task.toObject() }, 'Task assigned successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Assign task using AI recommendation
 * POST /api/tasks/:id/assign-ai
 */
export const assignTaskWithAI = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find task
    const task = await Task.findById(id).populate({
      path: 'story',
      select: 'title project',
      populate: {
        path: 'project',
        select: 'team',
      },
    })
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    // Get project team members
    const { Project } = await import('../models/index.js')
    const projectDoc = await Project.findById(task.story.project._id || task.story.project).populate('team')
    
    let teamMembers = []
    if (projectDoc.team) {
      const team = await Team.findById(projectDoc.team._id).populate('members')
      teamMembers = team.members.map((m) => m._id.toString())
    }

    if (teamMembers.length === 0) {
      throw new BadRequestError('No team members available for assignment')
    }

    // Get AI recommendations
    let recommendations = []
    try {
      recommendations = await getTaskAssignmentRecommendations(
        {
          title: task.title,
          description: task.description,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          storyId: task.story._id.toString(),
        },
        teamMembers
      )
    } catch (mlError) {
      logger.error('ML service error:', mlError)
      throw new BadRequestError('Failed to get AI recommendations. ML service unavailable.')
    }

    if (recommendations.length === 0) {
      throw new BadRequestError('No recommendations available')
    }

    // Get top recommendation
    const topRecommendation = recommendations[0]
    const recommendedUserId = topRecommendation.userId

    // Find recommended user
    const recommendedUser = await User.findById(recommendedUserId)
    if (!recommendedUser) {
      throw new NotFoundError('Recommended user not found')
    }

    // Update task
    task.assignedTo = recommendedUserId
    task.aiRecommendation = {
      suggestedAssignee: recommendedUserId,
      confidence: topRecommendation.confidence || 0,
      reasoning: topRecommendation.reasoning || '',
    }
    await task.save()

    // Populate references
    await task.populate('assignedTo', 'name email avatar')
    await task.populate('story', 'title storyId')

    // Create notification
    await Notification.create({
      user: recommendedUserId,
      type: 'task_assigned',
      title: 'Task Assigned (AI Recommended)',
      message: `You have been assigned to task "${task.title}" based on AI recommendation`,
      entityType: 'task',
      entityId: task._id,
    })

    // Create activity log
    await createActivity({
      type: 'assigned',
      entityType: 'task',
      entityId: task._id,
      user: req.user.id,
      description: `Task "${task.title}" assigned to ${recommendedUser.name} (AI recommended)`,
      metadata: { aiRecommendation: task.aiRecommendation },
    })

    // Emit event via event emitter
    eventEmitter.emit('task:assigned', {
      task: task.toObject(),
      assignee: recommendedUser.toObject(),
      aiRecommendation: task.aiRecommendation,
      story: task.story,
    })

    // Collect feedback for ML learning (async, don't wait)
    try {
      const project = await Project.findById(task.story.project?._id || task.story.project).select('team')
      await MLFeedback.create({
        modelType: 'task_assignment',
        predictionId: `task-${task._id}-${Date.now()}`,
        prediction: {
          taskId: task._id.toString(),
          recommendedUser: recommendedUserId,
          confidence: topRecommendation.confidence || 0,
          reasoning: topRecommendation.reasoning || '',
        },
        actualOutcome: {
          assignedTo: recommendedUserId,
        },
        feedback: {
          acceptedByUser: true, // User accepted AI recommendation
          wasAccurate: true,
        },
        accuracy: 1.0,
        context: {
          team: project?.team,
          project: task.story.project?._id || task.story.project,
          user: req.user.id,
        },
        metadata: {
          predictionTimestamp: new Date(),
          outcomeTimestamp: new Date(),
        },
      })
    } catch (feedbackError) {
      logger.warn('Failed to record task assignment feedback:', feedbackError)
      // Don't fail the request if feedback recording fails
    }

    return successResponse(
      res,
      {
        task: task.toObject(),
        recommendation: topRecommendation,
      },
      'Task assigned using AI recommendation successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get assignment recommendations
 * GET /api/tasks/:id/recommendations
 */
export const getAssignmentRecommendations = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find task with proper population
    const task = await Task.findById(id).populate({
      path: 'story',
      select: 'title project',
      populate: {
        path: 'project',
        select: 'name key team',
        populate: {
          path: 'team',
          select: 'name members',
        },
      },
    })
    
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    if (!task.story) {
      return successResponse(res, { recommendations: [] }, 'Task has no associated story')
    }

    if (!task.story.project) {
      return successResponse(res, { recommendations: [] }, 'Story has no associated project')
    }

    // Get project team members with their metrics
    const project = task.story.project
    let teamMembers = []
    
    // Handle both populated and unpopulated team
    const teamId = project.team?._id || project.team
    if (teamId) {
      const team = await Team.findById(teamId).populate('members', 'name email avatar skills availability role currentWorkload velocity completionRate onTimeDelivery qualityScore timeAccuracy')
      if (team && team.members && team.members.length > 0) {
        // Use member IDs for ML service (it will fetch full data)
        teamMembers = team.members.map((m) => m._id.toString())
      }
    }

    if (teamMembers.length === 0) {
      logger.warn(`No team members found for task ${id}. Project: ${project._id}, Team: ${teamId}`)
      return successResponse(res, { recommendations: [] }, 'No team members available. Please assign a team to the project with members.')
    }

    // Get AI recommendations
    let recommendations = []
    try {
      recommendations = await getTaskAssignmentRecommendations(
        {
          title: task.title,
          description: task.description,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          storyId: task.story._id.toString(),
        },
        teamMembers
      )
    } catch (mlError) {
      logger.error('ML service error:', mlError)
      throw new BadRequestError('Failed to get recommendations. ML service unavailable.')
    }

    // Populate user details
    // Import mongoose for ObjectId validation
    const mongoose = (await import('mongoose')).default
    const userIds = recommendations.map((r) => {
      // Handle both userId and user_id formats from ML service
      const userId = r.userId || r.user_id
      if (!userId) return null
      try {
        if (mongoose.Types.ObjectId.isValid(userId)) {
          return new mongoose.Types.ObjectId(userId)
        }
        return userId
      } catch {
        return userId
      }
    }).filter(id => id !== null) // Remove null values
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email avatar skills availability role')
      .lean()

    const recommendationsWithUsers = recommendations
      .map((rec) => {
        // Normalize userId to string for comparison (handle both userId and user_id)
        const recUserId = (rec.userId || rec.user_id)?.toString() || rec.userId || rec.user_id
        if (!recUserId) {
          logger.warn('Recommendation missing userId:', rec)
          return null
        }
        
        const user = users.find((u) => {
          const uId = u._id?.toString() || u._id
          return uId === recUserId
        })
        
        if (!user) {
          logger.warn(`User not found for recommendation userId: ${recUserId}`)
          return null
        }
        
        return {
          ...rec,
          userId: recUserId, // Ensure userId is always a string
          user_id: recUserId, // Also include user_id for compatibility
          user: {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            skills: user.skills || [],
            availability: user.availability,
            role: user.role,
          },
        }
      })
      .filter(rec => rec !== null) // Remove recommendations without valid users

    return successResponse(
      res,
      { recommendations: recommendationsWithUsers },
      'Recommendations retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Submit feedback for AI recommendations
 * POST /api/tasks/:id/ai/feedback
 */
export const submitTaskRecommendationFeedback = async (req, res, next) => {
  try {
    const { id } = req.params
    const { helpful, recommendationId, selectedAssignee, notes } = req.body || {}

    if (typeof helpful !== 'boolean') {
      throw new BadRequestError('Please specify if the recommendation was helpful')
    }

    await submitTaskAssignmentFeedback({
      task_id: id,
      recommendation_id: recommendationId,
      helpful,
      selected_assignee: selectedAssignee,
      reviewer_id: req.user.id,
      reviewer_role: req.user.role,
      notes: notes || '',
      timestamp: new Date().toISOString(),
    })

    return successResponse(res, { acknowledged: true }, 'Feedback recorded successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get task model stats
 * GET /api/tasks/ai/model-stats
 */
export const getTaskModelStats = async (req, res, next) => {
  try {
    const stats = await fetchTaskModelStats()
    return successResponse(res, { stats }, 'Model stats retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Start task
 * POST /api/tasks/:id/start
 */
export const startTask = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find task
    const task = await Task.findById(id)
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    // Update status
    task.status = 'in-progress'
    await task.save()

    // Populate references
    await task.populate('story', 'title storyId')
    await task.populate('assignedTo', 'name email avatar')

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'task',
      entityId: task._id,
      user: req.user.id,
      description: `Task "${task.title}" started`,
    })

    return successResponse(res, { task: task.toObject() }, 'Task started successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Complete task
 * POST /api/tasks/:id/complete
 */
export const completeTask = async (req, res, next) => {
  try {
    const { id } = req.params
    const { actualHours } = req.body

    // Find task
    const task = await Task.findById(id)
    if (!task) {
      throw new NotFoundError('Task not found')
    }
    const assigneeId = task.assignedTo

    // Update status and actual hours
    const oldStatus = task.status
    task.status = 'done'
    task.completedAt = new Date()
    if (actualHours !== undefined) {
      task.actualHours = actualHours
    }
    await task.save()

    // Populate story reference first
    await task.populate('story', 'title storyId status sprint project')
    
    // Check if all tasks in the story are now completed
    if (task.story) {
      const storyId = task.story._id || task.story
      const allTasks = await Task.find({ story: storyId })
      const allTasksDone = allTasks.length > 0 && allTasks.every(t => t.status === 'done')
      
      // If all tasks are done and story is not already 'done', mark story as done
      if (allTasksDone && task.story.status !== 'done') {
        const story = await Story.findById(storyId)
        if (story && story.status !== 'done') {
          const oldStoryStatus = story.status
          story.status = 'done'
          story.completedAt = new Date()
          await story.save()
          
          // Update sprint velocity if story belongs to a sprint
          if (story.sprint) {
            const { updateSprintVelocity } = await import('../services/sprint.service.js')
            await updateSprintVelocity(story.sprint.toString())
          }
          
          // Update project progress if story belongs to a project
          if (story.project) {
            const { updateProjectProgress } = await import('../services/project.service.js')
            const projectId = story.project._id?.toString() || story.project.toString() || story.project
            await updateProjectProgress(projectId)
          }
          
          // Update developer metrics for story completion
          if (story.assignedTo) {
            const { updateAllDeveloperMetrics } = await import('../services/developerMetrics.service.js')
            await updateAllDeveloperMetrics(story.assignedTo.toString())
          }
          
          // Emit story completed event
          eventEmitter.emit('story:completed', {
            story: story.toObject(),
            sprint: story.sprint,
            project: story.project,
          })
          
          // Emit story updated event for real-time updates
          eventEmitter.emit('story:updated', {
            story: story.toObject(),
            oldStatus: oldStoryStatus,
            newStatus: 'done',
          })
          
          logger.info(`Story ${storyId} automatically marked as done (all tasks completed)`)
        }
      }
    }

    // Update developer metrics when task is completed
    if (assigneeId && oldStatus !== 'done') {
      const { updateAllDeveloperMetrics } = await import('../services/developerMetrics.service.js')
      await updateAllDeveloperMetrics(assigneeId.toString())
    }

    // Populate references
    await task.populate('assignedTo', 'name email avatar')

    // Create activity log
    await createActivity({
      type: 'completed',
      entityType: 'task',
      entityId: task._id,
      user: req.user.id,
      description: `Task "${task.title}" completed`,
    })

    // Emit event via event emitter
    eventEmitter.emit('task:completed', {
      task: task.toObject(),
      story: task.story,
    })

    if (assigneeId) {
      await recordTaskCompletion({
        userId: assigneeId,
        task,
      })
    }

    return successResponse(res, { task: task.toObject() }, 'Task completed successfully')
  } catch (error) {
    next(error)
  }
}

