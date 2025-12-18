import { useEffect, useRef, useCallback } from 'react'
import socket, { connectSocket, disconnectSocket } from '@/services/socket/socketClient'
import { useAuthStore } from '@/stores/useAuthStore'
import { registerEventHandlers, unregisterEventHandlers, setToastInstance } from '@/services/socket/socketEventHandlers'
import { useToast } from '@/hooks/useToast'

/**
 * useSocket Hook
 * Custom hook to use socket in components
 * Subscribes to specific events and unsubscribes on cleanup
 * 
 * @example
 * const { socket, emit, isConnected } = useSocket();
 * 
 * useEffect(() => {
 *   socket.on('task:updated', handleTaskUpdate);
 *   return () => socket.off('task:updated', handleTaskUpdate);
 * }, []);
 */
export function useSocket() {
  const { isAuthenticated, token } = useAuthStore()
  const toast = useToast()
  const handlersRegistered = useRef(false)

  // Register toast instance for event handlers
  useEffect(() => {
    setToastInstance(toast)
  }, [toast])

  // Connect/disconnect socket based on auth state
  useEffect(() => {
    if (isAuthenticated && token) {
      // Register global event handlers on first connection
      if (!handlersRegistered.current && socket.connected) {
        registerEventHandlers(socket)
        handlersRegistered.current = true
      }
      
      connectSocket()
      
      // Register handlers after connection
      socket.once('connect', () => {
        if (!handlersRegistered.current) {
          registerEventHandlers(socket)
          handlersRegistered.current = true
        }
      })
    } else {
      disconnectSocket()
      if (handlersRegistered.current) {
        unregisterEventHandlers(socket)
        handlersRegistered.current = false
      }
    }

    return () => {
      // Don't disconnect on unmount, only on auth change
      // Socket will stay connected as long as user is authenticated
    }
  }, [isAuthenticated, token])

  // Helper function to emit events
  const emit = useCallback((event, data, callback) => {
    if (socket.connected) {
      if (callback) {
        socket.emit(event, data, callback)
      } else {
        socket.emit(event, data)
      }
    } else {
      console.warn('[Socket] Cannot emit event, socket not connected:', event)
    }
  }, [])

  // Helper function to subscribe to an event
  const on = useCallback((event, handler) => {
    socket.on(event, handler)
    return () => socket.off(event, handler)
  }, [])

  // Helper function to unsubscribe from an event
  const off = useCallback((event, handler) => {
    socket.off(event, handler)
  }, [])

  // Helper function to subscribe to an event once
  const once = useCallback((event, handler) => {
    socket.once(event, handler)
  }, [])

  return {
    socket,
    emit,
    on,
    off,
    once,
    isConnected: socket.connected,
  }
}

export default useSocket

