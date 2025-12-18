import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Play, CheckCircle, Edit, MoreVertical, CalendarClock } from 'lucide-react'
import { useSprint, useStartSprint, useCompleteSprint, useUpdateSprint, useSaveRetrospective, useUpdateActionItem, usePastRetrospectives } from '@/hooks/api/useSprints'
import { useSprintBurndown } from '@/hooks/api/useSprints'
import { useRole } from '@/hooks/useRole'
import { useStories, useUpdateStory, useDeleteStory } from '@/hooks/api/useStories'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Dropdown from '@/components/ui/Dropdown'
import Spinner from '@/components/ui/Spinner'
import BurndownChart from '@/components/charts/BurndownChart'
import VelocityChart from '@/components/dashboard/VelocityChart'
import SprintFormModal from '@/components/sprints/SprintFormModal'
import EmptyState from '@/components/layout/EmptyState'
import { Calendar, TrendingUp, MessageSquare, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import TextArea from '@/components/ui/TextArea'
import FormGroup from '@/components/ui/FormGroup'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'
import SprintMeetingsTab from '@/components/sprints/SprintMeetingsTab'
import KanbanBoard from '@/components/kanban/KanbanBoard'
import StoryDetailModal from '@/components/story/StoryDetailModal'
import TaskDetailModal from '@/components/story/TaskDetailModal'

/**
 * SprintDetail Page
 * Detailed view of a sprint with tabs for Board, Burndown, Velocity, Retrospective
 */
export default function SprintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('board')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Normalize ID - handle both 'id' and potential 'undefined' string
  const sprintId = id && id !== 'undefined' ? id : null

  const { data: sprint, isLoading: sprintLoading } = useSprint(sprintId)
  
  // Debug: Log sprint data when it loads
  useEffect(() => {
    if (sprint) {
      console.log('SprintDetail - Sprint loaded:', {
        id: sprint._id || sprint.id,
        name: sprint.name,
        projectId: sprint.projectId,
        project: sprint.project,
        project_id: sprint.project?._id,
        stories: sprint.stories?.length || 0,
      })
    }
  }, [sprint])
  const { data: burndownData, isLoading: burndownLoading } = useSprintBurndown(sprintId)
  const startSprint = useStartSprint()
  const completeSprint = useCompleteSprint()
  const updateSprint = useUpdateSprint()

  const handleStart = () => {
    if (!sprintId) {
      toast.error('Invalid sprint ID')
      return
    }
    startSprint.mutate(sprintId)
  }

  const handleComplete = () => {
    if (!sprintId) {
      toast.error('Invalid sprint ID')
      return
    }
    completeSprint.mutate(sprintId)
  }

  const handleUpdate = (data) => {
    if (!sprintId) {
      toast.error('Invalid sprint ID')
      return
    }
    updateSprint.mutate(
      { id: sprintId, data },
      {
        onSuccess: () => {
          setIsEditModalOpen(false)
        },
      }
    )
  }

  // Early return if id is not available (after hooks)
  if (!sprintId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Calendar className="w-16 h-16" />}
          title="Invalid Sprint ID"
          description="The sprint ID is missing or invalid. Please navigate from the sprints list."
          action={
            <Button variant="primary" onClick={() => navigate('/sprints')}>
              Back to Sprints
            </Button>
          }
        />
      </div>
    )
  }

  if (sprintLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!sprint) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Calendar className="w-16 h-16" />}
          title="Sprint Not Found"
          description="The sprint you're looking for doesn't exist or has been deleted."
          action={
            <Button variant="primary" onClick={() => navigate('/sprints')}>
              Back to Sprints
            </Button>
          }
        />
      </div>
    )
  }

  const daysRemaining = Math.ceil((new Date(sprint.endDate) - new Date()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysRemaining < 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="outlined"
            onClick={() => navigate('/sprints')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{sprint.name}</h1>
              <Badge
                variant={
                  sprint.status === 'active'
                    ? 'success'
                    : sprint.status === 'completed'
                    ? 'default'
                    : 'warning'
                }
                size="md"
              >
                {sprint.status}
              </Badge>
            </div>
            <p className="text-gray-600 mb-2">{sprint.goal}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                {new Date(sprint.startDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                -{' '}
                {new Date(sprint.endDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              {sprint.status === 'active' && (
                <span className={isOverdue ? 'text-error-600 font-medium' : 'text-warning-600'}>
                  {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sprint.status === 'planned' && (
            <Button variant="primary" onClick={handleStart} leftIcon={<Play className="w-4 h-4" />}>
              Start Sprint
            </Button>
          )}
          {sprint.status === 'active' && (
            <Button
              variant="success"
              onClick={handleComplete}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Complete Sprint
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => {
              if (!sprintId) {
                toast.error('Invalid sprint ID')
                return
              }
              navigate(`/sprints/${sprintId}/planning`)
            }}
          >
            Planning
          </Button>
          <Dropdown
            trigger={
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            }
            items={[
              {
                label: 'Edit Sprint',
                icon: <Edit className="w-4 h-4" />,
                onClick: () => setIsEditModalOpen(true),
              },
            ]}
            position="bottom-right"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'board', label: 'Board', icon: Calendar },
            { id: 'burndown', label: 'Burndown', icon: TrendingUp },
            { id: 'velocity', label: 'Velocity', icon: TrendingUp },
            { id: 'retrospective', label: 'Retrospective', icon: MessageSquare },
            { id: 'meetings', label: 'Meetings', icon: CalendarClock },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'board' && (
          <BoardTab
            sprintId={sprintId}
            projectId={
              sprint.projectId ||
              sprint.project?._id ||
              sprint.project ||
              (typeof sprint.project === 'string' ? sprint.project : null)
            }
            sprint={sprint}
          />
        )}
        {activeTab === 'burndown' && (
          <BurndownTab burndownData={burndownData} loading={burndownLoading} sprint={sprint} />
        )}
        {activeTab === 'velocity' && <VelocityTab sprint={sprint} />}
        {activeTab === 'retrospective' && <RetrospectiveTab sprintId={sprintId} />}
        {activeTab === 'meetings' && <SprintMeetingsTab sprint={sprint} />}
      </div>

      {/* Edit Sprint Modal */}
      <SprintFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdate}
        sprint={sprint}
        projectId={sprint.projectId}
        loading={updateSprint.isPending}
      />
    </div>
  )
}

// Board Tab Component
function BoardTab({ sprintId, projectId, sprint }) {
  const [selectedStoryId, setSelectedStoryId] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  
  // Extract projectId from sprint if not provided directly
  // NOTE: Sprint model uses 'project' field (not 'projectId'), which is populated
  const actualProjectId = useMemo(() => {
    let extractedId = null
    
    // Priority order: 1) prop, 2) sprint.project._id, 3) sprint.project (string/ObjectId)
    if (projectId) {
      extractedId = projectId
    } else if (sprint?.project?._id) {
      // This is the most common case - populated project object
      extractedId = sprint.project._id
    } else if (sprint?.project) {
      // Handle both ObjectId and string
      extractedId = typeof sprint.project === 'string' ? sprint.project : sprint.project.toString()
    } else if (sprint?.projectId) {
      // Fallback (unlikely to exist, but just in case)
      extractedId = sprint.projectId
    }
    
    // Convert to string if it's an ObjectId
    if (extractedId && typeof extractedId !== 'string') {
      extractedId = extractedId.toString()
    }
    
    console.log('BoardTab - ProjectId extraction:', {
      projectIdProp: projectId,
      sprintProject: sprint?.project,
      sprintProjectId: sprint?.projectId,
      extractedId: extractedId,
      finalProjectId: extractedId,
    })
    
    return extractedId
  }, [projectId, sprint])
  
  // Debug logging - ALWAYS log, even if values are missing
  useEffect(() => {
    console.log('BoardTab - Component rendered:', {
      sprintId: sprintId ? sprintId.toString() : 'MISSING',
      projectId: projectId ? projectId.toString() : 'MISSING',
      actualProjectId: actualProjectId ? actualProjectId.toString() : 'MISSING',
      sprintExists: !!sprint,
      sprintProject: sprint?.project,
      sprintProjectId: sprint?.projectId,
      sprintStoriesCount: sprint?.stories?.length || 0,
    })
  }, [sprintId, projectId, actualProjectId, sprint])
  
  // Fetch stories for this sprint - only if we have both IDs
  const { data: storiesData, isLoading: storiesLoading, error: storiesError } = useStories(actualProjectId, {
    sprintId: sprintId ? sprintId.toString() : undefined,
    limit: 100,
  })
  
  // Debug: Log API response
  useEffect(() => {
    if (storiesData !== undefined) {
      console.log('BoardTab - Stories API response:', {
        hasData: !!storiesData,
        isArray: Array.isArray(storiesData),
        dataType: typeof storiesData,
        dataKeys: storiesData && typeof storiesData === 'object' ? Object.keys(storiesData) : [],
        storiesCount: Array.isArray(storiesData) ? storiesData.length : 
                     (storiesData?.data && Array.isArray(storiesData.data) ? storiesData.data.length : 
                      (storiesData?.stories && Array.isArray(storiesData.stories) ? storiesData.stories.length : 0)),
      })
    }
    if (storiesError) {
      console.error('BoardTab - Stories API error:', storiesError)
    }
  }, [storiesData, storiesError])
  
  // Handle different response formats and also check sprint.stories if available
  const stories = useMemo(() => {
    // First, try to get stories from the API response
    let apiStories = []
    if (storiesData) {
      if (Array.isArray(storiesData)) {
        apiStories = storiesData
      } else if (Array.isArray(storiesData.data)) {
        apiStories = storiesData.data
      } else if (Array.isArray(storiesData.stories)) {
        apiStories = storiesData.stories
      } else if (Array.isArray(storiesData.data?.data)) {
        apiStories = storiesData.data.data
      }
    }
    
    // If API returned stories, use them
    if (apiStories.length > 0) {
      return apiStories
    }
    
    // Fallback: use stories from sprint object if available (backend populates them)
    if (sprint?.stories && Array.isArray(sprint.stories) && sprint.stories.length > 0) {
      console.log('Using stories from sprint object:', sprint.stories.length)
      return sprint.stories
    }
    
    return []
  }, [storiesData, sprint])
  
  // Fetch mutations for updates
  const updateStory = useUpdateStory()
  const deleteStory = useDeleteStory()
  
  // Enhance stories with proper IDs
  const enhancedStories = useMemo(() => {
    return stories.map((story) => ({
      ...story,
      id: story._id || story.id || story,
      title: story.title || 'Untitled Story',
      status: story.status || 'backlog',
      priority: story.priority || 'medium',
      storyPoints: story.storyPoints || 0,
      assignee: story.assignedTo,
    }))
  }, [stories])

  const handleStoryUpdate = useCallback((updatedStory) => {
    const storyId = updatedStory._id || updatedStory.id || updatedStory
    updateStory.mutate({
      id: storyId,
      data: {
        status: updatedStory.status,
        priority: updatedStory.priority,
        storyPoints: updatedStory.storyPoints,
      },
    })
  }, [updateStory])

  const handleStoryClick = useCallback((story) => {
    const storyId = story._id || story.id || story
    setSelectedStoryId(storyId)
  }, [])

  const handleStoryEdit = useCallback((story) => {
    const storyId = story._id || story.id || story
    setSelectedStoryId(storyId)
  }, [])

  const handleStoryDelete = useCallback((story) => {
    if (window.confirm(`Are you sure you want to delete "${story.title}"?`)) {
      const storyId = story._id || story.id || story
      deleteStory.mutate(storyId)
    }
  }, [deleteStory])

  const handleCloseStoryModal = useCallback(() => {
    setSelectedStoryId(null)
  }, [])

  const handleCloseTaskModal = useCallback(() => {
    setSelectedTaskId(null)
  }, [])

  if (!actualProjectId) {
    return (
      <div className="text-center py-12">
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-gray-400" />}
          title="Project Not Found"
          description="Unable to load stories. The sprint's project information is missing. Please check the sprint details."
        />
      </div>
    )
  }

  if (storiesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (storiesError) {
    return (
      <div className="text-center py-12">
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-gray-400" />}
          title="Error Loading Stories"
          description={storiesError.message || "Failed to load stories for this sprint"}
        />
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-12">
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-gray-400" />}
          title="No Stories in Sprint"
          description={`This sprint doesn't have any stories yet. Add stories to this sprint to see them on the board.`}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
        <KanbanBoard
          stories={enhancedStories}
          onStoryUpdate={handleStoryUpdate}
          onStoryEdit={handleStoryEdit}
          onStoryDelete={handleStoryDelete}
          onStoryClick={handleStoryClick}
        />
      </div>

      {/* Story Detail Modal */}
      {selectedStoryId && (
        <StoryDetailModal
          isOpen={!!selectedStoryId}
          onClose={handleCloseStoryModal}
          storyId={selectedStoryId}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          isOpen={!!selectedTaskId}
          onClose={handleCloseTaskModal}
          taskId={selectedTaskId}
        />
      )}
    </div>
  )
}

// Burndown Tab Component
function BurndownTab({ burndownData, loading, sprint }) {
  const daysRemaining = Math.ceil((new Date(sprint.endDate) - new Date()) / (1000 * 60 * 60 * 24))
  const pointsRemaining = sprint.capacity - sprint.velocity
  const isOnTrack = pointsRemaining <= (sprint.capacity * daysRemaining) / 14 // Rough estimate

  return (
    <div className="space-y-6">
      <BurndownChart data={burndownData?.days || []} loading={loading} />

      {/* Summary Stats */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Burndown Insights</h3>
        <Link
          to={`/reports?sprintId=${sprint._id || sprint.id}`}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View sprint reports
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Days Remaining</p>
          <p className="text-2xl font-bold text-gray-900">{Math.max(0, daysRemaining)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Points Remaining</p>
          <p className="text-2xl font-bold text-gray-900">{Math.max(0, pointsRemaining)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">On Track</p>
          <p className={`text-2xl font-bold ${isOnTrack ? 'text-success-600' : 'text-error-600'}`}>
            {isOnTrack ? 'Yes' : 'No'}
          </p>
        </Card>
      </div>
    </div>
  )
}

// Velocity Tab Component
function VelocityTab({ sprint }) {
  // Mock historical velocity data
  const historicalData = [
    { name: 'Sprint 1', velocity: 70 },
    { name: 'Sprint 2', velocity: 75 },
    { name: 'Sprint 3', velocity: 68 },
    { name: 'Sprint 4', velocity: 72 },
    { name: 'Sprint 5', velocity: 74 },
    { name: sprint.name, velocity: sprint.velocity },
  ]

  const averageVelocity =
    historicalData.slice(0, -1).reduce((sum, s) => sum + s.velocity, 0) / (historicalData.length - 1)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Planned Velocity</p>
          <p className="text-3xl font-bold text-gray-900">{sprint.capacity}</p>
          <p className="text-xs text-gray-500 mt-1">Story points</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Actual Velocity</p>
          <p className="text-3xl font-bold text-gray-900">{sprint.velocity}</p>
          <p className="text-xs text-gray-500 mt-1">Story points completed</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Historical Average</p>
          <p className="text-3xl font-bold text-gray-900">{Math.round(averageVelocity)}</p>
          <p className="text-xs text-gray-500 mt-1">Last 5 sprints</p>
        </Card>
      </div>

      <VelocityChart
        data={historicalData.map((s) => ({
          name: s.name,
          planned: sprint.capacity,
          actual: s.velocity,
        }))}
        loading={false}
      />
    </div>
  )
}

// Retrospective Tab Component
function RetrospectiveTab({ sprintId }) {
  const { data: sprint } = useSprint(sprintId)
  const { isAdmin, isManager } = useRole()
  const saveRetrospective = useSaveRetrospective()
  const updateActionItem = useUpdateActionItem()
  const [showPastRetrospectives, setShowPastRetrospectives] = useState(false)

  const canEdit = isAdmin || isManager
  const retrospective = sprint?.retrospective || {}
  const projectId = sprint?.project?._id || sprint?.project

  const { data: pastRetrospectives } = usePastRetrospectives(projectId, { limit: 5 })

  const [whatWentWell, setWhatWentWell] = useState([])
  const [whatDidntGoWell, setWhatDidntGoWell] = useState([])
  const [actionItems, setActionItems] = useState([])
  const [newItemInputs, setNewItemInputs] = useState({
    whatWentWell: '',
    whatDidntGoWell: '',
    actionItem: '',
  })

  // Initialize form data from sprint retrospective
  useEffect(() => {
    if (sprint?.retrospective) {
      setWhatWentWell(sprint.retrospective.whatWentWell || [])
      setWhatDidntGoWell(sprint.retrospective.whatDidntGoWell || [])
      setActionItems(sprint.retrospective.actionItems || [])
    }
  }, [sprint])

  const addItem = (section, value) => {
    if (!value.trim()) return

    if (section === 'whatWentWell') {
      setWhatWentWell([...whatWentWell, value.trim()])
      setNewItemInputs({ ...newItemInputs, whatWentWell: '' })
    } else if (section === 'whatDidntGoWell') {
      setWhatDidntGoWell([...whatDidntGoWell, value.trim()])
      setNewItemInputs({ ...newItemInputs, whatDidntGoWell: '' })
    } else if (section === 'actionItem') {
      setActionItems([
        ...actionItems,
        {
          item: value.trim(),
          completed: false,
        },
      ])
      setNewItemInputs({ ...newItemInputs, actionItem: '' })
    }
  }

  const removeItem = (section, index) => {
    if (section === 'whatWentWell') {
      setWhatWentWell(whatWentWell.filter((_, i) => i !== index))
    } else if (section === 'whatDidntGoWell') {
      setWhatDidntGoWell(whatDidntGoWell.filter((_, i) => i !== index))
    } else if (section === 'actionItem') {
      setActionItems(actionItems.filter((_, i) => i !== index))
    }
  }

  const toggleActionItem = (itemId) => {
    if (!canEdit) return
    const item = actionItems.find((ai, idx) => idx === parseInt(itemId) || ai._id === itemId)
    if (item) {
      const itemIndex = actionItems.findIndex((ai) => ai === item)
      const updatedItems = [...actionItems]
      updatedItems[itemIndex] = {
        ...item,
        completed: !item.completed,
      }
      setActionItems(updatedItems)

      // Update on backend if item has _id
      if (item._id) {
        updateActionItem.mutate({
          id: sprintId,
          itemId: item._id,
          completed: !item.completed,
        })
      }
    }
  }

  const handleSave = () => {
    if (!canEdit) return

    const retrospectiveData = {
      whatWentWell,
      whatDidntGoWell,
      actionItems: actionItems.map((ai) => ({
        item: typeof ai === 'string' ? ai : ai.item,
        completed: typeof ai === 'string' ? false : ai.completed,
      })),
    }

    saveRetrospective.mutate({
      id: sprintId,
      data: retrospectiveData,
    })
  }

  const handleExportPDF = () => {
    // Simple PDF export using window.print() - can be enhanced with a library
    const printWindow = window.open('', '_blank')
    const currentRetrospective = {
      whatWentWell,
      whatDidntGoWell,
      actionItems,
    }
    const content = generatePDFContent(sprint, currentRetrospective)
    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
  }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: `Sprint Retrospective: ${sprint?.name}`,
        text: `View the retrospective for ${sprint?.name}`,
        url: url,
      })
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Sprint Retrospective</h3>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="primary" onClick={handleSave} loading={saveRetrospective.isPending}>
              Save Retrospective
            </Button>
          )}
          <Button variant="outline" onClick={handleExportPDF}>
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleShare}>
            Share
          </Button>
          {pastRetrospectives && pastRetrospectives.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowPastRetrospectives(!showPastRetrospectives)}
            >
              {showPastRetrospectives ? 'Hide' : 'View'} Past Retrospectives
            </Button>
          )}
        </div>
      </div>

      {/* Past Retrospectives */}
      {showPastRetrospectives && pastRetrospectives && pastRetrospectives.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Past Retrospectives</h4>
          <div className="space-y-2">
            {pastRetrospectives.map((past) => (
              <div key={past._id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{past.name}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(past.endDate).toLocaleDateString()}
                  </span>
                </div>
                {past.retrospective && (
                  <div className="text-sm text-gray-600">
                    <p>
                      What went well: {past.retrospective.whatWentWell?.length || 0} items
                    </p>
                    <p>
                      What didn't go well: {past.retrospective.whatDidntGoWell?.length || 0} items
                    </p>
                    <p>Action items: {past.retrospective.actionItems?.length || 0} items</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* What Went Well Section */}
      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-success-500 rounded-full"></span>
          What Went Well
        </h4>
        <div className="space-y-3">
          {whatWentWell.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-success-50 border border-success-200 rounded-lg"
            >
              <span className="flex-1 text-gray-900">{item}</span>
              {canEdit && (
                <button
                  onClick={() => removeItem('whatWentWell', index)}
                  className="text-gray-400 hover:text-error-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {canEdit && (
            <div className="flex gap-2">
              <Input
                value={newItemInputs.whatWentWell}
                onChange={(e) =>
                  setNewItemInputs({ ...newItemInputs, whatWentWell: e.target.value })
                }
                placeholder="Add what went well..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addItem('whatWentWell', newItemInputs.whatWentWell)
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => addItem('whatWentWell', newItemInputs.whatWentWell)}
              >
                Add
              </Button>
            </div>
          )}
          {!canEdit && whatWentWell.length === 0 && (
            <p className="text-gray-500 text-sm italic">No items added yet</p>
          )}
        </div>
      </Card>

      {/* What Didn't Go Well Section */}
      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-error-500 rounded-full"></span>
          What Didn't Go Well
        </h4>
        <div className="space-y-3">
          {whatDidntGoWell.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-error-50 border border-error-200 rounded-lg"
            >
              <span className="flex-1 text-gray-900">{item}</span>
              {canEdit && (
                <button
                  onClick={() => removeItem('whatDidntGoWell', index)}
                  className="text-gray-400 hover:text-error-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {canEdit && (
            <div className="flex gap-2">
              <Input
                value={newItemInputs.whatDidntGoWell}
                onChange={(e) =>
                  setNewItemInputs({ ...newItemInputs, whatDidntGoWell: e.target.value })
                }
                placeholder="Add what didn't go well..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addItem('whatDidntGoWell', newItemInputs.whatDidntGoWell)
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => addItem('whatDidntGoWell', newItemInputs.whatDidntGoWell)}
              >
                Add
              </Button>
            </div>
          )}
          {!canEdit && whatDidntGoWell.length === 0 && (
            <p className="text-gray-500 text-sm italic">No items added yet</p>
          )}
        </div>
      </Card>

      {/* Action Items Section */}
      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
          Action Items
        </h4>
        <div className="space-y-3">
          {actionItems.map((actionItem, index) => {
            const item = typeof actionItem === 'string' ? actionItem : actionItem.item
            const completed = typeof actionItem === 'string' ? false : actionItem.completed
            const itemId = actionItem._id || index

            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 border rounded-lg ${
                  completed
                    ? 'bg-gray-50 border-gray-200 opacity-75'
                    : 'bg-primary-50 border-primary-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={() => toggleActionItem(itemId)}
                  disabled={!canEdit}
                  className="mt-1 rounded border-gray-300"
                />
                <span
                  className={`flex-1 ${completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                >
                  {item}
                </span>
                {canEdit && (
                  <button
                    onClick={() => removeItem('actionItem', index)}
                    className="text-gray-400 hover:text-error-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
          {canEdit && (
            <div className="flex gap-2">
              <Input
                value={newItemInputs.actionItem}
                onChange={(e) =>
                  setNewItemInputs({ ...newItemInputs, actionItem: e.target.value })
                }
                placeholder="Add action item..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addItem('actionItem', newItemInputs.actionItem)
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => addItem('actionItem', newItemInputs.actionItem)}
              >
                Add
              </Button>
            </div>
          )}
          {!canEdit && actionItems.length === 0 && (
            <p className="text-gray-500 text-sm italic">No action items added yet</p>
          )}
        </div>
      </Card>

      {/* Info Message for Viewers */}
      {!canEdit && (
        <Card className="p-4 bg-gray-50">
          <p className="text-sm text-gray-600">
            You have view-only access. Only managers and admins can edit retrospectives.
          </p>
        </Card>
      )}
    </div>
  )
}

// Helper function to generate PDF content
function generatePDFContent(sprint, retrospective) {
  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sprint Retrospective - ${sprint?.name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1f2937; }
        h2 { color: #374151; margin-top: 20px; }
        .section { margin-bottom: 30px; }
        .item { padding: 8px; margin: 5px 0; border-left: 3px solid #e5e7eb; padding-left: 15px; }
        .success { border-left-color: #10b981; background: #f0fdf4; }
        .error { border-left-color: #ef4444; background: #fef2f2; }
        .action { border-left-color: #3b82f6; background: #eff6ff; }
        .completed { text-decoration: line-through; opacity: 0.7; }
      </style>
    </head>
    <body>
      <h1>Sprint Retrospective: ${sprint?.name}</h1>
      <p><strong>Sprint Period:</strong> ${formatDate(sprint?.startDate)} - ${formatDate(sprint?.endDate)}</p>
      <p><strong>Status:</strong> ${sprint?.status}</p>
      
      <div class="section">
        <h2>What Went Well</h2>
        ${(retrospective.whatWentWell || []).map((item) => `<div class="item success">${item}</div>`).join('') || '<p>No items</p>'}
      </div>
      
      <div class="section">
        <h2>What Didn't Go Well</h2>
        ${(retrospective.whatDidntGoWell || []).map((item) => `<div class="item error">${item}</div>`).join('') || '<p>No items</p>'}
      </div>
      
      <div class="section">
        <h2>Action Items</h2>
        ${(retrospective.actionItems || []).map((ai) => {
          const item = typeof ai === 'string' ? ai : ai.item
          const completed = typeof ai === 'string' ? false : ai.completed
          return `<div class="item action ${completed ? 'completed' : ''}">${completed ? '✓' : '○'} ${item}</div>`
        }).join('') || '<p>No items</p>'}
      </div>
    </body>
    </html>
  `
}

