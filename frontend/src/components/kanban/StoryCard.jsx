import PropTypes from 'prop-types'
import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { MessageCircle, Link2, Sparkles, Edit, Trash2, MoreVertical } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Tooltip from '@/components/ui/Tooltip'
import Dropdown from '@/components/ui/Dropdown'
import { cn } from '@/utils'

/**
 * StoryCard Component
 * Draggable card displaying story information in Kanban board
 * 
 * @example
 * <StoryCard story={story} index={0} onEdit={handleEdit} onDelete={handleDelete} />
 */
export default function StoryCard({
  story,
  index,
  onEdit,
  onDelete,
  onClick,
  className = '',
}) {
  const [isHovered, setIsHovered] = useState(false)

  const priorityColors = {
    high: 'border-l-error-500',
    medium: 'border-l-warning-500',
    low: 'border-l-success-500',
  }

  const pointsColors = {
    1: 'bg-blue-100 text-blue-700',
    2: 'bg-green-100 text-green-700',
    3: 'bg-yellow-100 text-yellow-700',
    5: 'bg-orange-100 text-orange-700',
    8: 'bg-red-100 text-red-700',
    13: 'bg-purple-100 text-purple-700',
  }

  const taskProgress = story.tasks ? {
    completed: story.tasks.filter((t) => t.status === 'done').length,
    total: story.tasks.length,
  } : { completed: 0, total: 0 }

  const progressPercentage = taskProgress.total > 0
    ? (taskProgress.completed / taskProgress.total) * 100
    : 0

  const menuItems = [
    {
      label: 'Edit Story',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => onEdit?.(story),
    },
    {
      type: 'divider',
    },
    {
      label: 'Delete Story',
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'danger',
      onClick: () => onDelete?.(story),
    },
  ]

  return (
    <Draggable draggableId={story.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn('mb-3', className)}
        >
          <Card
            className={cn(
              'p-4 cursor-pointer transition-all border-l-4',
              priorityColors[story.priority] || 'border-l-gray-300',
              snapshot.isDragging ? 'shadow-xl rotate-2' : 'hover:shadow-md',
              className
            )}
            onClick={() => onClick?.(story)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outlined" size="sm" className="font-mono text-xs">
                  {story.id}
                </Badge>
                {story.aiInsights && (
                  <Tooltip content="AI insights available" position="top">
                    <div className="p-1 rounded bg-primary-100">
                      <Sparkles className="w-3 h-3 text-primary-600" />
                    </div>
                  </Tooltip>
                )}
              </div>
              {isHovered && (
                <div onClick={(e) => e.stopPropagation()}>
                  <Dropdown
                    trigger={
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    }
                    items={menuItems}
                    position="bottom-right"
                  />
                </div>
              )}
            </div>

            {/* Title */}
            <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
              {story.title}
            </h4>

            {/* Description */}
            {story.description && (
              <p className="text-xs text-gray-600 mb-3 line-clamp-1">
                {story.description}
              </p>
            )}

            {/* Story Points and Priority */}
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outlined"
                size="sm"
                className={cn(
                  'rounded-full w-8 h-8 flex items-center justify-center p-0 font-bold',
                  pointsColors[story.storyPoints] || 'bg-gray-100 text-gray-700'
                )}
              >
                {story.storyPoints}
              </Badge>
              <Badge
                variant={
                  story.priority === 'high'
                    ? 'error'
                    : story.priority === 'medium'
                    ? 'warning'
                    : 'default'
                }
                size="sm"
              >
                {story.priority}
              </Badge>
            </div>

            {/* Task Progress */}
            {taskProgress.total > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Tasks</span>
                  <span className="font-medium">
                    {taskProgress.completed}/{taskProgress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-primary-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {story.dependencies && story.dependencies.length > 0 && (
                  <Tooltip content={`${story.dependencies.length} dependencies`} position="top">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Link2 className="w-3 h-3" />
                      <span>{story.dependencies.length}</span>
                    </div>
                  </Tooltip>
                )}
                {story.commentsCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MessageCircle className="w-3 h-3" />
                    <span>{story.commentsCount}</span>
                  </div>
                )}
              </div>
              {story.assignedTo && (
                <Avatar
                  name={story.assignedToName || 'User'}
                  size="xs"
                  src={null}
                />
              )}
            </div>
          </Card>
        </div>
      )}
    </Draggable>
  )
}

StoryCard.propTypes = {
  story: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    storyPoints: PropTypes.number.isRequired,
    priority: PropTypes.oneOf(['low', 'medium', 'high']).isRequired,
    status: PropTypes.string.isRequired,
    assignedTo: PropTypes.string,
    assignedToName: PropTypes.string,
    tasks: PropTypes.array,
    dependencies: PropTypes.array,
    aiInsights: PropTypes.object,
    commentsCount: PropTypes.number,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onClick: PropTypes.func,
  className: PropTypes.string,
}

