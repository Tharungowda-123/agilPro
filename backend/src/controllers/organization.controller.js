import { Organization, Team, Project, User } from '../models/index.js'
import { successResponse } from '../utils/response.js'
import { NotFoundError, ForbiddenError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * Organization Controller
 * HTTP request handlers for organization
 */

/**
 * Get organization
 * GET /api/organization
 * Only admins can access organization details
 */
export const getOrganization = async (req, res, next) => {
  try {
    // Only admins can view organization details
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only administrators can view organization details')
    }

    // Get the first active organization (in a multi-tenant system, you'd filter by user's org)
    const organization = await Organization.findOne({ isActive: true })
      .lean()

    if (!organization) {
      throw new NotFoundError('Organization not found')
    }

    // Get organization statistics
    const [teamsCount, projectsCount, usersCount] = await Promise.all([
      Team.countDocuments({ organization: organization._id, isActive: true }),
      Project.countDocuments({ isArchived: false }),
      User.countDocuments({ isActive: true }),
    ])

    const organizationData = {
      ...organization,
      statistics: {
        teams: teamsCount,
        projects: projectsCount,
        users: usersCount,
      },
    }

    return successResponse(res, { organization: organizationData }, 'Organization retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Update organization
 * PUT /api/organization
 * Only admins can update organization
 */
export const updateOrganization = async (req, res, next) => {
  try {
    // Only admins can update organization
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only administrators can update organization')
    }

    const organization = await Organization.findOne({ isActive: true })

    if (!organization) {
      throw new NotFoundError('Organization not found')
    }

    const { name, domain, settings, subscription } = req.body

    // Update fields
    if (name !== undefined) organization.name = name
    if (domain !== undefined) organization.domain = domain
    if (settings !== undefined) {
      organization.settings = {
        ...organization.settings,
        ...settings,
      }
    }
    if (subscription !== undefined) {
      organization.subscription = {
        ...organization.subscription,
        ...subscription,
      }
    }

    await organization.save()

    logger.info(`Organization updated by user ${req.user.id}`)

    return successResponse(res, { organization: organization.toObject() }, 'Organization updated successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get organization teams
 * GET /api/organization/teams
 * Only admins can access
 */
export const getOrganizationTeams = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only administrators can view organization teams')
    }

    const organization = await Organization.findOne({ isActive: true })

    if (!organization) {
      throw new NotFoundError('Organization not found')
    }

    const teams = await Team.find({ organization: organization._id, isActive: true })
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean()

    return successResponse(res, { teams }, 'Organization teams retrieved successfully')
  } catch (error) {
    next(error)
  }
}

