import PropTypes from 'prop-types'
import { cn } from '@/utils'

/**
 * Avatar Component
 * 
 * @example
 * <Avatar src="/user.jpg" alt="User" size="md" />
 * 
 * @example
 * <Avatar name="John Doe" size="lg" online />
 */
export default function Avatar({
  src,
  alt,
  name,
  size = 'md',
  online = false,
  className = '',
  ...props
}) {
  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  }

  const indicatorSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  }

  return (
    <div className={cn('relative inline-block', className)} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={cn('rounded-full object-cover', sizes[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-primary-500 text-white flex items-center justify-center font-medium',
            sizes[size]
          )}
          aria-label={alt || name}
        >
          {getInitials(name)}
        </div>
      )}
      {online && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full bg-success-500 border-2 border-white',
            indicatorSizes[size]
          )}
          aria-label="Online"
        />
      )}
    </div>
  )
}

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  online: PropTypes.bool,
  className: PropTypes.string,
}

