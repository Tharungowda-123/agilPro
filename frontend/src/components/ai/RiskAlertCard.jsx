import PropTypes from 'prop-types'
import { AlertTriangle, X, CheckCircle, ExternalLink } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'

/**
 * RiskAlertCard Component
 * Card displaying AI-detected risks with mitigation suggestions
 * 
 * @example
 * <RiskAlertCard
 *   risk={risk}
 *   onAcknowledge={handleAcknowledge}
 *   onDismiss={handleDismiss}
 * />
 */
export default function RiskAlertCard({
  risk,
  onAcknowledge,
  onDismiss,
  onQuickFix,
  className = '',
}) {
  const severityColors = {
    high: {
      border: 'border-error-500',
      bg: 'bg-error-50',
      text: 'text-error-700',
      icon: 'text-error-600',
    },
    medium: {
      border: 'border-warning-500',
      bg: 'bg-warning-50',
      text: 'text-warning-700',
      icon: 'text-warning-600',
    },
    low: {
      border: 'border-gray-400',
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      icon: 'text-gray-600',
    },
  }

  const typeColors = {
    dependency: 'bg-purple-100 text-purple-700',
    capacity: 'bg-blue-100 text-blue-700',
    technical: 'bg-orange-100 text-orange-700',
    timeline: 'bg-red-100 text-red-700',
  }

  const colors = severityColors[risk.severity] || severityColors.medium

  const handleAcknowledge = () => {
    onAcknowledge?.(risk.id)
    toast.success('Risk acknowledged')
  }

  const handleDismiss = () => {
    onDismiss?.(risk.id)
    toast.info('Risk alert dismissed')
  }

  return (
    <Card className={cn('p-4 border-2', colors.border, colors.bg, className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn('w-5 h-5', colors.icon)} />
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={risk.severity === 'high' ? 'error' : risk.severity === 'medium' ? 'warning' : 'default'} size="sm">
                {risk.severity}
              </Badge>
              <Badge variant="outlined" size="sm" className={typeColors[risk.type] || ''}>
                {risk.type}
              </Badge>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/50 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <h4 className={cn('font-semibold mb-2', colors.text)}>{risk.title}</h4>
      <p className="text-sm text-gray-700 mb-3">{risk.description}</p>

      {/* Affected Items */}
      {risk.affectedItems && risk.affectedItems.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-600 mb-1">Affected Items:</p>
          <div className="flex flex-wrap gap-2">
            {risk.affectedItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.type}-${item.id}`}
                className="text-xs text-primary-600 hover:underline flex items-center gap-1"
              >
                {item.name}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Impact Assessment */}
      {risk.impact && (
        <div className="mb-3 p-2 bg-white/50 rounded">
          <p className="text-xs font-medium text-gray-600 mb-1">Impact:</p>
          <p className="text-xs text-gray-700">{risk.impact}</p>
        </div>
      )}

      {/* Suggested Actions */}
      {risk.suggestedActions && risk.suggestedActions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-600 mb-2">Suggested Actions:</p>
          <ul className="space-y-1">
            {risk.suggestedActions.map((action, index) => (
              <li key={index} className="text-xs text-gray-700 flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Fix Actions */}
      {risk.quickFixes && risk.quickFixes.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {risk.quickFixes.map((fix, index) => (
            <Button
              key={index}
              variant="outlined"
              size="sm"
              onClick={() => onQuickFix?.(risk.id, fix)}
            >
              {fix.label}
            </Button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <Button
          variant="primary"
          size="sm"
          onClick={handleAcknowledge}
          className="flex-1"
          leftIcon={<CheckCircle className="w-4 h-4" />}
        >
          Acknowledge
        </Button>
        <Button
          variant="outlined"
          size="sm"
          onClick={handleDismiss}
        >
          Dismiss
        </Button>
      </div>
    </Card>
  )
}

RiskAlertCard.propTypes = {
  risk: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    severity: PropTypes.oneOf(['low', 'medium', 'high']).isRequired,
    type: PropTypes.oneOf(['dependency', 'capacity', 'technical', 'timeline']).isRequired,
    affectedItems: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
      })
    ),
    impact: PropTypes.string,
    suggestedActions: PropTypes.arrayOf(PropTypes.string),
    quickFixes: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        action: PropTypes.string,
      })
    ),
  }).isRequired,
  onAcknowledge: PropTypes.func,
  onDismiss: PropTypes.func,
  onQuickFix: PropTypes.func,
  className: PropTypes.string,
}

