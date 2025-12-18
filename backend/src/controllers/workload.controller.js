import {
  getDeveloperWorkload,
  getHistoricalWorkload,
  getSuggestedTasks,
} from '../services/workload.service.js'
import { successResponse } from '../utils/response.js'
import { NotFoundError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * Workload Controller
 * HTTP request handlers for developer workload visualization
 */

/**
 * Get developer workload data
 * GET /api/users/:id/workload/detailed
 */
export const getDeveloperWorkloadHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const { sprintId } = req.query
    const userId = req.user.id

    // Users can only view their own workload
    if (id !== userId && req.user.role !== 'admin' && req.user.role !== 'manager') {
      throw new NotFoundError('Workload data not found')
    }

    const workloadData = await getDeveloperWorkload(id, sprintId || null)

    return successResponse(
      res,
      { workload: workloadData },
      'Developer workload retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get historical workload data
 * GET /api/users/:id/workload/history
 */
export const getHistoricalWorkloadHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const { limit = 8 } = req.query
    const userId = req.user.id

    // Users can only view their own workload
    if (id !== userId && req.user.role !== 'admin' && req.user.role !== 'manager') {
      throw new NotFoundError('Workload data not found')
    }

    const historicalData = await getHistoricalWorkload(id, parseInt(limit))

    return successResponse(
      res,
      { history: historicalData },
      'Historical workload retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get suggested tasks based on capacity
 * GET /api/users/:id/workload/suggestions
 */
export const getSuggestedTasksHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const { maxSuggestions = 5 } = req.query
    const userId = req.user.id

    // Users can only view their own suggestions
    if (id !== userId && req.user.role !== 'admin' && req.user.role !== 'manager') {
      throw new NotFoundError('Suggestions not found')
    }

    const suggestions = await getSuggestedTasks(id, parseInt(maxSuggestions))

    return successResponse(
      res,
      { suggestions },
      'Suggested tasks retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

