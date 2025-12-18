import PropTypes from 'prop-types'
import { useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { Plus, X } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/utils'

/**
 * KanbanColumn Component
 * Column in Kanban board with droppable area for stories
 * 
 * @example
 * <KanbanColumn
 *   title="In Progress"
 *   status="in_progress"
 *   stories={stories}
 *   onAddStory={handleAdd}
 *   wipLimit={5}
 * />
 */
export default function KanbanColumn({
  title,
  status,
  droppableId,
  stories = [],
  onAddStory,
  wipLimit,
  className = '',
  children,
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [newStoryTitle, setNewStoryTitle] = useState('')
  const [newStoryPoints, setNewStoryPoints] = useState(5)

  const statusColors = {
    backlog: 'bg-gray-50 border-gray-200',
    ready: 'bg-blue-50 border-blue-200',
    in_progress: 'bg-yellow-50 border-yellow-200',
    review: 'bg-purple-50 border-purple-200',
    done: 'bg-green-50 border-green-200',
  }

  const handleAdd = () => {
    if (newStoryTitle.trim()) {
      onAddStory?.({
        title: newStoryTitle.trim(),
        storyPoints: newStoryPoints,
        status,
      })
      setNewStoryTitle('')
      setNewStoryPoints(5)
      setIsAdding(false)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setNewStoryTitle('')
    setNewStoryPoints(5)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAdd()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const isOverLimit = wipLimit && stories.length >= wipLimit

  return (
    <div className={cn('flex flex-col h-full min-w-[300px]', className)}>
      {/* Column Header */}
      <div className={cn('p-4 rounded-t-lg border-2 border-b-0', statusColors[status] || 'bg-gray-50')}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <Badge variant="outlined" size="sm">
              {stories.length}
            </Badge>
            {wipLimit && (
              <span className="text-xs text-gray-500">
                / {wipLimit} limit
              </span>
            )}
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="p-1 hover:bg-white/50 rounded transition-colors"
              title="Add story"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
        {isOverLimit && (
          <p className="text-xs text-error-600 font-medium">WIP limit reached</p>
        )}
      </div>

      {/* Quick Add Form */}
      {isAdding && (
        <div className="p-4 bg-white border-x-2 border-t border-gray-200">
          <Input
            placeholder="Story title..."
            value={newStoryTitle}
            onChange={(e) => setNewStoryTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="mb-2"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="13"
              value={newStoryPoints}
              onChange={(e) => setNewStoryPoints(Number(e.target.value))}
              onKeyDown={handleKeyDown}
              className="w-20"
            />
            <span className="text-xs text-gray-500">points</span>
            <div className="flex-1" />
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
            >
              Add
            </Button>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Droppable Area */}
      <Droppable droppableId={droppableId || status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-4 rounded-b-lg border-2 border-t-0 overflow-y-auto',
              statusColors[status] || 'bg-gray-50',
              snapshot.isDraggingOver && 'bg-opacity-80',
              isOverLimit && 'opacity-50'
            )}
            style={{ maxHeight: 'calc(100vh - 250px)' }}
          >
            {stories.length === 0 && !snapshot.isDraggingOver ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No stories in {title}
              </div>
            ) : (
              children
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

KanbanColumn.propTypes = {
  title: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  droppableId: PropTypes.string,
  stories: PropTypes.array.isRequired,
  onAddStory: PropTypes.func,
  wipLimit: PropTypes.number,
  children: PropTypes.node,
  className: PropTypes.string,
}

