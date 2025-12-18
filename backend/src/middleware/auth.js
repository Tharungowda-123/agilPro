import { verifyToken } from '../config/jwt.js'
import { UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js'
import { User, Project, Team, Task, Story } from '../models/index.js'
import { isTokenBlacklisted } from '../services/auth.service.js'
import { cacheUtils } from '../config/redis.js'
import logger from '../utils/logger.js'
import {
  canViewProject,
  canEditProject,
  canDeleteProject,
  canViewTeam,
  canEditTask,
  canManageResource,
  isManagerOfTeam,
} from '../utils/permissions.js'

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */

/**
 * Authenticate JWT token
 * Extracts token from Authorization header, verifies it, and attaches user to req.user
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      throw new UnauthorizedError('No token provided')
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      throw new UnauthorizedError('Token has been revoked')
    }

    // Verify token
    const decoded = verifyToken(token)

    // Check user session in cache
    const cacheKey = `session:${decoded.id}`
    let user = await cacheUtils.get(cacheKey)

    if (!user) {
      // Cache miss - fetch from database
      const userDoc = await User.findById(decoded.id)
        .select('-password')
        .populate('team', 'name _id')

      if (!userDoc) {
        throw new UnauthorizedError('User not found')
      }

      if (!userDoc.isActive) {
        throw new UnauthorizedError('Account is deactivated')
      }

      // Convert to plain object for caching
      user = {
        _id: userDoc._id,
        id: userDoc._id.toString(),
        email: userDoc.email,
        role: userDoc.role,
        name: userDoc.name,
        team: userDoc.team,
        skills: userDoc.skills,
        isActive: userDoc.isActive,
        isEmailVerified: userDoc.isEmailVerified,
      }

      // Cache user session for 1 hour
      await cacheUtils.set(cacheKey, user, 3600)
    } else {
      // Validate cached user is still active
      if (!user.isActive) {
        // Remove from cache
        await cacheUtils.del(cacheKey)
        throw new UnauthorizedError('Account is deactivated')
      }
    }

    // Attach full user object to request with team information
    req.user = {
      _id: user._id,
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      team: user.team,
      skills: user.skills,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
    }

    next()
  } catch (error) {
    if (error.message === 'Token expired' || error.message === 'Invalid token' || error.message === 'Token has been revoked') {
      return next(new UnauthorizedError(error.message))
    }
    logger.error('Authentication error:', error)
    next(new UnauthorizedError('Authentication failed'))
  }
}

/**
 * Authorize roles
 * Checks if user's role is in the allowed roles array
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'))
    }

    // Flatten the array in case roles are passed as array or individual arguments
    const roles = allowedRoles.flat()

    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized role access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method,
      })
      return next(
        new ForbiddenError(
          `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
        )
      )
    }

    next()
  }
}

/**
 * Optional authentication
 * Authenticates if token is present, but doesn't fail if token is missing
 * Useful for routes that work for both authenticated and unauthenticated users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      try {
        const decoded = verifyToken(token)
        const user = await User.findById(decoded.id)
          .select('-password')
          .populate('team', 'name _id')
        
        if (user && user.isActive) {
          req.user = {
            _id: user._id,
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            team: user.team,
          }
        }
      } catch (error) {
        // Token is invalid, but we don't fail - just continue without user
        logger.debug('Optional auth: Invalid token, continuing without authentication')
      }
    }

    next()
  } catch (error) {
    // Don't fail on optional auth errors
    next()
  }
}

/**
 * Check project access
 * Verifies user has access to the requested project
 * Admin: access to all projects
 * Others: access only to projects from their team
 */
export const checkProjectAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'))
    }

    const projectId = req.params.projectId || req.params.id

    if (!projectId) {
      return next(new BadRequestError('Project ID is required'))
    }

    // Find project and populate team
    const project = await Project.findById(projectId).populate('team', 'name _id')

    if (!project) {
      return next(new NotFoundError('Project not found'))
    }

    // Check access using permission utility
    if (!canViewProject(req.user, project)) {
      logger.warn('Project access denied', {
        userId: req.user.id,
        userRole: req.user.role,
        projectId: project._id.toString(),
        projectTeam: project.team?._id?.toString(),
        userTeam: req.user.team?._id?.toString(),
      })
      return next(new ForbiddenError('You do not have access to this project'))
    }

    // Attach project to request for use in controllers
    req.project = project
    next()
  } catch (error) {
    logger.error('Error checking project access:', error)
    next(error)
  }
}

/**
 * Check team access
 * Verifies user has access to the requested team
 * Admin: access to all teams
 * Others: access only to their own team
 */
export const checkTeamAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'))
    }

    const teamId = req.params.teamId || req.params.id

    if (!teamId) {
      return next(new BadRequestError('Team ID is required'))
    }

    // Find team
    const team = await Team.findById(teamId)

    if (!team) {
      return next(new NotFoundError('Team not found'))
    }

    // Check access using permission utility
    if (!canViewTeam(req.user, team)) {
      logger.warn('Team access denied', {
        userId: req.user.id,
        userRole: req.user.role,
        teamId: team._id.toString(),
        userTeam: req.user.team?._id?.toString(),
      })
      return next(new ForbiddenError('You do not have access to this team'))
    }

    // Attach team to request for use in controllers
    req.team = team
    next()
  } catch (error) {
    logger.error('Error checking team access:', error)
    next(error)
  }
}

/**
 * Check resource ownership
 * Verifies user owns the resource (for tasks/stories assigned to them)
 * Developers can only update their own tasks
 * Managers can update tasks from their team
 * Admin can update any task
 */
export const checkResourceOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'))
    }

    const resourceId = req.params.taskId || req.params.storyId || req.params.id
    const resourceType = req.params.taskId ? 'task' : req.params.storyId ? 'story' : 'resource'

    if (!resourceId) {
      return next(new BadRequestError(`${resourceType} ID is required`))
    }

    let resource

    if (resourceType === 'task') {
      resource = await Task.findById(resourceId)
        .populate('assignedTo', '_id email name')
        .populate({
          path: 'story',
          populate: {
            path: 'project',
            select: 'team',
            populate: {
              path: 'team',
              select: '_id name',
            },
          },
        })

      if (!resource) {
        return next(new NotFoundError('Task not found'))
      }

      // Check if user can edit this task
      const canEdit = canEditTask(req.user, resource)

      if (!canEdit) {
        logger.warn('Task edit access denied', {
          userId: req.user.id,
          userRole: req.user.role,
          taskId: resource._id.toString(),
          taskAssignedTo: resource.assignedTo?._id?.toString(),
        })
        return next(
          new ForbiddenError('You do not have permission to edit this task')
        )
      }
    } else if (resourceType === 'story') {
      resource = await Story.findById(resourceId).populate('project', 'team')

      if (!resource) {
        return next(new NotFoundError('Story not found'))
      }

      // For stories, check project access
      if (!canViewProject(req.user, resource.project)) {
        logger.warn('Story edit access denied', {
          userId: req.user.id,
          userRole: req.user.role,
          storyId: resource._id.toString(),
        })
        return next(
          new ForbiddenError('You do not have permission to edit this story')
        )
      }
    }

    // Attach resource to request for use in controllers
    req[resourceType] = resource
    next()
  } catch (error) {
    logger.error('Error checking resource ownership:', error)
    next(error)
  }
}

/**
 * Check manager permission
 * Verifies user is a manager of the team that owns the resource
 * Used for assigning tasks, creating sprints, etc.
 */
export const checkManagerPermission = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'))
    }

    // Admin can always manage
    if (req.user.role === 'admin') {
      return next()
    }

    // Must be a manager
    if (req.user.role !== 'manager') {
      return next(
        new ForbiddenError('Only managers can perform this action')
      )
    }

    // Manager must have a team
    if (!req.user.team) {
      return next(
        new ForbiddenError('You must be assigned to a team to perform this action')
      )
    }

    // Try to get team from request (set by checkProjectAccess or checkTeamAccess)
    let resourceTeam = req.project?.team || req.team

    // If not available, try to get from request body or params
    if (!resourceTeam) {
      const projectId = req.body.project || req.params.projectId || req.params.id
      if (projectId) {
        const project = await Project.findById(projectId).populate('team', '_id name')
        if (project) {
          resourceTeam = project.team
        }
      }
    }

    if (!resourceTeam) {
      return next(
        new BadRequestError('Unable to determine resource team')
      )
    }

    // Check if user is manager of the resource's team
    if (!isManagerOfTeam(req.user, resourceTeam)) {
      logger.warn('Manager permission denied', {
        userId: req.user.id,
        userTeam: req.user.team?._id?.toString(),
        resourceTeam: resourceTeam._id?.toString() || resourceTeam.toString(),
      })
      return next(
        new ForbiddenError('You can only manage resources from your own team')
      )
    }

    next()
  } catch (error) {
    logger.error('Error checking manager permission:', error)
    next(error)
  }
}


