import PropTypes from 'prop-types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Card from '@/components/ui/Card'
import { cn } from '@/utils'

/**
 * StatsCard Component
 * Displays a metric with icon, value, and trend indicator
 * 
 * @example
 * <StatsCard
 *   title="Active Projects"
 *   value={12}
 *   icon={<Folder />}
 *   trend={{ value: 5, direction: 'up' }}
 *   color="primary"
 * />
 */
export default function StatsCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  className = '',
}) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 border-primary-200',
    success: 'bg-success-50 text-success-600 border-success-200',
    warning: 'bg-warning-50 text-warning-600 border-warning-200',
    error: 'bg-error-50 text-error-600 border-error-200',
    info: 'bg-blue-50 text-blue-600 border-blue-200',
  }

  const trendColors = {
    up: 'text-success-600',
    down: 'text-error-600',
    neutral: 'text-gray-500',
  }

  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus

  return (
    <Card className={cn('p-6 hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {trend && (
            <div className={cn('flex items-center gap-1 text-sm font-medium', trendColors[trend.direction])}>
              <TrendIcon className="w-4 h-4" />
              <span>
                {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                {trend.value}%
              </span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg border', colorClasses[color])}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  icon: PropTypes.node.isRequired,
  trend: PropTypes.shape({
    value: PropTypes.number,
    direction: PropTypes.oneOf(['up', 'down', 'neutral']),
  }),
  color: PropTypes.oneOf(['primary', 'success', 'warning', 'error', 'info']),
  className: PropTypes.string,
}

