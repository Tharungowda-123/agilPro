import PropTypes from 'prop-types'
import { cn } from '@/utils'

/**
 * Button Component
 * 
 * @example
 * <Button variant="primary" size="md" loading={isLoading}>
 *   Click Me
 * </Button>
 * 
 * @example
 * <Button variant="outline" leftIcon={<Icon />} fullWidth>
 *   Submit
 * </Button>
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  type = 'button',
  onClick,
  'aria-label': ariaLabel,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'

  const variants = {
    primary:
      'bg-primary-500 text-white hover:bg-primary-600 dark:hover:bg-primary-500/90 focus:ring-primary-500',
    secondary:
      'bg-secondary-500 text-white hover:bg-secondary-600 dark:hover:bg-secondary-500/90 focus:ring-secondary-500',
    outline:
      'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 dark:text-primary-200 dark:border-primary-400 dark:hover:bg-primary-500/10 focus:ring-primary-500',
    outlined:
      'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 dark:text-primary-200 dark:border-primary-400 dark:hover:bg-primary-500/10 focus:ring-primary-500',
    ghost:
      'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800/70 focus:ring-gray-500 dark:focus:ring-slate-400',
    danger:
      'bg-error-500 text-white hover:bg-error-600 dark:hover:bg-error-500/90 focus:ring-error-500',
    success:
      'bg-success-500 text-white hover:bg-success-600 dark:hover:bg-success-500/90 focus:ring-success-500',
  }

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  }

  return (
    <button
      type={type}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'outlined', 'ghost', 'danger', 'success']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  fullWidth: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  'aria-label': PropTypes.string,
}
