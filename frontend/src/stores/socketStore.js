import { create } from 'zustand'

/**
 * Socket Store
 * Manages socket connection state and active rooms
 */
export const useSocketStore = create((set, get) => ({
  isConnected: false,
  isReconnecting: false,
  activeRooms: [], // Track rooms we've joined

  setConnected: (connected) => set({ isConnected: connected }),
  setReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),

  // Add room to active rooms
  addRoom: (room) => {
    const rooms = get().activeRooms
    if (!rooms.includes(room)) {
      set({ activeRooms: [...rooms, room] })
    }
  },

  // Remove room from active rooms
  removeRoom: (room) => {
    const rooms = get().activeRooms
    set({ activeRooms: rooms.filter((r) => r !== room) })
  },

  // Clear all rooms
  clearRooms: () => set({ activeRooms: [] }),
}))

