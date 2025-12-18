import { useState, useEffect } from 'react'
import { Sparkles, CheckCircle, ChevronRight, Loader2, FileText } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { useBreakdownFeature, useAcceptBreakdown } from '@/hooks/api/useFeatures'
import { cn } from '@/utils'

/**
 * Feature Breakdown Wizard
 * Multi-step wizard for AI-powered feature breakdown
 */
export default function FeatureBreakdownWizard({ isOpen, onClose, featureId, onSuccess }) {
  const [step, setStep] = useState(1) // 1: Analysis, 2: Review, 3: Confirmation
  const [selectedStories, setSelectedStories] = useState([])
  const [breakdownData, setBreakdownData] = useState(null)
  const [analysisProgress, setAnalysisProgress] = useState('')

  const breakdownMutation = useBreakdownFeature()
  const acceptMutation = useAcceptBreakdown()

  useEffect(() => {
    if (isOpen && featureId) {
      setStep(1)
      setSelectedStories([])
      setBreakdownData(null)
      setAnalysisProgress('')
      // Start breakdown automatically
      handleBreakdown()
    }
  }, [isOpen, featureId])

  const handleBreakdown = async () => {
    setAnalysisProgress('Identifying personas...')
    await new Promise((resolve) => setTimeout(resolve, 500))

    setAnalysisProgress('Extracting requirements...')
    await new Promise((resolve) => setTimeout(resolve, 500))

    setAnalysisProgress('Generating stories...')
    await new Promise((resolve) => setTimeout(resolve, 500))

    setAnalysisProgress('Creating tasks...')

    breakdownMutation.mutate(
      { featureId },
      {
        onSuccess: (response) => {
          const data = response.data || response
          setBreakdownData(data)
          setStep(2)
          // Select all stories by default
          const stories = data.suggestedBreakdown?.stories || []
          setSelectedStories(stories.map((_, index) => index))
        },
        onError: () => {
          setStep(1) // Stay on analysis step on error
        },
      }
    )
  }

  const handleToggleStory = (index) => {
    setSelectedStories((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const handleAcceptAll = () => {
    acceptMutation.mutate(
      {
        featureId,
        createAll: true,
      },
      {
        onSuccess: () => {
          setStep(3)
          setTimeout(() => {
            onSuccess?.()
            onClose()
          }, 2000)
        },
      }
    )
  }

  const handleAcceptSelected = () => {
    acceptMutation.mutate(
      {
        featureId,
        storyIds: selectedStories,
        createAll: false,
      },
      {
        onSuccess: () => {
          setStep(3)
          setTimeout(() => {
            onSuccess?.()
            onClose()
          }, 2000)
        },
      }
    )
  }

  const stories = breakdownData?.suggestedBreakdown?.stories || []
  const analysis = breakdownData?.analysis || {}
  const totalStories = stories.length
  const totalTasks = stories.reduce((sum, story) => sum + (story.tasks?.length || 0), 0)
  const totalPoints = stories.reduce((sum, story) => sum + (story.estimated_points || story.estimatedPoints || 0), 0)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Feature Breakdown" size="xl">
      <div className="space-y-6">
        {/* Step 1: AI Analysis */}
        {step === 1 && (
          <div className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-primary-600 animate-spin" />
                <Sparkles className="w-8 h-8 text-primary-400 absolute top-4 right-4" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              AI is analyzing feature...
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{analysisProgress || 'Initializing...'}</p>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <p>✓ Identifying personas</p>
              <p>✓ Extracting requirements</p>
              <p className={analysisProgress.includes('Generating') ? 'text-primary-600' : ''}>
                {analysisProgress.includes('Generating') ? '⏳' : '✓'} Generating stories
              </p>
              <p className={analysisProgress.includes('Creating') ? 'text-primary-600' : ''}>
                {analysisProgress.includes('Creating') ? '⏳' : '✓'} Creating tasks
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Review Breakdown */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-4 bg-primary-50 dark:bg-primary-900/20">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary-600">{totalStories}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stories</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">{totalTasks}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tasks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">{totalPoints}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Points</p>
                </div>
              </div>
            </Card>

            {/* AI Insights */}
            {analysis.personas && analysis.personas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Identified Personas</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.personas.map((persona, idx) => (
                    <Badge key={idx} variant="outline">
                      {persona}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Stories List */}
            <StoriesList
              stories={stories}
              selectedStories={selectedStories}
              onToggleStory={handleToggleStory}
            />

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outlined" onClick={onClose}>
                Cancel
              </Button>
              <div className="flex gap-3">
                <Button variant="outlined" onClick={handleBreakdown} disabled={breakdownMutation.isPending}>
                  Re-analyze
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAcceptSelected}
                  disabled={selectedStories.length === 0 || acceptMutation.isPending}
                  loading={acceptMutation.isPending}
                >
                  Accept Selected ({selectedStories.length})
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAcceptAll}
                  disabled={acceptMutation.isPending}
                  loading={acceptMutation.isPending}
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Breakdown Complete!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Created {acceptMutation.data?.stories?.length || totalStories} stories with{' '}
              {acceptMutation.data?.tasksCount || totalTasks} tasks
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Stories List Component (separate to handle useState properly)
function StoriesList({ stories, selectedStories, onToggleStory }) {
  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {stories.map((story, index) => {
        const isSelected = selectedStories.includes(index)
        const tasks = story.tasks || []
        return (
          <StoryCard
            key={index}
            story={story}
            index={index}
            isSelected={isSelected}
            tasks={tasks}
            onToggle={onToggleStory}
          />
        )
      })}
    </div>
  )
}

// Story Card Component
function StoryCard({ story, index, isSelected, tasks, onToggle }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all',
        isSelected ? 'border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''
      )}
      onClick={() => onToggle(index)}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(index)}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">{story.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{story.description}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge>{story.estimated_points || story.estimatedPoints || 0} pts</Badge>
              <Badge variant="outline">{tasks.length} tasks</Badge>
            </div>
          </div>

          {/* Acceptance Criteria */}
          {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Acceptance Criteria:
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {story.acceptance_criteria.slice(0, 2).map((criteria, idx) => (
                  <li key={idx}>• {criteria}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tasks (Expandable) */}
          {tasks.length > 0 && (
            <div className="mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded(!expanded)
                }}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <ChevronRight className={cn('w-4 h-4 transition-transform', expanded && 'rotate-90')} />
                {tasks.length} tasks
              </button>
              {expanded && (
                <div className="mt-2 ml-5 space-y-2">
                  {tasks.map((task, taskIdx) => (
                    <div
                      key={taskIdx}
                      className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{task.title}</span>
                      {(task.estimated_hours || task.estimatedHours) && (
                        <span className="text-xs text-gray-500">
                          ({(task.estimated_hours || task.estimatedHours)}h)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

