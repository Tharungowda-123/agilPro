import PropTypes from 'prop-types'
import { TrendingUp, ExternalLink } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ConfidenceIndicator from './ConfidenceIndicator'
import { cn } from '@/utils'

/**
 * ComplexityInsightsCard Component
 * Card displaying AI complexity analysis for a story
 * 
 * @example
 * <ComplexityInsightsCard
 *   story={story}
 *   insights={insights}
 *   onViewFull={handleViewFull}
 * />
 */
export default function ComplexityInsightsCard({
  story,
  insights,
  onViewFull,
  className = '',
}) {
  if (!insights) return null

  const complexityAreas = [
    { label: 'UI', value: insights.ui || 0, max: 10 },
    { label: 'Backend', value: insights.backend || 0, max: 10 },
    { label: 'Database', value: insights.database || 0, max: 10 },
    { label: 'Integration', value: insights.integration || 0, max: 10 },
  ]

  const overallComplexity = insights.overall || 0
  const estimatedPoints = insights.estimatedPoints || 0
  const confidence = insights.confidence || 0

  const getComplexityColor = (value) => {
    if (value >= 8) return 'bg-error-500'
    if (value >= 5) return 'bg-warning-500'
    return 'bg-success-500'
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-1">{story.title}</h4>
        <p className="text-xs text-gray-600">Complexity Analysis</p>
      </div>

      {/* Overall Complexity Score */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Complexity</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{overallComplexity}/10</span>
            <TrendingUp className={cn(
              'w-5 h-5',
              overallComplexity >= 8 ? 'text-error-600' : overallComplexity >= 5 ? 'text-warning-600' : 'text-success-600'
            )} />
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn('h-2 rounded-full transition-all', getComplexityColor(overallComplexity))}
            style={{ width: `${(overallComplexity / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Complexity Breakdown */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Complexity Breakdown</p>
        <div className="space-y-2">
          {complexityAreas.map((area) => (
            <div key={area.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-700">{area.label}</span>
                <span className="text-xs font-medium text-gray-900">
                  {area.value}/{area.max}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={cn('h-1.5 rounded-full transition-all', getComplexityColor(area.value))}
                  style={{ width: `${(area.value / area.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estimated Effort */}
      <div className="mb-4 p-3 bg-primary-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Estimated Effort</span>
          <Badge variant="outlined" size="md">
            {estimatedPoints} story points
          </Badge>
        </div>
        <ConfidenceIndicator score={confidence} size="sm" />
      </div>

      {/* Similar Stories */}
      {insights.similarStories && insights.similarStories.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2">Similar Stories</p>
          <div className="space-y-1">
            {insights.similarStories.slice(0, 3).map((similar) => (
              <div
                key={similar.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
              >
                <a
                  href={`#story-${similar.id}`}
                  className="text-primary-600 hover:underline flex items-center gap-1"
                >
                  {similar.title}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <Badge variant="outlined" size="sm">
                  {Math.round(similar.similarity * 100)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {onViewFull && (
        <Button
          variant="outlined"
          size="sm"
          onClick={onViewFull}
          className="w-full"
        >
          View Full Analysis
        </Button>
      )}
    </Card>
  )
}

ComplexityInsightsCard.propTypes = {
  story: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  insights: PropTypes.shape({
    overall: PropTypes.number,
    ui: PropTypes.number,
    backend: PropTypes.number,
    database: PropTypes.number,
    integration: PropTypes.number,
    estimatedPoints: PropTypes.number,
    confidence: PropTypes.number,
    similarStories: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        similarity: PropTypes.number,
      })
    ),
  }),
  onViewFull: PropTypes.func,
  className: PropTypes.string,
}

