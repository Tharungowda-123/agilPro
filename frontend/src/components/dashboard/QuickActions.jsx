import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { FolderPlus, FileText, Play, Kanban, Brain } from 'lucide-react'
import { useRole } from '@/hooks/useRole'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/utils'

/**
 * QuickActions Component
 * Grid of quick action buttons for common tasks
 * 
 * @example
 * <QuickActions />
 */
export default function QuickActions({ className = '', onOpenAIRecommendations }) {
  const navigate = useNavigate()
  const { canCreateProject, canCreateSprint, canManageStories, isViewer } = useRole()

  // Build actions based on permissions
  const allActions = [
    {
      id: 'create-project',
      label: 'Create Project',
      icon: FolderPlus,
      onClick: () => navigate('/projects?modal=createProject'),
      color: 'primary',
      show: canCreateProject,
    },
    {
      id: 'ai-recommendations',
      label: 'AI Recommendations',
      icon: Brain,
      onClick: () => {
        if (typeof onOpenAIRecommendations === 'function') {
          onOpenAIRecommendations()
        } else {
          navigate('/ai/recommendations')
        }
      },
      color: 'purple',
      show: !isViewer,
    },
    {
      id: 'create-story',
      label: 'Create Story',
      icon: FileText,
      onClick: () => navigate('/board?modal=createStory'),
      color: 'success',
      show: canManageStories,
    },
    {
      id: 'start-sprint',
      label: 'Start Sprint',
      icon: Play,
      onClick: () => navigate('/sprints?modal=createSprint'),
      color: 'warning',
      show: canCreateSprint,
    },
    {
      id: 'view-board',
      label: 'View Board',
      icon: Kanban,
      onClick: () => navigate('/board'),
      color: 'info',
      show: !isViewer, // All non-viewers can view board
    },
  ]

  // Filter actions based on permissions
  const actions = allActions.filter((action) => action.show !== false)

  return (
    <Card className={cn('p-6', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Quick Actions</h3>
        <p className="text-sm text-gray-600">Common tasks and shortcuts</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.id}
              variant="outlined"
              onClick={action.onClick}
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          )
        })}
      </div>
    </Card>
  )
}

QuickActions.propTypes = {
  className: PropTypes.string,
  onOpenAIRecommendations: PropTypes.func,
}

