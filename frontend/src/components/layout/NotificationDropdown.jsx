import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { cn } from '@/utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

/**
 * NotificationDropdown Component
 * Dropdown showing recent notifications with unread count, icons, timestamps
 * Mark all as read button and view all link
 */
export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      message: 'Task "User Authentication" completed',
      timestamp: '2 hours ago',
      read: false,
      icon: '✓',
    },
    {
      id: 2,
      type: 'info',
      message: 'New comment on "Dashboard Design"',
      timestamp: '5 hours ago',
      read: false,
      icon: '💬',
    },
    {
      id: 3,
      type: 'warning',
      message: 'Sprint "Q1 Planning" ends in 2 days',
      timestamp: '1 day ago',
      read: true,
      icon: '⚠️',
    },
  ])

  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const getTypeStyles = (type) => {
    const styles = {
      success: 'bg-success-50 border-success-200',
      error: 'bg-error-50 border-error-200',
      warning: 'bg-warning-50 border-warning-200',
      info: 'bg-primary-50 border-primary-200',
    }
    return styles[type] || styles.info
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-strong z-50 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-heading font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={markAllAsRead}
                rightIcon={<CheckCheck className="w-4 h-4" />}
              >
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
                      !notification.read && 'bg-primary-50/50'
                    )}
                    onClick={() => {
                      setNotifications(
                        notifications.map((n) =>
                          n.id === notification.id ? { ...n, read: true } : n
                        )
                      )
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0',
                          getTypeStyles(notification.type)
                        )}
                      >
                        {notification.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm',
                            !notification.read ? 'font-medium text-gray-900' : 'text-gray-700'
                          )}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.timestamp}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium text-center">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

