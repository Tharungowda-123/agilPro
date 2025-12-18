import { useState, useEffect } from 'react'
import { Eye, MessageSquare, TrendingUp } from 'lucide-react'
import { useDeveloperWorkload, useHistoricalWorkload } from '@/hooks/api/useUsers'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import WorkloadMeter from './WorkloadMeter'
import WorkloadBreakdown from './WorkloadBreakdown'
import CapacityForecast from './CapacityForecast'
import HistoricalWorkload from './HistoricalWorkload'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { useNavigate } from 'react-router-dom'

/**
 * Workload Widget Component
 * Main component for developer workload visualization
 */
export default function WorkloadWidget({ sprintId = null }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDetails, setShowDetails] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestType, setRequestType] = useState(null) // 'help' or 'more'

  const userId = user?._id || user?.id
  const { data: workload, isLoading } = useDeveloperWorkload(userId, { sprintId })
  const { data: history } = useHistoricalWorkload(userId, { limit: 8 })

  // Auto-refresh workload when tasks/stories change
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['user', userId, 'workload'] })
    }, 30 * 1000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [userId, queryClient])

  const handleRequestHelp = () => {
    setRequestType('help')
    setShowRequestModal(true)
  }

  const handleRequestMoreTasks = () => {
    setRequestType('more')
    setShowRequestModal(true)
  }

  const normalizeId = (value) => {
    if (!value) return null
    if (typeof value === 'string') return value
    if (typeof value === 'object') {
      if (typeof value._id === 'string') return value._id
      if (value._id?.toString) return value._id.toString()
      if (typeof value.id === 'string') return value.id
      if (value.id?.toString) return value.id.toString()
      if (value.toString && value.toString() !== '[object Object]') return value.toString()
    }
    return null
  }

  const buildBoardUrl = ({ projectId, storyId, taskId }) => {
    const params = new URLSearchParams()
    if (projectId) params.set('projectId', projectId)
    if (storyId) params.set('storyId', storyId)
    if (taskId) params.set('taskId', taskId)
    const search = params.toString()
    return search ? `/board?${search}` : '/board'
  }

  const handleTaskClick = (item) => {
    if (!item) return
    const relatedStory = item.story || item
    const storyId = normalizeId(relatedStory)
    const projectRef = relatedStory?.project || item.project
    const projectId = normalizeId(projectRef)
    const isActualTask = !!item.story
    const taskId = isActualTask ? normalizeId(item) : null

    const targetUrl = buildBoardUrl({ projectId, storyId, taskId })
    navigate(targetUrl)
  }

  const handleViewAllTasks = () => {
    // Navigate to board or tasks view
    navigate('/board')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" color="primary" />
      </div>
    )
  }

  if (!workload) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-500">No workload data available</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Workload Meter */}
        <WorkloadMeter
          workload={workload}
          onRequestHelp={handleRequestHelp}
          onRequestMoreTasks={handleRequestMoreTasks}
        />

        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outlined"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          {workload.tasks && workload.tasks.length > 0 && (
            <Button
              variant="outlined"
              size="sm"
              onClick={handleViewAllTasks}
            >
              View All Tasks ({workload.tasks.length + (workload.stories?.length || 0)})
            </Button>
          )}
        </div>

        {/* Detailed View */}
        {showDetails && (
          <div className="space-y-4">
            {/* Breakdown */}
          <WorkloadBreakdown workload={workload} />

            {/* Capacity Forecast */}
            <CapacityForecast workload={workload} onTaskClick={handleTaskClick} />

            {/* Historical Workload */}
            <HistoricalWorkload history={history || []} currentWorkload={workload} />
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <RequestModal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false)
            setRequestType(null)
          }}
          type={requestType}
          workload={workload}
        />
      )}
    </>
  )
}

// Request Modal Component
function RequestModal({ isOpen, onClose, type, workload }) {
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    // In a real app, this would send a notification to the manager
    // For now, we'll just show a success message
    alert(
      type === 'help'
        ? 'Your request for help has been sent to your manager.'
        : 'Your request for more tasks has been sent to your manager.'
    )
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'help' ? 'Request Help' : 'Request More Tasks'}>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-700 mb-2">
            {type === 'help' ? (
              <>
                You're currently overloaded with <strong>{workload?.assignedPoints?.toFixed(1)} points</strong>{' '}
                assigned but your capacity is only <strong>{workload?.capacity?.toFixed(1)} points</strong>.
                Send a message to your manager requesting assistance.
              </>
            ) : (
              <>
                You have <strong>{workload?.availablePoints?.toFixed(1)} points</strong> available capacity.
                Request more tasks from your manager.
              </>
            )}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={4}
            placeholder={
              type === 'help'
                ? 'Explain what help you need or which tasks you need assistance with...'
                : 'Specify what type of tasks you\'d like to work on...'
            }
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Send Request
          </Button>
        </div>
      </div>
    </Modal>
  )
}

