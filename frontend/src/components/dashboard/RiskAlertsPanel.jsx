import PropTypes from 'prop-types'
import { AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { cn } from '@/utils'

const severityMap = {
  high: { label: 'High', color: 'error' },
  medium: { label: 'Medium', color: 'warning' },
  low: { label: 'Low', color: 'success' },
}

export default function RiskAlertsPanel({ data, loading, className = '' }) {
  if (loading) {
    return (
      <Card className={cn('p-4 flex items-center gap-3', className)}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">Analyzing risks...</p>
      </Card>
    )
  }

  if (!data || (!data.alerts?.length && !data.bottlenecks?.length)) {
    return (
      <Card className={cn('p-4 text-sm text-gray-500', className)}>
        No major risks detected right now. Keep monitoring!
      </Card>
    )
  }

  const alerts = data.alerts?.slice(0, 5) || []
  const bottlenecks = data.bottlenecks?.slice(0, 4) || []

  return (
    <Card className={cn('p-5 space-y-5', className)}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-warning-500" />
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Risk Insights</h3>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Active Alerts
          </div>
          {alerts.map((alert) => {
            const severity = severityMap[alert.severity?.toLowerCase()] || severityMap.medium
            return (
              <div key={alert.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <Badge variant={severity.color} size="sm">
                    {severity.label}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {alert.projectName || alert.sprintName || alert.type}
                </p>
                {alert.recommendation && (
                  <p className="text-xs text-gray-600 mt-2">{alert.recommendation}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {bottlenecks.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <ShieldAlert className="w-4 h-4 text-error-500" />
            Capacity Bottlenecks
          </div>
          <div className="space-y-3">
            {bottlenecks.map((item, index) => {
              const severity = severityMap[item.severity?.toLowerCase()] || severityMap.medium
              return (
                <div key={item.id || index} className="p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {item.title || item.message || item.description || 'Bottleneck detected'}
                    </p>
                    <Badge variant={severity.color} size="sm">
                      {severity.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.team?.name || item.teamName || item.area || 'Capacity'}
                  </p>
                  {item.recommendation && (
                    <p className="text-xs text-gray-600 mt-2">{item.recommendation}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}

RiskAlertsPanel.propTypes = {
  data: PropTypes.shape({
    alerts: PropTypes.array,
    bottlenecks: PropTypes.array,
  }),
  loading: PropTypes.bool,
  className: PropTypes.string,
}

