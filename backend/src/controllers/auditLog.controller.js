import AuditLog from '../models/AuditLog.js'
import { successResponse, paginatedResponse } from '../utils/response.js'
import { BadRequestError, ForbiddenError } from '../utils/errors.js'
import logger from '../utils/logger.js'
import { formatDateForFilename } from '../services/export.service.js'

/**
 * Audit Log Controller
 * HTTP request handlers for audit logs
 */

/**
 * Get audit logs with filtering
 * GET /api/audit-logs
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    // Only admins can view audit logs
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only administrators can view audit logs')
    }

    const {
      page = 1,
      limit = 50,
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      search,
      archived = false,
    } = req.query

    // Build query
    const query = {
      archived: archived === 'true',
    }

    if (userId) {
      query.user = userId
    }

    if (action) {
      query.action = action
    }

    if (entityType) {
      query.entityType = entityType
    }

    if (entityId) {
      query.entityId = entityId
    }

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        query.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate)
      }
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { entityName: { $regex: search, $options: 'i' } },
      ]
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Get total count
    const total = await AuditLog.countDocuments(query)

    // Get audit logs
    const auditLogs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    return paginatedResponse(
      res,
      auditLogs,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      'Audit logs retrieved successfully'
    )
  } catch (error) {
    logger.error('Error getting audit logs:', error)
    next(error)
  }
}

/**
 * Get audit log by ID
 * GET /api/audit-logs/:id
 */
export const getAuditLog = async (req, res, next) => {
  try {
    // Only admins can view audit logs
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only administrators can view audit logs')
    }

    const { id } = req.params

    const auditLog = await AuditLog.findById(id).populate('user', 'name email role').lean()

    if (!auditLog) {
      throw new BadRequestError('Audit log not found')
    }

    return successResponse(res, { auditLog }, 'Audit log retrieved successfully')
  } catch (error) {
    logger.error('Error getting audit log:', error)
    next(error)
  }
}

/**
 * Get audit log statistics
 * GET /api/audit-logs/stats
 */
export const getAuditLogStats = async (req, res, next) => {
  try {
    // Only admins can view audit log stats
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only administrators can view audit log statistics')
    }

    const { startDate, endDate } = req.query

    const dateQuery = {}
    if (startDate || endDate) {
      dateQuery.createdAt = {}
      if (startDate) {
        dateQuery.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        dateQuery.createdAt.$lte = new Date(endDate)
      }
    }

    // Get action counts
    const actionCounts = await AuditLog.aggregate([
      { $match: { ...dateQuery, archived: false } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    // Get entity type counts
    const entityTypeCounts = await AuditLog.aggregate([
      { $match: { ...dateQuery, archived: false } },
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    // Get top users by action count
    const topUsers = await AuditLog.aggregate([
      { $match: { ...dateQuery, archived: false } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$_id',
          userName: '$userInfo.name',
          userEmail: '$userInfo.email',
          count: 1,
        },
      },
    ])

    // Get total count
    const total = await AuditLog.countDocuments({ ...dateQuery, archived: false })

    return successResponse(
      res,
      {
        total,
        actionCounts,
        entityTypeCounts,
        topUsers,
      },
      'Audit log statistics retrieved successfully'
    )
  } catch (error) {
    logger.error('Error getting audit log stats:', error)
    next(error)
  }
}

/**
 * Export audit logs to CSV
 * GET /api/audit-logs/export/csv
 */
export const exportAuditLogsCSV = async (req, res, next) => {
  try {
    // Only admins can export audit logs
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only administrators can export audit logs')
    }

    const {
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      search,
      archived = false,
    } = req.query

    // Build query (same as getAuditLogs)
    const query = {
      archived: archived === 'true',
    }

    if (userId) {
      query.user = userId
    }

    if (action) {
      query.action = action
    }

    if (entityType) {
      query.entityType = entityType
    }

    if (entityId) {
      query.entityId = entityId
    }

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        query.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate)
      }
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { entityName: { $regex: search, $options: 'i' } },
      ]
    }

    // Get all matching audit logs (no pagination for export)
    const auditLogs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .lean()

    // Convert to CSV
    const csvHeaders = [
      'Timestamp',
      'User',
      'User Email',
      'Action',
      'Entity Type',
      'Entity Name',
      'Description',
      'IP Address',
      'Changes (Before)',
      'Changes (After)',
    ]

    const csvRows = auditLogs.map((log) => {
      return [
        log.createdAt ? new Date(log.createdAt).toISOString() : '',
        log.userName || '',
        log.userEmail || '',
        log.action || '',
        log.entityType || '',
        log.entityName || '',
        log.description || '',
        log.ipAddress || '',
        log.changes?.before ? JSON.stringify(log.changes.before) : '',
        log.changes?.after ? JSON.stringify(log.changes.after) : '',
      ]
    })

    // Escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) {
        return ''
      }
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    const csvContent = [
      csvHeaders.map(escapeCSV).join(','),
      ...csvRows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n')

    const filename = `audit-logs-${formatDateForFilename()}.csv`

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    return res.send(csvContent)
  } catch (error) {
    logger.error('Error exporting audit logs:', error)
    next(error)
  }
}

