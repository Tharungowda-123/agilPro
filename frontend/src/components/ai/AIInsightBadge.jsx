import PropTypes from 'prop-types'
import { Sparkles } from 'lucide-react'
import Tooltip from '@/components/ui/Tooltip'
import { cn } from '@/utils'

/**
 * AIInsightBadge Component
 * Badge indicating AI insights are available
 * 
 * @example
 * <AIInsightBadge hasInsights={true} onClick={handleClick} />
 */
export default function AIInsightBadge({
  hasInsights = false,
  onClick,
  size = 'sm',
  className = '',
}) {
  if (!hasInsights) return null

  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <Tooltip content="AI insights available" position="top">
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200 transition-all animate-pulse',
          sizes[size],
          className
        )}
        aria-label="AI insights available"
      >
        <Sparkles className={cn('animate-pulse', iconSizes[size])} />
      </button>
    </Tooltip>
  )
}

AIInsightBadge.propTypes = {
  hasInsights: PropTypes.bool,
  onClick: PropTypes.func,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
}

