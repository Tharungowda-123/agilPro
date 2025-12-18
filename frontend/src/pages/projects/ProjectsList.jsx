import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Plus, Search, Grid, List, FileSpreadsheet } from 'lucide-react'
import { useProjects, useCreateProject } from '@/hooks/api/useProjects'
import { useExportProjectsExcel, useExportStoriesExcel, useExportTasksExcel } from '@/hooks/api/useExport'
import { useRole } from '@/hooks/useRole'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import ProjectCard from '@/components/projects/ProjectCard'
import ProjectFormModal from '@/components/projects/ProjectFormModal'
import EmptyState from '@/components/layout/EmptyState'
import Spinner from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import { FolderOpen } from 'lucide-react'
import ExportButton from '@/components/export/ExportButton'
import Dropdown from '@/components/ui/Dropdown'

/**
 * ProjectsList Page
 * Displays all projects in grid or list view with search, filters, and pagination
 */
export default function ProjectsList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { canCreateProject, isViewer } = useRole()
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const modalParam = searchParams.get('modal')

  const { data, isLoading } = useProjects({
    page,
    limit: 12,
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  const createProject = useCreateProject()
  const exportProjectsExcel = useExportProjectsExcel()
  const exportStoriesExcel = useExportStoriesExcel()
  const exportTasksExcel = useExportTasksExcel()
  const handleExportProjectStories = (projectId) => {
    if (!projectId) return
    exportStoriesExcel.mutate({ projectId })
  }

  const handleExportProjectTasks = (projectId) => {
    if (!projectId) return
    exportTasksExcel.mutate({ projectId })
  }

  const handleCreateProject = (data) => {
    createProject.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false)
        if (modalParam === 'createProject') {
          const next = new URLSearchParams(searchParams)
          next.delete('modal')
          setSearchParams(next, { replace: true })
        }
      },
    })
  }

  useEffect(() => {
    if (modalParam === 'createProject' && canCreateProject) {
      setIsModalOpen(true)
    }
  }, [modalParam, canCreateProject])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    if (modalParam === 'createProject') {
      const next = new URLSearchParams(searchParams)
      next.delete('modal')
      setSearchParams(next, { replace: true })
    }
  }

  // Handle different response structures
  const projects = Array.isArray(data?.data) 
    ? data.data.map(p => ({ ...p, id: p._id || p.id }))
    : Array.isArray(data) 
    ? data.map(p => ({ ...p, id: p._id || p.id }))
    : []
  const pagination = data?.pagination || {}

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Projects</h1>
          <p className="text-gray-600">Manage and track all your projects</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-100 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Grid view"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-100 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <ExportButton
            onExportPDF={() => {
              toast.info('PDF export for projects coming soon')
            }}
            onExportExcel={() => {
              exportProjectsExcel.mutate()
            }}
            loading={exportProjectsExcel.isPending}
          />
          {canCreateProject && (
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(true)
                const next = new URLSearchParams(searchParams)
                next.set('modal', 'createProject')
                setSearchParams(next, { replace: true })
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Project
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search projects by name or key..."
            leftIcon={<Search className="w-5 h-5" />}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="w-full sm:w-48"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="planning">Planning</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </Select>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full sm:w-48"
        >
          <option value="name">Sort by Name</option>
          <option value="created">Sort by Created</option>
          <option value="due">Sort by Due Date</option>
        </Select>
      </div>

      {/* Projects Display */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" color="primary" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-16 h-16" />}
          title="No Projects Found"
          description={searchTerm || statusFilter !== 'all' 
            ? 'Try adjusting your search or filters'
            : 'Get started by creating your first project'}
          action={
            !searchTerm && statusFilter === 'all' && canCreateProject ? (
              <Button
                variant="primary"
                onClick={() => setIsModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Project
              </Button>
            ) : null
          }
        />
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project._id || project.id} project={project} />
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => {
                  const projectId = project._id || project.id
                  return (
                  <tr
                    key={projectId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/projects/${projectId}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{project.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-mono">{project.key}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'active' ? 'bg-success-100 text-success-800' :
                        project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        project.status === 'planning' ? 'bg-warning-100 text-warning-800' :
                        'bg-error-100 text-error-800'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/projects/${projectId}`)
                          }}
                        >
                          View
                        </Button>
                        <div
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Dropdown
                            trigger={
                              <Button variant="outlined" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
                                Export
                              </Button>
                            }
                            items={[
                              {
                                label: exportStoriesExcel.isPending ? 'Exporting stories…' : 'Stories (.xlsx)',
                                onClick: () => handleExportProjectStories(projectId),
                                disabled: exportStoriesExcel.isPending,
                              },
                              {
                                label: exportTasksExcel.isPending ? 'Exporting tasks…' : 'Tasks (.xlsx)',
                                onClick: () => handleExportProjectTasks(projectId),
                                disabled: exportTasksExcel.isPending,
                              },
                            ]}
                            position="bottom-right"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Create Project Modal */}
      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateProject}
        loading={createProject.isPending}
      />
    </div>
  )
}

