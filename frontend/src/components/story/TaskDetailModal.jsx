import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { X, Edit, Save, Plus, Clock, Play, Pause, Square } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import RichTextEditor from '@/components/editor/RichTextEditor'
import FormGroup from '@/components/ui/FormGroup'
import Avatar from '@/components/ui/Avatar'
import ThreadedCommentsSection from '@/components/comments/ThreadedCommentsSection'
import AssigneeSelector from './AssigneeSelector'
import StatusSelector from './StatusSelector'
import PrioritySelector from './PrioritySelector'
import {
  useTask,
  useUpdateTask,
  useTaskRecommendations,
  useAssignTask,
  useSubmitTaskFeedback,
} from '@/hooks/api/useTasks'
import { taskService } from '@/services/api'
import { useUsers } from '@/hooks/api/useUsers'
import { useTimeEntriesForTask } from '@/hooks/api/useTimeEntries'
import { useAuthStore } from '@/stores/useAuthStore'
import { useQueryClient } from '@tanstack/react-query'
import TimerWidget from '@/components/timeTracking/TimerWidget'
import ManualTimeEntry from '@/components/timeTracking/ManualTimeEntry'
import TimeEntryList from '@/components/timeTracking/TimeEntryList'
import AttachmentSection from '@/components/attachments/AttachmentSection'
import Spinner from '@/components/ui/Spinner'
import TaskAssignmentCard from '@/components/ai/TaskAssignmentCard'
import Card from '@/components/ui/Card'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import TaskDependenciesTab from '@/components/tasks/TaskDependenciesTab'
import TaskCommitsTab from '@/components/tasks/TaskCommitsTab'

/**
 * TaskDetailModal Component
 * Modal displaying task details with tabs
 * 
 * @example
 * <TaskDetailModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   taskId="1"
 * />
 */
export default function TaskDetailModal({ isOpen, onClose, taskId, className = '' }) {
  const [activeTab, setActiveTab] = useState('details')
  const [isEditMode, setIsEditMode] = useState(false)
  const [localTask, setLocalTask] = useState(null)
  const [feedbackPrompt, setFeedbackPrompt] = useState(null)
  const [feedbackNotes, setFeedbackNotes] = useState('')

  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const { data: task, isLoading } = useTask(taskId)
  const { data: usersData } = useUsers()
  const rawUsers = Array.isArray(usersData) ? usersData : usersData?.data || usersData || []
  // Normalize users to have consistent id field
  const users = rawUsers.map((u) => ({
    ...u,
    id: u._id || u.id || u,
    name: u.name || u.email || 'Unknown User',
    email: u.email || '',
    avatar: u.avatar || '',
  }))
  const updateTask = useUpdateTask()
  const { data: timeEntriesData } = useTimeEntriesForTask(taskId)
  const { data: recommendationsData, isFetching: recommendationsLoading } = useTaskRecommendations(taskId)
  const assignTask = useAssignTask()
  const submitTaskFeedback = useSubmitTaskFeedback()
  
  // Fetch comments from backend
  
  const timeEntries = timeEntriesData?.data || timeEntriesData || []
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0) || (task?.actualHours || 0)
  const rawRecommendations =
    (Array.isArray(recommendationsData) && recommendationsData) ||
    recommendationsData?.data?.recommendations ||
    recommendationsData?.recommendations ||
    []
  
  // Normalize recommendations to ensure user names are properly extracted
  const recommendations = rawRecommendations.map((rec) => {
    // Extract userId - handle both ObjectId and string formats
    const userId = rec.userId?.toString() || 
                   rec.user?._id?.toString() || 
                   rec.user?.id?.toString() || 
                   rec._id?.toString() || 
                   rec.id?.toString() || 
                   null
    
    // Extract user name - prioritize user object, then direct fields
    const userName = rec.user?.name || 
                    rec.userName || 
                    rec.name || 
                    rec.user?.email || 
                    'Unknown User'
    
    return {
      userId,
      userName,
      name: userName,
      avatar: rec.user?.avatar || rec.avatar,
      role: rec.user?.role || rec.role,
      confidence: Number(rec.confidence ?? rec.score ?? 0.5),
      skills: rec.skills || rec.user?.skills || [],
      workload: rec.workload,
      reasoning: rec.reasoning || rec.reason,
      recommendationId: rec.recommendationId || rec.id || userId,
    }
  }).filter(rec => rec.userId) // Filter out recommendations without valid userId
  const normalizedTaskSummary = {
    id: task?._id?.toString() || task?.id || taskId,
    title: task?.title,
  }

  useEffect(() => {
    if (task) {
      // Update local task state when task data changes
      setLocalTask(task)
    }
  }, [task])

  // Refetch task data when taskId changes (only if not already loading)
  useEffect(() => {
    if (taskId && !isLoading) {
      // Only mark as stale, don't force immediate refetch to avoid excessive requests
      queryClient.invalidateQueries({ 
        queryKey: ['task', taskId],
        refetchType: 'none' // Don't refetch immediately, just mark as stale
      })
    }
  }, [taskId]) // Removed queryClient and isLoading from deps to avoid unnecessary runs

  const handleSave = () => {
    if (!localTask) return

    // Prepare update data - only send fields that can be updated
    // Extract IDs from populated objects
    let dueDateValue = null
    if (localTask.dueDate) {
      // Handle date string from input (YYYY-MM-DD) or Date object
      if (typeof localTask.dueDate === 'string') {
        // If it's already an ISO string, use it; otherwise parse it
        if (localTask.dueDate.includes('T')) {
          dueDateValue = localTask.dueDate
        } else {
          // It's a date string like "2025-11-18", create date at midnight UTC
          const date = new Date(localTask.dueDate + 'T00:00:00.000Z')
          dueDateValue = date.toISOString()
        }
      } else {
        // It's a Date object
        dueDateValue = new Date(localTask.dueDate).toISOString()
      }
    }

    const updateData = {
      title: localTask.title,
      description: localTask.description,
      status: localTask.status,
      priority: localTask.priority,
      estimatedHours: localTask.estimatedHours,
      actualHours: localTask.actualHours,
      dueDate: dueDateValue,
      assignedTo: localTask.assignedTo
        ? (localTask.assignedTo._id || localTask.assignedTo.id || localTask.assignedTo)
        : null,
    }

    // If status is being changed to 'done', use completeTask endpoint for better handling
    const isCompleting = updateData.status === 'done' && task?.status !== 'done'
    
    if (isCompleting) {
      // Use completeTask endpoint which handles completion logic
      taskService.completeTask(taskId, { actualHours: updateData.actualHours })
        .then(() => {
          setIsEditMode(false)
          toast.success('Task completed successfully! 🎉')
          // Batch invalidations to reduce API calls - use refetchType: 'active' to only refetch active queries
          queryClient.invalidateQueries({ 
            queryKey: ['task', taskId],
            refetchType: 'active' // Only refetch if query is currently active
          })
          queryClient.invalidateQueries({ 
            queryKey: ['tasks'],
            exact: false,
            refetchType: 'active'
          })
          queryClient.invalidateQueries({ 
            queryKey: ['dashboard', 'stats'],
            exact: true,
            refetchType: 'active'
          })
          queryClient.invalidateQueries({ 
            queryKey: ['dashboard', 'deadlines'],
            exact: true,
            refetchType: 'active'
          })
          // Story and project queries will be updated via WebSocket, so we can skip them here
          // to reduce API calls and prevent rate limiting
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || 'Failed to complete task')
        })
    } else {
      // Regular update
      updateTask.mutate(
        {
          id: taskId,
          data: updateData,
        },
        {
          onSuccess: () => {
            setIsEditMode(false)
            toast.success('Task updated!')
            // Note: Query invalidation is already handled in useUpdateTask hook
            // No need to invalidate again here to avoid duplicate requests
          },
        }
      )
    }
  }

  const handleTimeLogged = () => {
    // Refresh task data to get updated actualHours
    queryClient.invalidateQueries({ queryKey: ['task', taskId] })
  }

  const handleAssignFromRecommendation = async (_, recommendation) => {
    if (!recommendation?.userId) {
      toast.error('Invalid user ID. Cannot assign task.')
      return
    }
    
    // Ensure userId is a string
    const userId = recommendation.userId?.toString() || recommendation.userId
    
    if (!userId) {
      toast.error('Invalid user ID. Cannot assign task.')
      return
    }
    
    assignTask.mutate(
      { id: taskId, userId },
      {
        onSuccess: () => {
          toast.success(`Assigned to ${recommendation.userName || 'user'}`)
          setFeedbackPrompt({
            recommendationId: recommendation.recommendationId || recommendation.id || userId,
            selectedAssignee: userId,
          })
          queryClient.invalidateQueries({ queryKey: ['task', taskId] })
          queryClient.invalidateQueries({ queryKey: ['task', taskId, 'recommendations'] })
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || 'Failed to assign task')
        },
      }
    )
  }

  const handleImmediateFeedback = (_, recommendation, isPositive) => {
    submitTaskFeedback.mutate({
      taskId,
      data: {
        helpful: isPositive,
        recommendationId: recommendation?.recommendationId || recommendation?.id || recommendation?.userId,
        selectedAssignee: recommendation?.userId,
        notes: '',
      },
    })
  }

  const handleFeedbackSubmit = (helpful) => {
    if (!feedbackPrompt) return
    submitTaskFeedback.mutate(
      {
        taskId,
        data: {
          helpful,
          recommendationId: feedbackPrompt.recommendationId,
          selectedAssignee: feedbackPrompt.selectedAssignee,
          notes: feedbackNotes,
        },
      },
      {
        onSuccess: () => {
          setFeedbackPrompt(null)
          setFeedbackNotes('')
          toast.success('Thanks for the feedback!')
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || 'Failed to submit feedback')
        },
      }
    )
  }


  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" color="primary" />
        </div>
      </Modal>
    )
  }

  if (!task || !localTask) {
    return null
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Badge variant="outlined" size="md" className="font-mono">
              Task {task.id}
            </Badge>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Task' : 'Task Details'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isEditMode ? (
              <>
                <Button variant="outlined" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} loading={updateTask.isPending}>
                  Save
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
              { id: 'comments', label: 'Comments' },
              { id: 'attachments', label: 'Attachments' },
              { id: 'dependencies', label: 'Dependencies' },
              { id: 'commits', label: 'Commits' },
              { id: 'activity', label: 'Activity' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm',
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
            <div className="space-y-6">
              <TaskDetailsTab
                task={localTask}
                setTask={setLocalTask}
                isEditMode={isEditMode}
                users={users || []}
                timeEntries={timeEntries}
                totalHours={totalHours}
                taskId={taskId}
                onTimeLogged={handleTimeLogged}
              />
              <TaskAISection
                task={normalizedTaskSummary}
                recommendations={recommendations}
                loading={recommendationsLoading}
                onAssign={handleAssignFromRecommendation}
                onFeedback={handleImmediateFeedback}
                pendingFeedback={feedbackPrompt}
                onSubmitFeedback={handleFeedbackSubmit}
                feedbackNotes={feedbackNotes}
                setFeedbackNotes={setFeedbackNotes}
                assignLoading={assignTask.isPending}
                feedbackLoading={submitTaskFeedback.isPending}
              />
            </div>
          )}

          {activeTab === 'comments' && (
            <ThreadedCommentsSection
              entityType="task"
              entityId={taskId}
              users={users || []}
              enableShortcuts
            />
          )}

          {activeTab === 'attachments' && (
            <AttachmentSection
              attachments={task?.attachments || []}
              entityType="task"
              entityId={taskId}
            />
          )}

          {activeTab === 'activity' && (
            <TaskActivityTab taskId={taskId} />
          )}

          {activeTab === 'dependencies' && <TaskDependenciesTab task={task} />}

          {activeTab === 'commits' && <TaskCommitsTab taskId={taskId} task={task} />}
        </div>
      </div>
    </Modal>
  )
}

// Task Details Tab
function TaskDetailsTab({
  task,
  setTask,
  isEditMode,
  users,
  timeEntries,
  totalHours,
  taskId,
  onTimeLogged,
}) {
  const [manualHours, setManualHours] = useState(0)

  return (
    <div className="space-y-6">
      {/* Title */}
      <FormGroup label="Title" required>
        {isEditMode ? (
          <Input
            value={task.title}
            onChange={(e) => setTask({ ...task, title: e.target.value })}
          />
        ) : (
          <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
        )}
      </FormGroup>

      {/* Description */}
      <FormGroup label="Description">
        {isEditMode ? (
          <RichTextEditor
            value={task.description || ''}
            onChange={(html) => setTask({ ...task, description: html })}
            placeholder="Enter task description..."
            users={users || []}
            minHeight="150px"
          />
        ) : (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: task.description || '<p class="text-gray-400 italic">No description</p>',
            }}
          />
        )}
      </FormGroup>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Status">
          {isEditMode ? (
            <StatusSelector
              value={task?.status || 'todo'}
              onChange={(value) => setTask({ ...task, status: value })}
              forTask={true}
            />
          ) : (
            <Badge
              variant={
                task.status === 'done'
                  ? 'success'
                  : task.status === 'in-progress' || task.status === 'in_progress'
                  ? 'warning'
                  : 'default'
              }
              size="md"
            >
              {task.status === 'in_progress' ? 'in-progress' : task.status === 'todo' ? 'To Do' : task.status}
            </Badge>
          )}
        </FormGroup>

        <FormGroup label="Priority">
          {isEditMode ? (
            <PrioritySelector
              value={task.priority}
              onChange={(value) => setTask({ ...task, priority: value })}
            />
          ) : (
            <Badge
              variant={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}
              size="md"
            >
              {task.priority}
            </Badge>
          )}
        </FormGroup>

        <FormGroup label="Estimated Hours">
          {isEditMode ? (
            <Input
              type="number"
              value={task.estimatedHours || 0}
              onChange={(e) => setTask({ ...task, estimatedHours: Number(e.target.value) })}
            />
          ) : (
            <span className="text-sm text-gray-900">{task.estimatedHours || 0}h</span>
          )}
        </FormGroup>

        <FormGroup label="Due Date">
          {isEditMode ? (
            <Input
              type="date"
              value={
                task.dueDate
                  ? new Date(task.dueDate).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) => {
                const dateValue = e.target.value
                // Store the date string directly (YYYY-MM-DD format)
                // We'll convert it to ISO string when saving
                setTask({
                  ...task,
                  dueDate: dateValue || null,
                })
              }}
            />
          ) : (
            <span className="text-sm text-gray-900">
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'No due date'}
            </span>
          )}
        </FormGroup>

        <FormGroup label="Assignee">
          {isEditMode ? (
            <AssigneeSelector
              value={
                task.assignedTo
                  ? (task.assignedTo._id || task.assignedTo.id || task.assignedTo)?.toString()
                  : null
              }
              onChange={(value) => {
                // Find the user object to store
                const selectedUser = value ? users.find((u) => u.id === value || u._id === value) : null
                setTask({
                  ...task,
                  assignedTo: selectedUser || value || null,
                })
              }}
              users={users}
            />
          ) : (
            <div className="flex items-center gap-2">
              {task.assignedTo ? (
                <>
                  <Avatar
                    name={users.find((u) => {
                      const userId = (u._id || u.id)?.toString()
                      const assignedId = task.assignedTo?._id?.toString() || task.assignedTo?.toString() || task.assignedTo
                      return userId && assignedId && userId === assignedId
                    })?.name || 'User'}
                    size="sm"
                  />
                  <span className="text-sm text-gray-900">
                    {users.find((u) => {
                      const userId = (u._id || u.id)?.toString()
                      const assignedId = task.assignedTo?._id?.toString() || task.assignedTo?.toString() || task.assignedTo
                      return userId && assignedId && userId === assignedId
                    })?.name || 'Unknown User'}
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-400">Unassigned</span>
              )}
            </div>
          )}
        </FormGroup>

        <FormGroup label="Parent Story">
          <a href={`#story-${task.storyId}`} className="text-primary-600 hover:underline text-sm">
            Story {task.storyId}
          </a>
        </FormGroup>
      </div>

      {/* Time Tracking */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Tracking</h3>
        <div className="space-y-4">
          {/* Timer Widget */}
          <TimerWidget taskId={taskId} onTimeLogged={onTimeLogged} />

          {/* Manual Time Entry */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Manual Entry</h4>
            <ManualTimeEntry taskId={taskId} onTimeLogged={onTimeLogged} />
          </div>

          {/* Time Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Time Logged</span>
              <span className="text-lg font-bold text-gray-900">{totalHours.toFixed(2)}h</span>
            </div>
            {task.estimatedHours && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    totalHours > task.estimatedHours ? 'bg-error-500' : 'bg-primary-500'
                  )}
                  style={{ width: `${Math.min((totalHours / task.estimatedHours) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Time Entries List */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Time Entries</h4>
            <TimeEntryList taskId={taskId} />
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskAISection({
  task,
  recommendations,
  loading,
  onAssign,
  onFeedback,
  pendingFeedback,
  onSubmitFeedback,
  feedbackNotes,
  setFeedbackNotes,
  assignLoading,
  feedbackLoading,
}) {
  const hasRecommendations = Array.isArray(recommendations) && recommendations.length > 0

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Assignment Recommendations</h3>
            <p className="text-sm text-gray-500">Capacity-aware suggestions for this task.</p>
          </div>
          {loading && <Spinner size="sm" />}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner size="md" color="primary" />
          </div>
        ) : hasRecommendations ? (
          <TaskAssignmentCard
            task={task}
            recommendations={recommendations}
            onAssign={onAssign}
            onFeedback={onFeedback}
          />
        ) : (
          <p className="text-sm text-gray-500">
            No AI suggestions yet. Ensure the project has a team assigned and refresh.
          </p>
        )}
      </Card>

      {pendingFeedback && (
        <Card className="p-4 border border-primary-200 bg-primary-50/60">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Was the AI suggestion helpful?</h4>
          <p className="text-xs text-gray-600 mb-3">Share quick feedback to improve future recommendations.</p>
          <TextArea
            rows={3}
            placeholder="Optional note..."
            value={feedbackNotes}
            onChange={(e) => setFeedbackNotes(e.target.value)}
          />
          <div className="flex items-center gap-3 mt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSubmitFeedback(true)}
              loading={feedbackLoading}
              disabled={assignLoading}
            >
              Helpful
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onSubmitFeedback(false)} disabled={feedbackLoading}>
              Needs improvement
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500"
              onClick={() => {
                setFeedbackNotes('')
                onSubmitFeedback(false)
              }}
            >
              Skip
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

// Task Activity Tab
function TaskActivityTab({ taskId }) {
  const activities = [
    {
      id: '1',
      type: 'status_changed',
      user: 'John Doe',
      description: 'changed status from In Progress to Done',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      icon: '✓',
    },
    {
      id: '2',
      type: 'assigned',
      user: 'Jane Smith',
      description: 'assigned to John Doe',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      icon: '👤',
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
    <div className="space-y-4">
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

TaskDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  taskId: PropTypes.string.isRequired,
  className: PropTypes.string,
}
