import { CustomReport } from '../models/index.js'
import {
  getAvailableWidgets,
  runReport,
  updateReportSchedule,
} from '../services/report.service.js'
import { successResponse } from '../utils/response.js'
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js'
import { logActivity } from '../services/activity.service.js'
import { logSettingsAction } from '../services/audit.service.js'

const canViewReport = (report, user) => {
  if (!report) return false
  const userId = user._id.toString()

  if (report.owner.toString() === userId) return true
  const scope = report.sharedWith?.scope || 'private'
  if (scope === 'organization') return true
  if (scope === 'team') {
    const userTeamId = user.team?._id?.toString() || user.team?.toString()
    return report.sharedWith?.teams?.some((teamId) => teamId.toString() === userTeamId)
  }
  if (scope === 'custom') {
    return report.sharedWith?.users?.some((id) => id.toString() === userId)
  }
  return false
}

const ensureOwner = (report, user) => {
  if (report.owner.toString() !== (user._id || user.id).toString() && user.role !== 'admin') {
    throw new ForbiddenError('Only the report owner can modify this report')
  }
}

export const getWidgetLibrary = async (req, res, next) => {
  try {
    const widgets = getAvailableWidgets()
    return successResponse(res, { widgets }, 'Widgets fetched successfully')
  } catch (error) {
    next(error)
  }
}

export const listCustomReports = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id
    const userTeamId = req.user.team?._id || req.user.team

    const reports = await CustomReport.find({
      $or: [
        { owner: userId },
        { 'sharedWith.scope': 'organization' },
        {
          'sharedWith.scope': 'team',
          'sharedWith.teams': { $in: [userTeamId].filter(Boolean) },
        },
        {
          'sharedWith.scope': 'custom',
          'sharedWith.users': userId,
        },
      ],
    })
      .populate('owner', 'name email')
      .sort({ updatedAt: -1 })
      .lean()

    return successResponse(res, { reports }, 'Reports retrieved successfully')
  } catch (error) {
    next(error)
  }
}

export const createCustomReport = async (req, res, next) => {
  try {
    const { name, widgets, filters, sharedWith, schedule, description } = req.body

    if (!name || !widgets || widgets.length === 0) {
      throw new BadRequestError('Report name and at least one widget are required')
    }

    const report = new CustomReport({
      name,
      description,
      owner: req.user._id || req.user.id,
      widgets,
      filters,
      sharedWith,
    })

    if (schedule) {
      await updateReportSchedule(report, schedule)
    }

    await report.save()
    await logActivity(
      'created',
      'custom_report',
      report._id,
      req.user.id,
      `Custom report "${report.name}" created`
    )
    await logSettingsAction(req.user, 'report_created', `Created custom report "${report.name}"`)

    return successResponse(res, { report }, 'Report created successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const getCustomReport = async (req, res, next) => {
  try {
    const report = await CustomReport.findById(req.params.id)
    if (!report) {
      throw new NotFoundError('Report not found')
    }
    if (!canViewReport(report, req.user)) {
      throw new ForbiddenError('You do not have access to this report')
    }
    return successResponse(res, { report }, 'Report retrieved successfully')
  } catch (error) {
    next(error)
  }
}

export const updateCustomReport = async (req, res, next) => {
  try {
    const report = await CustomReport.findById(req.params.id)
    if (!report) {
      throw new NotFoundError('Report not found')
    }
    ensureOwner(report, req.user)

    const { name, widgets, filters, sharedWith, schedule, description } = req.body

    if (name !== undefined) report.name = name
    if (description !== undefined) report.description = description
    if (widgets !== undefined) report.widgets = widgets
    if (filters !== undefined) report.filters = filters
    if (sharedWith !== undefined) report.sharedWith = sharedWith
    if (schedule !== undefined) {
      await updateReportSchedule(report, schedule)
    }

    await report.save()
    await logActivity(
      'updated',
      'custom_report',
      report._id,
      req.user.id,
      `Custom report "${report.name}" updated`
    )

    return successResponse(res, { report }, 'Report updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteCustomReport = async (req, res, next) => {
  try {
    const report = await CustomReport.findById(req.params.id)
    if (!report) {
      throw new NotFoundError('Report not found')
    }
    ensureOwner(report, req.user)

    await report.remove()
    await logActivity(
      'deleted',
      'custom_report',
      report._id,
      req.user.id,
      `Custom report "${report.name}" deleted`
    )

    return successResponse(res, null, 'Report deleted successfully')
  } catch (error) {
    next(error)
  }
}

export const runCustomReport = async (req, res, next) => {
  try {
    const report = await CustomReport.findById(req.params.id)
    if (!report) {
      throw new NotFoundError('Report not found')
    }
    if (!canViewReport(report, req.user)) {
      throw new ForbiddenError('You do not have access to this report')
    }

    const datasets = await runReport({
      widgets: report.widgets,
      filters: req.body?.filters || report.filters,
    })

    report.lastRunAt = new Date()
    report.lastRunSummary = new Map(
      datasets.map((dataset) => [
        dataset.id,
        {
          metric: dataset.metric,
          preview: dataset.data,
        },
      ])
    )
    await report.save()

    return successResponse(res, { datasets }, 'Report executed successfully')
  } catch (error) {
    next(error)
  }
}

export const previewCustomReport = async (req, res, next) => {
  try {
    const { widgets, filters } = req.body
    if (!widgets || widgets.length === 0) {
      throw new BadRequestError('Widgets are required for preview')
    }
    const datasets = await runReport({ widgets, filters })
    return successResponse(res, { datasets }, 'Preview generated successfully')
  } catch (error) {
    next(error)
  }
}

