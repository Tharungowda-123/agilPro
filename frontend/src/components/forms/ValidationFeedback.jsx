import PropTypes from 'prop-types'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/utils'

/**
 * ValidationFeedback Component
 * Shows validation status with icons and messages
 */
export default function ValidationFeedback({
  status,
  message,
  className = '',
}) {
  if (!status) {
    return null
  }

  const variants = {
    success: {
      icon: CheckCircle2,
      color: 'text-success-500',
      bg: 'bg-success-50',
      border: 'border-success-200',
    },
    error: {
      icon: XCircle,
      color: 'text-error-500',
      bg: 'bg-error-50',
      border: 'border-error-200',
    },
    warning: {
      icon: AlertCircle,
      color: 'text-warning-500',
      bg: 'bg-warning-50',
      border: 'border-warning-200',
    },
  }

  const variant = variants[status] || variants.error
  const Icon = variant.icon

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border',
        variant.bg,
        variant.border,
        className
      )}
      role="alert"
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', variant.color)} />
      {message && (
        <p className={cn('text-sm font-medium', variant.color)}>{message}</p>
      )}
    </div>
  )
}

ValidationFeedback.propTypes = {
  status: PropTypes.oneOf(['success', 'error', 'warning']),
  message: PropTypes.string,
  className: PropTypes.string,
}

