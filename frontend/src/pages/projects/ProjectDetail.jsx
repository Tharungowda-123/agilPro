import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MoreVertical,
  Edit,
  Archive,
  Trash2,
  Calendar,
  Target,
  Users,
  TrendingUp,
  Sparkles,
  Plus,
} from 'lucide-react'
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/api/useProjects'
import { useSprints, useAssignStoriesToSprint } from '@/hooks/api/useSprints'
import { useStories, useDeleteStory } from '@/hooks/api/useStories'
import { useTeams } from '@/hooks/api/useTeams'
import { useFeatures, useCreateFeature, useBreakdownFeature } from '@/hooks/api/useFeatures'
import { useProgramIncrements, useCreateProgramIncrement } from '@/hooks/api/useProgramIncrements'
import PIWizard from '@/components/pi-planning/PIWizard'
import { useRole } from '@/hooks/useRole'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Dropdown from '@/components/ui/Dropdown'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import ProjectFormModal from '@/components/projects/ProjectFormModal'
import DeleteConfirmModal from '@/components/projects/DeleteConfirmModal'
import EmptyState from '@/components/layout/EmptyState'
import StoryDetailModal from '@/components/story/StoryDetailModal'
import QuickCreateStoryModal from '@/components/story/QuickCreateStoryModal'
import FeatureFormModal from '@/components/features/FeatureFormModal'
import { useExportStoriesExcel, useExportTasksExcel } from '@/hooks/api/useExport'
import ExcelImport from '@/components/import/ExcelImport'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'

/**
 * ProjectDetail Page
 * Detailed view of a project with tabs for Overview, Sprints, Backlog, Team, Settings
 */
export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEditProject, canDeleteProject, isViewer, canCreateProject } = useRole()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { data: project, isLoading: projectLoading } = useProject(id)
  const { data: sprints, isLoading: sprintsLoading } = useSprints(id)
  const { data: storiesData, isLoading: storiesLoading } = useStories(id, { status: 'todo' })
  const { data: teams } = useTeams()
  const { data: featuresData, isLoading: featuresLoading } = useFeatures(id)
  const { data: pisData, isLoading: pisLoading } = useProgramIncrements(id)
  const deleteStoryMutation = useDeleteStory()
  const assignStoriesToSprint = useAssignStoriesToSprint()

  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  const createFeature = useCreateFeature()
  const createPI = useCreateProgramIncrement()
  
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false)
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false)
  const [isPIWizardOpen, setIsPIWizardOpen] = useState(false)
  const [selectedStoryId, setSelectedStoryId] = useState(null)

  const handleUpdate = (data) => {
    updateProject.mutate(
      { id, data },
      {
        onSuccess: () => {
          setIsEditModalOpen(false)
        },
      }
    )
  }

  const handleDelete = () => {
    deleteProject.mutate(id, {
      onSuccess: () => {
        navigate('/projects')
      },
    })
  }

  const handleCreateFeature = (data) => {
    createFeature.mutate(
      { projectId: id, data },
      {
        onSuccess: () => {
          setIsFeatureModalOpen(false)
        },
      }
    )
  }

  const sprintsData = Array.isArray(sprints) ? sprints : sprints?.data || sprints || []
  const storiesDataArray = Array.isArray(storiesData) ? storiesData : storiesData?.data || storiesData || []
  const teamsData = Array.isArray(teams) ? teams : teams?.data || teams || []
  const features = Array.isArray(featuresData)
    ? featuresData
    : featuresData?.features || featuresData?.data?.features || []

  // Extract data from response objects
  const projectData = project?.data?.project || project?.data || project || {}
  const canManageBacklog = canCreateProject || canEditProject(projectData)

  // Build action menu items based on permissions
  const actionMenuItems = []
  
  if (canEditProject(projectData)) {
    actionMenuItems.push({
      label: 'Edit Project',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => setIsEditModalOpen(true),
    })
    actionMenuItems.push({
      label: 'Archive Project',
      icon: <Archive className="w-4 h-4" />,
      onClick: () => {
        // TODO: Implement archive
      },
    })
  }
  
  if (canDeleteProject && actionMenuItems.length > 0) {
    actionMenuItems.push({ type: 'divider' })
  }
  
  if (canDeleteProject) {
    actionMenuItems.push({
      label: 'Delete Project',
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'danger',
      onClick: () => setIsDeleteModalOpen(true),
    })
  }

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Target className="w-16 h-16" />}
          title="Project Not Found"
          description="The project you're looking for doesn't exist or has been deleted."
          action={
            <Button variant="primary" onClick={() => navigate('/projects')}>
              Back to Projects
            </Button>
          }
        />
      </div>
    )
  }

  const stories = storiesDataArray

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="outlined"
            onClick={() => navigate('/projects')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{projectData?.name}</h1>
              <Badge variant="outlined" size="md">
                {projectData?.key}
              </Badge>
              <Badge
                variant={
                  projectData?.status === 'active'
                    ? 'success'
                    : projectData?.status === 'completed'
                    ? 'default'
                    : projectData?.status === 'planning'
                    ? 'warning'
                    : 'error'
                }
                size="md"
              >
                {projectData?.status}
              </Badge>
            </div>
            <p className="text-gray-600">{projectData?.description}</p>
          </div>
        </div>
        {actionMenuItems.length > 0 && (
          <Dropdown
            trigger={
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            }
            items={actionMenuItems}
            position="bottom-right"
          />
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'pi-planning', label: 'PI Planning' },
            { id: 'features', label: 'Features' },
            { id: 'sprints', label: 'Sprints' },
            { id: 'backlog', label: 'Backlog' },
            { id: 'team', label: 'Team' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
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

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && <OverviewTab project={project} />}
        {activeTab === 'pi-planning' && (
          <PIPlanningTab
            projectId={id}
            pis={pisData?.data || pisData || []}
            loading={pisLoading}
            onCreatePI={() => setIsPIWizardOpen(true)}
            canCreatePI={canManageBacklog}
          />
        )}
        {activeTab === 'features' && (
          <FeaturesTab
            projectId={id}
            features={features}
            loading={featuresLoading}
            onCreateFeature={() => setIsFeatureModalOpen(true)}
            canCreateFeature={canManageBacklog}
          />
        )}
        {activeTab === 'sprints' && (
          <SprintsTab projectId={id} sprints={sprints || []} loading={sprintsLoading} />
        )}
        {activeTab === 'backlog' && (
          <BacklogTab
            projectId={id}
            stories={stories}
            loading={storiesLoading}
            features={features}
            featuresLoading={featuresLoading}
            onCreateStory={() => setIsCreateStoryModalOpen(true)}
            onCreateFeature={() => setIsFeatureModalOpen(true)}
            canCreateStory={canManageBacklog}
            onStoryClick={(storyId) => {
              setSelectedStoryId(storyId)
            }}
            sprints={sprintsData}
            assignStoriesToSprint={assignStoriesToSprint}
            deleteStory={deleteStoryMutation}
          />
        )}
        {activeTab === 'team' && (
          <TeamTab 
            project={project} 
            teams={teamsData || []} 
            onAssignTeam={() => setIsEditModalOpen(true)}
          />
        )}
        {activeTab === 'settings' && !isViewer && (
          <SettingsTab
            project={project}
            onEdit={() => setIsEditModalOpen(true)}
            onDelete={() => setIsDeleteModalOpen(true)}
          />
        )}
        {activeTab === 'settings' && isViewer && (
          <div className="text-center py-12">
            <p className="text-gray-500">Settings are not available in read-only mode.</p>
          </div>
        )}
      </div>

      {/* PI Wizard */}
      {canManageBacklog && (
        <PIWizard
          isOpen={isPIWizardOpen}
          onClose={() => setIsPIWizardOpen(false)}
          projectId={id}
          onSuccess={() => {
            setIsPIWizardOpen(false)
          }}
        />
      )}

      {/* Modals */}
      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdate}
        project={project}
        loading={updateProject.isPending}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? All associated sprints, stories, and tasks will also be deleted."
        itemName={projectData?.name}
        loading={deleteProject.isPending}
      />
      
      {/* Story Detail Modal */}
      {selectedStoryId && (
        <StoryDetailModal
          isOpen={!!selectedStoryId}
          onClose={() => setSelectedStoryId(null)}
          storyId={selectedStoryId}
        />
      )}

      <FeatureFormModal
        isOpen={isFeatureModalOpen}
        onClose={() => setIsFeatureModalOpen(false)}
        onSubmit={handleCreateFeature}
        loading={createFeature.isPending}
      />

      <QuickCreateStoryModal
        isOpen={isCreateStoryModalOpen}
        onClose={() => setIsCreateStoryModalOpen(false)}
        defaultProjectId={id}
      />
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ project }) {
  const projectId = project?._id || project?.id
  const { data: storiesData } = useStories(projectId)
  const { data: sprints } = useSprints(projectId)
  
  const stories = Array.isArray(storiesData) ? storiesData : storiesData?.data || storiesData || []
  const sprintsData = Array.isArray(sprints) ? sprints : sprints?.data || sprints || []
  const projectData = project?.data?.project || project?.data || project || {}

  const totalStoryPoints = stories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)
  const completedStoryPoints = stories
    .filter((s) => s.status === 'done')
    .reduce((sum, s) => sum + (s.storyPoints || 0), 0)
  const activeSprints = sprints?.filter((s) => s.status === 'active').length || 0
  const averageVelocity =
    sprints?.filter((s) => s.status === 'completed').reduce((sum, s) => sum + s.velocity, 0) /
      (sprints?.filter((s) => s.status === 'completed').length || 1) || 0

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Start Date</p>
            <p className="text-sm font-medium text-gray-900">
              {projectData?.startDate
                ? new Date(projectData.startDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">End Date</p>
            <p className="text-sm font-medium text-gray-900">
              {projectData?.endDate
                ? new Date(projectData.endDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Priority</p>
            <Badge
              variant={
                projectData?.priority === 'high'
                  ? 'error'
                  : projectData?.priority === 'medium'
                  ? 'warning'
                  : 'success'
              }
              size="sm"
            >
              {projectData?.priority || 'N/A'}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Progress</p>
            <p className="text-sm font-medium text-gray-900">{projectData?.progress || 0}%</p>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Target className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Story Points</p>
              <p className="text-xl font-bold text-gray-900">{totalStoryPoints}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <Target className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed Points</p>
              <p className="text-xl font-bold text-gray-900">{completedStoryPoints}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Calendar className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Sprints</p>
              <p className="text-xl font-bold text-gray-900">{activeSprints}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Team Velocity</p>
              <p className="text-xl font-bold text-gray-900">{Math.round(averageVelocity)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// PI Planning Tab Component
function PIPlanningTab({ projectId, pis = [], loading, onCreatePI, canCreatePI }) {
  const navigate = useNavigate()
  const pisArray = Array.isArray(pis) ? pis : pis?.data || pis || []
  const { refetch: refetchPIs } = useProgramIncrements(projectId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (pisArray.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<Target className="w-16 h-16" />}
          title="No Program Increments"
          description="Create a Program Increment to plan multiple sprints together, or import from Excel"
          action={
            canCreatePI && (
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Button variant="primary" onClick={onCreatePI}>
                  Create Program Increment
                </Button>
              </div>
            )
          }
        />
        {/* Excel Import Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Import from Excel
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload an Excel file with features. The system will automatically break them down into stories, create tasks, assign them to team members, and schedule sprints.
          </p>
          <ExcelImport
            projectId={projectId}
            onImportComplete={(result) => {
              toast.success('Import completed! Refreshing...')
              refetchPIs()
            }}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {canCreatePI && (
        <div className="flex justify-end">
          <Button variant="primary" onClick={onCreatePI}>
            Create Program Increment
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pisArray.map((pi) => {
          const piId = pi._id || pi.id
          const features = pi.features || []
          const sprints = pi.sprints || []
          const completedFeatures = features.filter((f) => f.status === 'completed').length
          const progress = features.length > 0 ? Math.round((completedFeatures / features.length) * 100) : 0
          
          return (
            <Card
              key={piId}
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/pi/${piId}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{pi.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{pi.description || 'No description'}</p>
                </div>
                <Badge
                  variant={
                    pi.status === 'active'
                      ? 'success'
                      : pi.status === 'completed'
                      ? 'default'
                      : 'warning'
                  }
                  size="sm"
                >
                  {pi.status || 'planning'}
                </Badge>
              </div>
              <div className="space-y-3">
                {pi.startDate && pi.endDate && (
                  <div className="text-sm text-gray-600">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {new Date(pi.startDate).toLocaleDateString()} - {new Date(pi.endDate).toLocaleDateString()}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Features:</span>
                  <span className="text-gray-900">{completedFeatures}/{features.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Sprints: {sprints.length}</span>
                  <span>Progress: {progress}%</span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Sprints Tab Component
function SprintsTab({ projectId, sprints, loading }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!sprints || sprints.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-16 h-16" />}
        title="No Sprints"
        description="Create your first sprint to start tracking work"
        action={
          <Button
            variant="primary"
            onClick={() =>
              navigate(`/sprints?projectId=${projectId || ''}&modal=createSprint`)
            }
          >
            Create Sprint
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() =>
            navigate(`/sprints?projectId=${projectId || ''}&modal=createSprint`)
          }
        >
          Create Sprint
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sprints.map((sprint) => {
          const sprintId = sprint._id || sprint.id
          return (
          <Card
            key={sprintId}
            className="p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/sprints/${sprintId}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{sprint.name}</h3>
                <p className="text-sm text-gray-600">{sprint.goal}</p>
              </div>
              <Badge
                variant={
                  sprint.status === 'active'
                    ? 'success'
                    : sprint.status === 'completed'
                    ? 'default'
                    : 'warning'
                }
                size="sm"
              >
                {sprint.status}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Dates:</span>
                <span className="text-gray-900">
                  {new Date(sprint.startDate).toLocaleDateString()} -{' '}
                  {new Date(sprint.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Velocity:</span>
                <span className="text-gray-900">{sprint.velocity || 0} / {sprint.capacity || 0} points</span>
              </div>
            </div>
          </Card>
          )
        })}
      </div>
    </div>
  )
}

// Backlog Tab Component
function BacklogTab({
  projectId,
  stories = [],
  loading,
  features = [],
  featuresLoading,
  onCreateStory,
  onCreateFeature,
  canCreateStory,
  onStoryClick,
  sprints = [],
  assignStoriesToSprint,
  deleteStory,
}) {
  const { mutate: breakDownFeature, isPending: isBreakingFeature } = useBreakdownFeature()
  const [activeFeatureId, setActiveFeatureId] = useState(null)
  const exportStoriesExcel = useExportStoriesExcel()
  const exportTasksExcel = useExportTasksExcel()
  const [selectedStoryIds, setSelectedStoryIds] = useState([])
  const [selectedSprintId, setSelectedSprintId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleExportStories = () => {
    exportStoriesExcel.mutate({ projectId })
  }

  const handleExportTasks = () => {
    exportTasksExcel.mutate({ projectId })
  }

  const toggleStorySelection = (storyId) => {
    setSelectedStoryIds((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    )
  }

  const handleSelectAll = () => {
    if (selectedStoryIds.length === stories.length) {
      setSelectedStoryIds([])
    } else {
      setSelectedStoryIds(stories.map((story) => story._id || story.id))
    }
  }

  const handleAssignToSprint = async () => {
    if (!selectedSprintId || selectedStoryIds.length === 0 || !assignStoriesToSprint?.mutateAsync) return
    setIsAssigning(true)
    try {
      await assignStoriesToSprint.mutateAsync({
        sprintId: selectedSprintId,
        storyIds: selectedStoryIds,
        projectId,
      })
      setSelectedStoryIds([])
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsAssigning(false)
    }
  }

  const handleDeleteStories = async () => {
    if (selectedStoryIds.length === 0 || !deleteStory?.mutateAsync) return
    if (!window.confirm(`Delete ${selectedStoryIds.length} selected stor${selectedStoryIds.length === 1 ? 'y' : 'ies'}?`)) {
      return
    }
    setIsDeleting(true)
    try {
      await Promise.all(selectedStoryIds.map((storyId) => deleteStory.mutateAsync(storyId)))
      setSelectedStoryIds([])
    } catch (error) {
      // individual delete errors handled by hook toast
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBreakdown = (featureId) => {
    setActiveFeatureId(featureId)
    breakDownFeature(
      { featureId, projectId },
      {
        onSettled: () => setActiveFeatureId(null),
      }
    )
  }

  const renderFeatures = () => {
    if (featuresLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" color="primary" />
        </div>
      )
    }

    if (!features || features.length === 0) {
      return (
        <div className="py-6">
          <EmptyState
            icon={<Sparkles className="w-12 h-12" />}
            title="No features yet"
            description="Capture high-level initiatives and let AI break them into actionable stories."
          />
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {features.map((feature) => {
          const featureId = feature._id || feature.id
          const storyCount = feature.stories?.length || 0
          return (
            <Card key={featureId} className="p-4 border border-gray-200 rounded-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                    <Badge
                      variant={
                        feature.priority === 'high'
                          ? 'error'
                          : feature.priority === 'medium'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {feature.priority || 'medium'}
                    </Badge>
                    <Badge variant="outlined" size="sm">
                      {feature.status || 'backlog'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {feature.description || 'No description provided.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Business value: {feature.businessValue ?? '—'}</span>
                    <span>Stories linked: {storyCount}</span>
                  </div>
                </div>
                <div className="flex flex-col items-stretch gap-2 md:items-end">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    onClick={() => handleBreakdown(featureId)}
                    loading={isBreakingFeature && activeFeatureId === featureId}
                    disabled={isBreakingFeature && activeFeatureId !== featureId}
                  >
                    Break Down with AI
                  </Button>
                  {storyCount > 0 && (
                    <p className="text-xs text-gray-500">
                      {storyCount} {storyCount === 1 ? 'story' : 'stories'} linked
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  const renderStories = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" color="primary" />
        </div>
      )
    }

    if (!stories || stories.length === 0) {
      return (
        <EmptyState
          icon={<Target className="w-16 h-16" />}
          title="No Backlog Items"
          description="All stories are assigned to sprints or create new ones"
          action={
            canCreateStory && (
              <Button variant="primary" onClick={onCreateStory}>
                Create Story
              </Button>
            )
          }
        />
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
          {canCreateStory && (
            <Button variant="primary" onClick={onCreateStory}>
              Create Story
            </Button>
          )}
          <div className="flex flex-wrap gap-2">
            <Dropdown
              trigger={
                <Button variant="outlined" size="sm">
                  Export
                </Button>
              }
              items={[
                {
                  label: exportStoriesExcel.isPending ? 'Exporting stories…' : 'Stories (.xlsx)',
                  onClick: handleExportStories,
                  disabled: exportStoriesExcel.isPending,
                },
                {
                  label: exportTasksExcel.isPending ? 'Exporting tasks…' : 'Tasks (.xlsx)',
                  onClick: handleExportTasks,
                  disabled: exportTasksExcel.isPending,
                },
              ]}
            />
            <select
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select Sprint</option>
              {sprints.map((sprint) => (
                <option key={sprint._id || sprint.id} value={sprint._id || sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
            <Button
              variant="outlined"
              size="sm"
              onClick={handleAssignToSprint}
              disabled={!selectedSprintId || selectedStoryIds.length === 0 || isAssigning}
              loading={isAssigning}
            >
              Assign to Sprint
            </Button>
            {canCreateStory && (
              <Button
                variant="outlined"
                size="sm"
                onClick={handleDeleteStories}
                disabled={selectedStoryIds.length === 0 || isDeleting}
                loading={isDeleting}
              >
                Delete Selected
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={selectedStoryIds.length === stories.length && stories.length > 0}
              onChange={handleSelectAll}
            />
            <span>Select All</span>
          </div>
          <div>{selectedStoryIds.length} selected</div>
        </div>
        <div className="space-y-3">
          {stories.map((story) => {
            const storyId = story._id || story.id
            const isSelected = selectedStoryIds.includes(storyId)
            return (
              <Card
                key={storyId}
                className={cn(
                  'p-4 transition-shadow',
                  isSelected ? 'border-primary-300 bg-primary-50/40' : 'cursor-pointer hover:shadow-md'
                )}
                onClick={() => {
                  toggleStorySelection(storyId)
                  if (onStoryClick) {
                    onStoryClick(storyId)
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleStorySelection(storyId)
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{story.title}</h4>
                        <Badge variant="outlined" size="sm">
                          {story.storyPoints || 0} pts
                        </Badge>
                        <Badge
                          variant={
                            story.priority === 'high'
                              ? 'error'
                              : story.priority === 'medium'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {story.priority || 'medium'}
                        </Badge>
                        {story.status && (
                          <Badge variant="outline" size="sm">
                            {story.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {story.description || 'No description'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Features & AI Breakdown</h3>
            <p className="text-sm text-gray-600">
              Create epics, capture acceptance criteria, and let AI suggest the right stories for your backlog.
            </p>
          </div>
          {canCreateStory && (
            <Button variant="outlined" size="sm" onClick={onCreateFeature}>
              New Feature
            </Button>
          )}
        </div>
        {renderFeatures()}
      </Card>

      {stories && stories.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <div>
            <input
              type="checkbox"
              className="mr-2"
              checked={selectedStoryIds.length === stories.length}
              onChange={handleSelectAll}
            />
            Select All
          </div>
          <div>{selectedStoryIds.length} selected</div>
        </div>
      )}

      {renderStories()}
    </div>
  )
}

// Team Tab Component
function TeamTab({ project, teams, onAssignTeam }) {
  const projectData = project?.data?.project || project?.data || project || {}
  const projectTeamId = projectData.team?._id || projectData.team
  
  // Find the team assigned to this project
  const projectTeam = projectTeamId 
    ? teams.find((t) => {
        const teamId = t._id || t.id
        return teamId && teamId.toString() === projectTeamId.toString()
      })
    : null

  if (!projectTeam) {
    return (
      <EmptyState
        icon={<Users className="w-16 h-16" />}
        title="No Team Assigned"
        description="Assign a team to this project to get started"
        action={
          <Button variant="primary" onClick={onAssignTeam}>
            Add Team
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{projectTeam.name}</h3>
            <p className="text-sm text-gray-600">{projectTeam.description}</p>
          </div>
          <Button 
            variant="primary"
            onClick={() => {
              // Navigate to team detail page to add members
              const teamId = projectTeam._id || projectTeam.id
              if (teamId) {
                window.location.href = `/teams/${teamId}`
              }
            }}
          >
            Manage Team
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projectTeam.memberDetails?.map((member) => (
            <div key={member.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-gray-600 mb-1">Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {member.skills?.slice(0, 3).map((skill, i) => (
                    <Badge key={i} variant="outlined" size="sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// Features Tab Component
function FeaturesTab({ projectId, features, loading, onCreateFeature, canCreateFeature }) {
  const navigate = useNavigate()
  const featuresArray = Array.isArray(features) ? features : features?.features || features?.data?.features || []

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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Features</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage features and break them down into stories
          </p>
        </div>
        {canCreateFeature && (
          <Button variant="outlined" onClick={onCreateFeature} leftIcon={<Plus className="w-4 h-4" />}>
            Create Feature
          </Button>
        )}
      </div>

      {featuresArray.length === 0 ? (
        <EmptyState
          icon={<Target className="w-16 h-16" />}
          title="No features yet"
          description="Create your first feature to get started with story breakdown."
          action={
            canCreateFeature ? (
              <Button variant="primary" onClick={onCreateFeature}>
                Create Feature
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresArray.map((feature) => {
            const featureId = feature._id || feature.id
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
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                      {feature.title}
                    </h4>
                    {feature.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {feature.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={priorityColors[feature.priority] || priorityColors.medium}>
                      {feature.priority || 'medium'}
                    </Badge>
                    <Badge className={statusColors[feature.status] || statusColors.draft}>
                      {feature.status || 'draft'}
                    </Badge>
                  </div>

                  {totalStories > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {completedStories}/{totalStories}
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

                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    {feature.estimatedStoryPoints > 0 && (
                      <span className="text-gray-600 dark:text-gray-400">
                        Est: {feature.estimatedStoryPoints} pts
                      </span>
                    )}
                    {feature.actualStoryPoints > 0 && (
                      <span className="text-gray-600 dark:text-gray-400">
                        Actual: {feature.actualStoryPoints} pts
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Settings Tab Component
function SettingsTab({ project, onEdit, onDelete }) {
  const { canEditProject, canDeleteProject } = useRole()
  const projectData = project?.data?.project || project?.data || project || {}
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Settings</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Project Name</p>
            <p className="text-sm font-medium text-gray-900">{projectData?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Project Key</p>
            <p className="text-sm font-medium text-gray-900 font-mono">{projectData?.key}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Status</p>
            <Badge
              variant={
                project.status === 'active'
                  ? 'success'
                  : project.status === 'completed'
                  ? 'default'
                  : project.status === 'planning'
                  ? 'warning'
                  : 'error'
              }
              size="sm"
            >
              {project.status}
            </Badge>
          </div>
        </div>
        {(canEditProject(projectData) || canDeleteProject) && (
          <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
            {canEditProject(projectData) && (
              <Button variant="primary" onClick={onEdit}>
                Edit Project
              </Button>
            )}
            {canDeleteProject && (
              <Button variant="error" onClick={onDelete}>
                Delete Project
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

