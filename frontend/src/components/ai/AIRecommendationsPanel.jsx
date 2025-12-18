import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import PropTypes from 'prop-types'
import { X, Sparkles, AlertCircle } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import TaskAssignmentCard from './TaskAssignmentCard'
import SprintOptimizationCard from './SprintOptimizationCard'
import RiskAlertCard from './RiskAlertCard'
import ComplexityInsightsCard from './ComplexityInsightsCard'
import AILoadingState from './AILoadingState'
import { cn } from '@/utils'
import axiosInstance from '@/services/api/axiosConfig'
import { API_ENDPOINTS } from '@/constants'
import { toast } from 'react-hot-toast'

/**
 * AIRecommendationsPanel Component
 * Sidebar panel displaying AI recommendations
 * 
 * @example
 * <AIRecommendationsPanel
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   context={{ type: 'sprint', id: '1' }}
 * />
 */
export default function AIRecommendationsPanel({
  isOpen,
  onClose,
  context = {},
  className = '',
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState({
    taskAssignments: [],
    sprintOptimizations: [],
    riskAlerts: [],
    complexityInsights: [],
  })
  const [error, setError] = useState(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const invalidateDashboardData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'insights'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'deadlines'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'activities'] })
    if (context?.type === 'task') {
      queryClient.invalidateQueries({ queryKey: ['task', context.id] })
    }
    if (context?.type === 'story') {
      queryClient.invalidateQueries({ queryKey: ['story', context.id] })
    }
  }, [context, queryClient])

  const normalizeRiskEntries = useCallback((alerts = [], bottlenecks = []) => {
    const normalizedAlerts = alerts.map((alert, index) => ({
      id: alert.id || `alert-${index}`,
      severity: alert.severity || 'medium',
      type: alert.type || 'general',
      title: alert.title || alert.projectName || 'Risk detected',
      description: alert.message || alert.description || 'Potential risk detected',
      affectedItems: alert.projectId
        ? [
            {
              id: alert.projectId,
              name: alert.projectName || 'Project',
              type: 'project',
            },
          ]
        : [],
      impact: alert.recommendation || '',
      suggestedActions: alert.recommendation ? [alert.recommendation] : [],
      quickFixes: alert.quickFixes || [],
    }))

    const normalizedBottlenecks = bottlenecks.map((item, index) => ({
      id: item.id || `bottleneck-${index}`,
      severity: item.severity || 'medium',
      type: item.type || 'capacity',
      title: item.title || item.message || 'Workload bottleneck',
      description: item.description || item.reason || 'Bottleneck detected in team workload',
      affectedItems: item.team
        ? [
            {
              id: item.team.id || `team-${index}`,
              name: item.team.name || 'Team',
              type: 'team',
            },
          ]
        : [],
      suggestedActions: item.recommendation ? [item.recommendation] : [],
      quickFixes: [],
    }))

    return [...normalizedAlerts, ...normalizedBottlenecks]
  }, [])

  const fetchTaskAssignments = useCallback(async () => {
    if (!context?.id) return null
    const response = await axiosInstance.get(API_ENDPOINTS.TASKS.RECOMMENDATIONS(context.id))
    const recs =
      response.data?.data?.recommendations ||
      response.data?.recommendations ||
      response.data ||
      []

    if (!recs.length) return null

    const normalizedRecs = recs.map((rec) => ({
      userId: rec.userId || rec.user?.id || rec.user?._id,
      userName: rec.user?.name || rec.userName || rec.user?.email || 'Unassigned',
      avatar: rec.user?.avatar,
      role: rec.user?.role,
      confidence: Number(rec.confidence ?? rec.score ?? 0.5),
      skills: rec.skills || rec.user?.skills || [],
      workload: rec.workload,
      reasoning: rec.reasoning || rec.reason,
      recommendationId: rec.recommendationId || rec.id,
    }))

    return {
      task: {
        id: context.id,
        title: context.title || context.name || 'Task',
      },
      recommendations: normalizedRecs,
    }
  }, [context])

  const fetchSprintInsights = useCallback(async () => {
    if (!context?.id) return null
    const sprintId = context.id
    const planResponse = await axiosInstance.post(`/sprints/${sprintId}/ai/optimize-plan`, context.payload || {})
    const plan = planResponse.data?.data?.plan || planResponse.data?.plan
    const suggestions = plan?.suggested_stories || []
    if (!suggestions.length) return null

    return {
      sprint: {
        id: sprintId,
        name: context.name || plan?.sprintName || 'Sprint Plan',
      },
      suggestions: suggestions.map((suggestion) => ({
        storyId: suggestion.story_id || suggestion.storyId || suggestion.id,
        storyTitle: suggestion.title || suggestion.storyTitle || 'Story',
        storyPoints: suggestion.story_points || suggestion.storyPoints,
        reason: suggestion.reason || suggestion.description,
        riskLevel: suggestion.risk_level || suggestion.riskLevel || plan?.risk_level || 'medium',
      })),
    }
  }, [context])

  const fetchStoryInsights = useCallback(async () => {
    if (!context?.id) return null
    const response = await axiosInstance.post(`/stories/${context.id}/analyze`)
    const data = response.data?.data || response.data
    if (!data) return null

    return {
      story: {
        id: context.id,
        title: context.title || data?.story?.title || 'Story',
      },
      insights: {
        overall: data.complexityScore ?? data.complexity ?? 0,
        ui: data.complexityBreakdown?.ui ?? data.breakdown?.ui ?? 0,
        backend: data.complexityBreakdown?.backend ?? data.breakdown?.backend ?? 0,
        integration: data.complexityBreakdown?.integration ?? data.breakdown?.integration ?? 0,
        testing: data.complexityBreakdown?.testing ?? data.breakdown?.testing ?? 0,
        estimatedPoints: data.estimatedPoints ?? data.storyPointsEstimate ?? null,
        confidence: data.confidence ?? 0,
        similarStories: data.similarStories || [],
      },
    }
  }, [context])

  const fetchRiskInsights = useCallback(async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.RISK_ALERTS)
      const payload = response.data?.data || response.data || {}
      return {
        alerts: payload.alerts || [],
        bottlenecks: payload.bottlenecks || [],
      }
    } catch (err) {
      if (err.response?.status === 403) {
        return { alerts: [], bottlenecks: [] }
      }
      throw err
    }
  }, [])

  const loadRecommendations = useCallback(async () => {
    if (!isOpen) return
    setIsLoading(true)
    setError(null)
    try {
      const [riskPayload, taskPayload, sprintPayload, storyPayload] = await Promise.all([
        fetchRiskInsights(),
        context?.type === 'task' ? fetchTaskAssignments() : null,
        context?.type === 'sprint' ? fetchSprintInsights() : null,
        context?.type === 'story' ? fetchStoryInsights() : null,
      ])

      setRecommendations({
        taskAssignments: taskPayload ? [taskPayload] : [],
        sprintOptimizations: sprintPayload ? [sprintPayload] : [],
        riskAlerts: normalizeRiskEntries(riskPayload.alerts, riskPayload.bottlenecks),
        complexityInsights: storyPayload ? [storyPayload] : [],
      })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load AI recommendations')
    } finally {
      setIsLoading(false)
    }
  }, [
    context,
    fetchRiskInsights,
    fetchSprintInsights,
    fetchStoryInsights,
    fetchTaskAssignments,
    isOpen,
    normalizeRiskEntries,
  ])

  useEffect(() => {
    if (isOpen) {
      loadRecommendations()
    }
  }, [isOpen, loadRecommendations])

  const handleAssign = async (task, recommendation) => {
    if (!task?.id || !recommendation?.userId) return
    try {
      await axiosInstance.post(API_ENDPOINTS.TASKS.ASSIGN(task.id), {
        userId: recommendation.userId,
      })
      toast.success(`Assigned to ${recommendation.userName}`)
      loadRecommendations()
      invalidateDashboardData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign task')
    }
  }

  const handleFeedback = async (task, recommendation, isPositive) => {
    if (!task?.id) return
    try {
      await axiosInstance.post(`/tasks/${task.id}/ai/feedback`, {
        isHelpful: isPositive,
        recommendationId: recommendation?.recommendationId || recommendation?.userId,
        selectedAssignee: recommendation?.userId,
      })
      toast.success('Feedback recorded')
      invalidateDashboardData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send feedback')
    }
  }

  const handleAcceptSprint = async (storyIds = []) => {
    if (!context?.id || storyIds.length === 0) return
    try {
      await axiosInstance.post(`/sprints/${context.id}/stories`, {
        storyIds,
      })
      toast.success('Sprint plan applied')
      loadRecommendations()
      invalidateDashboardData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply sprint plan')
    }
  }

  const handleAcknowledgeRisk = (riskId) => {
    setRecommendations((prev) => ({
      ...prev,
      riskAlerts: prev.riskAlerts.filter((risk) => risk.id !== riskId),
    }))
    invalidateDashboardData()
  }

  const handleDismissRisk = (riskId) => {
    setRecommendations((prev) => ({
      ...prev,
      riskAlerts: prev.riskAlerts.filter((risk) => risk.id !== riskId),
    }))
    invalidateDashboardData()
  }

  const handleQuickFix = (riskId, fix) => {
    if (!fix) return
    toast.info(`Triggered quick fix: ${fix.label}`)
    handleAcknowledgeRisk(riskId)
  }

  const handleViewStory = (storyId) => {
    if (!storyId) return
    const params = new URLSearchParams({ storyId })
    navigate(`/board?${params.toString()}`)
    invalidateDashboardData()
    onClose?.()
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600 animate-pulse" />
              <h2 className="text-lg font-semibold text-gray-900">AI Recommendations</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          {context?.type && (
            <Badge variant="outlined" size="sm">
              {context?.type.charAt(0).toUpperCase() + context?.type.slice(1)} Context
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {isLoading ? (
            <AILoadingState message="AI is analyzing..." showSkeleton />
          ) : error ? (
            <div className="p-3 rounded border border-error-200 bg-error-50 text-sm text-error-700">
              {error}
            </div>
          ) : recommendations.taskAssignments.length === 0 &&
            recommendations.sprintOptimizations.length === 0 &&
            recommendations.riskAlerts.length === 0 &&
            recommendations.complexityInsights.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recommendations available</p>
            </div>
          ) : (
            <>
              {/* Task Assignments */}
              {recommendations.taskAssignments && recommendations.taskAssignments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Task Assignment Recommendations
                  </h3>
                  <div className="space-y-3">
                    {recommendations.taskAssignments.map((item) => (
                      <TaskAssignmentCard
                        key={item.task.id}
                        task={item.task}
                        recommendations={item.recommendations}
                        onAssign={handleAssign}
                        onFeedback={handleFeedback}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sprint Optimizations */}
              {recommendations.sprintOptimizations && recommendations.sprintOptimizations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Sprint Optimization Suggestions
                  </h3>
                  <div className="space-y-3">
                    {recommendations.sprintOptimizations.map((item) => (
                      <SprintOptimizationCard
                        key={item.sprint.id}
                        sprint={item.sprint}
                        suggestions={item.suggestions}
                        onAccept={handleAcceptSprint}
                        onDismiss={() => handleDismissRisk(item.sprint.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Alerts */}
              {recommendations.riskAlerts && recommendations.riskAlerts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Risk Alerts
                  </h3>
                  <div className="space-y-3">
                    {recommendations.riskAlerts.map((risk) => (
                      <RiskAlertCard
                        key={risk.id}
                        risk={risk}
                        onAcknowledge={handleAcknowledgeRisk}
                        onDismiss={handleDismissRisk}
                        onQuickFix={handleQuickFix}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Complexity Insights */}
              {recommendations.complexityInsights && recommendations.complexityInsights.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Complexity Insights
                  </h3>
                  <div className="space-y-3">
                    {recommendations.complexityInsights.map((item) => (
                      <ComplexityInsightsCard
                        key={item.story.id}
                        story={item.story}
                        insights={item.insights}
                        onViewFull={() => handleViewStory(item.story.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

AIRecommendationsPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  context: PropTypes.shape({
    type: PropTypes.oneOf(['story', 'sprint', 'project', 'task']),
    id: PropTypes.string,
  }),
  className: PropTypes.string,
}

