import { AlertTriangle, AlertCircle, TrendingUp, MessageSquare } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { cn } from '@/utils'

/**
 * Workload Meter Component
 * Visual progress meter showing capacity vs assigned workload
 */
export default function WorkloadMeter({ workload, onRequestHelp, onRequestMoreTasks }) {
  if (!workload) return null

  const { capacity, assignedPoints, utilization, availablePoints, isOverloaded, isUnderutilized } = workload

  const getColor = () => {
    if (utilization >= 100) return 'error'
    if (utilization >= 80) return 'warning'
    return 'success'
  }

  const color = getColor()

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Workload Meter</h3>
            {workload.sprint && (
              <p className="text-sm text-gray-600 mt-1">{workload.sprint.name}</p>
            )}
          </div>
          <Badge
            variant={color === 'error' ? 'error' : color === 'warning' ? 'warning' : 'success'}
            size="lg"
          >
            {utilization}%
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Assigned</span>
            <span className="font-medium text-gray-900">
              {assignedPoints.toFixed(1)} / {capacity.toFixed(1)} pts
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={cn(
                'h-4 rounded-full transition-all duration-300',
                color === 'error'
                  ? 'bg-error-500'
                  : color === 'warning'
                  ? 'bg-warning-500'
                  : 'bg-success-500'
              )}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Available: {availablePoints.toFixed(1)} pts</span>
            <span>{utilization}% utilized</span>
          </div>
        </div>

        {/* Alerts */}
        {isOverloaded && (
          <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-error-900 mb-1">You're Overloaded!</p>
              <p className="text-sm text-error-700 mb-2">
                You have {assignedPoints.toFixed(1)} points assigned but your capacity is only{' '}
                {capacity.toFixed(1)} points.
              </p>
              {onRequestHelp && (
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={onRequestHelp}
                  leftIcon={<MessageSquare className="w-4 h-4" />}
                  className="text-error-700 border-error-300 hover:bg-error-100"
                >
                  Request Help from Manager
                </Button>
              )}
            </div>
          </div>
        )}

        {isUnderutilized && availablePoints > 5 && (
          <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-primary-900 mb-1">You're Underutilized</p>
              <p className="text-sm text-primary-700 mb-2">
                You have {availablePoints.toFixed(1)} points available. Consider requesting more
                tasks.
              </p>
              {onRequestMoreTasks && (
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={onRequestMoreTasks}
                  leftIcon={<TrendingUp className="w-4 h-4" />}
                  className="text-primary-700 border-primary-300 hover:bg-primary-100"
                >
                  Request More Tasks
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Capacity Forecast */}
        {!isOverloaded && availablePoints > 0 && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">You can take {availablePoints.toFixed(1)} more story points</span>{' '}
              {workload.sprint ? 'this sprint' : 'currently'}.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

