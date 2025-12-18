import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Sparkles, Target } from 'lucide-react'
import { useFeatures } from '@/hooks/api/useFeatures'
import { useCreateFeature } from '@/hooks/api/useFeatures'
import { useProjects } from '@/hooks/api/useProjects'
import { useRole } from '@/hooks/useRole'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import FeatureFormModal from '@/components/features/FeatureFormModal'
import EmptyState from '@/components/layout/EmptyState'
import Spinner from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import { cn } from '@/utils'

/**
 * Features Page
 * Displays all features with filters, search, and pagination
 */
export default function Features() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { canCreateProject, isViewer } = useRole()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [projectFilter, setProjectFilter] = useState(searchParams.get('project') || 'all')
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: projectsData } = useProjects()
  const projects = Array.isArray(projectsData?.data) ? projectsData.data : projectsData || []

  const filters = {
    search: searchTerm || undefined,
    project: projectFilter !== 'all' ? projectFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: 12,
  }

  const { data, isLoading } = useFeatures(filters)
  const createFeature = useCreateFeature()

  const features = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
  const pagination = data?.pagination || {}

  const handleCreateFeature = (formData) => {
    const projectId = projectFilter !== 'all' ? projectFilter : formData.projectId
    createFeature.mutate(
      {
        projectId,
        data: { ...formData, projectId },
      },
      {
        onSuccess: () => {
          setIsModalOpen(false)
        },
      }
    )
  }

  const handleFilterChange = (filterName, value) => {
    setPage(1) // Reset to first page on filter change
    const newParams = new URLSearchParams(searchParams)
    if (value === 'all' || !value) {
      newParams.delete(filterName)
    } else {
      newParams.set(filterName, value)
    }
    newParams.delete('page') // Reset page
    setSearchParams(newParams, { replace: true })
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    setPage(1)
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set('search', value)
    } else {
      newParams.delete('search')
    }
    newParams.delete('page')
    setSearchParams(newParams, { replace: true })
  }

  const priorityColors = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    ready: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'in-breakdown': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'broken-down': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  }

  const canCreate = canCreateProject && !isViewer

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Features</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage features and their breakdown into stories</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Feature
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value)
              handleFilterChange('project', e.target.value)
            }}
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id || project._id} value={project.id || project._id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value)
              handleFilterChange('priority', e.target.value)
            }}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              handleFilterChange('status', e.target.value)
            }}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="in-breakdown">In Breakdown</option>
            <option value="broken-down">Broken Down</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
      </Card>

      {/* Features List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" color="primary" />
        </div>
      ) : features.length === 0 ? (
        <EmptyState
          icon={<Target className="w-16 h-16" />}
          title="No features found"
          description={
            searchTerm || projectFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters to see more features.'
              : canCreate
              ? 'Get started by creating your first feature.'
              : 'No features have been created yet.'
          }
          action={
            canCreate
              ? {
                  label: 'Create Feature',
                  onClick: () => setIsModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const featureId = feature._id || feature.id
              const project = projects.find((p) => (p.id || p._id) === (feature.project?._id || feature.project))
              const totalStories = feature.totalStories || feature.stories?.length || 0
              const completedStories = feature.completedStories || feature.stories?.filter((s) => s.status === 'done').length || 0
              const progress = feature.progress || (totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0)

              return (
                <Card
                  key={featureId}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/features/${featureId}`)}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                          {feature.title}
                        </h3>
                      </div>
                      {feature.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {feature.description}
                        </p>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={priorityColors[feature.priority] || priorityColors.medium}>
                        {feature.priority || 'medium'}
                      </Badge>
                      <Badge className={statusColors[feature.status] || statusColors.draft}>
                        {feature.status || 'draft'}
                      </Badge>
                      {project && (
                        <Badge variant="outline">
                          {project.name}
                        </Badge>
                      )}
                    </div>

                    {/* Progress */}
                    {totalStories > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {completedStories}/{totalStories} stories
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Story Points */}
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        {feature.estimatedStoryPoints > 0 && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Estimated: </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {feature.estimatedStoryPoints} pts
                            </span>
                          </div>
                        )}
                        {feature.actualStoryPoints > 0 && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Actual: </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {feature.actualStoryPoints} pts
                            </span>
                          </div>
                        )}
                      </div>
                      {feature.aiInsights && (
                        <Sparkles className="w-4 h-4 text-primary-600" />
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={(newPage) => {
                setPage(newPage)
                const newParams = new URLSearchParams(searchParams)
                newParams.set('page', newPage.toString())
                setSearchParams(newParams, { replace: true })
              }}
            />
          )}
        </>
      )}

      {/* Create Feature Modal */}
      {canCreate && (
        <FeatureFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateFeature}
          loading={createFeature.isPending}
          defaultProjectId={projectFilter !== 'all' ? projectFilter : undefined}
        />
      )}
    </div>
  )
}

