import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  AlertTriangle,
  Lightbulb,
  GripVertical,
  X,
  Plus,
  RefreshCw,
  History,
} from 'lucide-react'
import {
  useTeamCapacityPlanning,
  useCapacityTrends,
  useRebalanceSuggestions,
  useReassignTask,
  useApplyRebalancePlan,
  useRebalanceHistory,
  useTeamAvailabilityForecast,
  useTeamAvailabilityDashboard,
  useSyncTeamCalendar,
} from '@/hooks/api/useTeams'
import { useAddCapacityAdjustment } from '@/hooks/api/useUsers'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { cn } from '@/utils'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

/**
 * Capacity Planning Page
 * Visual capacity planning and workload management for managers
 */
export default function CapacityPlanning({ teamId: propTeamId }) {
  const { id: paramTeamId } = useParams()
  const id = propTeamId || paramTeamId
  const [selectedSprintId, setSelectedSprintId] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false)
  const [adjustmentUserId, setAdjustmentUserId] = useState(null)
  const [manualTaskId, setManualTaskId] = useState('')
  const [manualTargetUserId, setManualTargetUserId] = useState('')

  const { data: capacityData, isLoading } = useTeamCapacityPlanning(id, {
    sprintId: selectedSprintId,
  })
  const { data: trends } = useCapacityTrends(id, { limit: 10 })
  const {
    data: rebalanceData,
    isLoading: isRebalanceLoading,
    refetch: refetchRebalance,
  } = useRebalanceSuggestions(id, {
    sprintId: selectedSprintId,
  })

  const applyRebalance = useApplyRebalancePlan()
  const { data: rebalanceHistory } = useRebalanceHistory(id, { limit: 5 })
  const { data: availabilityForecast = [] } = useTeamAvailabilityForecast(id, { horizon: 14 })
  const { data: availabilityDashboard } = useTeamAvailabilityDashboard(id)
  const syncCalendar = useSyncTeamCalendar()
  const [editablePlan, setEditablePlan] = useState([])
  // Get sprints for the team's projects
  // Note: This is a simplified approach - in a real app, you'd want a hook that gets sprints by team
  useEffect(() => {
    if (rebalanceData?.plan?.moves) {
      setEditablePlan(rebalanceData.plan.moves)
    } else {
      setEditablePlan([])
    }
  }, [rebalanceData])

  const sprints = []

  const reassignTask = useReassignTask()
  const addCapacityAdjustment = useAddCapacityAdjustment()

  const manualOverrideApplied = useMemo(() => {
    const originalPlan = rebalanceData?.plan?.moves || []
    if (originalPlan.length !== editablePlan.length) return true
    return JSON.stringify(originalPlan) !== JSON.stringify(editablePlan)
  }, [editablePlan, rebalanceData])

  const allMemberTasks = useMemo(() => {
    if (!capacityData?.members) return []
    return capacityData.members.flatMap((member) =>
      (member.tasks || []).map((task) => ({
        id: task.taskId || task.id,
        title: task.title,
        ownerId: member.userId,
        ownerName: member.name,
      }))
    )
  }, [capacityData?.members])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!capacityData) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No capacity data available</p>
      </div>
    )
  }

  const handleDragEnd = async (result) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    // Same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    // Extract task ID and user IDs
    const taskId = draggableId.replace('task-', '')
    const fromUserId = source.droppableId.replace('user-', '')
    const toUserId = destination.droppableId.replace('user-', '')

    if (fromUserId === toUserId) return

    // Reassign task
    await reassignTask.mutateAsync({
      teamId: id,
      taskId,
      newUserId: toUserId,
    })
  }

  const handleAddAdjustment = async (data) => {
    if (!adjustmentUserId) return

    await addCapacityAdjustment.mutateAsync({
      id: adjustmentUserId,
      data,
    })

    setIsAdjustmentModalOpen(false)
    setAdjustmentUserId(null)
  }

  const handleManualReassign = () => {
    if (!manualTaskId || !manualTargetUserId) return
    reassignTask.mutate(
      {
        teamId: id,
        taskId: manualTaskId,
        newUserId: manualTargetUserId,
      },
      {
        onSuccess: () => {
          setManualTaskId('')
          setManualTargetUserId('')
        },
      }
    )
  }

  const handlePlanDestinationChange = (index, newUserId) => {
    if (!capacityData?.members || !newUserId) return
    const member = capacityData.members.find(
      (m) => (m.userId || m._id)?.toString() === newUserId.toString()
    )
    if (!member) return
    setEditablePlan((prev) =>
      prev.map((move, idx) =>
        idx === index
          ? {
              ...move,
              to: {
                userId: member.userId || member._id,
                name: member.name,
              },
            }
          : move
      )
    )
  }

  const handleApplyRebalance = () => {
    if (!editablePlan || editablePlan.length === 0 || applyRebalance.isPending) {
      return
    }

    applyRebalance.mutate(
      {
        teamId: id,
        data: {
          plan: editablePlan,
          sprintId: selectedSprintId || rebalanceData?.capacity?.sprint?.id || null,
          manualOverride: manualOverrideApplied,
          imbalance: rebalanceData?.analysis,
        },
      },
      {
        onSuccess: () => {
          refetchRebalance()
        },
      }
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Capacity Planning</h1>
          <p className="text-gray-600 mt-1">{capacityData.teamName}</p>
        </div>
        <div className="flex items-center gap-3">
          {capacityData.sprint && (
            <Badge variant="outlined" size="lg">
              <Calendar className="w-4 h-4 mr-1" />
              {capacityData.sprint.name}
            </Badge>
          )}
          <select
            value={selectedSprintId || ''}
            onChange={(e) => setSelectedSprintId(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Current Sprint</option>
            {sprints
              .filter((s) => s.status === 'active' || s.status === 'planned')
              .map((sprint) => (
                <option key={sprint._id || sprint.id} value={sprint._id || sprint.id}>
                  {sprint.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Warnings */}
      {capacityData.warnings && (
        <div className="space-y-2">
          {capacityData.warnings.teamOverloaded && (
            <div className="p-4 bg-error-50 border border-error-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-error-900 mb-1">Team Overloaded</h4>
                <p className="text-sm text-error-700">
                  Total workload ({capacityData.totals.totalWorkload.toFixed(1)} pts) exceeds team
                  capacity ({capacityData.totals.totalCapacity.toFixed(1)} pts)
                </p>
              </div>
            </div>
          )}
          {capacityData.warnings.capacityExceeded && (
            <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-warning-900 mb-1">Sprint Commitment Exceeded</h4>
                <p className="text-sm text-warning-700">
                  Sprint commitment ({capacityData.totals.sprintCommitment} pts) exceeds team
                  capacity ({capacityData.totals.totalCapacity.toFixed(1)} pts)
                </p>
              </div>
            </div>
          )}
          {capacityData.warnings.overloadedMembers.length > 0 && (
            <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <h4 className="font-semibold text-warning-900 mb-2">Overloaded Members</h4>
              <div className="space-y-1">
                {capacityData.warnings.overloadedMembers.map((member) => (
                  <div key={member.userId} className="text-sm text-warning-700">
                    • {member.name}: {member.overload.toFixed(1)} pts over capacity
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <RebalancePanel
        analysis={rebalanceData?.analysis}
        capacity={rebalanceData?.capacity}
        plan={editablePlan}
        members={capacityData.members}
        isLoading={isRebalanceLoading}
        manualOverride={manualOverrideApplied}
        onChangeDestination={handlePlanDestinationChange}
        onRefresh={refetchRebalance}
        onApply={handleApplyRebalance}
        applying={applyRebalance.isPending}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Capacity</p>
          <p className="text-2xl font-bold text-gray-900">
            {capacityData.totals.totalCapacity.toFixed(1)} pts
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Current Workload</p>
          <p className="text-2xl font-bold text-gray-900">
            {capacityData.totals.totalWorkload.toFixed(1)} pts
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Utilization</p>
          <p className="text-2xl font-bold text-gray-900">
            {capacityData.totals.totalUtilization}%
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Available</p>
          <p className="text-2xl font-bold text-gray-900">
            {capacityData.totals.availableCapacity.toFixed(1)} pts
          </p>
        </div>
      </div>

      <AvailabilityPanel
        forecast={availabilityForecast}
        dashboard={availabilityDashboard}
        onSyncCalendar={() => syncCalendar.mutate({ teamId: id })}
        syncing={syncCalendar.isPending}
      />

      {/* AI Rebalance Suggestions */}
      {rebalanceData?.suggestions && rebalanceData.suggestions.length > 0 && (
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-primary-900">AI Rebalance Suggestions</h3>
          </div>
          <div className="space-y-3">
            {rebalanceData.suggestions.map((suggestion, idx) => (
              <div key={idx} className="p-3 bg-white rounded border border-primary-100">
                <p className="text-sm text-gray-700">{suggestion.reason || suggestion.message}</p>
                {suggestion.recommendation && (
                  <p className="text-sm text-gray-600 mt-1">{suggestion.recommendation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Capacity Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Capacity List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
          {capacityData.members.map((member) => (
            <MemberCard
              key={member.userId}
              member={member}
              onViewTasks={() => setSelectedMember(member)}
              onAdjustCapacity={() => {
                setAdjustmentUserId(member.userId)
                setIsAdjustmentModalOpen(true)
              }}
            />
          ))}
        </div>

        {/* Capacity vs Commitment Chart */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity vs Commitment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: 'Capacity',
                  value: capacityData.totals.totalCapacity,
                },
                {
                  name: 'Workload',
                  value: capacityData.totals.totalWorkload,
                },
                {
                  name: 'Commitment',
                  value: capacityData.totals.sprintCommitment,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drag and Drop Task Reassignment */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reassign Tasks</h3>
        <p className="text-sm text-gray-600 mb-4">
          Drag tasks between team members to rebalance workload
        </p>
        <div className="grid gap-3 md:grid-cols-3 mb-4">
          <div>
            <label className="text-xs uppercase text-gray-500 mb-1 block">Task</label>
            <select
              value={manualTaskId}
              onChange={(e) => setManualTaskId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select task</option>
              {allMemberTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} · {task.ownerName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase text-gray-500 mb-1 block">Assign to</label>
            <select
              value={manualTargetUserId}
              onChange={(e) => setManualTargetUserId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select member</option>
              {capacityData.members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleManualReassign}
              disabled={!manualTaskId || !manualTargetUserId}
              loading={reassignTask.isPending}
            >
              Reassign Task
            </Button>
          </div>
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capacityData.members.map((member) => (
              <Droppable key={member.userId} droppableId={`user-${member.userId}`}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'p-4 border-2 rounded-lg min-h-[200px] transition-colors',
                      snapshot.isDraggingOver
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar name={member.name} size="sm" src={member.avatar} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {member.currentWorkload.toFixed(1)} / {member.effectiveCapacity.toFixed(1)} pts
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[...member.tasks, ...member.stories].map((item, index) => (
                        <Draggable
                          key={item.id}
                          draggableId={`task-${item.id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                'p-2 bg-white border border-gray-200 rounded text-sm',
                                snapshot.isDragging && 'shadow-lg'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                                <span className="flex-1 truncate">{item.title}</span>
                                <Badge size="sm" variant="outlined">
                                  {item.storyPoints || 0} pts
                                </Badge>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Historical Trends */}
      {trends && trends.length > 0 && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Historical Capacity Utilization
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sprintName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="utilization"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Utilization %"
              />
              <Line
                type="monotone"
                dataKey="committed"
                stroke="#9ca3af"
                strokeWidth={2}
                name="Committed"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                strokeWidth={2}
                name="Completed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {rebalanceHistory && rebalanceHistory.length > 0 && (
        <RebalanceHistory history={rebalanceHistory} />
      )}

      {/* Member Tasks Modal */}
      {selectedMember && (
        <MemberTasksModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* Capacity Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <CapacityAdjustmentModal
          userId={adjustmentUserId}
          onClose={() => {
            setIsAdjustmentModalOpen(false)
            setAdjustmentUserId(null)
          }}
          onSave={handleAddAdjustment}
        />
      )}
    </div>
  )
}

function RebalancePanel({
  analysis,
  capacity,
  plan,
  members,
  isLoading,
  manualOverride,
  onChangeDestination,
  onRefresh,
  onApply,
  applying,
}) {
  if (!isLoading && !analysis) {
    return null
  }

  const hasPlan = plan && plan.length > 0
  const totalPoints = hasPlan
    ? plan.reduce((sum, move) => sum + (move.pointsMoved || 0), 0).toFixed(1)
    : '0.0'
  const memberOptions =
    members?.map((member) => ({
      value: (member.userId || member._id || '').toString(),
      label: member.name,
    })) || []

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Automatic Workload Rebalancing</h3>
          <p className="text-sm text-gray-600">
            Detects overloaded members, suggests moves, and lets you preview adjustments before
            applying.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outlined" size="sm" onClick={onRefresh} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onApply}
            disabled={!hasPlan || applying}
          >
            {applying ? 'Applying...' : 'Apply Rebalance'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Analyzing workload imbalance...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Overloaded</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analysis?.overloadedMembers?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Underutilized</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analysis?.underutilizedMembers?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Points To Rebalance</p>
              <p className="text-2xl font-semibold text-gray-900">{totalPoints}</p>
            </div>
          </div>

          {manualOverride && (
            <p className="text-xs text-warning-700">
              Manual overrides detected. Review destinations before applying.
            </p>
          )}

          {hasPlan ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 uppercase text-xs tracking-wide">
                    <th className="py-2 pr-4">Task</th>
                    <th className="py-2 pr-4">From</th>
                    <th className="py-2 pr-4">To (override)</th>
                    <th className="py-2 pr-4">Points</th>
                    <th className="py-2 pr-4">Impact Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((move, index) => (
                    <tr key={`${move.taskId}-${index}`} className="border-t border-gray-100">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">{move.taskTitle}</p>
                        <p className="text-xs text-gray-500">
                          {move.storyId ? `Story ${move.storyId}` : 'Task'}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium text-gray-900">{move.from?.name}</p>
                        <p className="text-xs text-gray-500">Currently assigned</p>
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          value={move.to?.userId || ''}
                          onChange={(e) => onChangeDestination(index, e.target.value)}
                        >
                          {memberOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{move.pointsMoved || 0}</td>
                      <td className="py-3 pr-4 text-xs text-gray-600">
                        <div>
                          From {move.impact?.fromBefore ?? '--'}% → {move.impact?.fromAfter ?? '--'}%
                        </div>
                        <div>
                          To {move.impact?.toBefore ?? '--'}% → {move.impact?.toAfter ?? '--'}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No rebalance moves suggested at this time.</p>
          )}
        </>
      )}
    </div>
  )
}

function RebalanceHistory({ history }) {
  if (!history || history.length === 0) {
    return null
  }

  const getBadgeVariant = (status) => {
    if (status === 'applied') return 'success'
    if (status === 'partial') return 'warning'
    return 'error'
  }

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
      <div className="flex items-center gap-2">
        <History className="w-5 h-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900">Rebalancing History</h3>
      </div>
      <div className="space-y-3">
        {history.map((entry) => (
          <div
            key={entry._id}
            className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between border border-gray-100 rounded p-3"
          >
            <div>
              <p className="font-medium text-gray-900">
                {typeof entry.summary?.totalPointsMoved === 'number'
                  ? entry.summary.totalPointsMoved.toFixed(1)
                  : Number(entry.summary?.totalPointsMoved || 0).toFixed(1)}{' '}
                pts moved · {entry.summary?.totalMoves || 0} task(s)
              </p>
              <p className="text-xs text-gray-500">
                {entry.triggeredBy?.name || 'System'} ·{' '}
                {new Date(entry.appliedAt || entry.createdAt).toLocaleString()}
              </p>
              {entry.summary?.manualOverride && (
                <p className="text-xs text-warning-700">Manual overrides were applied.</p>
              )}
            </div>
            <Badge variant={getBadgeVariant(entry.status)}>{entry.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

function AvailabilityPanel({ forecast, dashboard, onSyncCalendar, syncing }) {
  const chartData = (forecast || []).map((entry) => ({
    date:
      entry.dateLabel ||
      entry.date ||
      new Date(entry.timestamp || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    available: entry.availableCapacity || entry.availableHours || 0,
    workload: entry.bookedCapacity || entry.workload || entry.bookedHours || 0,
  }))

  const upcomingTimeOff = dashboard?.timeOff || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Availability Forecast</h3>
          <Button variant="ghost" size="sm" onClick={onSyncCalendar} loading={syncing}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Calendar
          </Button>
        </div>
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-500">No availability data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="available" stroke="#10b981" name="Available" strokeWidth={2} />
              <Line type="monotone" dataKey="workload" stroke="#ef4444" name="Booked" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Availability</h3>
        {upcomingTimeOff.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming time off.</p>
        ) : (
          <div className="space-y-3 max-h-[260px] overflow-y-auto">
            {upcomingTimeOff.map((event) => (
              <div key={`${event.userId}-${event.start}`} className="border border-gray-100 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">{event.userName}</p>
                <p className="text-xs text-gray-500">
                  {new Date(event.start).toLocaleDateString()} - {new Date(event.end).toLocaleDateString()} •{' '}
                  {event.type || 'Time off'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Member Card Component
function MemberCard({ member, onViewTasks, onAdjustCapacity }) {
  const getUtilizationColor = (utilization) => {
    if (utilization >= 100) return 'bg-error-500'
    if (utilization >= 90) return 'bg-error-400'
    if (utilization >= 70) return 'bg-warning-500'
    return 'bg-success-500'
  }

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar name={member.name} size="md" src={member.avatar} />
          <div>
            <h4 className="font-semibold text-gray-900">{member.name}</h4>
            <p className="text-xs text-gray-600">{member.email}</p>
          </div>
        </div>
        {member.isOverloaded && (
          <Badge variant="error" size="sm">
            Overloaded
          </Badge>
        )}
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Capacity</span>
          <span className="font-medium text-gray-900">
            {member.effectiveCapacity.toFixed(1)} pts
            {member.baseCapacity !== member.effectiveCapacity && (
              <span className="text-gray-500 text-xs ml-1">
                (base: {member.baseCapacity.toFixed(1)})
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Workload</span>
          <span className="font-medium text-gray-900">
            {member.currentWorkload.toFixed(1)} pts
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Utilization</span>
          <span className="font-medium text-gray-900">{member.utilization}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn('h-2 rounded-full transition-all', getUtilizationColor(member.utilization))}
            style={{ width: `${Math.min(member.utilization, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outlined" size="sm" onClick={onViewTasks} className="flex-1">
          View Tasks ({member.taskCount + member.storyCount})
        </Button>
        <Button variant="outlined" size="sm" onClick={onAdjustCapacity}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// Member Tasks Modal
function MemberTasksModal({ member, onClose }) {
  return (
    <Modal isOpen={!!member} onClose={onClose} title={`${member?.name}'s Tasks`}>
      <div className="space-y-3">
        {member?.tasks?.map((task) => (
          <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{task.title}</span>
              <Badge size="sm" variant="outlined">
                {task.storyPoints} pts
              </Badge>
            </div>
            {task.story && (
              <p className="text-xs text-gray-600 mt-1">
                Story: {task.story.title || task.story.storyId}
              </p>
            )}
          </div>
        ))}
        {member?.stories?.map((story) => (
          <div key={story.id} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{story.title}</span>
              <Badge size="sm" variant="outlined">
                {story.storyPoints} pts
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">Story ID: {story.storyId}</p>
          </div>
        ))}
        {(!member?.tasks?.length && !member?.stories?.length) && (
          <p className="text-gray-600 text-center py-4">No tasks assigned</p>
        )}
      </div>
    </Modal>
  )
}

// Capacity Adjustment Modal
function CapacityAdjustmentModal({ userId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    type: 'vacation',
    reason: '',
    startDate: '',
    endDate: '',
    adjustedCapacity: 0,
  })

  useEffect(() => {
    if (!userId) {
      setFormData({
        type: 'vacation',
        reason: '',
        startDate: '',
        endDate: '',
        adjustedCapacity: 0,
      })
    }
  }, [userId])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Modal isOpen={!!userId} onClose={onClose} title="Add Capacity Adjustment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="vacation">Vacation</option>
            <option value="sick">Sick Leave</option>
            <option value="training">Training</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <Input
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Optional reason"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adjusted Capacity (0 = unavailable)
          </label>
          <Input
            type="number"
            min="0"
            value={formData.adjustedCapacity}
            onChange={(e) =>
              setFormData({ ...formData, adjustedCapacity: parseFloat(e.target.value) || 0 })
            }
            placeholder="0"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}

