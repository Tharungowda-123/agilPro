import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, X } from 'lucide-react'
import { useNotificationStore } from '@/stores/notificationStore'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/utils'

/**
 * NotificationCenter Component
 * Dropdown notification center with unread count
 * 
 * @example
 * <NotificationCenter />
 */
export default function NotificationCenter({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const navigate = useNavigate()

  const {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore()

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'unread') return !notification.read
    if (activeTab === 'mentions') return notification.type === 'mention'
    return true
  })

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now - time) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
    if (notification.url) {
      navigate(notification.url)
      setIsOpen(false)
    }
  }

  const getNotificationIcon = (type) => {
    const icons = {
      task_assigned: '✓',
      mention: '@',
      story_updated: '📖',
      sprint_started: '🏃',
      risk_detected: '⚠️',
      ai_recommendation: '✨',
      deadline_reminder: '⏰',
    }
    return icons[type] || '🔔'
  }

  return (
    <div className={cn('relative', className)}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <Badge
            variant="error"
            size="sm"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center p-0"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => {
                      markAllAsRead()
                    }}
                    leftIcon={<CheckCheck className="w-4 h-4" />}
                  >
                    Mark all read
                  </Button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread', count: unreadCount },
                { id: 'mentions', label: 'Mentions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-medium transition-colors border-b-2',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <Badge variant="error" size="sm" className="ml-2">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-400">Loading...</div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.slice(0, 20).map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 hover:bg-gray-50 transition-colors cursor-pointer relative',
                        !notification.read && 'bg-primary-50/30'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xl mt-0.5">
                          {notification.icon || getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 mb-1">{notification.message}</p>
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    navigate('/notifications')
                    setIsOpen(false)
                  }}
                  className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

NotificationCenter.propTypes = {
  className: PropTypes.string,
}

