import PropTypes from 'prop-types'
import { Sparkles } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/utils'

/**
 * AILoadingState Component
 * Loading state for AI analysis with animated icon
 * 
 * @example
 * <AILoadingState message="AI is analyzing..." />
 */
export default function AILoadingState({
  message = 'AI is analyzing...',
  showSkeleton = false,
  className = '',
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="lg" color="primary" />
        </div>
        <Sparkles className="w-12 h-12 text-primary-600 animate-pulse" />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-2">{message}</p>
      <p className="text-xs text-gray-500">This may take a few seconds</p>

      {showSkeleton && (
        <div className="w-full mt-6 space-y-3">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      )}
    </div>
  )
}

AILoadingState.propTypes = {
  message: PropTypes.string,
  showSkeleton: PropTypes.bool,
  className: PropTypes.string,
}

