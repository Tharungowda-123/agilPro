import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { Calendar, Users } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/utils'

/**
 * ProjectCard Component
 * Card displaying project information in grid view
 * 
 * @example
 * <ProjectCard project={project} />
 */
export default function ProjectCard({ project, className = '' }) {
  const navigate = useNavigate()

  const priorityColors = {
    high: 'border-l-error-500',
    medium: 'border-l-warning-500',
    low: 'border-l-success-500',
  }

  const statusVariants = {
    active: 'success',
    planning: 'warning',
    completed: 'default',
    'on-hold': 'error',
  }

  const handleClick = () => {
    const projectId = project._id || project.id
    if (projectId) {
      navigate(`/projects/${projectId}`)
    }
  }

  const progress = typeof project.progress === 'number' ? project.progress : 0

  return (
    <Card
      className={cn(
        'p-6 cursor-pointer transition-all hover:shadow-lg border-l-4',
        priorityColors[project.priority] || 'border-l-gray-300',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
            <Badge variant="outlined" size="sm">
              {project.key}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{project.description}</p>
        </div>
        <Badge variant={statusVariants[project.status] || 'default'} size="sm">
          {project.status}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Team Members */}
      {project.team && project.team.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-gray-400" />
          <div className="flex -space-x-2">
            {project.team.slice(0, 5).map((memberId, index) => (
              <Avatar
                key={index}
                name={`User ${memberId}`}
                size="xs"
                src={null}
                className="border-2 border-white"
              />
            ))}
            {project.team.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600 font-medium">
                +{project.team.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Due Date */}
      {project.endDate && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Due: {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      )}
    </Card>
  )
}

ProjectCard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
    progress: PropTypes.number,
    priority: PropTypes.oneOf(['low', 'medium', 'high']),
    team: PropTypes.arrayOf(PropTypes.string),
    endDate: PropTypes.string,
  }).isRequired,
  className: PropTypes.string,
}

