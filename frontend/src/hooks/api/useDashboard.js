import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/services/api/axiosConfig'
import { API_ENDPOINTS } from '@/constants'

/**
 * Dashboard Hooks
 * Custom hooks for fetching dashboard data from backend API
 */

// Get dashboard stats from backend (role-specific)
const getDashboardStats = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.STATS)
  return response.data.data || response.data
}

const getVelocityTrend = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.VELOCITY_FORECAST)
  const data = response.data?.data || response.data || {}
  const history = Array.isArray(data.history) ? data.history : []
  const forecast = data.forecast?.predicted_velocity || null
  
  // If history is array of numbers, convert to chart format
  // If history is array of objects with sprint info, use that
  const chartData = history.map((entry, index) => {
    if (typeof entry === 'number') {
      return {
        name: `Sprint ${index + 1}`,
        actual: entry,
        planned: entry, // Use same value for planned if not available
      }
    } else if (entry && typeof entry === 'object') {
      return {
        name: entry.name || entry.sprintName || `Sprint ${index + 1}`,
        actual: entry.actual || entry.completedPoints || entry.velocity || 0,
        planned: entry.planned || entry.committedPoints || entry.velocity || 0,
      }
    } else {
      return {
        name: `Sprint ${index + 1}`,
        actual: 0,
        planned: 0,
      }
    }
  })
  
  return {
    history: chartData,
    forecast,
  }
}

const getUpcomingDeadlines = async (params = {}) => {
  const response = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.DEADLINES, {
    params: {
      limit: params.limit || 8,
      days: params.days || 14,
      teamId: params.teamId,
    },
  })
  const data = response.data?.data?.items || response.data?.items || response.data || []
  return data.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type || 'task',
    dueDate: item.dueDate,
    status: item.status,
    priority: item.priority,
    projectId: item.project?.id || item.project?._id || item.projectId,
    storyId: item.story?.id || item.story?.storyId || item.storyId,
    taskId: item.taskId || item.id,
    assignedTo: item.assignee?.id,
    assignedToName: item.assignee?.name,
  }))
}

// Mock AI insights (keep for now, can be replaced with real API later)
const buildEntityLink = ({ entityType, projectId, storyId, taskId, entityId }) => {
  const params = new URLSearchParams()
  if (projectId) params.set('projectId', projectId)
  switch (entityType) {
    case 'story':
      if (storyId || entityId) {
        params.set('storyId', storyId || entityId)
        return `/board?${params.toString()}`
      }
      return null
    case 'task':
      if (taskId || entityId) {
        if (storyId) {
          params.set('storyId', storyId)
        }
        params.set('taskId', taskId || entityId)
        return `/board?${params.toString()}`
      }
      return null
    case 'project':
      return entityId ? `/projects/${entityId}` : null
    case 'sprint':
      return entityId ? `/sprints/${entityId}` : null
    default:
      return null
  }
}

const getAIInsights = async () => {
  try {
    const response = await axiosInstance.get('/insights/ai')
    const insights = response?.data?.data || response?.data?.insights || response?.data || []
    // Ensure insights is an array
    if (!Array.isArray(insights)) {
      return []
    }
    return insights.map((insight, index) => {
      const entityType = insight.entityType || insight.targetType || insight.typeTarget
      const projectId =
        insight.project?._id ||
        insight.projectId ||
        insight.entity?.project?._id ||
        insight.entity?.projectId ||
        null
      const storyId = insight.story?._id || insight.storyId || insight.entity?.storyId || null
      const taskId = insight.task?._id || insight.taskId || null
      const entityId = insight.entity?._id || insight.entityId || insight.targetId || null

      return {
        id: insight.id || insight._id || `insight-${index}`,
        type: insight.type || 'recommendation',
        title: insight.title || insight.heading || 'Insight',
        message: insight.description || insight.message || '',
        priority: insight.priority || 'medium',
        action: insight.action || 'View details',
        entityType,
        projectId,
        storyId,
        taskId,
        link: buildEntityLink({ entityType, projectId, storyId, taskId, entityId }),
      }
    })
  } catch (error) {
    // Silently handle 404 or other errors - endpoint might not exist yet
    if (error.response?.status === 404) {
      return []
    }
    // For other errors, return empty array
    return []
  }
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useVelocityData = () => {
  return useQuery({
    queryKey: ['dashboard', 'velocity'],
    queryFn: getVelocityTrend,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

const getRiskAlerts = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.RISK_ALERTS)
  return response.data.data || response.data
}

const getVelocityForecastData = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.VELOCITY_FORECAST)
  return response.data.data || response.data
}

export const useRecentActivities = () => {
  return useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: async () => {
      const response = await axiosInstance.get('/activities', { params: { limit: 10 } })
      const activities = response.data.data || response.data.activities || response.data || []
      // Transform to match ActivityFeed format
      return activities.map((activity) => ({
        id: activity._id || activity.id,
        type: activity.type,
        userId: activity.user?._id || activity.user || activity.userId,
        userName: activity.user?.name || activity.userName || 'Unknown User',
        message: activity.description || activity.message || `${activity.type} activity`,
        targetName:
          activity.entityType === 'story'
            ? activity.entity?.title
            : activity.entityType === 'task'
            ? activity.entity?.title
            : activity.entityType === 'project'
            ? activity.entity?.name
            : activity.entityType === 'sprint'
            ? activity.entity?.name
            : activity.targetName || '',
        timestamp: activity.createdAt || activity.timestamp,
        entityType: activity.entityType || activity.targetType || activity.entity?.type,
        entityId:
          activity.entity?._id ||
          activity.entity?._id ||
          activity.entityId ||
          activity.targetId ||
          null,
        projectId:
          activity.project?._id ||
          activity.projectId ||
          activity.entity?.project?._id ||
          activity.entity?.projectId ||
          activity.entity?.project ||
          null,
        storyId:
          activity.entityType === 'story'
            ? activity.entity?._id || activity.entityId
            : activity.entity?.story?._id || activity.entity?.storyId || activity.storyId || null,
        taskId: activity.entityType === 'task' ? activity.entity?._id || activity.entityId : null,
      }))
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const useUpcomingDeadlines = () => {
  return useQuery({
    queryKey: ['dashboard', 'deadlines'],
    queryFn: () => getUpcomingDeadlines(),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useAIInsights = () => {
  return useQuery({
    queryKey: ['dashboard', 'insights'],
    queryFn: getAIInsights,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useRiskAlerts = (options = {}) => {
  return useQuery({
    queryKey: ['dashboard', 'risk-alerts'],
    queryFn: getRiskAlerts,
    staleTime: 2 * 60 * 1000,
    ...options,
  })
}

export const useVelocityForecast = (options = {}) => {
  return useQuery({
    queryKey: ['dashboard', 'velocity-forecast'],
    queryFn: getVelocityForecastData,
    staleTime: 2 * 60 * 1000,
    ...options,
  })
}
