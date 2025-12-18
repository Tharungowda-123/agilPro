import { useEffect, useRef } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { queryClient } from '@/services/queryClient'
import { useSocketStore } from '@/stores/socketStore'

/**
 * useRealtimeUpdates Hook
 * Hook to enable real-time updates for a component
 * Joins specific room on mount, leaves on unmount
 * Listens to relevant events and invalidates React Query cache
 * 
 * @param {string} entityType - Type of entity ('project', 'sprint', 'story', 'task')
 * @param {string|number} entityId - ID of the entity
 * 
 * @example
 * useRealtimeUpdates('sprint', sprintId);
 */
export function useRealtimeUpdates(entityType, entityId) {
  const { socket, isConnected } = useSocket()
  const roomJoined = useRef(false)
  const roomName = entityId ? `${entityType}:${entityId}` : null

  useEffect(() => {
    if (!roomName || !isConnected) {
      return
    }

    // Join room
    socket.emit('join-room', roomName)
    useSocketStore.getState().addRoom(roomName)
    roomJoined.current = true

    // Set up event listeners based on entity type
    const eventHandlers = getEventHandlersForEntityType(entityType, entityId)

    // Register event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler)
    })

    return () => {
      // Leave room
      if (roomJoined.current && roomName) {
        socket.emit('leave-room', roomName)
        useSocketStore.getState().removeRoom(roomName)
        roomJoined.current = false
      }

      // Unregister event handlers
      Object.keys(eventHandlers).forEach((event) => {
        socket.off(event)
      })
    }
  }, [socket, isConnected, roomName, entityType, entityId])
}

/**
 * Get event handlers for specific entity type
 */
function getEventHandlersForEntityType(entityType, entityId) {
  const handlers = {}

  switch (entityType) {
    case 'project':
      handlers['project:updated'] = () => {
        queryClient.invalidateQueries({ queryKey: ['projects', entityId] })
        queryClient.invalidateQueries({ queryKey: ['projects'] })
      }
      handlers['sprint:created'] = () => {
        queryClient.invalidateQueries({ queryKey: ['projects', entityId, 'sprints'] })
        queryClient.invalidateQueries({ queryKey: ['sprints'] })
      }
      handlers['story:created'] = () => {
        queryClient.invalidateQueries({ queryKey: ['projects', entityId, 'stories'] })
        queryClient.invalidateQueries({ queryKey: ['stories'] })
      }
      break

    case 'sprint':
      handlers['sprint:updated'] = () => {
        queryClient.invalidateQueries({ queryKey: ['sprints', entityId] })
        queryClient.invalidateQueries({ queryKey: ['sprints'] })
      }
      handlers['story:moved'] = (data) => {
        if (data.newSprintId === entityId || data.oldSprintId === entityId) {
          queryClient.invalidateQueries({ queryKey: ['sprints', entityId] })
          queryClient.invalidateQueries({ queryKey: ['sprints', entityId, 'stories'] })
        }
      }
      handlers['task:created'] = () => {
        queryClient.invalidateQueries({ queryKey: ['sprints', entityId, 'tasks'] })
      }
      handlers['task:updated'] = () => {
        queryClient.invalidateQueries({ queryKey: ['sprints', entityId, 'tasks'] })
      }
      handlers['sprint:started'] = () => {
        queryClient.invalidateQueries({ queryKey: ['sprints', entityId] })
      }
      handlers['sprint:completed'] = () => {
        queryClient.invalidateQueries({ queryKey: ['sprints', entityId] })
      }
      break

    case 'story':
      handlers['story:updated'] = () => {
        queryClient.invalidateQueries({ queryKey: ['stories', entityId] })
        queryClient.invalidateQueries({ queryKey: ['stories'] })
      }
      handlers['task:created'] = () => {
        queryClient.invalidateQueries({ queryKey: ['stories', entityId, 'tasks'] })
        queryClient.invalidateQueries({ queryKey: ['stories', entityId] })
      }
      handlers['task:updated'] = () => {
        queryClient.invalidateQueries({ queryKey: ['stories', entityId, 'tasks'] })
        queryClient.invalidateQueries({ queryKey: ['stories', entityId] })
      }
      handlers['task:completed'] = () => {
        queryClient.invalidateQueries({ queryKey: ['stories', entityId, 'tasks'] })
        queryClient.invalidateQueries({ queryKey: ['stories', entityId] })
      }
      handlers['story:ai-analyzed'] = () => {
        queryClient.invalidateQueries({ queryKey: ['stories', entityId] })
      }
      break

    case 'task':
      handlers['task:updated'] = () => {
        queryClient.invalidateQueries({ queryKey: ['tasks', entityId] })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      }
      handlers['task:assigned'] = () => {
        queryClient.invalidateQueries({ queryKey: ['tasks', entityId] })
      }
      handlers['task:status-changed'] = () => {
        queryClient.invalidateQueries({ queryKey: ['tasks', entityId] })
      }
      handlers['task:completed'] = () => {
        queryClient.invalidateQueries({ queryKey: ['tasks', entityId] })
      }
      handlers['comment:added'] = (data) => {
        if (data.entityType === 'task' && data.entityId === entityId) {
          queryClient.invalidateQueries({ queryKey: ['tasks', entityId, 'comments'] })
        }
      }
      break

    default:
      console.warn(`[useRealtimeUpdates] Unknown entity type: ${entityType}`)
  }

  return handlers
}

export default useRealtimeUpdates

