import { Project, Story, Sprint, Team, Organization } from '../models/index.js'
import {
  generateProjectKey,
  calculateProjectProgress,
  getProjectVelocity,
  isUserAuthorized,
  createActivity,
  getProjectMetrics as getProjectMetricsService,
  getTeamPerformance as getTeamPerformanceService,
} from '../services/project.service.js'
import { logProjectAction, getChanges } from '../services/audit.service.js'
import eventEmitter from '../services/eventEmitter.service.js'
import { successResponse, paginatedResponse } from '../utils/response.js'
import { NotFoundError, ForbiddenError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * Project Controller
 * HTTP request handlers for projects
 */

/**
 * Get projects with pagination and filters
 * GET /api/projects
 */
export const getProjects = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      teamId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    // Build query
    const query = { isArchived: false }

    // Calculate pagination early (needed for early returns)
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const limitNum = parseInt(limit)

    // Role-based filtering: Non-admins can only see their team's projects
    if (req.user.role !== 'admin') {
      if (req.user.team) {
        query.team = req.user.team._id || req.user.team
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
          'Projects retrieved successfully'
        )
      }
    }

    // Filter by status
    if (status) {
      query.status = status
    }

    // Filter by team (admin can filter by any team, others are already filtered)
    if (teamId && req.user.role === 'admin') {
      query.team = teamId
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { key: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    // Build sort object
    const sort = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Execute query
    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('team', 'name members')
        .populate('createdBy', 'name email avatar')
        .populate('defaultSprintTemplate', 'name durationDays capacity')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Project.countDocuments(query),
    ])

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

    return paginatedResponse(res, projects, pagination, 'Projects retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get single project
 * GET /api/projects/:id
 */
export const getProject = async (req, res, next) => {
  try {
    // Project access is already checked by checkProjectAccess middleware
    // Use req.project if available, otherwise fetch it
    let project = req.project
    if (!project) {
      project = await Project.findById(req.params.id)
        .populate('team', 'name members capacity velocity')
        .populate('createdBy', 'name email avatar')
        .populate({
          path: 'organization',
          select: 'name domain',
        })
        .populate('defaultSprintTemplate', 'name durationDays capacity')
    } else {
      // Populate if not already populated
      await project.populate('team', 'name members capacity velocity')
      await project.populate('createdBy', 'name email avatar')
      await project.populate({
        path: 'organization',
        select: 'name domain',
      })
      await project.populate('defaultSprintTemplate', 'name durationDays capacity')
    }

    if (!project) {
      throw new NotFoundError('Project not found')
    }

    // Get sprints for the project
    const projectId = project._id.toString()
    const sprints = await Sprint.find({ project: projectId }).select('name status startDate endDate')

    const projectData = project.toObject()
    projectData.sprints = sprints

    return successResponse(res, { project: projectData }, 'Project retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Create new project
 * POST /api/projects
 */
export const createProject = async (req, res, next) => {
  try {
    const projectData = req.body

    // Generate unique project key if not provided
    if (!projectData.key) {
      projectData.key = await generateProjectKey(projectData.name)
    } else {
      // Check if key already exists
      const existingProject = await Project.findOne({ key: projectData.key.toUpperCase() })
      if (existingProject) {
        projectData.key = await generateProjectKey(projectData.name)
      } else {
        projectData.key = projectData.key.toUpperCase()
      }
    }

    // Set createdBy
    projectData.createdBy = req.user.id

    // Ensure organization is set (required by schema)
    if (!projectData.organization) {
      // Prefer organization from provided team or user's team
      let orgId = null
      try {
        let teamId = projectData.team || req.user?.team?._id || req.user?.team
        if (teamId) {
          const team = await Team.findById(teamId).select('organization')
          if (team?.organization) {
            orgId = team.organization
          }
        }
      } catch (e) {
        // ignore, fallback below
      }
      if (!orgId) {
        const org = await Organization.findOne({ isActive: true }).select('_id')
        if (org) orgId = org._id
      }
      if (orgId) {
        projectData.organization = orgId
      }
    }

    // Create project
    const project = new Project(projectData)
    await project.save()

    // Populate references
    await project.populate('team', 'name members')
    await project.populate('createdBy', 'name email avatar')

    // Log audit
    await logProjectAction(req.user, 'project_created', project, {}, req)

    // Create activity log
    await createActivity({
      type: 'created',
      entityType: 'project',
      entityId: project._id,
      user: req.user.id,
      description: `Project "${project.name}" created`,
    })

    // Emit event via event emitter
    eventEmitter.emit('project:created', { project: project.toObject() })

    return successResponse(res, { project: project.toObject() }, 'Project created successfully', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * Update project
 * PUT /api/projects/:id
 */
export const updateProject = async (req, res, next) => {
  try {
    // Project access and manager permission already checked by middlewares
    const project = req.project || (await Project.findById(req.params.id))
    if (!project) {
      throw new NotFoundError('Project not found')
    }
    
    const updateData = req.body

    // Get old values for audit log
    const oldProject = project.toObject()

    // Update project
    Object.assign(project, updateData)
    await project.save()

    // Populate references
    await project.populate('team', 'name members')
    await project.populate('createdBy', 'name email avatar')

    // Get changes for audit log
    const changes = getChanges(oldProject, project.toObject(), ['name', 'description', 'status', 'team'])

    // Log audit
    await logProjectAction(req.user, 'project_updated', project, changes, req)

    // Create activity log
    await createActivity({
      type: 'updated',
      entityType: 'project',
      entityId: project._id,
      user: req.user.id,
      description: `Project "${project.name}" updated`,
      metadata: { changes: updateData },
    })

    // Emit event via event emitter
    eventEmitter.emit('project:updated', { project: project.toObject() })

    return successResponse(res, { project: project.toObject() }, 'Project updated successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Delete project (soft delete)
 * DELETE /api/projects/:id
 */
export const deleteProject = async (req, res, next) => {
  try {
    // Project access already checked by checkProjectAccess middleware
    // Admin role already checked by authorizeRoles middleware
    const project = req.project || (await Project.findById(req.params.id))
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    // Soft delete (set isArchived to true)
    project.isArchived = true
    await project.save()

    // Log audit
    await logProjectAction(req.user, 'project_deleted', project, {}, req)

    // Create activity log
    await createActivity({
      type: 'deleted',
      entityType: 'project',
      entityId: project._id,
      user: req.user.id,
      description: `Project "${project.name}" archived`,
    })

    // Emit event via event emitter
    eventEmitter.emit('project:deleted', { projectId: project._id.toString() })

    return successResponse(res, null, 'Project deleted successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get project metrics
 * GET /api/projects/:id/metrics
 */
export const getProjectMetricsHandler = async (req, res, next) => {
  try {
    // Project access already checked by checkProjectAccess middleware
    const project = req.project || (await Project.findById(req.params.id))
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    // Get metrics from service
    const metrics = await getProjectMetricsService(project._id.toString())

    return successResponse(res, { metrics }, 'Project metrics retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get team performance for project
 * GET /api/projects/:id/team-performance
 */
export const getTeamPerformanceHandler = async (req, res, next) => {
  try {
    // Project access already checked by checkProjectAccess middleware
    const project = req.project || (await Project.findById(req.params.id))
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    // Get team performance
    const performance = await getTeamPerformanceService(project._id.toString())

    return successResponse(res, { performance }, 'Team performance retrieved successfully')
  } catch (error) {
    next(error)
  }
}

