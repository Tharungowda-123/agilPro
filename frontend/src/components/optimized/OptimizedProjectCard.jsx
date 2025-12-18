import { memo, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { Calendar, Users, TrendingUp } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/utils'

/**
 * OptimizedProjectCard Component
 * Example of performance-optimized component using:
 * - React.memo to prevent unnecessary re-renders
 * - useMemo for expensive calculations
 * - useCallback for event handlers
 */
const OptimizedProjectCard = memo(function OptimizedProjectCard({
  project,
  onClick,
  className = '',
}) {
  const navigate = useNavigate()

  // Memoize computed values
  const progressPercentage = useMemo(() => {
    if (!project.totalStoryPoints || project.totalStoryPoints === 0) return 0
    return Math.round((project.completedStoryPoints / project.totalStoryPoints) * 100)
  }, [project.totalStoryPoints, project.completedStoryPoints])

  const statusColor = useMemo(() => {
    const statusMap = {
      active: 'success',
      planning: 'warning',
      completed: 'primary',
      archived: 'neutral',
    }
    return statusMap[project.status] || 'neutral'
  }, [project.status])

  const formattedDate = useMemo(() => {
    if (!project.dueDate) return null
    return new Date(project.dueDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }, [project.dueDate])

  // Memoize event handlers
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(project.id)
    } else {
      navigate(`/projects/${project.id}`)
    }
  }, [project.id, onClick, navigate])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    },
    [handleClick]
  )

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View project ${project.name}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
              {project.name}
            </h3>
            <p className="text-sm text-gray-500">{project.key}</p>
          </div>
          <Badge variant={statusColor} size="sm">
            {project.status}
          </Badge>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>{project.completedStoryPoints || 0}/{project.totalStoryPoints || 0} SP</span>
          </div>
          {formattedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Team Members */}
        {project.teamMembers && project.teamMembers.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <div className="flex -space-x-2">
              {project.teamMembers.slice(0, 5).map((member) => (
                <Avatar
                  key={member.id}
                  name={member.name}
                  src={member.avatar}
                  size="sm"
                  className="border-2 border-white"
                />
              ))}
              {project.teamMembers.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                  +{project.teamMembers.length - 5}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
})

OptimizedProjectCard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
    totalStoryPoints: PropTypes.number,
    completedStoryPoints: PropTypes.number,
    dueDate: PropTypes.string,
    teamMembers: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        avatar: PropTypes.string,
      })
    ),
  }).isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
}

// Custom comparison function for memo (optional, for fine-grained control)
OptimizedProjectCard.displayName = 'OptimizedProjectCard'

export default OptimizedProjectCard

