import PropTypes from 'prop-types'
import { cn } from '@/utils'

/**
 * ConfidenceIndicator Component
 * Visual indicator for AI confidence scores
 * 
 * @example
 * <ConfidenceIndicator score={85} showLabel />
 */
export default function ConfidenceIndicator({
  score,
  showLabel = true,
  variant = 'bar',
  size = 'md',
  className = '',
}) {
  const getColorClass = () => {
    if (score >= 80) return 'bg-success-500'
    if (score >= 60) return 'bg-warning-500'
    return 'bg-error-500'
  }

  const getTextColor = () => {
    if (score >= 80) return 'text-success-600'
    if (score >= 60) return 'text-warning-600'
    return 'text-error-600'
  }

  const getLabel = () => {
    if (score >= 80) return 'High'
    if (score >= 60) return 'Medium'
    return 'Low'
  }

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  if (variant === 'circular') {
    const radius = size === 'sm' ? 20 : size === 'md' ? 30 : 40
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference

    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <svg className="transform -rotate-90" width={radius * 2 + 10} height={radius * 2 + 10}>
          <circle
            cx={radius + 5}
            cy={radius + 5}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx={radius + 5}
            cy={radius + 5}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn('transition-all duration-500', getColorClass())}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-semibold', size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base', getTextColor())}>
            {score}%
          </span>
        </div>
        {showLabel && (
          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2">
            <span className={cn('text-xs', getTextColor())}>{getLabel()}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Confidence</span>
          <span className={cn('font-medium', getTextColor())}>
            {score}% ({getLabel()})
          </span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('rounded-full transition-all duration-500', getColorClass(), sizes[size])}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

ConfidenceIndicator.propTypes = {
  score: PropTypes.number.isRequired,
  showLabel: PropTypes.bool,
  variant: PropTypes.oneOf(['bar', 'circular']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
}

