import { queryClient } from '@/services/queryClient'
import { useNotificationStore } from '@/stores/notificationStore'
import { useToast } from '@/hooks/useToast'

/**
 * Socket Event Handlers
 * Handles all socket events and updates UI/cache accordingly
 */

// Initialize toast hook (will be used in handlers)
let toast = null

// Initialize toast when handlers are first used
const getToast = () => {
  if (!toast) {
    // This will be set by the component using the handlers
    return {
      showSuccess: (msg) => console.log('[Toast] Success:', msg),
      showError: (msg) => console.error('[Toast] Error:', msg),
      showInfo: (msg) => console.log('[Toast] Info:', msg),
      showWarning: (msg) => console.warn('[Toast] Warning:', msg),
    }
  }
  return toast
}

// Set toast instance (called from useSocket hook)
export const setToastInstance = (toastInstance) => {
  toast = toastInstance
}

/**
 * Task Event Handlers
 */
export const taskEventHandlers = {
  'task:created': (data) => {
    console.log('[Socket] Task created:', data)
    const toastInstance = getToast()
    
    // Invalidate task queries
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['tasks', data.storyId] })
    queryClient.invalidateQueries({ queryKey: ['stories', data.storyId] })
    
    // Show notification
    toastInstance.showInfo(`New task created: ${data.task?.title || 'Untitled'}`)
    
    // Add to notification store
    useNotificationStore.getState().addNotification({
      type: 'info',
      message: `New task created: ${data.task?.title || 'Untitled'}`,
      timestamp: new Date().toISOString(),
    })
  },

  'task:updated': (data) => {
    console.log('[Socket] Task updated:', data)
    
    const task = data.task || data
    const taskId = task?._id || task?.id
    
    // Update task in cache optimistically
    if (taskId) {
      queryClient.setQueryData(['task', taskId], (old) => ({
        ...old,
        ...task,
      }))
    }
    
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false })
    queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    
    // If status changed to 'done', treat it like completion
    if (task?.status === 'done') {
      if (task?.story?._id || task?.storyId) {
        const storyId = task.story._id || task.storyId
        queryClient.invalidateQueries({ queryKey: ['stories', storyId] })
        queryClient.invalidateQueries({ queryKey: ['stories'], exact: false })
      }
      
      // Invalidate dashboard queries
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'deadlines'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false })
      
      // Invalidate project queries
      if (task?.story?.project?._id || task?.story?.project) {
        const projectId = task.story.project._id || task.story.project
        queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
        queryClient.invalidateQueries({ queryKey: ['projects'], exact: false })
      }
    } else {
      // For other status changes, just invalidate story queries
      if (task?.story?._id || task?.storyId) {
        const storyId = task.story._id || task.storyId
        queryClient.invalidateQueries({ queryKey: ['stories', storyId] })
      }
    }
  },

  'task:assigned': (data) => {
    console.log('[Socket] Task assigned:', data)
    const toastInstance = getToast()
    
    // Invalidate task queries
    queryClient.invalidateQueries({ queryKey: ['tasks', data.taskId] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    
    // Show notification
    if (data.assignedTo) {
      toastInstance.showInfo(`Task assigned to ${data.assignedTo.name || 'you'}`)
      
      useNotificationStore.getState().addNotification({
        type: 'info',
        message: `Task "${data.taskTitle || 'Untitled'}" assigned to you`,
        timestamp: new Date().toISOString(),
      })
    }
  },

  'task:status-changed': (data) => {
    console.log('[Socket] Task status changed:', data)
    
    // Update task in cache
    if (data.task?.id) {
      queryClient.setQueryData(['tasks', data.task.id], (old) => ({
        ...old,
        ...data.task,
      }))
    }
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['tasks', data.task?.storyId] })
    
    // Show notification for status changes
    if (data.newStatus === 'done' || data.newStatus === 'completed') {
      const toastInstance = getToast()
      toastInstance.showSuccess(`Task "${data.taskTitle || 'Untitled'}" completed`)
    }
  },

  'task:completed': (data) => {
    console.log('[Socket] Task completed:', data)
    const toastInstance = getToast()
    
    // Update task in cache
    if (data.task?.id) {
      queryClient.setQueryData(['tasks', data.task.id], (old) => ({
        ...old,
        status: 'done',
        completedAt: new Date().toISOString(),
      }))
    }
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['tasks', data.task?.storyId] })
    queryClient.invalidateQueries({ queryKey: ['stories', data.task?.storyId] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    
    // Show notification
    toastInstance.showSuccess(`Task "${data.taskTitle || 'Untitled'}" completed! 🎉`)
    
    useNotificationStore.getState().addNotification({
      type: 'success',
      message: `Task "${data.taskTitle || 'Untitled'}" completed`,
      timestamp: new Date().toISOString(),
    })
  },
}

/**
 * Story Event Handlers
 */
export const storyEventHandlers = {
  'story:created': (data) => {
    console.log('[Socket] Story created:', data)
    
    // Invalidate story queries
    queryClient.invalidateQueries({ queryKey: ['stories'] })
    queryClient.invalidateQueries({ queryKey: ['stories', data.projectId] })
    queryClient.invalidateQueries({ queryKey: ['projects', data.projectId] })
    
    const toastInstance = getToast()
    toastInstance.showInfo(`New story created: ${data.story?.title || 'Untitled'}`)
  },

  'story:updated': (data) => {
    console.log('[Socket] Story updated:', data)
    const story = data.story || data
    const storyId = story?._id || story?.id
    
    // Optimistically update story in cache
    if (storyId) {
      queryClient.setQueryData(['story', storyId], story)
    }
    
    // Invalidate all story queries to ensure board and all pages refresh
    queryClient.invalidateQueries({ queryKey: ['stories'], exact: false })
    queryClient.invalidateQueries({ queryKey: ['story', storyId] })
    
    // If status changed to 'done', invalidate additional queries
    if (story?.status === 'done') {
      // Invalidate dashboard queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'deadlines'] })
      
      // Invalidate project queries
      const projectId = story?.project?._id || story?.project || story?.projectId || data.story?.projectId
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
        queryClient.invalidateQueries({ queryKey: ['projects'], exact: false })
      }
      
      // Invalidate sprint queries if story is in a sprint
      const sprintId = story?.sprint?._id || story?.sprint || story?.sprintId
      if (sprintId) {
        queryClient.invalidateQueries({ queryKey: ['sprints', sprintId] })
        queryClient.invalidateQueries({ queryKey: ['sprints'], exact: false })
      }
    } else {
      // For other status changes, still invalidate project queries
      const projectId = story?.project?._id || story?.project || story?.projectId || data.story?.projectId
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      }
    }
  },

  'story:moved': (data) => {
    console.log('[Socket] Story moved:', data)
    
    // Update story sprint assignment in cache
    if (data.story?.id) {
      queryClient.setQueryData(['stories', data.story.id], (old) => ({
        ...old,
        sprintId: data.newSprintId,
      }))
    }
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['stories'] })
    queryClient.invalidateQueries({ queryKey: ['sprints', data.oldSprintId] })
    queryClient.invalidateQueries({ queryKey: ['sprints', data.newSprintId] })
    queryClient.invalidateQueries({ queryKey: ['projects', data.story?.projectId] })
    
    const toastInstance = getToast()
    toastInstance.showInfo(`Story moved to ${data.newSprintName || 'new sprint'}`)
  },

  'story:ai-analyzed': (data) => {
    console.log('[Socket] Story AI analyzed:', data)
    
    // Update story with AI insights
    if (data.story?.id) {
      queryClient.setQueryData(['stories', data.story.id], (old) => ({
        ...old,
        aiInsights: data.insights,
      }))
    }
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['stories', data.story?.id] })
    
    const toastInstance = getToast()
    toastInstance.showInfo('AI analysis completed for story')
    
    useNotificationStore.getState().addNotification({
      type: 'info',
      message: `AI insights available for "${data.storyTitle || 'story'}"`,
      timestamp: new Date().toISOString(),
    })
  },
}

/**
 * Sprint Event Handlers
 */
export const sprintEventHandlers = {
  'sprint:started': (data) => {
    console.log('[Socket] Sprint started:', data)
    
    // Invalidate sprint queries
    queryClient.invalidateQueries({ queryKey: ['sprints', data.sprintId] })
    queryClient.invalidateQueries({ queryKey: ['sprints'] })
    queryClient.invalidateQueries({ queryKey: ['projects', data.projectId] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    
    const toastInstance = getToast()
    toastInstance.showSuccess(`Sprint "${data.sprintName || 'Untitled'}" started! 🚀`)
    
    useNotificationStore.getState().addNotification({
      type: 'success',
      message: `Sprint "${data.sprintName || 'Untitled'}" has started`,
      timestamp: new Date().toISOString(),
    })
  },

  'sprint:completed': (data) => {
    console.log('[Socket] Sprint completed:', data)
    
    const sprintId = data.sprintId || data.sprint?._id?.toString() || data.sprint?.id
    const projectId = data.projectId || data.sprint?.project?._id?.toString() || data.sprint?.project?.toString() || data.sprint?.project
    
    // Update sprint in cache if we have the data
    if (data.sprint && sprintId) {
      queryClient.setQueryData(['sprint', sprintId], data.sprint)
    }
    
    // Invalidate all sprint-related queries to force refresh
    queryClient.invalidateQueries({ queryKey: ['sprints'] })
    queryClient.invalidateQueries({ queryKey: ['sprint', sprintId] })
    queryClient.invalidateQueries({ queryKey: ['sprints', projectId] })
    queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    
    const toastInstance = getToast()
    toastInstance.showSuccess(`Sprint "${data.sprintName || data.sprint?.name || 'Untitled'}" completed! 🎉`)
    
    useNotificationStore.getState().addNotification({
      type: 'success',
      message: `Sprint "${data.sprintName || data.sprint?.name || 'Untitled'}" has been completed`,
      timestamp: new Date().toISOString(),
    })
  },

  'sprint:velocity-updated': (data) => {
    console.log('[Socket] Sprint velocity updated:', data)
    
    // Invalidate velocity-related queries
    queryClient.invalidateQueries({ queryKey: ['sprints', data.sprintId, 'velocity'] })
    queryClient.invalidateQueries({ queryKey: ['sprints', data.sprintId] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  },
}

/**
 * Collaboration Event Handlers
 */
export const collaborationEventHandlers = {
  'user:joined': (data) => {
    console.log('[Socket] User joined:', data)
    // This will be handled by usePresence hook
  },

  'user:left': (data) => {
    console.log('[Socket] User left:', data)
    // This will be handled by usePresence hook
  },

  'user:typing': (data) => {
    console.log('[Socket] User typing:', data)
    // This will be handled by components that need typing indicators
  },

  'comment:added': (data) => {
    console.log('[Socket] Comment added:', data)
    
    // Invalidate comments/queries for the entity
    if (data.entityType === 'task') {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.entityId, 'comments'] })
    } else if (data.entityType === 'story') {
      queryClient.invalidateQueries({ queryKey: ['stories', data.entityId, 'comments'] })
    }
    
    const toastInstance = getToast()
    if (data.comment?.author?.name) {
      toastInstance.showInfo(`New comment from ${data.comment.author.name}`)
    }
  },
}

/**
 * Notification Event Handlers
 */
export const notificationEventHandlers = {
  'notification:new': (data) => {
    console.log('[Socket] New notification:', data)
    
    // Add to notification store
    useNotificationStore.getState().addNotification({
      ...data.notification,
      timestamp: data.notification.timestamp || new Date().toISOString(),
    })
    
    // Show toast
    const toastInstance = getToast()
    const message = data.notification?.message || 'New notification'
    
    switch (data.notification?.type) {
      case 'success':
        toastInstance.showSuccess(message)
        break
      case 'error':
        toastInstance.showError(message)
        break
      case 'warning':
        toastInstance.showWarning(message)
        break
      default:
        toastInstance.showInfo(message)
    }
  },
}

/**
 * Register all event handlers with socket
 */
export const registerEventHandlers = (socket) => {
  // Task events
  Object.entries(taskEventHandlers).forEach(([event, handler]) => {
    socket.on(event, handler)
  })

  // Story events
  Object.entries(storyEventHandlers).forEach(([event, handler]) => {
    socket.on(event, handler)
  })

  // Sprint events
  Object.entries(sprintEventHandlers).forEach(([event, handler]) => {
    socket.on(event, handler)
  })

  // Collaboration events
  Object.entries(collaborationEventHandlers).forEach(([event, handler]) => {
    socket.on(event, handler)
  })

  // Notification events
  Object.entries(notificationEventHandlers).forEach(([event, handler]) => {
    socket.on(event, handler)
  })
}

/**
 * Unregister all event handlers from socket
 */
export const unregisterEventHandlers = (socket) => {
  const allEvents = [
    ...Object.keys(taskEventHandlers),
    ...Object.keys(storyEventHandlers),
    ...Object.keys(sprintEventHandlers),
    ...Object.keys(collaborationEventHandlers),
    ...Object.keys(notificationEventHandlers),
  ]

  allEvents.forEach((event) => {
    socket.off(event)
  })
}
