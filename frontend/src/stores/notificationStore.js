import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { notificationService } from '@/services/notificationService'

/**
 * Notification Store
 * Manages notification state and actions
 */
export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,

      // Load notifications from API
      loadNotifications: async () => {
        set({ isLoading: true })
        try {
          const data = await notificationService.getNotifications()
          const notifications = data.data || data || []
          set({
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
            isLoading: false,
          })
        } catch (error) {
          console.error('Failed to load notifications:', error)
          set({ isLoading: false })
        }
      },

      // Add a new notification
      addNotification: (notification) => {
        const newNotification = {
          id: Date.now().toString(),
          ...notification,
          read: false,
          timestamp: new Date().toISOString(),
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep max 50
          unreadCount: state.unreadCount + 1,
        }))
      },

      // Mark notification as read
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }))
      },

      // Mark all notifications as read
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }))
      },

      // Delete notification
      deleteNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          }
        })
      },

      // Clear all notifications
      clearAll: () => {
        set({
          notifications: [],
          unreadCount: 0,
        })
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
)

