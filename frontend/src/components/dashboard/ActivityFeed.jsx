import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, ArrowUpRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/utils'

/**
 * ActivityFeed Component
 * Displays recent activity feed with user avatars and timestamps
 * 
 * @example
 * <ActivityFeed activities={activities} loading={false} />
 */
export default function ActivityFeed({ activities = [], loading = false, className = '' }) {
  const navigate = useNavigate()

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now - time) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return time.toLocaleDateString()
  }

  const activityIcons = {
    story_completed: '✓',
    task_created: '➕',
    sprint_started: '🚀',
    task_assigned: '👤',
    comment_added: '💬',
    project_created: '📁',
  }

  const buildBoardUrl = ({ projectId, storyId, taskId }) => {
    const params = new URLSearchParams()
    if (projectId) params.set('projectId', projectId)
    if (storyId) params.set('storyId', storyId)
    if (taskId) params.set('taskId', taskId)
    const search = params.toString()
    return search ? `/board?${search}` : '/board'
  }

  const getActivityLink = (activity) => {
    const { entityType, projectId, storyId, taskId, entityId } = activity
    if (!entityType) return null

    switch (entityType) {
      case 'story':
        return buildBoardUrl({ projectId, storyId: storyId || entityId })
      case 'task':
        return buildBoardUrl({
          projectId,
          storyId: storyId || activity.storyId || null,
          taskId: taskId || entityId,
        })
      case 'comment':
        return storyId || projectId ? buildBoardUrl({ projectId, storyId }) : null
      case 'project':
        return entityId ? `/projects/${entityId}` : null
      case 'sprint':
        return entityId ? `/sprints/${entityId}` : null
      default:
        return null
    }
  }

  const handleActivityClick = (activity) => {
    const link = getActivityLink(activity)
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

  if (activities.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No recent activity</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Recent Activity</h3>
          <p className="text-sm text-gray-600">Latest updates from your projects</p>
        </div>
        <Link
          to="/activity"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View all
        </Link>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.map((activity) => {
          const link = getActivityLink(activity)
          return (
            <div
              key={activity.id}
              className={cn(
                'flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0',
                link && 'cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors'
              )}
              onClick={() => handleActivityClick(activity)}
            >
            <Avatar
              name={activity.userName}
              size="sm"
              src={null}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.userName}</span>
                {' '}
                <span className="text-gray-600">{activity.message}</span>
              </p>
              {activity.targetName && (
                <p className="text-sm text-primary-600 mt-1 truncate">
                  {activityIcons[activity.type] || '•'} {activity.targetName}
                </p>
              )}
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(activity.timestamp)}
              </div>
              {link && (
                <div className="flex items-center gap-1 mt-2 text-xs text-primary-600">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>Open</span>
                </div>
              )}
            </div>
          </div>
        )})
        }
      </div>
    </Card>
  )
}

ActivityFeed.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      userId: PropTypes.string.isRequired,
      userName: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      targetName: PropTypes.string,
      timestamp: PropTypes.string.isRequired,
      entityType: PropTypes.string,
      entityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      storyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      taskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  loading: PropTypes.bool,
  className: PropTypes.string,
}

