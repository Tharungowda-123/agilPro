import PropTypes from 'prop-types'
import { DragDropContext } from '@hello-pangea/dnd'
import KanbanColumn from './KanbanColumn'
import StoryCard from './StoryCard'
import { toast } from 'react-hot-toast'

/**
 * KanbanBoard Component
 * Main Kanban board with drag and drop functionality
 * 
 * @example
 * <KanbanBoard
 *   stories={stories}
 *   onStoryUpdate={handleUpdate}
 *   onStoryAdd={handleAdd}
 *   onStoryEdit={handleEdit}
 *   onStoryDelete={handleDelete}
 * />
 */
export default function KanbanBoard({
  stories = [],
  onStoryUpdate,
  onStoryAdd,
  onStoryEdit,
  onStoryDelete,
  onStoryClick,
  className = '',
}) {
  const columns = [
    { id: 'backlog', title: 'Backlog', status: 'backlog' },
    { id: 'ready', title: 'Ready', status: 'ready' },
    { id: 'in_progress', title: 'In Progress', status: 'in-progress' }, // Use 'in-progress' to match backend
    { id: 'review', title: 'Review', status: 'review' },
    { id: 'done', title: 'Done', status: 'done' },
  ]

  // Group stories by status
  // Only include stories in their correct column based on status
  const storiesByStatus = stories.reduce((acc, story) => {
    let status = story.status || 'backlog'
    
    // Normalize status values
    if (status === 'todo') {
      status = 'backlog'
    } else if (status === 'in_progress') {
      status = 'in-progress' // Normalize underscore to hyphen
    }
    
    // Only add story to its correct column
    // Stories with status 'done' should only appear in 'done' column
    if (!acc[status]) acc[status] = []
    acc[status].push(story)
    return acc
  }, {})

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result

    // Dropped outside or same position
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return
    }

    const storyId = draggableId
    // Map column ID to status
    // Column IDs: 'backlog', 'ready', 'in_progress', 'review', 'done'
    // Status values: 'backlog', 'ready', 'in-progress', 'review', 'done'
    let newStatus = destination.droppableId
    if (newStatus === 'in_progress') {
      newStatus = 'in-progress' // Convert column ID to status format
    }

    // Find the story
    const story = stories.find((s) => s.id === storyId)
    if (!story) return

    // Optimistic update
    const updatedStory = { ...story, status: newStatus }
    onStoryUpdate?.(updatedStory)

    // Show toast
    const columnTitle = columns.find((c) => c.id === destination.droppableId)?.title || newStatus
    toast.success(`Story moved to ${columnTitle}`)
  }

  const handleAddStory = (storyData) => {
    onStoryAdd?.(storyData)
    toast.success('Story added!')
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={className}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '600px' }}>
          {columns.map((column) => {
            // Map column status to match story status format
            // Column IDs use 'in_progress' but story statuses use 'in-progress'
            let statusKey = column.status
            if (column.id === 'in_progress') {
              statusKey = 'in-progress' // Use hyphenated version for lookup
            }
            const columnStories = storiesByStatus[statusKey] || []
            return (
              <KanbanColumn
                key={column.id}
                title={column.title}
                status={column.status}
                droppableId={column.id}
                stories={columnStories}
                onAddStory={handleAddStory}
              >
                {columnStories.map((story, index) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    index={index}
                    onEdit={onStoryEdit}
                    onDelete={onStoryDelete}
                    onClick={onStoryClick}
                  />
                ))}
              </KanbanColumn>
            )
          })}
        </div>
      </div>
    </DragDropContext>
  )
}

KanbanBoard.propTypes = {
  stories: PropTypes.array.isRequired,
  onStoryUpdate: PropTypes.func.isRequired,
  onStoryAdd: PropTypes.func,
  onStoryEdit: PropTypes.func,
  onStoryDelete: PropTypes.func,
  onStoryClick: PropTypes.func,
  className: PropTypes.string,
}

