import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { ArrowLeft, Save, Lightbulb, X, RefreshCw, Sparkles, AlertTriangle, Activity, Zap, CheckCircle } from 'lucide-react'
import {
  useSprint,
  useAssignStoriesToSprint,
  useSprintAIPlan,
  useSprintVelocityForecast,
  useSprintStorySuggestions,
  useSprintSimulation,
  useSprintCompletionPrediction,
  useAutoGenerateSprintPlan,
  useAcceptGeneratedPlan,
} from '@/hooks/api/useSprints'
import { useStories } from '@/hooks/api/useStories'
import { useUpdateStory } from '@/hooks/api/useStories'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

/**
 * SprintPlanning Page
 * Drag and drop interface for planning sprint backlog
 */

const toIdString = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value._id) return value._id.toString()
  if (value.id) return value.id.toString()
  return value.toString()
}

const getStoryId = (story) =>
  (story?.id && story.id.toString()) ||
  (story?._id && story._id.toString()) ||
  story?.storyId ||
  story?.story_id ||
  ''

const getStorySprintId = (story) =>
  story?.sprintId ||
  toIdString(story?.sprint) ||
  (typeof story?.sprint === 'string' ? story.sprint : null)

const getStoryProjectId = (story) =>
  story?.projectId ||
  toIdString(story?.project) ||
  (typeof story?.project === 'string' ? story.project : null)

export default function SprintPlanning() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showAIRecommendations, setShowAIRecommendations] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [aiPlan, setAiPlan] = useState(null)
  const [aiVelocity, setAiVelocity] = useState(null)
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [aiError, setAiError] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [simulationResult, setSimulationResult] = useState(null)
  const [completionPrediction, setCompletionPrediction] = useState(null)
  const [simulationLoading, setSimulationLoading] = useState(false)
  const [completionLoading, setCompletionLoading] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [generationProgress, setGenerationProgress] = useState('')

  const { data: sprint, isLoading: sprintLoading } = useSprint(id)
  const projectIdRef = sprint?.project?._id || sprint?.project || sprint?.projectId
  const normalizedProjectId = projectIdRef ? projectIdRef.toString() : null
  const { data: storiesData, isLoading: storiesLoading } = useStories(projectIdRef)
  const updateStory = useUpdateStory()
  const optimizeSprintPlan = useSprintAIPlan()
  const velocityForecast = useSprintVelocityForecast()
  const sprintStorySuggestions = useSprintStorySuggestions()
  const sprintSimulation = useSprintSimulation()
  const sprintCompletionPrediction = useSprintCompletionPrediction()
  const assignStories = useAssignStoriesToSprint()
  const autoGeneratePlan = useAutoGenerateSprintPlan()
  const acceptGeneratedPlan = useAcceptGeneratedPlan()

  const stories = Array.isArray(storiesData) ? storiesData : storiesData?.data || []
  const backlogStories = stories.filter((story) => {
    const storySprintId = getStorySprintId(story)
    const storyProjectId = getStoryProjectId(story)
    return !storySprintId && (!normalizedProjectId || storyProjectId === normalizedProjectId)
  })
  const sprintStories = stories.filter((story) => getStorySprintId(story) === id)

  // Filter backlog stories
  const filteredBacklog = backlogStories.filter((story) => {
    const matchesSearch = !searchTerm || story.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || story.priority === priorityFilter
    return matchesSearch && matchesPriority
  })

  // Calculate capacity
  const committedPoints = sprintStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)
  const capacity = sprint?.capacity || 80
  const capacityPercentage = (committedPoints / capacity) * 100

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    // Same position, no change
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const storyId = draggableId.replace('story-', '')
    const newSprintId = destination.droppableId === 'sprint-backlog' ? id : null

    updateStory.mutate(
      {
        id: storyId,
        data: { sprintId: newSprintId },
      },
      {
        onSuccess: () => {
          toast.success('Sprint plan updated')
        },
      }
    )
  }

  const handleSave = () => {
    toast.success('Sprint plan saved!')
    navigate(`/sprints/${id}`)
  }

  const loadAIInsights = async () => {
    if (!id) return
    setAiLoading(true)
    setAiError(null)
    try {
      const [planRes, velocityRes, suggestionsRes] = await Promise.all([
        optimizeSprintPlan.mutateAsync({ sprintId: id }),
        velocityForecast.mutateAsync({ sprintId: id }),
        sprintStorySuggestions.mutateAsync({ sprintId: id }),
      ])

      // Handle different response formats
      const plan = planRes?.data?.plan || planRes?.data || planRes?.plan || planRes || null
      const velocity = velocityRes?.data?.forecast || velocityRes?.data || velocityRes?.forecast || velocityRes || null
      const suggestions = suggestionsRes?.data?.suggestedStories || 
                         suggestionsRes?.data?.suggested_stories ||
                         suggestionsRes?.data?.stories ||
                         suggestionsRes?.suggestedStories || 
                         suggestionsRes?.suggested_stories ||
                         suggestionsRes?.stories ||
                         (Array.isArray(suggestionsRes?.data) ? suggestionsRes.data : []) ||
                         (Array.isArray(suggestionsRes) ? suggestionsRes : []) ||
                         []

      setAiPlan(plan)
      setAiVelocity(velocity)
      setAiSuggestions(suggestions)
      
      // If plan doesn't have suggested_stories but suggestions do, merge them
      if (plan && !plan.suggested_stories && suggestions.length > 0) {
        setAiPlan({
          ...plan,
          suggested_stories: suggestions
        })
      }
    } catch (error) {
      console.error('AI Insights Error:', error)
      setAiError(error?.response?.data?.message || error.message || 'Failed to fetch AI recommendations')
    } finally {
      setAiLoading(false)
    }
  }

  const handleToggleAI = () => {
    const next = !showAIRecommendations
    setShowAIRecommendations(next)
    if (next && !aiPlan && !aiLoading) {
      loadAIInsights()
    }
  }

  const handleApplyAIPlan = () => {
    // Use suggestions from either aiPlan or aiSuggestions
    const storiesToAdd = aiPlan?.suggested_stories || aiSuggestions || []
    
    if (!storiesToAdd.length) {
      toast.error('No AI stories to add yet. Please run analysis first.')
      return
    }
    
    const currentStoryIds = new Set(sprintStories.map((story) => getStoryId(story)).filter(Boolean))
    const storyIds = storiesToAdd
      .map((story) => story.story_id || story.id || story._id)
      .filter((storyId) => {
        const idStr = storyId?.toString()
        return idStr && !currentStoryIds.has(idStr)
      })

    if (storyIds.length === 0) {
      toast.error('All recommended stories are already part of this sprint')
      return
    }

    assignStories.mutate(
      { sprintId: id, storyIds, projectId: normalizedProjectId },
      {
        onSuccess: () => {
          toast.success(`Added ${storyIds.length} story/stories to sprint`)
          loadAIInsights()
        },
        onError: (error) => {
          toast.error(error?.response?.data?.message || 'Failed to add stories to sprint')
        }
      }
    )
  }

  const formatStoryForSimulation = (story) => ({
    story_id: getStoryId(story),
    title: story.title,
    story_points: story.storyPoints || 0,
    priority: story.priority || 'medium',
    status: story.status || 'backlog',
    estimated_hours: story.estimatedHours || null,
    dependencies: (story.dependencies || []).map((dep) => toIdString(dep)),
  })

  const handleSimulateSprint = async () => {
    if (!id) return
    setSimulationLoading(true)
    try {
      const payload = {
        stories: sprintStories.map(formatStoryForSimulation),
        riskTolerance: 'balanced',
      }
      const response = await sprintSimulation.mutateAsync({ sprintId: id, data: payload })
      setSimulationResult(response?.data?.simulation || response?.simulation || response)
      toast.success('Sprint simulation ready')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to simulate sprint')
    } finally {
      setSimulationLoading(false)
    }
  }

  const handlePredictCompletion = async () => {
    if (!id) return
    setCompletionLoading(true)
    try {
      const remainingStoryPoints = Math.max(
        committedPoints - (sprint.completedPoints || 0),
        sprint.remainingPoints || 0
      )
      const response = await sprintCompletionPrediction.mutateAsync({
        sprintId: id,
        data: {
          remainingStoryPoints,
          sprintCapacity: capacity,
        },
      })
      setCompletionPrediction(response?.data?.prediction || response?.prediction || response)
      toast.success('Completion forecast generated')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to predict completion')
    } finally {
      setCompletionLoading(false)
    }
  }

  const handleAutoGenerate = async () => {
    if (!id) return
    setGeneratingPlan(true)
    setGenerationProgress('Analyzing...')

    try {
      // Simulate progress updates
      setTimeout(() => setGenerationProgress('Selecting stories...'), 1000)
      setTimeout(() => setGenerationProgress('Assigning tasks...'), 2000)
      setTimeout(() => setGenerationProgress('Balancing workload...'), 3000)

      const response = await autoGeneratePlan.mutateAsync(id)
      const plan = response?.data?.generatedPlan || response?.generatedPlan || response
      
      setGeneratedPlan(plan)
      setGeneratingPlan(false)
      setIsReviewModalOpen(true)
      toast.success('Sprint plan generated successfully!')
    } catch (error) {
      setGeneratingPlan(false)
      toast.error(error?.response?.data?.message || 'Failed to generate sprint plan')
    }
  }

  const handleAcceptPlan = async () => {
    if (!id || !generatedPlan) return

    try {
      await acceptGeneratedPlan.mutateAsync({
        sprintId: id,
        generatedPlan,
      })
      setIsReviewModalOpen(false)
      setGeneratedPlan(null)
      // Refresh page data
      window.location.reload()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to accept plan')
    }
  }

  if (sprintLoading || storiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!sprint) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Sprint not found</p>
      </div>
    )
  }

  // Combine suggestions from both sources
  const suggestedStories = aiPlan?.suggested_stories || aiSuggestions || []
  const capacityUtilization = aiPlan?.capacity_utilization || '--'
  const completionPercent =
    typeof aiPlan?.predicted_completion_probability === 'number'
      ? `${Math.round(aiPlan.predicted_completion_probability * 100)}%`
      : '--'
  const totalPointsSuggested =
    typeof aiPlan?.total_story_points === 'number'
      ? `${aiPlan.total_story_points.toFixed(1)} pts`
      : '--'
  const predictedVelocityValue =
    typeof aiVelocity?.predicted_velocity === 'number' ? `${aiVelocity.predicted_velocity} pts` : '--'
  const velocityConfidence =
    aiVelocity?.confidence_interval && Array.isArray(aiVelocity.confidence_interval)
      ? `${aiVelocity.confidence_interval[0]} - ${aiVelocity.confidence_interval[1]} pts`
      : null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outlined"
            onClick={() => navigate(`/sprints/${id}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sprint.name} - Planning</h1>
            <p className="text-gray-600">
              {new Date(sprint.startDate).toLocaleDateString()} -{' '}
              {new Date(sprint.endDate).toLocaleDateString()} • Capacity: {capacity} points
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={handleAutoGenerate}
            loading={generatingPlan}
            leftIcon={<Zap className="w-4 h-4" />}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            ⚡ Auto-Generate Sprint Plan
          </Button>
          <Button variant="outlined" onClick={handleToggleAI} leftIcon={<Lightbulb className="w-4 h-4" />}>
            AI Recommendations
          </Button>
          <Button variant="outlined" onClick={handleSave} leftIcon={<Save className="w-4 h-4" />}>
            Save Plan
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={`flex gap-6 relative ${showAIRecommendations ? 'pr-[400px]' : ''}`}>
          {/* Main Content */}
          <div className="flex-1 flex gap-6">
            {/* Product Backlog - Left Column (40%) */}
            <div className="w-[40%] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Product Backlog</h2>
                <Badge variant="outlined" size="sm">
                  {filteredBacklog.length} stories
                </Badge>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Input
                  placeholder="Search stories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Backlog Stories */}
              <Droppable droppableId="product-backlog">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      space-y-2 min-h-[400px] p-4 rounded-lg border-2 border-dashed
                      ${snapshot.isDraggingOver ? 'border-primary-300 bg-primary-50' : 'border-gray-200'}
                    `}
                  >
                    {filteredBacklog.map((story, index) => {
                      const storyId = getStoryId(story)
                      if (!storyId) return null
                      return (
                        <Draggable key={storyId} draggableId={`story-${storyId}`} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900 text-sm">{story.title}</h4>
                                <Badge variant="outlined" size="sm">
                                  {story.storyPoints || 0} pts
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    story.priority === 'high'
                                      ? 'error'
                                      : story.priority === 'medium'
                                      ? 'warning'
                                      : 'default'
                                  }
                                  size="sm"
                                >
                                  {story.priority || 'medium'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {story.storyPoints || 0} story points
                                </span>
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                    {filteredBacklog.length === 0 && (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No stories in backlog
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Sprint Backlog - Right Column (60%) */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Sprint Backlog</h2>
                <Badge variant="outlined" size="sm">
                  {sprintStories.length} stories
                </Badge>
              </div>

              {/* Capacity Indicator */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Capacity</span>
                  <span className="text-sm font-medium text-gray-900">
                    {committedPoints} / {capacity} points
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      capacityPercentage > 100
                        ? 'bg-error-500'
                        : capacityPercentage > 80
                        ? 'bg-warning-500'
                        : 'bg-success-500'
                    }`}
                    style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                  />
                </div>
                {capacityPercentage > 100 && (
                  <p className="text-xs text-error-600 mt-1">
                    Over capacity by {committedPoints - capacity} points
                  </p>
                )}
              </Card>

              {/* Sprint Stories */}
              <Droppable droppableId="sprint-backlog">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      space-y-2 min-h-[400px] p-4 rounded-lg border-2 border-dashed
                      ${snapshot.isDraggingOver ? 'border-primary-300 bg-primary-50' : 'border-gray-200'}
                    `}
                  >
                    {sprintStories.map((story, index) => {
                      const storyId = getStoryId(story)
                      if (!storyId) return null
                      return (
                        <Draggable key={storyId} draggableId={`story-${storyId}`} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900 text-sm">{story.title}</h4>
                                <Badge variant="outlined" size="sm">
                                  {story.storyPoints || 0} pts
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    story.priority === 'high'
                                      ? 'error'
                                      : story.priority === 'medium'
                                      ? 'warning'
                                      : 'default'
                                  }
                                  size="sm"
                                >
                                  {story.priority || 'medium'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {story.storyPoints || 0} story points
                                </span>
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                    {sprintStories.length === 0 && (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        Drag stories here to add them to the sprint
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </div>

        {/* AI Recommendations Sidebar */}
        {showAIRecommendations && (
          <div className="w-96 bg-white border-l border-gray-200 p-6 fixed right-0 top-0 h-screen overflow-y-auto shadow-lg z-50">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Sprint Planner</h3>
                <p className="text-xs text-gray-500">
                  Capacity-aware recommendations generated from your backlog
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadAIInsights}
                  disabled={aiLoading}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Refresh
                </Button>
                <button
                  onClick={() => setShowAIRecommendations(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {aiLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner size="md" color="primary" />
              </div>
            ) : aiError ? (
              <div className="mt-4 p-4 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-sm text-error-700">{aiError}</p>
                <Button variant="outlined" size="sm" className="mt-3" onClick={loadAIInsights}>
                  Try again
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 mt-6">
                  <Card className="p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Capacity Utilization</p>
                    <p className="text-2xl font-semibold text-gray-900">{capacityUtilization}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Predicted Velocity</p>
                    <p className="text-2xl font-semibold text-gray-900">{predictedVelocityValue}</p>
                    {velocityConfidence && (
                      <p className="text-xs text-gray-500 mt-1">Range: {velocityConfidence}</p>
                    )}
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Completion Probability</p>
                    <p className="text-2xl font-semibold text-gray-900">{completionPercent}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Story Points</p>
                    <p className="text-2xl font-semibold text-gray-900">{totalPointsSuggested}</p>
                  </Card>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary-500" />
                      Recommended Stories ({suggestedStories.length})
                    </h4>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!suggestedStories.length || assignStories.isPending || aiLoading}
                      onClick={handleApplyAIPlan}
                      title={!suggestedStories.length ? 'No stories to add. Run analysis first.' : 'Add all recommended stories to sprint'}
                    >
                      {assignStories.isPending ? 'Adding...' : `Add to Sprint (${suggestedStories.length})`}
                    </Button>
                  </div>
                  {suggestedStories.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {suggestedStories.map((story, index) => {
                        const storyId = story.story_id || story.id || story._id || `story-${index}`
                        return (
                          <div key={storyId} className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 break-words">{story.title || 'Untitled Story'}</p>
                                {story.reason && (
                                  <p className="text-xs text-gray-500 mt-1 break-words">{story.reason}</p>
                                )}
                              </div>
                              <Badge variant="outlined" size="sm" className="flex-shrink-0">
                                {story.story_points || story.storyPoints || 0} pts
                              </Badge>
                            </div>
                            {(story.suggested_assignee || story.priority) && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                {story.suggested_assignee && (
                                  <span className="font-medium text-gray-700">
                                    {story.suggested_assignee}
                                  </span>
                                )}
                                {story.priority && (
                                  <span>• Priority: {story.priority}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 mb-3">No recommendations available.</p>
                      <Button 
                        variant="outlined" 
                        size="sm" 
                        onClick={loadAIInsights}
                        disabled={aiLoading}
                      >
                        {aiLoading ? 'Loading...' : 'Run Analysis'}
                      </Button>
                    </div>
                  )}
                </div>

                {aiSuggestions.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Top Backlog Picks</h4>
                    <div className="space-y-2">
                      {aiSuggestions.slice(0, 5).map((suggestion) => (
                        <div
                          key={`${suggestion.story_id}-${suggestion.title}`}
                          className="p-3 bg-gray-50 rounded border border-gray-100"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{suggestion.title}</p>
                            <Badge variant="outlined" size="sm">
                              {suggestion.story_points || 0} pts
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{suggestion.reason || 'High match'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiPlan?.risk_factors?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning-500" />
                      Detected Risks
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm text-gray-600">
                      {aiPlan.risk_factors.map((risk, index) => (
                        <li key={`${risk}-${index}`}>• {risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-8 space-y-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    leftIcon={<Activity className="w-4 h-4" />}
                    onClick={handleSimulateSprint}
                    loading={simulationLoading || sprintSimulation.isPending}
                  >
                    {simulationLoading ? 'Simulating...' : 'Simulate Sprint Outcome'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={handlePredictCompletion}
                    loading={completionLoading || sprintCompletionPrediction.isPending}
                  >
                    {completionLoading ? 'Predicting...' : 'Predict Completion Date'}
                  </Button>
                </div>

                {simulationResult && (
                  <div className="mt-6 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">Simulation Summary</h4>
                    <Card className="p-4 space-y-2">
                      {simulationResult.completion_confidence && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 uppercase">Completion Confidence</span>
                          <span className="text-sm font-medium text-gray-900">
                            {(simulationResult.completion_confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                      {simulationResult.projected_velocity && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 uppercase">Projected Velocity</span>
                          <span className="text-sm font-medium text-gray-900">
                            {simulationResult.projected_velocity} pts
                          </span>
                        </div>
                      )}
                      {simulationResult.risk_alerts?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Risk Alerts</p>
                          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                            {simulationResult.risk_alerts.map((risk, idx) => (
                              <li key={`${risk}-${idx}`}>{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {simulationResult.blockers?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Potential Blockers</p>
                          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                            {simulationResult.blockers.map((blocker, idx) => (
                              <li key={`${blocker}-${idx}`}>{blocker}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {completionPrediction && (
                  <div className="mt-6 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">Completion Forecast</h4>
                    <Card className="p-4 space-y-2">
                      {completionPrediction.predicted_completion_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 uppercase">Predicted Finish</span>
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(completionPrediction.predicted_completion_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {completionPrediction.likelihood && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 uppercase">On-time Likelihood</span>
                          <span className="text-sm font-medium text-gray-900">
                            {(completionPrediction.likelihood * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                      {completionPrediction.bottlenecks?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Bottlenecks</p>
                          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                            {completionPrediction.bottlenecks.map((item, idx) => (
                              <li key={`${item}-${idx}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DragDropContext>

      {/* Auto-Generate Loading Modal */}
      {generatingPlan && (
        <Modal isOpen={generatingPlan} onClose={() => {}} size="sm">
          <div className="text-center py-8">
            <Spinner size="lg" color="primary" className="mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Generating Sprint Plan...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{generationProgress}</p>
          </div>
        </Modal>
      )}

      {/* Review Generated Plan Modal */}
      {isReviewModalOpen && generatedPlan && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title="Review Generated Sprint Plan"
          size="xl"
        >
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-4 bg-primary-50 dark:bg-primary-900/20">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stories</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {generatedPlan.selected_stories?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {generatedPlan.selected_stories?.reduce(
                      (sum, s) => sum + (s.tasks?.length || 0),
                      0
                    ) || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {generatedPlan.total_points || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completion</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {generatedPlan.predicted_completion || 0}%
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-primary-200 dark:border-primary-700">
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  ⚡ Generated in {generatedPlan.generation_time || 'seconds'}
                </p>
              </div>
            </Card>

            {/* Team Workload */}
            {generatedPlan.team_workload && generatedPlan.team_workload.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Team Workload</h4>
                <div className="space-y-2">
                  {generatedPlan.team_workload.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{member.member}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.before} → {member.after} hours
                        </p>
                      </div>
                      <Badge
                        className={
                          member.utilization > 100
                            ? 'bg-red-100 text-red-800'
                            : member.utilization > 90
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }
                      >
                        {member.utilization}% utilized
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Stories */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Selected Stories</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {generatedPlan.selected_stories?.map((storyData, idx) => {
                  const story = storyData.story
                  const tasks = storyData.tasks || []
                  return (
                    <Card key={idx} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-gray-100">{story.title}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge>{story.priority || 'medium'}</Badge>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {story.storyPoints || story.points || 0} pts
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {tasks.length} tasks
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {tasks.map((taskData, taskIdx) => (
                          <div
                            key={taskIdx}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                          >
                            <div className="flex-1">
                              <p className="text-gray-900 dark:text-gray-100">{taskData.task.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {taskData.assigned_to_name} • {taskData.task.estimated_hours}h •{' '}
                                {taskData.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outlined" onClick={() => setIsReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAcceptPlan}
                loading={acceptGeneratedPlan.isPending}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Accept & Create Plan
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

