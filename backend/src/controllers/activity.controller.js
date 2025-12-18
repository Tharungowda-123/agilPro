import { getActivities as getActivitiesService } from '../services/activity.service.js'
import { successResponse, paginatedResponse } from '../utils/response.js'
import logger from '../utils/logger.js'

/**
 * Activity Controller
 * HTTP request handlers for activities
 */

/**
 * Get activities with filters
 * GET /api/activities
 */
export const getActivities = async (req, res, next) => {
  try {
    const { entityType, entityId, userId, type, page = 1, limit = 20 } = req.query

    const filters = {}
    if (entityType) filters.entityType = entityType
    if (entityId) filters.entityId = entityId
    if (userId) filters.userId = userId
    if (type) filters.type = type

    const result = await getActivitiesService(filters, { page, limit })

    return paginatedResponse(
      res,
      result.activities,
      result.pagination,
      'Activities retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get activities for project
 * GET /api/projects/:projectId/activities
 */
export const getProjectActivities = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { page = 1, limit = 20 } = req.query

    const result = await getActivitiesService(
      { entityType: 'project', entityId: projectId },
      { page, limit }
    )

    return paginatedResponse(
      res,
      result.activities,
      result.pagination,
      'Project activities retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get activities for sprint
 * GET /api/sprints/:sprintId/activities
 */
export const getSprintActivities = async (req, res, next) => {
  try {
    const { sprintId } = req.params
    const { page = 1, limit = 20 } = req.query

    const result = await getActivitiesService(
      { entityType: 'sprint', entityId: sprintId },
      { page, limit }
    )

    return paginatedResponse(
      res,
      result.activities,
      result.pagination,
      'Sprint activities retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get activities for story
 * GET /api/stories/:storyId/activities
 */
export const getStoryActivities = async (req, res, next) => {
  try {
    const { storyId } = req.params
    const { page = 1, limit = 20 } = req.query

    const result = await getActivitiesService(
      { entityType: 'story', entityId: storyId },
      { page, limit }
    )

    return paginatedResponse(
      res,
      result.activities,
      result.pagination,
      'Story activities retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get activities for user
 * GET /api/users/:userId/activities
 */
export const getUserActivities = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 20 } = req.query

    const result = await getActivitiesService({ userId }, { page, limit })

    return paginatedResponse(
      res,
      result.activities,
      result.pagination,
      'User activities retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

