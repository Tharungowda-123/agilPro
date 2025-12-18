import PropTypes from 'prop-types'
import { User, CheckCircle, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Tooltip from '@/components/ui/Tooltip'
import ConfidenceIndicator from './ConfidenceIndicator'
import { cn } from '@/utils'

/**
 * TaskAssignmentCard Component
 * Card showing AI recommendations for task assignment
 * 
 * @example
 * <TaskAssignmentCard
 *   task={task}
 *   recommendations={recommendations}
 *   onAssign={handleAssign}
 * />
 */
export default function TaskAssignmentCard({
  task,
  recommendations = [],
  onAssign,
  onFeedback,
  className = '',
}) {
  const handleAssign = (recommendation) => {
    onAssign?.(task, recommendation)
  }

  const handleFeedback = (recommendation, isPositive) => {
    onFeedback?.(task, recommendation, isPositive)
  }

  if (recommendations.length === 0) {
    return null
  }

  const topRecommendations = recommendations.slice(0, 3)

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
          <p className="text-sm text-gray-600">Recommended Assignees</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => handleFeedback(topRecommendations[0], true)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Good recommendation"
          >
            <ThumbsUp className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => handleFeedback(topRecommendations[0], false)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Poor recommendation"
          >
            <ThumbsDown className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {topRecommendations.map((rec, index) => (
          <div
            key={rec.userId || rec._id || rec.id || `rec-${index}`}
            className={cn(
              'p-3 border rounded-lg transition-all',
              index === 0 ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white'
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar name={rec.userName || rec.name || 'User'} size="md" src={rec.avatar} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900">{rec.userName || rec.name || 'Unknown User'}</h5>
                    {rec.role && (
                      <p className="text-xs text-gray-500">{rec.role}</p>
                    )}
                  </div>
                  {index === 0 && (
                    <Badge variant="primary" size="sm">
                      Best Match
                    </Badge>
                  )}
                </div>

                <div className="mb-2">
                  <ConfidenceIndicator score={rec.confidence} size="sm" />
                </div>

                {rec.skills && rec.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {rec.skills.map((skill) => (
                      <Badge key={skill} variant="outlined" size="sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                {rec.workload && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <User className="w-3 h-3" />
                    <span>
                      {rec.workload.current}/{rec.workload.capacity} tasks
                      {rec.workload.available && ' • Available'}
                    </span>
                  </div>
                )}

                {rec.reasoning && (
                  <Tooltip content={rec.reasoning} position="top">
                    <p className="text-xs text-gray-500 line-clamp-2 cursor-help">
                      {rec.reasoning}
                    </p>
                  </Tooltip>
                )}

                <Button
                  variant={index === 0 ? 'primary' : 'outlined'}
                  size="sm"
                  onClick={() => handleAssign(rec)}
                  className="mt-2 w-full"
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                >
                  Assign to {rec.userName ? rec.userName.split(' ')[0] : rec.name ? rec.name.split(' ')[0] : 'User'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length > 3 && (
        <Button
          variant="outlined"
          size="sm"
          className="mt-3 w-full"
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          See All {recommendations.length} Recommendations
        </Button>
      )}
    </Card>
  )
}

TaskAssignmentCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  recommendations: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.string.isRequired,
      userName: PropTypes.string.isRequired,
      avatar: PropTypes.string,
      role: PropTypes.string,
      confidence: PropTypes.number.isRequired,
      skills: PropTypes.arrayOf(PropTypes.string),
      workload: PropTypes.shape({
        current: PropTypes.number,
        capacity: PropTypes.number,
        available: PropTypes.bool,
      }),
      reasoning: PropTypes.string,
    })
  ),
  onAssign: PropTypes.func,
  onFeedback: PropTypes.func,
  className: PropTypes.string,
}

