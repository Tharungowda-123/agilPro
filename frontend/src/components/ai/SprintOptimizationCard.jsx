import PropTypes from 'prop-types'
import { useState } from 'react'
import { CheckCircle, AlertTriangle, TrendingUp, X } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import ConfidenceIndicator from './ConfidenceIndicator'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'

/**
 * SprintOptimizationCard Component
 * Card showing AI suggestions for sprint optimization
 * 
 * @example
 * <SprintOptimizationCard
 *   sprint={sprint}
 *   suggestions={suggestions}
 *   onAccept={handleAccept}
 * />
 */
export default function SprintOptimizationCard({
  sprint,
  suggestions = [],
  onAccept,
  onDismiss,
  className = '',
}) {
  const [selectedStories, setSelectedStories] = useState(
    suggestions.map((s) => s.storyId)
  )

  const handleToggleStory = (storyId) => {
    setSelectedStories((prev) =>
      prev.includes(storyId)
        ? prev.filter((id) => id !== storyId)
        : [...prev, storyId]
    )
  }

  const handleAcceptAll = () => {
    onAccept?.(selectedStories)
    toast.success('Sprint optimized!')
  }

  const handleDismiss = () => {
    onDismiss?.()
    toast.info('Suggestions dismissed')
  }

  if (suggestions.length === 0) {
    return null
  }

  const riskLevel = suggestions.find((s) => s.riskLevel)?.riskLevel || 'low'
  const expectedVelocity = suggestions.reduce((sum, s) => sum + (s.storyPoints || 0), 0)

  const riskColors = {
    high: 'border-error-300 bg-error-50',
    medium: 'border-warning-300 bg-warning-50',
    low: 'border-success-300 bg-success-50',
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">{sprint.name}</h4>
          <p className="text-sm text-gray-600">AI Suggests</p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Risk Level Indicator */}
      <div className={cn('p-3 rounded-lg border mb-4', riskColors[riskLevel])}>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className={cn(
            'w-4 h-4',
            riskLevel === 'high' ? 'text-error-600' : riskLevel === 'medium' ? 'text-warning-600' : 'text-success-600'
          )} />
          <span className="text-sm font-medium text-gray-900">
            Risk Level: {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
          </span>
        </div>
        <p className="text-xs text-gray-600">
          {riskLevel === 'high' && 'High risk of not meeting sprint goals'}
          {riskLevel === 'medium' && 'Moderate risk, some adjustments recommended'}
          {riskLevel === 'low' && 'Low risk, sprint looks well-balanced'}
        </p>
      </div>

      {/* Expected Velocity */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600">Expected Velocity</span>
        </div>
        <span className="font-semibold text-gray-900">{expectedVelocity} points</span>
      </div>

      {/* Suggested Stories */}
      <div className="space-y-2 mb-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.storyId}
            className={cn(
              'p-3 border rounded-lg transition-all',
              selectedStories.includes(suggestion.storyId)
                ? 'border-primary-300 bg-primary-50'
                : 'border-gray-200 bg-white'
            )}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedStories.includes(suggestion.storyId)}
                onChange={() => handleToggleStory(suggestion.storyId)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="font-medium text-gray-900">{suggestion.storyTitle}</h5>
                  {suggestion.storyPoints && (
                    <Badge variant="outlined" size="sm">
                      {suggestion.storyPoints} pts
                    </Badge>
                  )}
                </div>
                {suggestion.reason && (
                  <p className="text-xs text-gray-600">{suggestion.reason}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleAcceptAll}
          className="flex-1"
          leftIcon={<CheckCircle className="w-4 h-4" />}
        >
          Accept All ({selectedStories.length})
        </Button>
        <Button
          variant="outlined"
          size="sm"
          onClick={() => {
            // Customize action - could open a modal
            toast.info('Customize feature coming soon')
          }}
        >
          Customize
        </Button>
      </div>
    </Card>
  )
}

SprintOptimizationCard.propTypes = {
  sprint: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  suggestions: PropTypes.arrayOf(
    PropTypes.shape({
      storyId: PropTypes.string.isRequired,
      storyTitle: PropTypes.string.isRequired,
      storyPoints: PropTypes.number,
      reason: PropTypes.string,
      riskLevel: PropTypes.oneOf(['low', 'medium', 'high']),
    })
  ),
  onAccept: PropTypes.func,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
}

