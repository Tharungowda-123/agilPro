import PropTypes from 'prop-types'
import { cn } from '@/utils'

/**
 * Skeleton Component for loading states
 * 
 * @example
 * <Skeleton variant="text" width="200px" />
 * 
 * @example
 * <Skeleton variant="circle" size="40px" />
 */
export default function Skeleton({
  variant = 'rectangle',
  width,
  height,
  size,
  className = '',
  ...props
}) {
  const baseStyles = 'bg-gray-200 animate-pulse rounded'

  const variants = {
    text: 'h-4',
    rectangle: 'h-20',
    circle: 'rounded-full',
  }

  const style = {}
  if (width) style.width = width
  if (height) style.height = height
  if (size && variant === 'circle') {
    style.width = size
    style.height = size
  }

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      style={style}
      aria-busy="true"
      aria-label="Loading"
      {...props}
    />
  )
}

Skeleton.propTypes = {
  variant: PropTypes.oneOf(['text', 'rectangle', 'circle']),
  width: PropTypes.string,
  height: PropTypes.string,
  size: PropTypes.string,
  className: PropTypes.string,
}

