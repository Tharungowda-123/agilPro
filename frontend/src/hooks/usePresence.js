import { useState, useEffect, useRef } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * usePresence Hook
 * Track who's viewing what entity
 * Join presence room for an entity, emit presence events
 * Listen to user:joined and user:left events
 * Return list of online users viewing same entity
 * 
 * @param {string} entityType - Type of entity ('project', 'sprint', 'story', 'task')
 * @param {string|number} entityId - ID of the entity
 * @param {object} options - Options for presence tracking
 * @param {number} options.heartbeatInterval - Interval in ms to send presence heartbeat (default: 30000)
 * 
 * @returns {object} - { onlineUsers: Array, isOnline: boolean }
 * 
 * @example
 * const { onlineUsers, isOnline } = usePresence('sprint', sprintId);
 */
export function usePresence(entityType, entityId, options = {}) {
  const { socket, isConnected } = useSocket()
  const { user } = useAuthStore()
  const [onlineUsers, setOnlineUsers] = useState([])
  const heartbeatIntervalRef = useRef(null)
  const roomName = entityId ? `presence:${entityType}:${entityId}` : null
  const { heartbeatInterval = 30000 } = options

  // Join presence room and start emitting presence
  useEffect(() => {
    if (!roomName || !isConnected || !user) {
      return
    }

    // Join presence room
    socket.emit('join-room', roomName)

    // Emit initial presence
    socket.emit('presence:join', {
      room: roomName,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
    })

    // Set up heartbeat to keep presence active
    heartbeatIntervalRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('presence:heartbeat', { room: roomName })
      }
    }, heartbeatInterval)

    // Listen to presence events
    const handleUserJoined = (data) => {
      if (data.room === roomName && data.user.id !== user.id) {
        setOnlineUsers((prev) => {
          // Check if user already in list
          const exists = prev.find((u) => u.id === data.user.id)
          if (exists) return prev
          return [...prev, data.user]
        })
      }
    }

    const handleUserLeft = (data) => {
      if (data.room === roomName) {
        setOnlineUsers((prev) => prev.filter((u) => u.id !== data.user.id))
      }
    }

    socket.on('user:joined', handleUserJoined)
    socket.on('user:left', handleUserLeft)

    // Request current online users
    socket.emit('presence:get-users', roomName, (users) => {
      if (Array.isArray(users)) {
        setOnlineUsers(users.filter((u) => u.id !== user.id))
      }
    })

    return () => {
      // Leave presence room
      socket.emit('presence:leave', { room: roomName })
      socket.emit('leave-room', roomName)

      // Clear heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }

      // Remove event listeners
      socket.off('user:joined', handleUserJoined)
      socket.off('user:left', handleUserLeft)

      // Clear online users
      setOnlineUsers([])
    }
  }, [socket, isConnected, roomName, user, heartbeatInterval])

  return {
    onlineUsers,
    isOnline: onlineUsers.length > 0,
    totalOnline: onlineUsers.length + 1, // Include current user
  }
}

export default usePresence

