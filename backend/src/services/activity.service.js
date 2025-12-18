import { Activity } from '../models/index.js'
import logger from '../utils/logger.js'

/**
 * Activity Service
 * Handles activity logging
 */

/**
 * Log activity
 * @param {string} type - Activity type (created, updated, deleted, assigned, completed, moved, commented)
 * @param {string} entityType - Entity type (project, sprint, story, task)
 * @param {string} entityId - Entity ID
 * @param {string} userId - User ID
 * @param {string} description - Activity description
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Created activity
 */
export const logActivity = async (type, entityType, entityId, userId, description, metadata = {}) => {
  try {
    const activity = new Activity({
      type,
      entityType,
      entityId,
      user: userId,
      description,
      metadata,
    })

    await activity.save()
    return activity
  } catch (error) {
    logger.error('Error logging activity:', error)
    // Don't throw error - activity logging shouldn't break the flow
    return null
  }
}

/**
 * Get activities with filters
 * @param {Object} filters - Filter options
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Activities and pagination info
 */
export const getActivities = async (filters = {}, pagination = {}) => {
  try {
    const { entityType, entityId, userId, type } = filters
    const { page = 1, limit = 20 } = pagination

    // Build query
    const query = {}

    if (entityType) {
      query.entityType = entityType
    }

    if (entityId) {
      query.entityId = entityId
    }

    if (userId) {
      query.user = userId
    }

    if (type) {
      query.type = type
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const limitNum = parseInt(limit)

    // Execute query
    const [activities, total] = await Promise.all([
      Activity.find(query)
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Activity.countDocuments(query),
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum)

    return {
      activities,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    }
  } catch (error) {
    logger.error('Error getting activities:', error)
    throw error
  }
}

