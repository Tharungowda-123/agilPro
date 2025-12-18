import PropTypes from 'prop-types'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, AlertCircle, ArrowUpRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/layout/EmptyState'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/utils'

/**
 * UpcomingDeadlines Component
 * Displays tasks and stories with upcoming deadlines
 * 
 * @example
 * <UpcomingDeadlines items={deadlines} loading={false} />
 */
export default function UpcomingDeadlines({ items = [], loading = false, className = '' }) {
  const navigate = useNavigate()

  const getDeadlineColor = (dueDate) => {
    if (!dueDate) return 'text-gray-500'
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'text-error-600' // Overdue
    if (diffDays === 0) return 'text-warning-600' // Due today
    if (diffDays <= 7) return 'text-warning-500' // Due this week
    return 'text-gray-600' // Future
  }

  const getDeadlineBadge = (dueDate) => {
    if (!dueDate) return null
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return <Badge variant="error" size="sm">Overdue</Badge>
    if (diffDays === 0) return <Badge variant="warning" size="sm">Due Today</Badge>
    if (diffDays <= 7) return <Badge variant="warning" size="sm">Due Soon</Badge>
    return null
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const buildBoardUrl = ({ projectId, storyId, taskId }) => {
    const params = new URLSearchParams()
    if (projectId) params.set('projectId', projectId)
    if (storyId) params.set('storyId', storyId)
    if (taskId) params.set('taskId', taskId)
    const search = params.toString()
    return search ? `/board?${search}` : '/board'
  }

  const getItemLink = (item) => {
    if (!item) return null

    if (item.type === 'task') {
      return buildBoardUrl({
        projectId: item.projectId,
        storyId: item.storyId,
        taskId: item.taskId || item.id,
      })
    }

    if (item.type === 'story') {
      return buildBoardUrl({
        projectId: item.projectId,
        storyId: item.storyId || item.id,
      })
    }

    if (item.type === 'project') {
      return item.id ? `/projects/${item.id}` : null
    }

    return null
  }

  const handleItemClick = (item) => {
    const link = getItemLink(item)
    if (link) {
      navigate(link)
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

  if (items.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <EmptyState
          icon={<Calendar className="w-12 h-12" />}
          title="No Upcoming Deadlines"
          description="You're all caught up! No tasks or stories due soon."
        />
      </Card>
    )
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Upcoming Deadlines</h3>
          <p className="text-sm text-gray-600">Tasks and stories due soon</p>
        </div>
        <Link
          to="/board"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Open board
        </Link>
      </div>
      <div className="space-y-4">
        {items.map((item) => {
          const link = getItemLink(item)
          return (
            <div
              key={item.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-colors',
                link && 'hover:bg-gray-50 cursor-pointer'
              )}
              onClick={() => handleItemClick(item)}
            >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                {link ? (
                  <span className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate">
                    {item.title}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-gray-900 truncate">{item.title}</span>
                )}
                {item.priority && (
                  <Badge
                    variant={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'}
                    size="sm"
                  >
                    {item.priority}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className={cn('flex items-center gap-1 text-xs', getDeadlineColor(item.dueDate))}>
                  <Calendar className="w-3 h-3" />
                  {formatDate(item.dueDate)}
                </div>
                {getDeadlineBadge(item.dueDate)}
                {item.assignedTo && (
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={item.assignedToName || 'User'}
                      size="xs"
                      src={null}
                    />
                    <span className="text-xs text-gray-600">{item.assignedToName}</span>
                  </div>
                )}
                {link && (
                  <div className="flex items-center gap-1 text-xs text-primary-600">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Open</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )})}
      </div>
    </Card>
  )
}

UpcomingDeadlines.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['task', 'story', 'project']).isRequired,
      dueDate: PropTypes.string,
      priority: PropTypes.oneOf(['low', 'medium', 'high']),
      assignedTo: PropTypes.string,
      assignedToName: PropTypes.string,
      projectId: PropTypes.string,
      storyId: PropTypes.string,
      taskId: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
  className: PropTypes.string,
}

