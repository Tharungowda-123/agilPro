import { QueryClient } from '@tanstack/react-query'

/**
 * React Query Client Configuration
 * Optimized for performance with smart caching strategies
 * 
 * Caching Strategy:
 * - Static data (user profile, teams): 30 minutes staleTime
 * - Dynamic data (projects, sprints): 5 minutes staleTime
 * - Real-time data (tasks, activities): 1 minute staleTime
 * - Background refetching enabled for better UX
 * 
 * Note: QueryClient is created as a singleton to prevent recreation on re-renders
 */
let queryClientInstance = null

export const getQueryClient = () => {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time (can be overridden per query)
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache time (how long to keep unused data)
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // Retry up to 2 times for other errors
        return failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch behavior
      refetchOnWindowFocus: false, // Don't refetch on window focus (better for performance)
      refetchOnMount: true, // Refetch when component mounts
      refetchOnReconnect: true, // Refetch when network reconnects
      // Background refetching for better UX
      refetchInterval: false, // Disable by default, enable per query if needed
      // Network mode
      networkMode: 'online', // Only run queries when online
          // Structural sharing - helps prevent unnecessary re-renders
          structuralSharing: true,
    },
    mutations: {
      retry: 0, // Don't retry mutations
      // Optimistic updates can be configured per mutation
    },
  },
      // Suppress console errors for React DOM cleanup issues
      logger: {
        log: console.log,
        warn: console.warn,
        error: (error) => {
          // Suppress React DOM removeChild errors (they're usually harmless)
          if (error?.message?.includes('removeChild') || error?.message?.includes('not a child')) {
            console.warn('React DOM cleanup warning (harmless):', error.message)
            return
          }
          console.error(error)
        },
      },
    })
  }
  return queryClientInstance
}

// Export singleton instance
export const queryClient = getQueryClient()

// Query key factories for consistent query keys
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'],
    me: () => [...queryKeys.auth.all, 'me'],
  },
  // Projects
  projects: {
    all: ['projects'],
    lists: () => [...queryKeys.projects.all, 'list'],
    list: (filters) => [...queryKeys.projects.lists(), { filters }],
    details: () => [...queryKeys.projects.all, 'detail'],
    detail: (id) => [...queryKeys.projects.details(), id],
  },
  // Sprints
  sprints: {
    all: ['sprints'],
    lists: () => [...queryKeys.sprints.all, 'list'],
    list: (filters) => [...queryKeys.sprints.lists(), { filters }],
    details: () => [...queryKeys.sprints.all, 'detail'],
    detail: (id) => [...queryKeys.sprints.details(), id],
  },
  // Stories
  stories: {
    all: ['stories'],
    lists: () => [...queryKeys.stories.all, 'list'],
    list: (filters) => [...queryKeys.stories.lists(), { filters }],
    details: () => [...queryKeys.stories.all, 'detail'],
    detail: (id) => [...queryKeys.stories.details(), id],
  },
  // Tasks
  tasks: {
    all: ['tasks'],
    lists: () => [...queryKeys.tasks.all, 'list'],
    list: (filters) => [...queryKeys.tasks.lists(), { filters }],
    details: () => [...queryKeys.tasks.all, 'detail'],
    detail: (id) => [...queryKeys.tasks.details(), id],
  },
  // Dashboard
  dashboard: {
    all: ['dashboard'],
    stats: () => [...queryKeys.dashboard.all, 'stats'],
    activities: () => [...queryKeys.dashboard.all, 'activities'],
  },
}

export default queryClient

