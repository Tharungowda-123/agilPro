import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  useSystemHealth,
  useSlowQueries,
  useHealthErrors,
  useRequestHistory,
  useHealthStatus,
} from '@/hooks/api/useHealth'
import { useTaskModelStats } from '@/hooks/api/useTasks'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Alert from '@/components/ui/Alert'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'

export default function SystemHealth() {
  const { data: overview, isLoading } = useSystemHealth()
  const { data: slowQueryData } = useSlowQueries()
  const { data: errorData } = useHealthErrors()
  const { data: requestHistoryData } = useRequestHistory()
  const { data: healthStatus } = useHealthStatus()
  const { data: taskModelStats, isLoading: modelStatsLoading } = useTaskModelStats()

  const slowQueries = slowQueryData?.slowQueries || []
  const recentErrors = errorData?.errors || []
  const requestHistory = requestHistoryData?.history || []

  const requestChartData = useMemo(() => {
    return requestHistory
      .slice()
      .reverse()
      .map((entry) => ({
        name: new Date(entry.timestamp).toLocaleTimeString([], { minute: '2-digit', hour: '2-digit' }),
        duration: Number(entry.durationMs?.toFixed(2)) || 0,
        status: entry.statusCode,
      }))
      .slice(-20)
  }, [requestHistory])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="p-6">
        <Alert variant="error" title="Unable to load system metrics" />
      </div>
    )
  }

  const { api, system, database, alerts } = overview

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">System Health Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Live metrics for API performance, infrastructure health, and database activity.
          </p>
        </div>
        <Link
          to="/admin/audit-logs"
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View audit logs
        </Link>
      </header>

      <StatusRibbon status={healthStatus} />

      <StatsGrid api={api} system={system} database={database} />

      <ModelHealthPanel stats={taskModelStats} loading={modelStatsLoading} />

      {alerts?.length > 0 && <AlertPanel alerts={alerts} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="API Response Times">
          {requestChartData.length === 0 ? (
            <EmptyState message="No request history yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={requestChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="ms" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="duration"
                  stroke="#111827"
                  strokeWidth={2}
                  name="Duration (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Resource Utilization">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={[
                {
                  name: 'Memory',
                  usage: system?.memory?.memoryUsagePercent || 0,
                },
                {
                  name: 'CPU',
                  usage: system?.cpu?.usagePercent || 0,
                },
                {
                  name: 'Disk',
                  usage: system?.disk?.usagePercent || 0,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="%" />
              <Tooltip />
              <Bar dataKey="usage" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SlowQueryPanel queries={slowQueries} />
        <ErrorPanel errors={recentErrors} />
      </div>
    </div>
  )
}

function StatusRibbon({ status }) {
  if (!status) return null

  const items = [
    { label: 'Database', value: status.database || 'unknown' },
    { label: 'Uptime', value: formatDuration(status.uptime || 0) },
    {
      label: 'Last Check',
      value: status.time ? new Date(status.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
          <p className="text-xs uppercase text-gray-500 tracking-wide">{item.label}</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function StatsGrid({ api, system, database }) {
  const items = [
    {
      label: 'Avg Response Time',
      value: `${Math.round(api?.averageResponseTime || 0)} ms`,
      helper: `${api?.totalRequests || 0} reqs`,
    },
    {
      label: 'Error Rate',
      value: `${((api?.errorRate || 0) * 100).toFixed(2)}%`,
      helper: `${api?.errorCount || 0} errors`,
    },
    {
      label: 'Active Users',
      value: system?.activeUsers || 0,
      helper: 'Currently active',
    },
    {
      label: 'API Uptime',
      value: formatDuration(system?.uptime || 0),
      helper: 'Since last restart',
    },
    {
      label: 'Avg Query Time',
      value: `${(database?.averageQueryDuration || 0).toFixed(1)} ms`,
      helper: `${database?.totalQueries || 0} queries`,
    },
    {
      label: 'CPU Load',
      value: `${(system?.cpu?.usagePercent || 0).toFixed(1)}%`,
      helper: `Load avg ${system?.cpu?.load1?.toFixed(2) || 0}`,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.label} className="p-4 border border-gray-200 rounded-xl bg-white">
          <p className="text-xs uppercase text-gray-500 tracking-wide">{item.label}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{item.value}</p>
          <p className="text-xs text-gray-500 mt-1">{item.helper}</p>
        </div>
      ))}
    </div>
  )
}

function AlertPanel({ alerts }) {
  return (
    <Card title="Active Alerts">
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={`${alert.type}-${index}`}
            className="flex items-start justify-between border border-gray-100 rounded-lg px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-gray-900 capitalize">{alert.type}</p>
              <p className="text-xs text-gray-500">{alert.message}</p>
            </div>
            <Badge variant={alert.severity === 'critical' ? 'error' : 'warning'} size="sm">
              {alert.severity}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ModelHealthPanel({ stats, loading }) {
  return (
    <Card title="ML Model Health">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : !stats ? (
        <EmptyState message="Model stats unavailable." />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <MetricTile
              label="Assignment Accuracy"
              value={
                typeof stats.accuracy === 'number'
                  ? `${(stats.accuracy * 100).toFixed(1)}%`
                  : stats.accuracyLabel || '--'
              }
              helper="Last 30 days"
            />
            <MetricTile
              label="Avg Response"
              value={`${Math.round(stats.avg_response_ms || stats.latencyMs || 0)} ms`}
              helper="Task recommendation latency"
            />
            <MetricTile
              label="Feedback Ratio"
              value={
                stats.feedback_positive !== undefined && stats.feedback_total
                  ? `${Math.round((stats.feedback_positive / stats.feedback_total) * 100)}% positive`
                  : stats.feedbackSummary || '--'
              }
              helper={`${stats.feedback_total || 0} responses`}
            />
          </div>

          {stats.alerts?.length > 0 && (
            <div className="border border-warning-100 rounded-lg p-3 bg-warning-50/40">
              <p className="text-xs font-semibold text-warning-800 uppercase mb-2">Model Warnings</p>
              <ul className="text-sm text-warning-900 list-disc list-inside space-y-1">
                {stats.alerts.map((alert, idx) => (
                  <li key={`${alert}-${idx}`}>{alert}</li>
                ))}
              </ul>
            </div>
          )}

          {stats.retraining?.last_run && (
            <div className="text-xs text-gray-500">
              Last training: {new Date(stats.retraining.last_run).toLocaleString()} • Drift score:{' '}
              {(stats.retraining.drift_score || 0).toFixed(2)}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function MetricTile({ label, value, helper }) {
  return (
    <div className="p-3 border border-gray-100 rounded-lg">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-500">{helper}</p>
    </div>
  )
}

function SlowQueryPanel({ queries }) {
  return (
    <Card title="Slow Queries">
      {queries.length === 0 ? (
        <EmptyState message="No slow queries detected." />
      ) : (
        <div className="space-y-3 max-h-[360px] overflow-y-auto">
          {queries.map((query, idx) => (
            <div key={`${query.collection}-${idx}`} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">
                  {query.collection}.{query.operation}
                </p>
                <Badge variant="outlined" size="sm">
                  {query.durationMs.toFixed(0)} ms
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1 break-all">
                {JSON.stringify(query.query)}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(query.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
          <div className="text-right">
            <Link
              to="/admin/audit-logs?tab=database"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View database logs →
            </Link>
          </div>
        </div>
      )}
    </Card>
  )
}

function ErrorPanel({ errors }) {
  return (
    <Card title="Recent Errors">
      {errors.length === 0 ? (
        <EmptyState message="No recent errors logged." />
      ) : (
        <div className="space-y-3 max-h-[360px] overflow-y-auto">
          {errors.map((error, idx) => (
            <div key={`error-${idx}`} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">{error.message}</p>
                <Badge variant="outlined" size="sm">
                  {error.name}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                {error.route} · {error.method} · {error.user}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(error.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
          <div className="text-right">
            <Link
              to="/admin/audit-logs?tab=errors"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Investigate errors →
            </Link>
          </div>
        </div>
      )}
    </Card>
  )
}

function Card({ title, children }) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function EmptyState({ message }) {
  return <p className="text-sm text-gray-500">{message}</p>
}

const formatDuration = (seconds) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  return `${mins}m`
}

