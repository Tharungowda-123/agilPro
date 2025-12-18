import { memo } from 'react'
import PropTypes from 'prop-types'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/utils'

/**
 * GlobalLoading Component
 * Full screen loading overlay for page transitions
 * Shows spinner with optional message
 */
function GlobalLoading({ message, className = '' }) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4">
        {/* App Logo or Spinner */}
        <div className="relative">
          <Spinner size="xl" />
          {/* Optional: Add app logo here */}
          {/* <img src="/logo.svg" alt="Logo" className="w-16 h-16" /> */}
        </div>
        
        {/* Loading Message */}
        {message && (
          <p className="text-sm font-medium text-gray-600 animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

GlobalLoading.propTypes = {
  message: PropTypes.string,
  className: PropTypes.string,
}

export default memo(GlobalLoading)

