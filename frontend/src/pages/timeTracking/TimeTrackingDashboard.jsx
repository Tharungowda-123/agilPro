import { useState } from 'react'
import { Clock, Calendar, TrendingUp, Download, Filter } from 'lucide-react'
import { useTimeTrackingSummary, useTimeEntries, useActiveTimer } from '@/hooks/api/useTimeEntries'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { useNavigate } from 'react-router-dom'
import { useExportTimeEntriesPDF, useExportTimeEntriesExcel } from '@/hooks/api/useExport'
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
import { cn } from '@/utils'

/**
 * Time Tracking Dashboard
 * Displays time tracking summary, history, and reports for developers
 */
export default function TimeTrackingDashboard() {
  const navigate = useNavigate()
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7) // Last 7 days
    return date.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  const { data: summary, isLoading: summaryLoading } = useTimeTrackingSummary({
    dateFrom,
    dateTo,
  })
  const { data: timeEntriesData, isLoading: entriesLoading } = useTimeEntries({
    dateFrom,
    dateTo,
  })
  const { data: activeTimer } = useActiveTimer()
  const exportTimeEntriesPDF = useExportTimeEntriesPDF()
  const exportTimeEntriesExcel = useExportTimeEntriesExcel()

  const timeEntries = timeEntriesData?.data || timeEntriesData || []

  const handleExportPDF = () => {
    exportTimeEntriesPDF.mutate({ dateFrom, dateTo })
  }

  const handleExportExcel = () => {
    exportTimeEntriesExcel.mutate({ dateFrom, dateTo })
  }

  // Prepare chart data
  const buildBoardUrl = (entry) => {
    if (!entry?.task) return null
    const projectId =
      entry.task.project?._id ||
      entry.task.projectId ||
      entry.task.project ||
      entry.story?.projectId ||
      null
    const storyId =
      entry.task.story?._id ||
      entry.task.storyId ||
      entry.story?._id ||
      entry.storyId ||
      null
    const taskId = entry.task._id || entry.task.id
    const params = new URLSearchParams()
    if (projectId) params.set('projectId', projectId)
    if (storyId) params.set('storyId', storyId)
    if (taskId) params.set('taskId', taskId)
    const query = params.toString()
    return query ? `/board?${query}` : null
  }

  const dailyData = summary?.byDate
    ? Object.entries(summary.byDate)
        .map(([date, hours]) => ({ date, hours }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    : []

  if (summaryLoading || entriesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking Dashboard</h1>
          <p className="text-gray-600 mt-1">Track and manage your work time</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outlined"
            onClick={handleExportExcel}
            leftIcon={<Download className="w-4 h-4" />}
            loading={exportTimeEntriesExcel.isPending}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            onClick={handleExportPDF}
            leftIcon={<Download className="w-4 h-4" />}
            loading={exportTimeEntriesPDF.isPending}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Active Timer Alert */}
      {activeTimer && (
        <Card className="p-4 bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary-600" />
            <div className="flex-1">
              <p className="font-medium text-primary-900">Timer Running</p>
              <p className="text-sm text-primary-700">
                Task: {activeTimer.task?.title || 'Unknown'} • Started:{' '}
                {new Date(activeTimer.startTime || activeTimer.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Clock className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.todayHours?.toFixed(2) || '0.00'}h
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <Calendar className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.weekHours?.toFixed(2) || '0.00'}h
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total (Period)</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.totalHours?.toFixed(2) || '0.00'}h
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info-100 rounded-lg">
              <Filter className="w-5 h-5 text-info-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Entries</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.entryCount || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">From:</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">To:</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Hours Chart */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Project Breakdown */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">By Project</h3>
          <div className="space-y-2">
            {summary?.byProject && summary.byProject.length > 0 ? (
              summary.byProject.map((project, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => project.projectId && navigate(`/projects/${project.projectId}`)}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors w-full text-left"
                >
                  <span className="text-sm font-medium text-gray-900">{project.name}</span>
                  <span className="text-sm text-gray-600">{project.hours.toFixed(2)}h</span>
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-400">No project data</p>
            )}
          </div>
        </Card>
      </div>

      {/* Time Entries Table */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Time Entries</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Task</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Hours</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Type</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-400">
                    No time entries found
                  </td>
                </tr>
              ) : (
                timeEntries.slice(0, 20).map((entry) => {
                  const boardLink = buildBoardUrl(entry)
                  return (
                  <tr
                    key={entry._id || entry.id}
                    className={`border-b border-gray-100 ${
                      boardLink ? 'cursor-pointer hover:bg-primary-50' : ''
                    }`}
                    onClick={() => boardLink && navigate(boardLink)}
                  >
                    <td className="py-2 px-4 text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-900">
                      {entry.task?.title || 'N/A'}
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-900">{entry.hours.toFixed(2)}h</td>
                    <td className="py-2 px-4 text-sm">
                      <span
                        className={cn(
                          'px-2 py-1 rounded text-xs',
                          entry.entryType === 'timer'
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {entry.entryType === 'timer' ? 'Timer' : 'Manual'}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-600">
                      {entry.description || '-'}
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

