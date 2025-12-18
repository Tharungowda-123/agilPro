import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useSprints } from '@/hooks/api/useSprints'
import { useCreateSprint, useStartSprint } from '@/hooks/api/useSprints'
import { useProjects } from '@/hooks/api/useProjects'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import SprintCard from '@/components/sprints/SprintCard'
import SprintFormModal from '@/components/sprints/SprintFormModal'
import EmptyState from '@/components/layout/EmptyState'
import Spinner from '@/components/ui/Spinner'
import { Calendar } from 'lucide-react'

/**
 * SprintsList Page
 * Displays all sprints with filters and project selector
 */
export default function SprintsList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const projectId = searchParams.get('projectId')
  const modalParam = searchParams.get('modal')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSprint, setEditingSprint] = useState(null)

  const { data: projects } = useProjects()
  const { data: sprints, isLoading } = useSprints(projectId || undefined)
  const createSprint = useCreateSprint()
  const startSprint = useStartSprint()

  const handleCreateSprint = (data) => {
    createSprint.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false)
        if (modalParam === 'createSprint') {
          const next = new URLSearchParams(searchParams)
          next.delete('modal')
          setSearchParams(next, { replace: true })
        }
      },
    })
  }

  const handleStartSprint = (id) => {
    startSprint.mutate(id)
  }

  const handleEditSprint = (sprint) => {
    setEditingSprint(sprint)
    setIsModalOpen(true)
  }

  useEffect(() => {
    if (modalParam === 'createSprint') {
      setEditingSprint(null)
      setIsModalOpen(true)
    }
  }, [modalParam])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSprint(null)
    if (modalParam === 'createSprint') {
      const next = new URLSearchParams(searchParams)
      next.delete('modal')
      if (projectId) {
        next.set('projectId', projectId)
      }
      setSearchParams(next, { replace: true })
    }
  }

  const filteredSprints = sprints?.filter((sprint) => {
    if (statusFilter === 'all') return true
    return sprint.status === statusFilter
  }) || []

  const selectedProject = projects?.data?.find((p) => p.id === projectId)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sprints</h1>
          <p className="text-gray-600">Manage and track your sprints</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={projectId || 'all'}
            onChange={(e) => {
              if (e.target.value === 'all') {
                setSearchParams({})
              } else {
                setSearchParams({ projectId: e.target.value })
              }
            }}
            className="w-full sm:w-64"
          >
            <option value="all">All Projects</option>
            {projects?.data?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Button
            variant="primary"
            onClick={() => {
              setEditingSprint(null)
              setIsModalOpen(true)
              const next = new URLSearchParams(searchParams)
              next.set('modal', 'createSprint')
              if (projectId) {
                next.set('projectId', projectId)
              }
              setSearchParams(next, { replace: true })
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Sprint
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'all', label: 'All' },
            { id: 'planned', label: 'Planned' },
            { id: 'active', label: 'Active' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  statusFilter === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Sprints Display */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" color="primary" />
        </div>
      ) : filteredSprints.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-16 h-16" />}
          title="No Sprints Found"
          description={
            statusFilter !== 'all'
              ? `No ${statusFilter} sprints found`
              : projectId
              ? 'No sprints found for this project'
              : 'Get started by creating your first sprint'
          }
          action={
            !projectId && statusFilter === 'all' ? (
              <Button
                variant="primary"
                onClick={() => setIsModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Sprint
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSprints.map((sprint) => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              onStart={handleStartSprint}
              onEdit={handleEditSprint}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Sprint Modal */}
      <SprintFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateSprint}
        sprint={editingSprint}
        projectId={projectId || undefined}
        loading={createSprint.isPending}
      />
    </div>
  )
}

