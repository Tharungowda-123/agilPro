import { io } from 'socket.io-client'
import { useSocketStore } from '@/stores/socketStore'

/**
 * Socket Client Setup
 * Creates and configures Socket.IO client instance with authentication and reconnection
 */

const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000'

// Ensure we're using the correct WebSocket URL format
const getSocketUrl = () => {
  const url = import.meta.env.VITE_WS_URL || 'http://localhost:5000'
  // Socket.IO doesn't need /socket.io path, it handles it automatically
  return url
}

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token')
}

// Create socket instance with configuration
const socket = io(getSocketUrl(), {
  autoConnect: false, // Don't auto-connect, we'll connect manually after auth
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  transports: ['websocket', 'polling'],
  auth: (cb) => {
    // Send JWT token in auth callback
    const token = getToken()
    cb({ token })
  },
})

// Connection event listeners
socket.on('connect', () => {
  console.log('[Socket] Connected to server')
  useSocketStore.getState().setConnected(true)
  useSocketStore.getState().setReconnecting(false)
  
  // Rejoin any rooms that were active before disconnection
  const activeRooms = useSocketStore.getState().activeRooms
  activeRooms.forEach((room) => {
    socket.emit('join-room', room)
  })
})

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected from server:', reason)
  useSocketStore.getState().setConnected(false)
  
  // If disconnect was not intentional, mark as reconnecting
  if (reason === 'io server disconnect' || reason === 'transport close') {
    useSocketStore.getState().setReconnecting(true)
  }
})

socket.on('connect_error', (error) => {
  console.error('[Socket] Connection error:', error)
  useSocketStore.getState().setConnected(false)
  useSocketStore.getState().setReconnecting(true)
  
  // If auth error, clear token and redirect to login
  if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
    localStorage.removeItem('token')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }
})

socket.on('reconnect', (attemptNumber) => {
  console.log('[Socket] Reconnected after', attemptNumber, 'attempts')
  useSocketStore.getState().setConnected(true)
  useSocketStore.getState().setReconnecting(false)
})

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('[Socket] Reconnection attempt', attemptNumber)
  useSocketStore.getState().setReconnecting(true)
})

socket.on('reconnect_error', (error) => {
  console.error('[Socket] Reconnection error:', error)
  useSocketStore.getState().setReconnecting(true)
})

socket.on('reconnect_failed', () => {
  console.error('[Socket] Reconnection failed')
  useSocketStore.getState().setReconnecting(false)
  useSocketStore.getState().setConnected(false)
})

// Helper function to connect socket (call after authentication)
export const connectSocket = () => {
  if (!socket.connected) {
    const token = getToken()
    if (token) {
      socket.auth = (cb) => cb({ token })
      socket.connect()
    } else {
      console.warn('[Socket] No token found, cannot connect')
    }
  }
}

// Helper function to disconnect socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect()
  }
}

// Helper function to reconnect socket (useful after token refresh)
export const reconnectSocket = () => {
  disconnectSocket()
  setTimeout(() => {
    connectSocket()
  }, 100)
}

// Update auth token when it changes
export const updateSocketAuth = (token) => {
  if (token) {
    socket.auth = (cb) => cb({ token })
    // If already connected, disconnect and reconnect with new token
    if (socket.connected) {
      reconnectSocket()
    }
  }
}

export default socket

