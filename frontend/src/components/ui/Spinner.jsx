import PropTypes from 'prop-types'
import { cn } from '@/utils'

/**
 * Spinner Component
 * 
 * @example
 * <Spinner size="md" color="primary" />
 * 
 * @example
 * <Spinner size="lg" color="white" />
 */
export default function Spinner({
  size = 'md',
  color = 'primary',
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const colors = {
    primary: 'border-primary-500',
    white: 'border-white',
    gray: 'border-gray-400',
  }

  return (
    <div
      className={cn(
        'border-4 border-t-transparent rounded-full animate-spin',
        sizes[size],
        colors[color],
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['primary', 'white', 'gray']),
  className: PropTypes.string,
}

