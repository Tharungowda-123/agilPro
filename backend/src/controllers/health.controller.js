import mongoose from 'mongoose'
import { successResponse } from '../utils/response.js'
import {
  getMetricsSnapshot,
  getSlowQueries,
  getRecentErrors,
  getRequestHistory,
} from '../services/monitoring.service.js'

export const getHealthOverview = async (req, res, next) => {
  try {
    const metrics = await getMetricsSnapshot()
    return successResponse(res, metrics, 'System health overview retrieved successfully')
  } catch (error) {
    next(error)
  }
}

export const getHealthStatus = async (req, res, next) => {
  try {
    const connectionState = mongoose.connection.readyState
    const statusMap = ['disconnected', 'connected', 'connecting', 'disconnecting']

    return successResponse(
      res,
      {
        time: new Date(),
        uptime: process.uptime(),
        database: statusMap[connectionState] || 'unknown',
      },
      'Health status retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

export const getSlowQueryReport = (req, res, next) => {
  try {
    const slowQueries = getSlowQueries()
    return successResponse(
      res,
      { slowQueries },
      'Slow query report retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

export const getErrorInsights = (req, res, next) => {
  try {
    const errors = getRecentErrors()
    return successResponse(res, { errors }, 'Recent errors retrieved successfully')
  } catch (error) {
    next(error)
  }
}

export const getRequestHistoryReport = (req, res, next) => {
  try {
    const history = getRequestHistory()
    return successResponse(res, { history }, 'Request history retrieved successfully')
  } catch (error) {
    next(error)
  }
}

