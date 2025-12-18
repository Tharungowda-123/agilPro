import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Lightbulb, TrendingUp, ChevronRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/layout/EmptyState'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/utils'

/**
 * AIInsightsPanel Component
 * Displays AI-generated insights, recommendations, and predictions
 * 
 * @example
 * <AIInsightsPanel insights={insights} loading={false} />
 */
export default function AIInsightsPanel({ insights = [], loading = false, className = '' }) {
  const navigate = useNavigate()
  const getInsightIcon = (type) => {
    switch (type) {
      case 'risk':
        return <AlertTriangle className="w-5 h-5 text-error-600" />
      case 'recommendation':
        return <Lightbulb className="w-5 h-5 text-warning-600" />
      case 'prediction':
        return <TrendingUp className="w-5 h-5 text-success-600" />
      default:
        return <Lightbulb className="w-5 h-5 text-gray-600" />
    }
  }

  const getInsightBadge = (type) => {
    const variants = {
      risk: 'error',
      recommendation: 'warning',
      prediction: 'success',
    }
    return (
      <Badge variant={variants[type] || 'default'} size="sm">
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const handleInsightClick = (insight) => {
    if (typeof insight.onClick === 'function') {
      insight.onClick(insight)
      return
    }
    if (insight.link) {
      navigate(insight.link)
    }
  }

  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" color="primary" />
        </div>
      </Card>
    )
  }

  if (insights.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <EmptyState
          icon={<Lightbulb className="w-12 h-12" />}
          title="No AI Insights"
          description="AI insights will appear here as your project progresses."
        />
      </Card>
    )
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">AI Insights</h3>
        <p className="text-sm text-gray-600">Smart recommendations and predictions</p>
      </div>
      <div className="space-y-3">
        {insights.map((insight) => {
          const isClickable = typeof insight.onClick === 'function' || Boolean(insight.link)
          return (
            <button
              key={insight.id}
              type="button"
              onClick={() => handleInsightClick(insight)}
              disabled={!isClickable}
              className={cn(
                'w-full text-left p-4 rounded-lg border border-gray-200 transition-all group',
                isClickable
                  ? 'hover:border-primary-300 hover:bg-primary-50'
                  : 'opacity-60 cursor-not-allowed'
              )}
            >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {getInsightBadge(insight.type)}
                  {insight.priority === 'high' && (
                    <Badge variant="error" size="sm">High Priority</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-900 font-medium mb-1">{insight.title}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{insight.message}</p>
                {insight.action && isClickable && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary-600 group-hover:text-primary-700">
                    <span>{insight.action}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

AIInsightsPanel.propTypes = {
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['risk', 'recommendation', 'prediction']).isRequired,
      title: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      priority: PropTypes.oneOf(['low', 'medium', 'high']),
      action: PropTypes.string,
      link: PropTypes.string,
      onClick: PropTypes.func,
    })
  ),
  loading: PropTypes.bool,
  className: PropTypes.string,
}

