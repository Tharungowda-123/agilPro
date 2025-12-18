import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'
import { AlertCircle, Link2, ShieldAlert } from 'lucide-react'
import {
  useTaskDependencyGraph,
  useTaskDependencyImpact,
  useAddTaskDependency,
  useRemoveTaskDependency,
  useTasks,
} from '@/hooks/api/useTasks'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import { cn } from '@/utils'

const getNodeStyle = (node) => {
  if (node.isCurrent) {
    return 'border-primary-500 bg-primary-50'
  }
  if (node.isCritical) {
    return 'border-error-500 bg-error-50'
  }
  if (node.isBlocked) {
    return 'border-warning-500 bg-warning-50'
  }
  return 'border-gray-200 bg-white'
}

const levelSpacing = 260
const rowSpacing = 140

export default function TaskDependenciesTab({ task }) {
  const taskId = task?._id || task?.id
  const storyId = task?.story?._id || task?.story
  const [selectedDependency, setSelectedDependency] = useState('')
  const [filter, setFilter] = useState('')

  const { data: graphData, isLoading: graphLoading } = useTaskDependencyGraph(taskId)
  const { data: impactData } = useTaskDependencyImpact(taskId)
  const { data: storyTasks } = useTasks(storyId)
  const addDependency = useAddTaskDependency()
  const removeDependency = useRemoveTaskDependency()

  const groupedLevels = useMemo(() => {
    const levels = {}
    ;(graphData?.nodes || []).forEach((node) => {
      const level = node.level ?? 0
      if (!levels[level]) {
        levels[level] = []
      }
      levels[level].push(node)
    })
    return levels
  }, [graphData])

  const flowNodes = useMemo(() => {
    const nodes = []
    Object.entries(groupedLevels).forEach(([levelKey, nodesAtLevel]) => {
      const level = Number(levelKey)
      nodesAtLevel.forEach((node, index) => {
        nodes.push({
          id: node.id,
          position: { x: level * levelSpacing, y: index * rowSpacing },
          data: { label: renderNodeContent(node) },
          className: cn(
            'rounded-xl border-2 shadow-sm px-3 py-2 min-w-[180px] text-left',
            getNodeStyle(node)
          ),
        })
      })
    })
    return nodes
  }, [groupedLevels])

  const flowEdges = useMemo(() => {
    return (graphData?.edges || []).map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      animated: edge.isCritical,
      style: {
        stroke: edge.isCritical ? '#ef4444' : '#94a3b8',
        strokeWidth: edge.isCritical ? 3 : 2,
      },
    }))
  }, [graphData])

  const availableTasks = useMemo(() => {
    return (storyTasks || [])
      .filter((t) => {
        const id = t._id || t.id
        if (id === taskId) return false
        const alreadyDep = (task.dependencies || []).some(
          (dep) => (dep._id || dep.id || dep).toString() === id.toString()
        )
        if (filter && !t.title.toLowerCase().includes(filter.toLowerCase())) {
          return false
        }
        return true
      })
      .map((t) => ({ id: t._id || t.id, title: t.title, status: t.status }))
  }, [storyTasks, task, taskId, filter])

  const handleAddDependency = () => {
    if (!selectedDependency) return
    addDependency.mutate(
      { taskId, dependencyId: selectedDependency },
      {
        onSuccess: () => {
          setSelectedDependency('')
        },
      }
    )
  }

  const handleRemoveDependency = (dependencyId) => {
    removeDependency.mutate({ taskId, dependencyId })
  }

  const existingDependencies = task.dependencies || []

  if (graphLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DependencySummary stats={graphData?.stats} blockedTasks={graphData?.blockedTasks} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-gray-200 rounded-xl bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary-500" />
              Dependency Graph
            </h3>
            <Badge variant="outlined" size="sm">
              {graphData?.nodes?.length || 0} tasks
            </Badge>
          </div>
          <div className="h-[420px]">
            {flowNodes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                No dependency data available.
              </div>
            ) : (
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                fitView
                nodesConnectable={false}
                zoomOnScroll={false}
                panOnScroll
              >
                <Background gap={16} size={1} color="#f1f5f9" />
                <Controls />
                <MiniMap pannable zoomable />
              </ReactFlow>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <DependencyManager
            availableTasks={availableTasks}
            selectedDependency={selectedDependency}
            onSelect={setSelectedDependency}
            onAdd={handleAddDependency}
            filter={filter}
            onFilterChange={setFilter}
            isAdding={addDependency.isPending}
          />

          <ExistingDependencies
            dependencies={existingDependencies}
            onRemove={handleRemoveDependency}
            isRemoving={removeDependency.isPending}
          />
        </div>
      </div>

      <ImpactPanel impact={impactData} />
    </div>
  )
}

function renderNodeContent(node) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-900 truncate">{node.label}</p>
      <p className="text-xs text-gray-500 capitalize">Status: {node.status || 'todo'}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {node.isCurrent && (
          <Badge size="sm" variant="primary">
            Current
          </Badge>
        )}
        {node.isCritical && (
          <Badge size="sm" variant="error">
            Critical
          </Badge>
        )}
        {node.isBlocked && (
          <Badge size="sm" variant="warning">
            Blocked
          </Badge>
        )}
      </div>
    </div>
  )
}

function DependencySummary({ stats, blockedTasks = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SummaryCard label="Total Tasks" value={stats?.totalTasks || 0} />
      <SummaryCard
        label="Blocked Tasks"
        value={stats?.blockedTasks || 0}
        description={
          blockedTasks.length > 0
            ? `${blockedTasks.length} task(s) waiting on dependencies`
            : 'No blockers detected'
        }
      />
      <SummaryCard
        label="Critical Path Length"
        value={stats?.criticalCount || 0}
        description="Tasks forming the current critical chain"
      />
    </div>
  )
}

function SummaryCard({ label, value, description }) {
  return (
    <div className="p-4 border border-gray-200 rounded-xl bg-white">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  )
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  description: PropTypes.string,
}

function DependencyManager({
  availableTasks,
  selectedDependency,
  onSelect,
  onAdd,
  filter,
  onFilterChange,
  isAdding,
}) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Add Dependency</h3>
      </div>
      <div className="p-4 space-y-3">
        <Input
          placeholder="Search tasks..."
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
        />
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={selectedDependency}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">Select task</option>
          {availableTasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title} ({task.status})
            </option>
          ))}
        </select>
        <Button
          variant="primary"
          className="w-full"
          onClick={onAdd}
          disabled={!selectedDependency}
          loading={isAdding}
        >
          Add Dependency
        </Button>
      </div>
    </div>
  )
}

function ExistingDependencies({ dependencies, onRemove, isRemoving }) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Current Dependencies</h3>
        <Badge variant="outlined" size="sm">
          {dependencies.length}
        </Badge>
      </div>
      <div className="p-4 space-y-3 max-h-[240px] overflow-y-auto">
        {dependencies.length === 0 && (
          <p className="text-xs text-gray-500">This task has no dependencies.</p>
        )}
        {dependencies.map((dep) => (
          <div
            key={dep._id || dep.id}
            className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{dep.title || dep.name}</p>
              <p className="text-xs text-gray-500 capitalize">Status: {dep.status || 'todo'}</p>
            </div>
            <Button
              variant="text"
              size="sm"
              className="text-error-600"
              onClick={() => onRemove(dep._id || dep.id || dep)}
              loading={isRemoving}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ImpactPanel({ impact }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="border border-gray-200 rounded-xl bg-white">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-warning-500" />
          <h3 className="text-sm font-semibold text-gray-900">Blocking Dependencies</h3>
        </div>
        <div className="p-4 space-y-3 max-h-[220px] overflow-y-auto">
          {impact?.blockers?.length ? (
            impact.blockers.map((blocker) => (
              <div
                key={blocker.id}
                className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{blocker.title}</p>
                  <p className="text-xs text-gray-500">Status: {blocker.status}</p>
                </div>
                <Badge variant="warning" size="sm">
                  Upstream
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">No upstream blockers detected.</p>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl bg-white">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-error-500" />
          <h3 className="text-sm font-semibold text-gray-900">Impacted Tasks</h3>
        </div>
        <div className="p-4 space-y-3 max-h-[220px] overflow-y-auto">
          {impact?.impacted?.length ? (
            impact.impacted.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">Status: {item.status}</p>
                </div>
                <Badge variant="error" size="sm">
                  Downstream
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">No downstream impact detected.</p>
          )}
        </div>
      </div>
    </div>
  )
}

TaskDependenciesTab.propTypes = {
  task: PropTypes.object.isRequired,
}

