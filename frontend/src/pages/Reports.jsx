import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet, Printer, Filter, Download } from 'lucide-react'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import ExportButton from '@/components/export/ExportButton'
import Dropdown from '@/components/ui/Dropdown'
import FilterPanel from '@/components/reports/FilterPanel'
import TeamPerformanceChart from '@/components/charts/TeamPerformanceChart'
import VelocityTrendChart from '@/components/charts/VelocityTrendChart'
import StoryStatusPieChart from '@/components/charts/StoryStatusPieChart'
import CycleTimeChart from '@/components/charts/CycleTimeChart'
import RiskHeatmap from '@/components/charts/RiskHeatmap'
import Spinner from '@/components/ui/Spinner'
import { useTeams } from '@/hooks/api/useTeams'
import { useUsers } from '@/hooks/api/useUsers'
import {
  useExportDashboardPDF,
  useExportProjectsExcel,
  useExportTeamsExcel,
  useExportStoriesExcel,
  useExportTasksExcel,
} from '@/hooks/api/useExport'
import { useReportWidgets, useCustomReports, useReportWidgetDatasets } from '@/hooks/api/useReports'
import { useRiskAlerts } from '@/hooks/api/useDashboard'
import { useRole } from '@/hooks/useRole'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'

/**
 * Reports Page
 * Comprehensive reports and analytics dashboard
 */
export default function Reports() {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState('30')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({})

  const { data: teamsData } = useTeams()
  const { data: usersData } = useUsers()
  const { data: widgetLibrary, isLoading: widgetLibraryLoading } = useReportWidgets()
  const { data: customReportsData, isLoading: customReportsLoading } = useCustomReports()
  const teams = teamsData?.data || teamsData || []
  const users = usersData?.data || usersData || []
  const customReports = customReportsData?.data || customReportsData || []
  const exportDashboardPDF = useExportDashboardPDF()
  const exportProjectsExcel = useExportProjectsExcel()
  const exportTeamsExcel = useExportTeamsExcel()
  const exportStoriesExcel = useExportStoriesExcel()
  const exportTasksExcel = useExportTasksExcel()
  const handleOpenCustomReport = (reportId) => {
    if (reportId) {
      navigate(`/reports/custom?reportId=${reportId}`)
    } else {
      navigate('/reports/custom')
    }
  }

  const { isAdmin, isManager } = useRole()
  const showRiskInsights = isAdmin || isManager

  const coreWidgets = useMemo(
    () => [
      { id: 'project-status', title: 'Project Status', metric: 'projectStatus', chartType: 'pie' },
      { id: 'task-status', title: 'Task Status', metric: 'taskStatus', chartType: 'bar' },
      { id: 'velocity-trend', title: 'Velocity Trend', metric: 'velocityTrend', chartType: 'line' },
      { id: 'completion-trend', title: 'Completion Trend', metric: 'completionTrend', chartType: 'line' },
      { id: 'team-capacity', title: 'Team Capacity', metric: 'teamCapacity', chartType: 'bar' },
    ],
    []
  )

  const coreMetricSet = useMemo(() => new Set(coreWidgets.map((widget) => widget.metric)), [coreWidgets])

  const additionalWidgets = useMemo(() => {
    if (!widgetLibrary?.length) return []
    return widgetLibrary
      .filter((widget) => widget.metric && !coreMetricSet.has(widget.metric))
      .map((widget) => ({
        id: widget.id || widget.metric,
        title: widget.label,
        metric: widget.metric,
        chartType: widget.defaultChart || widget.supportedCharts?.[0] || 'table',
        description: widget.description,
        supportedCharts: widget.supportedCharts,
      }))
  }, [widgetLibrary, coreMetricSet])

  const widgetDefinitions = useMemo(
    () => [...coreWidgets, ...additionalWidgets],
    [coreWidgets, additionalWidgets]
  )

  const { data: widgetDatasets = [], isLoading: widgetDatasetLoading } = useReportWidgetDatasets(
    widgetDefinitions,
    filters
  )
  const widgetsLoading = widgetDatasetLoading || widgetLibraryLoading

  const datasetLookup = useMemo(() => {
    return widgetDatasets.reduce((acc, dataset) => {
      const key = dataset.id || dataset.metric
      if (key) {
        acc[key] = dataset
      }
      return acc
    }, {})
  }, [widgetDatasets])

  const datasetMap = useMemo(() => {
    return widgetDatasets.reduce((acc, dataset) => {
      const key = dataset.metric || dataset.id
      if (key) {
        acc[key] = dataset.data || dataset
      }
      return acc
    }, {})
  }, [widgetDatasets])

  const additionalWidgetCards = useMemo(() => {
    if (!additionalWidgets.length) return []
    return additionalWidgets.map((widget) => ({
      widget,
      dataset: datasetLookup[widget.id] || datasetLookup[widget.metric],
    }))
  }, [additionalWidgets, datasetLookup])

  const renderAdditionalWidgetContent = (widget, dataset) => {
    const data = dataset?.data ?? dataset
    if (!data) {
      return <p className="text-sm text-gray-500">No data available for this widget.</p>
    }

    if (data.labels && data.values) {
      return (
        <ul className="space-y-2">
          {data.labels.map((label, idx) => (
            <li key={label || idx} className="flex items-center justify-between text-sm text-gray-700">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-900">{data.values?.[idx] ?? 0}</span>
            </li>
          ))}
        </ul>
      )
    }

    if (Array.isArray(data)) {
      return (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {data.slice(0, 6).map((row, idx) => (
            <div key={row.id || row.name || row.team || idx} className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                {row.name || row.team || row.metric || `Item ${idx + 1}`}
              </div>
              <div className="font-medium text-gray-900">
                {row.value ?? row.velocity ?? row.capacity ?? row.points ?? row.score ?? '--'}
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    )
  }

  const statusPieData = useMemo(() => {
    const data = datasetMap.taskStatus
    if (!data?.labels?.length) return []
    return data.labels.map((label, idx) => ({
      name: label,
      value: data.values?.[idx] ?? 0,
    }))
  }, [datasetMap])

  const velocityTrendData = useMemo(() => {
    const data = datasetMap.velocityTrend
    if (!data?.labels?.length) return []
    const average =
      data.series && data.series.length
        ? data.series.reduce((sum, value) => sum + value, 0) / data.series.length
        : 0
    return data.labels.map((label, idx) => ({
      sprint: label,
      planned: average,
      average,
      team_global_actual: data.series?.[idx] ?? 0,
    }))
  }, [datasetMap])

  const velocityTeams = useMemo(
    () => (velocityTrendData.length ? [{ id: 'global', name: 'Velocity', color: '#3b82f6' }] : []),
    [velocityTrendData]
  )

  const storiesCompletedData = useMemo(() => {
    const data = datasetMap.completionTrend
    if (!data?.labels?.length) return []
    return data.labels.map((label, idx) => ({
      week: label,
      completed: data.series?.[idx] ?? 0,
    }))
  }, [datasetMap])

  const teamPerformanceData = useMemo(() => {
    const data = datasetMap.teamCapacity
    if (!Array.isArray(data)) return []
    return data.map((team) => ({
      name: team.team || team.name || 'Team',
      velocity: team.velocity || 0,
      capacity: team.capacity || 0,
    }))
  }, [datasetMap])

  const cycleTimeData = useMemo(
    () =>
      storiesCompletedData.map((item) => ({
        name: item.week,
        value: Math.max(item.completed / 2, 0),
      })),
    [storiesCompletedData]
  )

  const leadTimeData = useMemo(
    () =>
      storiesCompletedData.map((item) => ({
        name: item.week,
        value: item.completed,
      })),
    [storiesCompletedData]
  )

  const developerPerformanceData = useMemo(() => {
    return users.slice(0, 5).map((user, index) => ({
      id: user.id,
      name: user.name,
      tasks: 35 + index * 2,
      points: 85 + index * 7,
      avgTime: `${2.3 + index * 0.2}d`,
      quality: 85 + index * 1.5,
    }))
  }, [users])

  const aiAccuracyData = [
    { month: 'Jan', complexity: 85, assignment: 78, planning: 82 },
    { month: 'Feb', complexity: 87, assignment: 80, planning: 84 },
    { month: 'Mar', complexity: 89, assignment: 82, planning: 86 },
    { month: 'Apr', complexity: 88, assignment: 81, planning: 85 },
    { month: 'May', complexity: 90, assignment: 83, planning: 87 },
    { month: 'Jun', complexity: 91, assignment: 85, planning: 88 },
  ]

  const { data: riskPayload, isLoading: riskLoading } = useRiskAlerts({
    enabled: showRiskInsights,
  })

  const riskAlerts = showRiskInsights
    ? riskPayload?.alerts || riskPayload?.data?.alerts || []
    : []
  const bottlenecks = showRiskInsights
    ? riskPayload?.bottlenecks || riskPayload?.data?.bottlenecks || []
    : []

  const riskHeatmapData = useMemo(() => {
    if (!riskAlerts.length) return []
    const grouped = riskAlerts.reduce((acc, alert) => {
      const key = alert.projectId || alert.projectName || alert.sprintId || alert.sprintName || alert.id
      if (!acc[key]) {
        acc[key] = {
          name: alert.projectName || alert.sprintName || 'Portfolio',
          risks: [],
        }
      }
      acc[key].risks.push({
        level: alert.severity || 'medium',
        type: alert.type || 'general',
      })
      return acc
    }, {})
    return Object.values(grouped)
  }, [riskAlerts])

  const topRisks = useMemo(() => {
    if (!riskAlerts.length) return []
    return riskAlerts.slice(0, 3).map((alert) => ({
      id: alert.id,
      description: alert.message || alert.description || alert.title,
      severity: alert.severity || 'medium',
      affected: [alert.projectName || alert.sprintName || 'Portfolio'],
      status: alert.recommendation ? 'mitigation' : 'active',
    }))
  }, [riskAlerts])

  const riskTrendData = useMemo(() => {
    if (!riskAlerts.length) return []
    const counts = riskAlerts.reduce(
      (acc, alert) => {
        const severity = alert.severity || 'medium'
        acc[severity] = (acc[severity] || 0) + 1
        return acc
      },
      { high: 0, medium: 0, low: 0 }
    )
    return [
      {
        month: 'Current',
        high: counts.high || 0,
        medium: counts.medium || 0,
        low: counts.low || 0,
      },
    ]
  }, [riskAlerts])

  // Summary metrics
  const totalStoryPoints = statusPieData.reduce((sum, item) => sum + (item.value || 0), 0)
  const completedPoints =
    statusPieData.find((item) => ['done', 'completed'].includes(item.name))?.value || 0
  const avgVelocity =
    velocityTrendData.length > 0
      ? velocityTrendData.reduce((sum, entry) => sum + (entry.team_global_actual || 0), 0) /
        velocityTrendData.length
      : 0
  const completionRate = totalStoryPoints > 0 ? Math.round((completedPoints / totalStoryPoints) * 100) : 0

  const handleExportPDF = () => exportDashboardPDF.mutate({ dateRange, filters })
  const handleExportProjects = () => exportProjectsExcel.mutate()
  const handleExportTeams = () => exportTeamsExcel.mutate()
  const handleExportStories = () => exportStoriesExcel.mutate(filters)
  const handleExportTasks = () => exportTasksExcel.mutate(filters)
  const handlePrint = () => window.print()

  const exportMenuItems = [
    {
      label: exportProjectsExcel.isPending ? 'Exporting projects…' : 'Projects (.xlsx)',
      onClick: handleExportProjects,
      disabled: exportProjectsExcel.isPending,
    },
    {
      label: exportStoriesExcel.isPending ? 'Exporting stories…' : 'Stories (.xlsx)',
      onClick: handleExportStories,
      disabled: exportStoriesExcel.isPending,
    },
    {
      label: exportTasksExcel.isPending ? 'Exporting tasks…' : 'Tasks (.xlsx)',
      onClick: handleExportTasks,
      disabled: exportTasksExcel.isPending,
    },
    {
      label: exportTeamsExcel.isPending ? 'Exporting teams…' : 'Teams (.xlsx)',
      onClick: handleExportTeams,
      disabled: exportTeamsExcel.isPending,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your team's performance</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full sm:w-48"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="custom">Custom Range</option>
          </Select>
          <Button
            variant="outlined"
            onClick={() => setIsFilterOpen(true)}
            leftIcon={<Filter className="w-4 h-4" />}
          >
            Filters
          </Button>
          <ExportButton
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportProjects}
            loading={exportDashboardPDF.isPending || exportProjectsExcel.isPending}
          />
          <Dropdown
            trigger={
              <Button
                variant="outlined"
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export Data
              </Button>
            }
            items={exportMenuItems}
            position="bottom-right"
          />
          <Button
            variant="outlined"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print
          </Button>
          <Button variant="primary" onClick={() => handleOpenCustomReport()}>
            Build Custom Report
          </Button>
        </div>
      </div>

      {/* Team Performance Overview */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Performance Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Story Points</p>
            <p className="text-2xl font-bold text-gray-900">{totalStoryPoints}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Average Velocity</p>
            <p className="text-2xl font-bold text-gray-900">{avgVelocity.toFixed(1)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
            <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Active Projects</p>
            <p className="text-2xl font-bold text-gray-900">3</p>
          </div>
        </div>
        {widgetsLoading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="md" color="primary" />
          </div>
        ) : teamPerformanceData.length === 0 ? (
          <p className="text-sm text-gray-500">No team performance data available.</p>
        ) : (
          <TeamPerformanceChart data={teamPerformanceData} />
        )}
      </Card>

      {/* Sprint Velocity Trends */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sprint Velocity Trends</h2>
        {widgetsLoading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="md" color="primary" />
          </div>
        ) : velocityTrendData.length === 0 ? (
          <p className="text-sm text-gray-500">No sprint velocity data available.</p>
        ) : (
          <VelocityTrendChart data={velocityTrendData} teams={velocityTeams} />
        )}
      </Card>

      {/* Story Completion Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Story Distribution by Status</h2>
          {widgetsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="md" color="primary" />
            </div>
          ) : statusPieData.length === 0 ? (
            <p className="text-sm text-gray-500">No status data available for the selected filters.</p>
          ) : (
            <StoryStatusPieChart data={statusPieData} />
          )}
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stories Completed per Week</h2>
          {widgetsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="md" color="primary" />
            </div>
          ) : storiesCompletedData.length === 0 ? (
            <p className="text-sm text-gray-500">No completion data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={storiesCompletedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#3b82f6" name="Stories Completed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Cycle Time and Lead Time */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cycle Time & Lead Time</h2>
        {widgetsLoading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="md" color="primary" />
          </div>
        ) : cycleTimeData.length === 0 ? (
          <p className="text-sm text-gray-500">No cycle time data available.</p>
        ) : (
          <CycleTimeChart cycleTimeData={cycleTimeData} leadTimeData={leadTimeData} />
        )}
      </Card>

      {/* Advanced Analytics Widgets */}
      {additionalWidgetCards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Advanced Analytics</h2>
              <p className="text-sm text-gray-600">
                Additional widgets surfaced from the reporting service.
              </p>
            </div>
            {widgetsLoading && <Spinner size="sm" color="primary" />}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {additionalWidgetCards.map(({ widget, dataset }) => (
              <Card key={widget.id} className="p-5 space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{widget.title}</h3>
                  {widget.description && (
                    <p className="text-sm text-gray-500">{widget.description}</p>
                  )}
                </div>
                {renderAdditionalWidgetContent(widget, dataset)}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Developer Performance Comparison */}
      <Card className="p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Developer Performance Comparison</h2>
          <Dropdown
            trigger={
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FileSpreadsheet className="w-4 h-4" />}
              >
                Export table
              </Button>
            }
            items={exportMenuItems}
            position="bottom-right"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Developer</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Tasks</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Story Points</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Avg Time</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Quality</th>
              </tr>
            </thead>
            <tbody>
              {developerPerformanceData.map((dev, index) => (
                <tr
                  key={dev.id || index}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => dev.id && navigate(`/users/${dev.id}`)}
                >
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">{dev.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">{dev.tasks}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">{dev.points}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">{dev.avgTime}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full',
                            dev.quality >= 90 ? 'bg-success-500' : dev.quality >= 80 ? 'bg-primary-500' : 'bg-warning-500'
                          )}
                          style={{ width: `${dev.quality}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 w-10">{Math.round(dev.quality)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Prediction Accuracy */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Prediction Accuracy</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Complexity Estimation</p>
            <p className="text-2xl font-bold text-gray-900">89%</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Task Assignment</p>
            <p className="text-2xl font-bold text-gray-900">82%</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Sprint Planning</p>
            <p className="text-2xl font-bold text-gray-900">86%</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={aiAccuracyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="complexity" stroke="#3b82f6" strokeWidth={2} name="Complexity" />
            <Line type="monotone" dataKey="assignment" stroke="#10b981" strokeWidth={2} name="Assignment" />
            <Line type="monotone" dataKey="planning" stroke="#f59e0b" strokeWidth={2} name="Planning" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Risk Analysis Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Heatmap</h2>
          {!showRiskInsights ? (
            <p className="text-sm text-gray-500">
              Risk analytics are available for managers and admins.
            </p>
          ) : riskLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="md" color="primary" />
            </div>
          ) : riskHeatmapData.length === 0 ? (
            <p className="text-sm text-gray-500">No risk signals detected for the selected filters.</p>
          ) : (
            <RiskHeatmap data={riskHeatmapData} />
          )}
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Risks</h2>
          {!showRiskInsights ? (
            <p className="text-sm text-gray-500">
              Sign in as a manager to view detailed risk alerts.
            </p>
          ) : riskLoading ? (
            <div className="flex items-center justify-center h-32">
              <Spinner size="sm" color="primary" />
            </div>
          ) : topRisks.length === 0 ? (
            <p className="text-sm text-gray-500">No critical risks at the moment.</p>
          ) : (
            <div className="space-y-3">
              {topRisks.map((risk) => (
                <div key={risk.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 flex-1">{risk.description}</p>
                    <Badge
                      variant={risk.severity === 'high' ? 'error' : risk.severity === 'medium' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {risk.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                    <span>Affected: {risk.affected.join(', ')}</span>
                    <Badge variant="outlined" size="sm">
                      {risk.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Risk Trend Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Trend</h2>
        {!showRiskInsights ? (
          <p className="text-sm text-gray-500">Risk trends require manager access.</p>
        ) : riskLoading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="md" color="primary" />
          </div>
        ) : riskTrendData.length === 0 ? (
          <p className="text-sm text-gray-500">No risk trend data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={riskTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="high" stroke="#ef4444" strokeWidth={2} name="High Risk" />
              <Line type="monotone" dataKey="medium" stroke="#f59e0b" strokeWidth={2} name="Medium Risk" />
              <Line type="monotone" dataKey="low" stroke="#10b981" strokeWidth={2} name="Low Risk" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Saved Custom Reports */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Saved Custom Reports</h2>
            <p className="text-sm text-gray-600">Open, edit, or run viewer reports you’ve built.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outlined" size="sm" onClick={() => handleOpenCustomReport()}>
              New Custom Report
            </Button>
          </div>
        </div>
        {customReportsLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-500 text-sm">Loading custom reports...</div>
        ) : customReports.length === 0 ? (
          <div className="text-sm text-gray-500 py-4">No saved reports yet. Build one to see it here.</div>
        ) : (
          <div className="space-y-3">
            {customReports.slice(0, 5).map((report) => (
              <div
                key={report._id || report.id}
                className="p-4 border border-gray-200 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{report.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {report.description || 'No description provided'}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    Visibility:{' '}
                    <Badge size="sm" variant="outlined">
                      {report.sharedWith?.scope || 'private'}
                    </Badge>
                    {report.schedule?.enabled && (
                      <span className="ml-2">• Scheduled {report.schedule.frequency}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outlined"
                    onClick={() => handleOpenCustomReport(report._id || report.id)}
                  >
                    Open in Builder
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenCustomReport(report._id || report.id)}
                  >
                    Run
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  )
}

