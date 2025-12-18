/**
 * Mock Notifications Data
 * Sample notifications for notification system
 */
export const mockNotifications = [
  {
    id: '1',
    type: 'success',
    title: 'Task Completed',
    message: 'Task "Set up project structure" has been completed',
    userId: '1',
    read: false,
    timestamp: '2024-11-05T12:00:00Z',
    link: '/tasks/1',
    icon: '✓',
  },
  {
    id: '2',
    type: 'info',
    title: 'New Comment',
    message: 'Mike Johnson commented on story "Kanban Board"',
    userId: '1',
    read: false,
    timestamp: '2024-11-20T11:30:00Z',
    link: '/stories/6',
    icon: '💬',
  },
  {
    id: '3',
    type: 'warning',
    title: 'Sprint Ending Soon',
    message: 'Sprint "Sprint 2 - Authentication" ends in 2 days',
    userId: '1',
    read: true,
    timestamp: '2024-11-15T09:00:00Z',
    link: '/sprints/2',
    icon: '⚠️',
  },
  {
    id: '4',
    type: 'info',
    title: 'Task Assigned',
    message: 'You have been assigned to task "Implement OAuth callback handler"',
    userId: '1',
    read: false,
    timestamp: '2024-11-18T09:00:00Z',
    link: '/tasks/6',
    icon: '📋',
  },
  {
    id: '5',
    type: 'success',
    title: 'Sprint Completed',
    message: 'Sprint "Sprint 1 - Foundation" has been completed',
    userId: '1',
    read: true,
    timestamp: '2024-11-17T17:00:00Z',
    link: '/sprints/1',
    icon: '🎉',
  },
]

