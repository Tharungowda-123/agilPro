import PropTypes from 'prop-types'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/utils'

/**
 * Alert Component
 * 
 * @example
 * <Alert variant="success" dismissible onDismiss={handleDismiss}>
 *   Operation completed successfully!
 * </Alert>
 */
export default function Alert({
  children,
  variant = 'info',
  dismissible = false,
  onDismiss,
  className = '',
  ...props
}) {
  const variants = {
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      text: 'text-success-800',
      icon: CheckCircle,
      iconColor: 'text-success-600',
    },
    error: {
      bg: 'bg-error-50',
      border: 'border-error-200',
      text: 'text-error-800',
      icon: AlertCircle,
      iconColor: 'text-error-600',
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      text: 'text-warning-800',
      icon: AlertTriangle,
      iconColor: 'text-warning-600',
    },
    info: {
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      text: 'text-primary-800',
      icon: Info,
      iconColor: 'text-primary-600',
    },
  }

  const config = variants[variant]
  const Icon = config.icon

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        config.bg,
        config.border,
        config.text,
        className
      )}
      {...props}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1">{children}</div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

Alert.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  dismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
}

