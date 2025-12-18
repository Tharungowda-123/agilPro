import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { X, Edit, Save, Check, Plus, Link2, Sparkles } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Select from '@/components/ui/Select'
import FormGroup from '@/components/ui/FormGroup'
import RichTextEditor from '@/components/editor/RichTextEditor'
import ThreadedCommentsSection from '@/components/comments/ThreadedCommentsSection'
import AssigneeSelector from './AssigneeSelector'
import StatusSelector from './StatusSelector'
import PrioritySelector from './PrioritySelector'
import AttachmentSection from '@/components/attachments/AttachmentSection'
import {
  useStory,
  useUpdateStory,
  useAnalyzeStory,
  useEstimateComplexity,
  useSimilarStories,
} from '@/hooks/api/useStories'
import { useTasks, useCreateTask, useUpdateTask } from '@/hooks/api/useTasks'
import { useUsers } from '@/hooks/api/useUsers'
import { useSprints } from '@/hooks/api/useSprints'
import { useAuthStore } from '@/stores/useAuthStore'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/layout/EmptyState'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { taskService } from '@/services/api'
import TaskDetailModal from './TaskDetailModal'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

/**
 * StoryDetailModal Component
 * Full-screen modal displaying story details with tabs
 * 
 * @example
 * <StoryDetailModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   storyId="1"
 * />
 */
export default function StoryDetailModal({ isOpen, onClose, storyId, className = '' }) {
  const [activeTab, setActiveTab] = useState('details')
  const [isEditMode, setIsEditMode] = useState(false)
  const [localStory, setLocalStory] = useState(null)
  const [acceptanceCriteria, setAcceptanceCriteria] = useState([])
  const [selectedTaskId, setSelectedTaskId] = useState(null)

  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const { data: story, isLoading } = useStory(storyId)
  const { data: tasksData } = useTasks(storyId)
  const { data: usersData } = useUsers()
  const projectId = story?.project?._id || story?.project || story?.projectId
  
  // Normalize users to always be an array
  // useUsers returns { data: [...], pagination: {...} }
  const users = Array.isArray(usersData) 
    ? usersData 
    : Array.isArray(usersData?.data) 
    ? usersData.data 
    : []
  const { data: sprints } = useSprints(projectId)
  const { data: similarStories = [], isLoading: similarStoriesLoading } = useSimilarStories(storyId)
  const updateStory = useUpdateStory()
  const analyzeStoryMutation = useAnalyzeStory()
  const estimateStoryPointsMutation = useEstimateComplexity()
  const updateTask = useUpdateTask()
  
  // Fetch comments from backend

  const tasks = tasksData || []

  useEffect(() => {
    if (story) {
      setLocalStory(story)
      setAcceptanceCriteria(story.acceptanceCriteria || [])
    }
  }, [story])

  const handleSave = () => {
    if (!localStory) return

    // Extract IDs from populated objects to avoid validation errors
    // Backend expects ObjectId strings, not populated objects
    const updateData = {
      title: localStory.title,
      description: localStory.description,
      status: localStory.status,
      priority: localStory.priority,
      storyPoints: localStory.storyPoints,
      acceptanceCriteria: acceptanceCriteria,
      // Extract IDs from populated objects
      feature: localStory.feature
        ? (localStory.feature._id || localStory.feature.id || localStory.feature)
        : localStory.featureId || null,
      sprint: localStory.sprint
        ? (localStory.sprint._id || localStory.sprint.id || localStory.sprint)
        : localStory.sprintId || null,
      assignedTo: localStory.assignedTo
        ? (localStory.assignedTo._id || localStory.assignedTo.id || localStory.assignedTo)
        : localStory.assignedToId || null,
      // Don't send populated fields that shouldn't be updated
      // Exclude: _id, project, createdBy, tasks, dependencies, attachments, createdAt, updatedAt, __v, aiInsights
    }

    updateStory.mutate(
      {
        id: storyId,
        data: updateData,
      },
      {
        onSuccess: () => {
          setIsEditMode(false)
          // The useUpdateStory hook will handle cache invalidation
          // Story will automatically move to correct column on board
          toast.success('Story updated!')
        },
      }
    )
  }

  const handleRunAnalysis = () => {
    if (!storyId) return
    analyzeStoryMutation.mutate(storyId)
  }

  const handleEstimatePoints = () => {
    if (!storyId) return
    estimateStoryPointsMutation.mutate(storyId)
  }

  const handleAddCriterion = () => {
    setAcceptanceCriteria([...acceptanceCriteria, { id: Date.now().toString(), text: '', checked: false }])
  }

  const handleRemoveCriterion = (id) => {
    setAcceptanceCriteria(acceptanceCriteria.filter((c) => c.id !== id))
  }

  const handleToggleCriterion = (id) => {
    setAcceptanceCriteria(
      acceptanceCriteria.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
    )
  }

  const handleTaskStatusToggle = async (taskId, newStatus, task) => {
    try {
      // If marking as done, use completeTask endpoint
      if (newStatus === 'done') {
        await taskService.completeTask(taskId, { actualHours: task.actualHours })
        toast.success('Task completed! 🎉')
      } else {
        // Otherwise, use regular update
        updateTask.mutate(
          {
            id: taskId,
            data: { status: newStatus },
          },
          {
            onSuccess: () => {
              toast.success('Task status updated!')
            },
          }
        )
        return // Early return since mutation handles its own success
      }
      
      // Invalidate queries to refresh data everywhere
      queryClient.invalidateQueries({ queryKey: ['tasks', storyId] })
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'deadlines'] })
      queryClient.invalidateQueries({ queryKey: ['story', storyId] })
      queryClient.invalidateQueries({ queryKey: ['stories'], exact: false })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task status')
    }
  }

  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const totalTasks = tasks.length

  const aiInsights = story?.aiInsights || null
  const breakdown = aiInsights?.complexityBreakdown || {}
  const complexityData = aiInsights
    ? [
        { subject: 'UI', value: breakdown.ui ?? 0, fullMark: 10 },
        { subject: 'Backend', value: breakdown.backend ?? 0, fullMark: 10 },
        { subject: 'Integration', value: breakdown.integration ?? 0, fullMark: 10 },
        { subject: 'Testing', value: breakdown.testing ?? 0, fullMark: 10 },
      ]
    : []

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <div className="flex items-center justify-center h-screen">
          <Spinner size="lg" color="primary" />
        </div>
      </Modal>
    )
  }

  if (!story || !localStory) {
    return null
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Badge variant="outlined" size="md" className="font-mono">
              {story.id}
            </Badge>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Story' : 'Story Details'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isEditMode ? (
              <>
                <Button variant="outlined" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} loading={updateStory.isPending}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outlined" onClick={() => setIsEditMode(true)} leftIcon={<Edit className="w-4 h-4" />}>
                Edit
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
        {[
          { id: 'details', label: 'Details' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'comments', label: 'Comments' },
          { id: 'attachments', label: 'Attachments' },
          { id: 'activity', label: 'Activity' },
          { id: 'insights', label: 'AI Insights' },
          { id: 'related', label: 'Related' },
        ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <DetailsTab
              story={localStory}
              setStory={setLocalStory}
              isEditMode={isEditMode}
              acceptanceCriteria={acceptanceCriteria}
              onAddCriterion={handleAddCriterion}
              onRemoveCriterion={handleRemoveCriterion}
              onToggleCriterion={handleToggleCriterion}
              users={users || []}
              sprints={sprints || []}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksTab
              storyId={storyId}
              tasks={tasks}
              completedTasks={completedTasks}
              totalTasks={totalTasks}
              onTaskClick={(taskId) => setSelectedTaskId(taskId)}
              onTaskStatusToggle={handleTaskStatusToggle}
            />
          )}

          {activeTab === 'comments' && (
            <ThreadedCommentsSection
              entityType="story"
              entityId={storyId}
              users={users || []}
              enableShortcuts
            />
          )}

          {activeTab === 'attachments' && (
            <AttachmentSection
              attachments={story?.attachments || []}
              entityType="story"
              entityId={storyId}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityTab storyId={storyId} />
          )}

          {activeTab === 'insights' && (
            <AIInsightsTab
              insights={aiInsights}
              complexityData={complexityData}
              onAnalyze={handleRunAnalysis}
              onEstimate={handleEstimatePoints}
              isAnalyzing={analyzeStoryMutation.isPending}
              isEstimating={estimateStoryPointsMutation.isPending}
            />
          )}
          {activeTab === 'related' && (
            <RelatedStoriesTab
              story={story}
              similarStories={similarStories}
              loading={similarStoriesLoading}
              onNavigate={onClose}
            />
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          taskId={selectedTaskId}
        />
      )}
    </Modal>
  )
}

// Details Tab Component
function DetailsTab({
  story,
  setStory,
  isEditMode,
  acceptanceCriteria,
  onAddCriterion,
  onRemoveCriterion,
  onToggleCriterion,
  users,
  sprints,
}) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <FormGroup label="Title" required>
        {isEditMode ? (
          <Input
            value={story.title}
            onChange={(e) => setStory({ ...story, title: e.target.value })}
          />
        ) : (
          <h3 className="text-2xl font-bold text-gray-900">{story.title}</h3>
        )}
      </FormGroup>

      {/* Metadata Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <FormGroup label="Status" required>
          {isEditMode ? (
            <StatusSelector
              value={story?.status || 'backlog'}
              onChange={(value) => setStory({ ...story, status: value })}
            />
          ) : (
            <Badge
              variant={
                story?.status === 'done'
                  ? 'success'
                  : story?.status === 'in-progress' || story?.status === 'in_progress'
                  ? 'warning'
                  : story?.status === 'review'
                  ? 'info'
                  : story?.status === 'ready'
                  ? 'primary'
                  : 'default'
              }
              size="md"
            >
              {story?.status || 'backlog'}
            </Badge>
          )}
        </FormGroup>

        <FormGroup label="Priority">
          {isEditMode ? (
            <PrioritySelector
              value={story.priority}
              onChange={(value) => setStory({ ...story, priority: value })}
            />
          ) : (
            <Badge
              variant={story.priority === 'high' ? 'error' : story.priority === 'medium' ? 'warning' : 'default'}
              size="md"
            >
              {story.priority}
            </Badge>
          )}
        </FormGroup>

        <FormGroup label="Story Points">
          {isEditMode ? (
            <Select
              options={[1, 2, 3, 5, 8, 13].map((points) => ({ value: points, label: `${points} points` }))}
              value={story.storyPoints || 1}
              onChange={(value) => setStory({ ...story, storyPoints: Number(value) })}
              placeholder="Select story points"
            />
          ) : (
            <Badge variant="outlined" size="md">
              {story.storyPoints || 0} pts
            </Badge>
          )}
        </FormGroup>

        <FormGroup label="Sprint">
          {isEditMode ? (
            <Select
              options={[
                { value: '', label: 'No Sprint' },
                ...sprints.map((sprint) => ({
                  value: sprint._id || sprint.id,
                  label: sprint.name || 'Unnamed Sprint',
                })),
              ]}
              value={story.sprintId || story.sprint?._id || story.sprint || ''}
              onChange={(value) => setStory({ ...story, sprintId: value || null })}
              placeholder="Select sprint"
            />
          ) : (
            <span className="text-sm text-gray-600">
              {sprints.find((s) => (s._id || s.id) === (story.sprintId || story.sprint?._id || story.sprint))?.name || 'No Sprint'}
            </span>
          )}
        </FormGroup>

        <FormGroup label="Assignee">
          {isEditMode ? (
            <AssigneeSelector
              value={
                story.assignedTo
                  ? (story.assignedTo._id || story.assignedTo.id || story.assignedTo)
                  : null
              }
              onChange={(value) => setStory({ ...story, assignedTo: value })}
              users={users}
            />
          ) : (
            <div className="flex items-center gap-2">
              {(() => {
                // Extract assignedTo ID - handle both object and ID formats
                const assignedToId = story.assignedTo
                  ? (story.assignedTo._id || story.assignedTo.id || story.assignedTo)
                  : null
                const assignedUser = assignedToId
                  ? users.find((u) => {
                      const userId = u._id || u.id
                      return userId && assignedToId && userId.toString() === assignedToId.toString()
                    })
                  : null

                return assignedUser ? (
                  <>
                    <Avatar
                      name={assignedUser.name || 'User'}
                      size="sm"
                      src={assignedUser.avatar}
                    />
                    <span className="text-sm text-gray-900">
                      {assignedUser.name}
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-400">Unassigned</span>
                    <span className="text-xs text-gray-500">Click "Edit" to assign this story to a team member</span>
                  </div>
                )
              })()}
            </div>
          )}
        </FormGroup>
      </div>

      {/* Description */}
      <FormGroup label="Description">
        {isEditMode ? (
          <RichTextEditor
            value={story.description || ''}
            onChange={(html) => setStory({ ...story, description: html })}
            placeholder="Enter story description..."
            users={users}
            minHeight="200px"
          />
        ) : (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: story.description || '<p class="text-gray-400 italic">No description</p>',
            }}
          />
        )}
      </FormGroup>

      {/* Acceptance Criteria */}
      <FormGroup label="Acceptance Criteria">
        <div className="space-y-2">
          {acceptanceCriteria.map((criterion) => (
            <div key={criterion.id} className="flex items-start gap-2">
              {isEditMode ? (
                <>
                  <input
                    type="checkbox"
                    checked={criterion.checked}
                    onChange={() => onToggleCriterion(criterion.id)}
                    className="mt-1"
                  />
                  <Input
                    value={criterion.text}
                    onChange={(e) => {
                      const updated = acceptanceCriteria.map((c) =>
                        c.id === criterion.id ? { ...c, text: e.target.value } : c
                      )
                      setAcceptanceCriteria(updated)
                    }}
                    className="flex-1"
                  />
                  <button
                    onClick={() => onRemoveCriterion(criterion.id)}
                    className="p-1 text-error-600 hover:bg-error-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="checkbox"
                    checked={criterion.checked}
                    onChange={() => onToggleCriterion(criterion.id)}
                    className="mt-1"
                    disabled={!isEditMode}
                  />
                  <span className={cn('text-sm', criterion.checked && 'line-through text-gray-400')}>
                    {criterion.text}
                  </span>
                </>
              )}
            </div>
          ))}
          {isEditMode && (
            <Button
              variant="outlined"
              size="sm"
              onClick={onAddCriterion}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Criterion
            </Button>
          )}
        </div>
      </FormGroup>

      {/* Dependencies */}
      <FormGroup label="Dependencies">
        <div className="space-y-2">
          {story.dependencies?.length > 0 ? (
            story.dependencies.map((depId) => (
              <div key={depId} className="flex items-center gap-2 text-sm">
                <Link2 className="w-4 h-4 text-gray-400" />
                <a href={`#story-${depId}`} className="text-primary-600 hover:underline">
                  Story {depId}
                </a>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">No dependencies</p>
          )}
          {isEditMode && (
            <Button variant="outlined" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Add Dependency
            </Button>
          )}
        </div>
      </FormGroup>
    </div>
  )
}

// Tasks Tab Component
function TasksTab({ storyId, tasks, completedTasks, totalTasks, onTaskClick, onTaskStatusToggle }) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [newTaskEstimatedHours, setNewTaskEstimatedHours] = useState('')
  
  const createTask = useCreateTask()

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      toast.error('Task title is required')
      return
    }

    createTask.mutate(
      {
        storyId,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        priority: newTaskPriority,
        estimatedHours: newTaskEstimatedHours ? parseFloat(newTaskEstimatedHours) : undefined,
      },
      {
        onSuccess: () => {
          setNewTaskTitle('')
          setNewTaskDescription('')
          setNewTaskPriority('medium')
          setNewTaskEstimatedHours('')
          setIsAddingTask(false)
        },
      }
    )
  }

  const handleCancelAddTask = () => {
    setNewTaskTitle('')
    setNewTaskDescription('')
    setNewTaskPriority('medium')
    setNewTaskEstimatedHours('')
    setIsAddingTask(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAddTask()
    } else if (e.key === 'Escape') {
      handleCancelAddTask()
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Tasks</h3>
          <p className="text-sm text-gray-600">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>
        {!isAddingTask && (
          <Button 
            variant="primary" 
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddingTask(true)}
          >
            Add Task
          </Button>
        )}
      </div>

      {/* Add Task Form */}
      {isAddingTask && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
          <Input
            placeholder="Task title..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <TextArea
            placeholder="Description (optional)..."
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            rows={2}
          />
          <div className="flex items-center gap-3">
            <Select
              value={newTaskPriority}
              onChange={(value) => setNewTaskPriority(value)}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
              className="w-32"
            />
            <Input
              type="number"
              placeholder="Est. hours"
              value={newTaskEstimatedHours}
              onChange={(e) => setNewTaskEstimatedHours(e.target.value)}
              className="w-32"
              min="0"
              step="0.5"
            />
            <div className="flex-1" />
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddTask}
              loading={createTask.isPending}
            >
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelAddTask}
              disabled={createTask.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {totalTasks > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all"
            style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
          />
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.length === 0 && !isAddingTask ? (
          <p className="text-center text-gray-400 py-8">No tasks yet</p>
        ) : (
          tasks.map((task) => {
            const taskId = task._id || task.id
            const assignedToName = task.assignedTo?.name || task.assignedToName || 'Unknown'
            return (
              <div
                key={taskId}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onTaskClick?.(taskId)}
              >
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  className="w-5 h-5 cursor-pointer"
                  onChange={(e) => {
                    e.stopPropagation() // Prevent opening task modal when clicking checkbox
                    const newStatus = e.target.checked ? 'done' : 'todo'
                    onTaskStatusToggle?.(taskId, newStatus, task)
                  }}
                />
                <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                    {task.estimatedHours && <span>{task.estimatedHours}h estimated</span>}
                    {task.assignedTo && (
                      <div className="flex items-center gap-1">
                        <Avatar
                          name={assignedToName}
                          size="xs"
                          src={task.assignedTo?.avatar}
                        />
                        <span>{assignedToName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Badge
                  variant={
                    task.status === 'done'
                      ? 'success'
                      : task.status === 'in-progress' || task.status === 'in_progress'
                      ? 'warning'
                      : 'default'
                  }
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {task.status === 'in_progress' ? 'in-progress' : task.status === 'todo' ? 'To Do' : task.status}
                </Badge>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// Activity Tab Component
function ActivityTab({ storyId }) {
  // Mock activity data
  const activities = [
    {
      id: '1',
      type: 'status_changed',
      user: 'John Doe',
      description: 'changed status from In Progress to Done',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      icon: '✓',
    },
    {
      id: '2',
      type: 'assigned',
      user: 'Jane Smith',
      description: 'assigned to John Doe',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      icon: '👤',
    },
    {
      id: '3',
      type: 'created',
      user: 'Jane Smith',
      description: 'created this story',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      icon: '➕',
    },
  ]

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
              {activity.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user}</span> {activity.description}
              </p>
              <p className="text-xs text-gray-500 mt-1">{formatTime(activity.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// AI Insights Tab Component
function AIInsightsTab({
  insights,
  complexityData,
  onAnalyze,
  onEstimate,
  isAnalyzing,
  isEstimating,
}) {
  if (!insights) {
    return (
      <div className="max-w-3xl mx-auto py-16">
        <EmptyState
          icon={<Sparkles className="w-14 h-14 text-primary-500" />}
          title="No AI insights yet"
          description="Let our AI assistant analyze this story to estimate complexity, story points, and highlight risks."
          action={
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={onAnalyze}
              loading={isAnalyzing}
            >
              Analyze with AI
            </Button>
          }
        />
      </div>
    )
  }

  const complexityScore = insights.complexityScore ?? insights.complexity ?? 0
  const confidencePercent = Math.round((insights.confidence ?? 0) * 100)
  const complexityLevel =
    insights.complexityLevel ||
    (complexityScore >= 7 ? 'high' : complexityScore >= 4 ? 'medium' : 'low')
  const factors = insights.factors || []
  const requirements = insights.requirements || []
  const similarStories = insights.similarStories || []
  const analyzedAt = insights.analyzedAt ? new Date(insights.analyzedAt) : null

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">AI Story Insights</p>
          <p className="text-xs text-gray-500">
            {analyzedAt ? `Last analyzed ${analyzedAt.toLocaleString()}` : 'Recently analyzed'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Sparkles className="w-4 h-4" />}
            onClick={onAnalyze}
            loading={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Re-run Analysis'}
          </Button>
          <Button variant="outlined" size="sm" onClick={onEstimate} loading={isEstimating}>
            {isEstimating ? 'Estimating...' : 'Estimate Story Points'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complexity Overview</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Overall Complexity</p>
              <p className="text-3xl font-bold text-gray-900">{complexityScore.toFixed(1)}/10</p>
            </div>
            <Badge
              variant={
                complexityLevel === 'high' ? 'error' : complexityLevel === 'medium' ? 'warning' : 'success'
              }
              size="lg"
            >
              {complexityLevel.charAt(0).toUpperCase() + complexityLevel.slice(1)}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-primary-500 h-2 rounded-full"
              style={{ width: `${(complexityScore / 10) * 100}%` }}
            />
          </div>
          {complexityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={complexityData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 10]} />
                <Radar name="Complexity" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500">No breakdown data available yet.</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimated Effort</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recommended Story Points</span>
              <Badge variant="outlined" size="md">
                {insights.estimatedPoints ?? '-'} pts
              </Badge>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Confidence</span>
                <span className="text-sm font-medium text-gray-900">{confidencePercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-success-500 h-2 rounded-full"
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
            </div>
            {insights.factors?.length > 0 && (
              <p className="text-sm text-gray-600">
                {insights.factors[0]}
                {insights.factors.length > 1 ? '...' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Complexity Factors</h3>
          {factors.length > 0 ? (
            <div className="space-y-2">
              {factors.map((factor, index) => (
                <div key={index} className="p-3 bg-primary-50 border border-primary-100 rounded-lg">
                  <p className="text-sm text-gray-700">{factor}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No additional factors identified.</p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Requirements</h3>
          {requirements.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              {requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No explicit requirements detected.</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Similar Stories</h3>
          <p className="text-xs text-gray-500">
            {(similarStories || []).length > 0
              ? 'Based on embeddings from past work'
              : 'No similar stories found'}
          </p>
        </div>
        {similarStories.length > 0 ? (
          <div className="space-y-3">
            {similarStories.map((similar, index) => (
              <div
                key={`${similar.storyId || similar.title || index}-${index}`}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {similar.title || similar.storyKey || 'Similar Story'}
                  </p>
                  {similar.storyKey && (
                    <p className="text-xs text-gray-500">ID: {similar.storyKey}</p>
                  )}
                  {similar.actualTime && (
                    <p className="text-xs text-gray-500">Actual time: {similar.actualTime}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {similar.actualPoints && (
                    <Badge variant="outlined" size="sm">
                      {similar.actualPoints} pts
                    </Badge>
                  )}
                  <Badge variant="default" size="sm">
                    {Math.round((similar.similarity ?? 0) * 100)}% match
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No similar work detected yet.</p>
        )}
      </div>
    </div>
  )
}

function RelatedStoriesTab({ story, similarStories, loading, onNavigate }) {
  const navigate = useNavigate()

  const handleOpenStory = (projectId, storyId) => {
    if (!projectId || !storyId) return
    navigate(`/projects/${projectId}?storyId=${storyId}`, { replace: false })
    if (onNavigate) onNavigate()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Similar Stories</h3>
            <p className="text-sm text-muted-foreground">AI recommended references from past work</p>
          </div>
          {loading && <Spinner size="sm" />}
        </div>
        {!loading && (!similarStories || similarStories.length === 0) ? (
          <EmptyState
            title="No similar stories found"
            description="Run AI analysis or update the story description to find comparable work."
            variant="ghost"
          />
        ) : (
          <div className="space-y-3">
            {similarStories?.map((item) => (
              <button
                key={item.storyId || item.id}
                type="button"
                onClick={() => handleOpenStory(item.projectId || story.project?._id || story.projectId, item.storyId || item.id)}
                className="w-full text-left border border-border rounded-lg p-4 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.title || item.storyKey || 'Referenced Story'}</p>
                    {item.projectName && <p className="text-xs text-muted-foreground">{item.projectName}</p>}
                  </div>
                  {item.similarity && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {(item.similarity * 100).toFixed(0)}% match
                    </Badge>
                  )}
                </div>
                {item.summary && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.summary}</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Dependencies</h3>
            <p className="text-sm text-muted-foreground">Stories that block or are blocked by this work item</p>
          </div>
          <Badge variant="outline">{story?.dependencies?.length || 0}</Badge>
        </div>
        {story?.dependencies?.length ? (
          <div className="space-y-3">
            {story.dependencies.map((dependency) => (
              <div
                key={dependency._id || dependency.id}
                className="flex items-center justify-between border border-border rounded-lg p-3"
              >
                <div>
                  <p className="font-medium">{dependency.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {dependency.storyId || dependency.displayId} · {dependency.status}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleOpenStory(
                      dependency.project || story.project?._id || story.projectId,
                      dependency._id || dependency.id
                    )
                  }
                >
                  Open
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No dependencies linked yet"
            description="Use the dependencies tab to capture upstream/downstream relationships."
            variant="ghost"
          />
        )}
      </div>
    </div>
  )
}

StoryDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  storyId: PropTypes.string.isRequired,
  className: PropTypes.string,
}

