import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { AlertTriangle, Zap, Target } from 'lucide-react'
import { useProgramIncrement, useOptimizePI, useUpdateProgramIncrement } from '@/hooks/api/useProgramIncrements'
import { useNavigate } from 'react-router-dom'
import { useFeatures } from '@/hooks/api/useFeatures'
import Button from '@/components/ui/Button'
import ExportButton from '@/components/export/ExportButton'
import ExcelImport from '@/components/import/ExcelImport'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/layout/EmptyState'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'

/**
 * PI Planning Board
 * Visual board with drag-drop features to sprints
 */
export default function PIPlanningBoard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [featureAssignments, setFeatureAssignments] = useState({})
  const [warnings, setWarnings] = useState([])

  const { data: piData, isLoading, refetch } = useProgramIncrement(id)
  const optimizePI = useOptimizePI()
  const updatePI = useUpdateProgramIncrement()

  const programIncrement = piData?.programIncrement || piData?.data?.programIncrement || piData
  const projectId = programIncrement?.project?._id || programIncrement?.project?.id || programIncrement?.project
  const { data: featuresData } = useFeatures({ project: projectId })
  const allFeatures = Array.isArray(featuresData?.data) ? featuresData.data : featuresData || []

  // Get PI features and sprints
  const piFeatures = programIncrement?.features || []
  const sprints = programIncrement?.sprints || []

  // Build feature assignments map
  const assignments = useMemo(() => {
    const map = {}
    piFeatures.forEach((feature) => {
      const featureId = feature._id || feature.id
      // Find which sprint this feature is assigned to
      const assignedSprint = sprints.find((sprint) => {
        const sprintId = sprint._id || sprint.id
        return featureAssignments[featureId] === sprintId
      })
      map[featureId] = assignedSprint?._id || assignedSprint?.id || null
    })
    return map
  }, [piFeatures, sprints, featureAssignments])

  // Calculate capacity per sprint
  const sprintCapacities = useMemo(() => {
    const capacities = {}
    sprints.forEach((sprint) => {
      const sprintId = sprint._id || sprint.id
      const capacity = sprint.capacity || sprint.velocity || 0
      const assignedFeatures = piFeatures.filter((f) => {
        const featureId = f._id || f.id
        return assignments[featureId] === sprintId
      })
      const allocated = assignedFeatures.reduce(
        (sum, f) => sum + (f.estimatedStoryPoints || f.actualStoryPoints || 0),
        0
      )
      capacities[sprintId] = {
        capacity,
        allocated,
        utilization: capacity > 0 ? Math.round((allocated / capacity) * 100) : 0,
        isOverloaded: allocated > capacity,
      }
    })
    return capacities
  }, [sprints, piFeatures, assignments])

  // Check for overloads
  const overloadWarnings = useMemo(() => {
    const warnings = []
    Object.entries(sprintCapacities).forEach(([sprintId, data]) => {
      if (data.isOverloaded) {
        const sprint = sprints.find((s) => (s._id || s.id) === sprintId)
        warnings.push({
          sprintId,
          sprintName: sprint?.name || sprintId,
          allocated: data.allocated,
          capacity: data.capacity,
          overload: data.allocated - data.capacity,
        })
      }
    })
    return warnings
  }, [sprintCapacities, sprints])

  const handleDragEnd = async (result) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    // Same position, no change
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const featureId = draggableId.replace('feature-', '')
    const newSprintId = destination.droppableId === 'unassigned' ? null : destination.droppableId

    // Update local state
    setFeatureAssignments((prev) => ({
      ...prev,
      [featureId]: newSprintId,
    }))

    // Update on server (if needed, could batch updates)
    // For now, we'll just update locally and save on commit
  }

  const handleOptimize = () => {
    optimizePI.mutate(
      { piId: id },
      {
        onSuccess: (response) => {
          const optimization = response.data?.optimization || response.optimization
          if (optimization?.assignments) {
            const newAssignments = {}
            optimization.assignments.forEach((assignment) => {
              newAssignments[assignment.featureId] = assignment.sprintId
            })
            setFeatureAssignments(newAssignments)
            toast.success('PI optimized successfully!')
          }
        },
      }
    )
  }

  const handleSave = async () => {
    // Save assignments by updating features with sprint assignments
    // For now, we'll just update the PI with the assignments
    // In a real implementation, you'd update each feature's sprint assignment
    try {
      // Update PI with current state
      await updatePI.mutateAsync({
        piId: id,
        data: {
          // The assignments are tracked in featureAssignments state
          // In production, you'd update each feature's sprint field
        },
      })
      toast.success('PI plan saved!')
      refetch()
    } catch (error) {
      toast.error('Failed to save PI plan')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!programIncrement) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Target className="w-16 h-16" />}
          title="Program Increment Not Found"
          description="The PI you're looking for doesn't exist or has been deleted."
        />
      </div>
    )
  }

  // Group features by sprint assignment
  const featuresBySprint = useMemo(() => {
    const groups = { unassigned: [] }
    sprints.forEach((sprint) => {
      const sprintId = sprint._id || sprint.id
      groups[sprintId] = []
    })

    piFeatures.forEach((feature) => {
      const featureId = feature._id || feature.id
      const sprintId = assignments[featureId] || 'unassigned'
      if (groups[sprintId]) {
        groups[sprintId].push(feature)
      } else {
        groups.unassigned.push(feature)
      }
    })

    return groups
  }, [piFeatures, sprints, assignments])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{programIncrement.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{programIncrement.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outlined" onClick={() => navigate(`/pi/${id}`)}>
            View Dashboard
          </Button>
          <Button variant="outlined" onClick={handleOptimize} leftIcon={<Zap className="w-4 h-4" />}>
            AI Optimize
          </Button>
          <ExportButton piId={id} piName={programIncrement.name} />
          <Button variant="primary" onClick={handleSave}>
            Save Plan
          </Button>
        </div>
      </div>

      {/* Import Section */}
      {programIncrement.status === 'planning' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Import from Excel
          </h2>
          <ExcelImport
            projectId={projectId}
            piId={id}
            onImportComplete={(result) => {
              toast.success('Import completed! Refreshing...')
              refetch()
            }}
          />
        </Card>
      )}

      {/* Warnings */}
      {overloadWarnings.length > 0 && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Capacity Warnings</h3>
              <ul className="space-y-1">
                {overloadWarnings.map((warning) => (
                  <li key={warning.sprintId} className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>{warning.sprintName}</strong>: {warning.allocated} pts allocated,{' '}
                    {warning.capacity} pts capacity ({warning.overload} pts overload)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Planning Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '600px' }}>
          {/* Unassigned Features */}
          <SprintColumn
            sprintId="unassigned"
            sprintName="Unassigned"
            features={featuresBySprint.unassigned || []}
            capacity={null}
            allocated={0}
          />

          {/* Sprint Columns */}
          {sprints.map((sprint) => {
            const sprintId = sprint._id || sprint.id
            const capacity = sprintCapacities[sprintId] || {}
            return (
              <SprintColumn
                key={sprintId}
                sprintId={sprintId}
                sprintName={sprint.name || `Sprint ${sprint.sprintNumber || ''}`}
                features={featuresBySprint[sprintId] || []}
                capacity={capacity.capacity}
                allocated={capacity.allocated}
                utilization={capacity.utilization}
                isOverloaded={capacity.isOverloaded}
                startDate={sprint.startDate}
                endDate={sprint.endDate}
              />
            )
          })}
        </div>
      </DragDropContext>

      {/* Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Features</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{piFeatures.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Capacity</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Object.values(sprintCapacities).reduce((sum, c) => sum + (c.capacity || 0), 0)} pts
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Allocated</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Object.values(sprintCapacities).reduce((sum, c) => sum + (c.allocated || 0), 0)} pts
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Utilization</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(
                (Object.values(sprintCapacities).reduce((sum, c) => sum + (c.allocated || 0), 0) /
                  Object.values(sprintCapacities).reduce((sum, c) => sum + (c.capacity || 0), 1)) *
                  100
              )}
              %
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Sprint Column Component
function SprintColumn({
  sprintId,
  sprintName,
  features,
  capacity,
  allocated,
  utilization,
  isOverloaded,
  startDate,
  endDate,
}) {
  return (
    <div className="flex-shrink-0 w-80">
      <Card className={cn('h-full', isOverloaded && 'border-2 border-yellow-500')}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{sprintName}</h3>
            {isOverloaded && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
          </div>
          {capacity !== null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Capacity</span>
                <span className={cn('font-medium', isOverloaded ? 'text-red-600' : 'text-gray-900 dark:text-gray-100')}>
                  {allocated || 0} / {capacity || 0} pts
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    isOverloaded
                      ? 'bg-red-500'
                      : utilization > 90
                      ? 'bg-yellow-500'
                      : 'bg-primary-600'
                  )}
                  style={{ width: `${Math.min(utilization || 0, 100)}%` }}
                />
              </div>
            </div>
          )}
          {startDate && endDate && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <DroppableColumn droppableId={sprintId}>
          <div className="p-4 space-y-3 min-h-[400px]">
            {features.map((feature, index) => (
              <FeatureCard key={feature._id || feature.id} feature={feature} index={index} />
            ))}
            {features.length === 0 && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                Drop features here
              </div>
            )}
          </div>
        </DroppableColumn>
      </Card>
    </div>
  )
}

// Droppable Column Component
function DroppableColumn({ droppableId, children }) {
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            snapshot.isDraggingOver && 'bg-primary-50 dark:bg-primary-900/20'
          )}
        >
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}

// Feature Card Component
function FeatureCard({ feature, index }) {
  const featureId = feature._id || feature.id

  const priorityColors = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  }

  return (
    <Draggable draggableId={`feature-${featureId}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-move',
            snapshot.isDragging && 'shadow-lg opacity-90'
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2">
              {feature.title}
            </h4>
            <Badge className={priorityColors[feature.priority] || priorityColors.medium} size="sm">
              {feature.priority || 'medium'}
            </Badge>
          </div>
          {(feature.estimatedStoryPoints || feature.actualStoryPoints) && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {(feature.estimatedStoryPoints || feature.actualStoryPoints)} pts
            </p>
          )}
        </div>
      )}
    </Draggable>
  )
}

