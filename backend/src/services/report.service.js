import { formatISO, startOfWeek } from 'date-fns'
import { Project, Sprint, Task, Team, CustomReport } from '../models/index.js'
import { calculateNextRunAt } from '../utils/schedule.js'

const AVAILABLE_WIDGETS = [
  {
    metric: 'projectStatus',
    label: 'Project Status Breakdown',
    description: 'Active vs on-hold vs archived projects',
    supportedCharts: ['pie', 'bar'],
    defaultChart: 'pie',
    defaultSize: { w: 4, h: 3 },
  },
  {
    metric: 'taskStatus',
    label: 'Task Status Overview',
    description: 'Distribution of tasks across statuses',
    supportedCharts: ['bar', 'pie', 'table'],
    defaultChart: 'bar',
    defaultSize: { w: 5, h: 3 },
  },
  {
    metric: 'velocityTrend',
    label: 'Sprint Velocity Trend',
    description: 'Velocity for the last completed sprints',
    supportedCharts: ['line', 'bar'],
    defaultChart: 'line',
    defaultSize: { w: 6, h: 3 },
  },
  {
    metric: 'completionTrend',
    label: 'Weekly Completion Trend',
    description: 'Completed tasks by week',
    supportedCharts: ['line', 'bar'],
    defaultChart: 'line',
    defaultSize: { w: 6, h: 3 },
  },
  {
    metric: 'teamCapacity',
    label: 'Team Capacity vs Workload',
    description: 'Compare committed capacity with assigned work',
    supportedCharts: ['bar', 'table'],
    defaultChart: 'bar',
    defaultSize: { w: 5, h: 3 },
  },
]

export const getAvailableWidgets = () => AVAILABLE_WIDGETS

const normalizeFilters = (filters = {}) => {
  const normalized = { ...filters }
  normalized.dateRange = normalized.dateRange || '30d'
  if (normalized.dateRange !== 'custom') {
    const days = parseInt(normalized.dateRange) || 30
    normalized.startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    normalized.endDate = new Date()
  } else if (filters.customRange?.start && filters.customRange?.end) {
    normalized.startDate = new Date(filters.customRange.start)
    normalized.endDate = new Date(filters.customRange.end)
  }
  normalized.projects = filters.projects || []
  normalized.teams = filters.teams || []
  return normalized
}

const applyProjectFilter = (query, filters) => {
  if (filters.projects?.length > 0) {
    query.project = { $in: filters.projects }
  }
  if (filters.teams?.length > 0) {
    query.team = { $in: filters.teams }
  }
}

const fetchProjectStatus = async (filters) => {
  const query = { isArchived: false }
  if (filters.teams?.length > 0) {
    query.team = { $in: filters.teams }
  }

  const projects = await Project.find(query).select('status').lean()
  const counts = projects.reduce(
    (acc, project) => {
      const status = project.status || 'active'
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {}
  )

  return {
    labels: Object.keys(counts),
    values: Object.values(counts),
  }
}

const fetchTaskStatus = async (filters) => {
  const query = {}
  applyProjectFilter(query, filters)
  if (filters.startDate && filters.endDate) {
    query.createdAt = { $gte: filters.startDate, $lte: filters.endDate }
  }

  const tasks = await Task.find(query).select('status priority').lean()
  const statusCounts = {}
  tasks.forEach((task) => {
    const status = task.status || 'todo'
    statusCounts[status] = (statusCounts[status] || 0) + 1
  })

  return {
    labels: Object.keys(statusCounts),
    values: Object.values(statusCounts),
  }
}

const fetchVelocityTrend = async (filters) => {
  const query = { status: 'completed' }
  if (filters.projects?.length > 0) {
    query.project = { $in: filters.projects }
  }
  const sprints = await Sprint.find(query)
    .select('name completedAt velocity')
    .sort({ completedAt: -1 })
    .limit(6)
    .lean()

  const ordered = sprints.reverse()
  return {
    labels: ordered.map((sprint) => sprint.name),
    series: ordered.map((sprint) => sprint.velocity || 0),
  }
}

const fetchCompletionTrend = async (filters) => {
  const query = { status: 'done' }
  applyProjectFilter(query, filters)
  if (filters.startDate && filters.endDate) {
    query.updatedAt = { $gte: filters.startDate, $lte: filters.endDate }
  }

  const tasks = await Task.find(query).select('updatedAt').lean()
  const buckets = {}

  tasks.forEach((task) => {
    const weekStart = formatISO(startOfWeek(task.updatedAt, { weekStartsOn: 1 }), {
      representation: 'date',
    })
    buckets[weekStart] = (buckets[weekStart] || 0) + 1
  })

  const sortedWeeks = Object.keys(buckets).sort((a, b) => new Date(a) - new Date(b))
  return {
    labels: sortedWeeks,
    series: sortedWeeks.map((week) => buckets[week]),
  }
}

const fetchTeamCapacity = async (filters) => {
  const query = {}
  if (filters.teams?.length > 0) {
    query._id = { $in: filters.teams }
  }
  const teams = await Team.find(query)
    .select('name capacity velocity')
    .lean()

  return teams.map((team) => ({
    team: team.name,
    capacity: team.capacity || 0,
    velocity: team.velocity || 0,
  }))
}

export const runWidget = async (widget, filters = {}) => {
  const normalizedFilters = normalizeFilters(filters)
  switch (widget.metric) {
    case 'projectStatus':
      return fetchProjectStatus(normalizedFilters)
    case 'taskStatus':
      return fetchTaskStatus(normalizedFilters)
    case 'velocityTrend':
      return fetchVelocityTrend(normalizedFilters)
    case 'completionTrend':
      return fetchCompletionTrend(normalizedFilters)
    case 'teamCapacity':
      return fetchTeamCapacity(normalizedFilters)
    default:
      return {}
  }
}

export const runReport = async ({ widgets = [], filters = {} }) => {
  return Promise.all(
    widgets.map(async (widget) => ({
      id: widget.id,
      title: widget.title,
      metric: widget.metric,
      chartType: widget.chartType,
      data: await runWidget(widget, filters),
    }))
  )
}

export const updateReportSchedule = async (report, schedulePayload = {}) => {
  if (!report.schedule) {
    report.schedule = {}
  }

  report.schedule.enabled = schedulePayload.enabled ?? report.schedule.enabled
  report.schedule.frequency = schedulePayload.frequency || report.schedule.frequency || 'weekly'
  report.schedule.timeOfDay = schedulePayload.timeOfDay || report.schedule.timeOfDay || '09:00'
  report.schedule.dayOfWeek =
    schedulePayload.dayOfWeek !== undefined ? schedulePayload.dayOfWeek : report.schedule.dayOfWeek || 1
  report.schedule.dayOfMonth =
    schedulePayload.dayOfMonth !== undefined
      ? schedulePayload.dayOfMonth
      : report.schedule.dayOfMonth || 1
  report.schedule.recipients =
    schedulePayload.recipients && schedulePayload.recipients.length > 0
      ? schedulePayload.recipients
      : report.schedule.recipients || []

  if (report.schedule.enabled) {
    report.schedule.nextRunAt = calculateNextRunAt(report.schedule)
  } else {
    report.schedule.nextRunAt = null
  }

  return report.schedule
}

export const findDueReports = async () => {
  const now = new Date()
  return CustomReport.find({
    'schedule.enabled': true,
    'schedule.nextRunAt': { $lte: now },
  })
    .populate('owner', 'name email')
    .lean()
}

