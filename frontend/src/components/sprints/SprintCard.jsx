import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { Calendar, Play, Edit, Eye } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/utils'

/**
 * SprintCard Component
 * Card displaying sprint information
 * 
 * @example
 * <SprintCard sprint={sprint} onStart={handleStart} />
 */
export default function SprintCard({ sprint, onStart, onEdit, className = '' }) {
  const navigate = useNavigate()

  const statusVariants = {
    planned: 'warning',
    active: 'success',
    completed: 'default',
  }

  // Normalize sprint ID - handle both 'id' and '_id'
  const sprintId = sprint.id || sprint._id

  const progress = sprint.capacity > 0 ? Math.round((sprint.velocity / sprint.capacity) * 100) : 0
  const daysRemaining = sprint.endDate
    ? Math.ceil((new Date(sprint.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0

  const handleClick = () => {
    if (!sprintId) {
      console.error('Sprint ID is missing')
      return
    }
    navigate(`/sprints/${sprintId}`)
  }

  return (
    <Card
      className={cn('p-6 cursor-pointer hover:shadow-lg transition-all', className)}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{sprint.name}</h3>
            <Badge variant={statusVariants[sprint.status] || 'default'} size="sm">
              {sprint.status}
            </Badge>
          </div>
          {sprint.project && (
            <p className="text-xs text-gray-500 mb-1">
              Project: {sprint.project?.name || sprint.project?.key || 'Unknown'}
            </p>
          )}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{sprint.goal}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                {new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            {sprint.status === 'active' && daysRemaining > 0 && (
              <span className="text-warning-600 font-medium">{daysRemaining} days left</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Ring */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">
            {sprint.velocity} / {sprint.capacity} points
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all',
              progress >= 100 ? 'bg-success-500' : progress >= 75 ? 'bg-primary-500' : 'bg-warning-500'
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Capacity Indicator */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
        <span>Capacity: {sprint.capacity} points</span>
        <span className={cn(
          sprint.velocity > sprint.capacity ? 'text-error-600' : 'text-gray-600'
        )}>
          Committed: {sprint.velocity} points
        </span>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
        {sprint.status === 'planned' && (
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              if (!sprintId) {
                console.error('Sprint ID is missing')
                return
              }
              onStart?.(sprintId)
            }}
            leftIcon={<Play className="w-4 h-4" />}
          >
            Start
          </Button>
        )}
        <Button
          variant="outlined"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            if (!sprintId) {
              console.error('Sprint ID is missing')
              return
            }
            navigate(`/sprints/${sprintId}`)
          }}
          leftIcon={<Eye className="w-4 h-4" />}
        >
          View
        </Button>
        <Button
          variant="outlined"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onEdit?.(sprint)
          }}
          leftIcon={<Edit className="w-4 h-4" />}
        >
          Edit
        </Button>
      </div>
    </Card>
  )
}

SprintCard.propTypes = {
  sprint: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    goal: PropTypes.string,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    capacity: PropTypes.number.isRequired,
    velocity: PropTypes.number.isRequired,
  }).isRequired,
  onStart: PropTypes.func,
  onEdit: PropTypes.func,
  className: PropTypes.string,
}

