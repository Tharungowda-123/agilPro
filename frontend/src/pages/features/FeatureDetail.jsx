import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Sparkles, Plus, Target, TrendingUp, FileText, Zap } from 'lucide-react'
import {
  useFeature,
  useUpdateFeature,
  useDeleteFeature,
  useBreakdownFeature,
  useAcceptBreakdown,
  useAutoBreakdownAndCreate,
  useFeatureProgress,
} from '@/hooks/api/useFeatures'
import { useStories } from '@/hooks/api/useStories'
import { useRole } from '@/hooks/useRole'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/layout/EmptyState'
import FeatureFormModal from '@/components/features/FeatureFormModal'
import FeatureBreakdownWizard from '@/components/features/FeatureBreakdownWizard'
import NLPInsights from '@/components/features/NLPInsights'
import StoryDetailModal from '@/components/story/StoryDetailModal'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'

/**
 * FeatureDetail Page
 * Detailed view of a feature with AI insights, child stories, and progress
 */
export default function FeatureDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEditProject, canDeleteProject, isViewer } = useRole()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isBreakdownWizardOpen, setIsBreakdownWizardOpen] = useState(false)
  const [selectedStoryId, setSelectedStoryId] = useState(null)

  const { data: featureData, isLoading, refetch: refetchFeature } = useFeature(id)
  const { data: progressData } = useFeatureProgress(id)
  const updateFeature = useUpdateFeature()
  const deleteFeature = useDeleteFeature()
  const breakdownFeature = useBreakdownFeature()
  const acceptBreakdown = useAcceptBreakdown()
  const autoBreakdownAndCreate = useAutoBreakdownAndCreate()

  const feature = featureData?.feature || featureData?.data?.feature || featureData
  const projectId = feature?.project?._id || feature?.project?.id || feature?.project
  const { data: storiesData } = useStories(projectId)
  const allStories = Array.isArray(storiesData?.data) ? storiesData.data : storiesData || []
  const featureStories = feature?.stories || []

  const handleUpdate = (data) => {
    updateFeature.mutate(
      { featureId: id, data },
      {
        onSuccess: () => {
          setIsEditModalOpen(false)
        },
      }
    )
  }

  const handleDelete = () => {
    if (window.confirm('Delete this feature? Choose an option:\n\nOK = Delete with all child stories\nCancel = Orphan stories (remove feature reference)')) {
      deleteFeature.mutate(
        { featureId: id, deleteChildren: true },
        {
          onSuccess: () => {
            navigate('/features')
          },
        }
      )
    } else {
      deleteFeature.mutate(
        { featureId: id, deleteChildren: false },
        {
          onSuccess: () => {
            navigate('/features')
          },
        }
      )
    }
  }

  const handleBreakdown = () => {
    setIsBreakdownWizardOpen(true)
  }

  const handleInstantBreakdown = async () => {
    // Use the one-click auto-breakdown-and-create endpoint
    autoBreakdownAndCreate.mutate(
      { featureId: id },
      {
        onSuccess: () => {
          refetchFeature()
        },
      }
    )
  }

  const handleBreakdownSuccess = () => {
    refetchFeature()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!feature) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Target className="w-16 h-16" />}
          title="Feature Not Found"
          description="The feature you're looking for doesn't exist or has been deleted."
          action={
            <Button variant="primary" onClick={() => navigate('/features')}>
              Back to Features
            </Button>
          }
        />
      </div>
    )
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

  const progress = progressData?.progress || {}
  const stories = progressData?.stories || {}

  const canEdit = canEditProject && !isViewer
  const canDelete = canDeleteProject && !isViewer

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="outlined"
            onClick={() => navigate('/features')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{feature.title}</h1>
              <Badge className={priorityColors[feature.priority] || priorityColors.medium}>
                {feature.priority || 'medium'}
              </Badge>
              <Badge className={statusColors[feature.status] || statusColors.draft}>
                {feature.status || 'draft'}
              </Badge>
            </div>
            {feature.description && (
              <p className="text-gray-600 dark:text-gray-400 max-w-3xl">{feature.description}</p>
            )}
            {feature.businessValue && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Value:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.businessValue}</p>
              </div>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={handleInstantBreakdown}
              leftIcon={<Zap className="w-4 h-4" />}
              loading={autoBreakdownAndCreate.isPending}
            >
              Auto-Breakdown & Create
            </Button>
            <Button
              variant="outlined"
              onClick={handleBreakdown}
              leftIcon={<Sparkles className="w-4 h-4" />}
              loading={breakdownFeature.isPending}
            >
              Breakdown with AI
            </Button>
            <Button variant="outlined" onClick={() => setIsEditModalOpen(true)} leftIcon={<Edit className="w-4 h-4" />}>
              Edit
            </Button>
            {canDelete && (
              <Button
                variant="danger"
                onClick={handleDelete}
                leftIcon={<Trash2 className="w-4 h-4" />}
                loading={deleteFeature.isPending}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Progress Overview */}
      {stories.total > 0 && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {progress.byStories || 0}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Stories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stories.completed || 0}/{stories.total || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estimated Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {feature.estimatedStoryPoints || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Actual Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {feature.actualStoryPoints || 0}
              </p>
            </div>
          </div>
          {stories.total > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all"
                  style={{ width: `${progress.byStories || 0}%` }}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Acceptance Criteria */}
          {feature.acceptanceCriteria && feature.acceptanceCriteria.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Acceptance Criteria</h2>
              <ul className="space-y-2">
                {feature.acceptanceCriteria.map((criterion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span className="text-gray-700 dark:text-gray-300">{criterion}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* AI Insights - Advanced NLP Analysis */}
          {feature.aiInsights && (
            <>
              {/* Advanced NLP Insights */}
              {feature.aiInsights.nlp_analysis && (
                <NLPInsights analysis={feature.aiInsights.nlp_analysis} />
              )}
              
              {/* Legacy AI Insights (fallback) */}
              {!feature.aiInsights.nlp_analysis && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary-600" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Insights</h2>
                    </div>
                    {canEdit && (
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={handleBreakdown}
                        leftIcon={<Sparkles className="w-3 h-3" />}
                      >
                        Re-analyze
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {feature.aiInsights.complexity !== undefined && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Complexity Score</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {feature.aiInsights.complexity}/10
                        </p>
                      </div>
                    )}
                    {feature.aiInsights.identifiedPersonas && feature.aiInsights.identifiedPersonas.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Identified Personas</p>
                        <div className="flex flex-wrap gap-2">
                          {feature.aiInsights.identifiedPersonas.map((persona, index) => (
                            <Badge key={index} variant="outline">
                              {persona}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {feature.aiInsights.extractedRequirements && feature.aiInsights.extractedRequirements.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Extracted Requirements</p>
                        <ul className="space-y-1">
                          {feature.aiInsights.extractedRequirements.map((req, index) => (
                            <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feature.aiInsights.analyzedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Analyzed: {new Date(feature.aiInsights.analyzedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Child Stories */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Child Stories</h2>
              {canEdit && (
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={() => navigate(`/projects/${projectId}?tab=backlog&feature=${id}`)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Story
                </Button>
              )}
            </div>
            {featureStories.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-12 h-12" />}
                title="No stories yet"
                description="Break down this feature into stories using AI or add them manually."
                action={
                  canEdit ? (
                    <Button variant="primary" onClick={handleBreakdown}>
                      Breakdown with AI
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="space-y-3">
                {featureStories.map((story) => {
                  const storyId = story._id || story.id
                  const fullStory = allStories.find((s) => (s._id || s.id) === storyId) || story
                  return (
                    <div
                      key={storyId}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedStoryId(storyId)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {fullStory.title || story.title}
                            </h3>
                            {fullStory.storyId && (
                              <Badge variant="outline" className="text-xs">
                                {fullStory.storyId}
                              </Badge>
                            )}
                          </div>
                          {fullStory.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {fullStory.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {fullStory.storyPoints !== undefined && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {fullStory.storyPoints} pts
                              </span>
                            )}
                            {fullStory.status && (
                              <Badge
                                className={cn(
                                  fullStory.status === 'done'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                )}
                              >
                                {fullStory.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Details</h2>
            <div className="space-y-4">
              {feature.project && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Project</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {feature.project.name || feature.project}
                  </p>
                </div>
              )}
              {feature.createdBy && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created By</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {feature.createdBy.name || feature.createdBy}
                  </p>
                </div>
              )}
              {feature.createdAt && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(feature.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {feature.updatedAt && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(feature.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {canEdit && (
        <>
          <FeatureFormModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={handleUpdate}
            loading={updateFeature.isPending}
            feature={feature}
          />
          <FeatureBreakdownWizard
            isOpen={isBreakdownWizardOpen}
            onClose={() => setIsBreakdownWizardOpen(false)}
            featureId={id}
            onSuccess={handleBreakdownSuccess}
          />
        </>
      )}

      {selectedStoryId && (
        <StoryDetailModal
          storyId={selectedStoryId}
          isOpen={!!selectedStoryId}
          onClose={() => setSelectedStoryId(null)}
        />
      )}
    </div>
  )
}

