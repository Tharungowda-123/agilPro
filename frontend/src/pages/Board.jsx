import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Filter, Users, AlertCircle, Calendar, FileSpreadsheet } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStories } from '@/hooks/api/useStories'
import { useCreateStory, useUpdateStory, useDeleteStory } from '@/hooks/api/useStories'
import { useSprints } from '@/hooks/api/useSprints'
import { useUsers } from '@/hooks/api/useUsers'
import { useProjects } from '@/hooks/api/useProjects'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRole } from '@/hooks/useRole'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import KanbanBoard from '@/components/kanban/KanbanBoard'
import FilterSidebar from '@/components/kanban/FilterSidebar'
import StoryDetailModal from '@/components/story/StoryDetailModal'
import TaskDetailModal from '@/components/story/TaskDetailModal'
import QuickCreateStoryModal from '@/components/story/QuickCreateStoryModal'
import Spinner from '@/components/ui/Spinner'
import { toast } from 'react-hot-toast'
import Dropdown from '@/components/ui/Dropdown'
import { useExportStoriesExcel, useExportTasksExcel } from '@/hooks/api/useExport'

/**
 * Board Page
 * Advanced Kanban board with drag-and-drop, filters, and real-time updates
 */
export default function Board() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const { isDeveloper, canManageStories } = useRole()
  const [selectedSprint, setSelectedSprint] = useState(null)
  const [groupBy, setGroupBy] = useState('status')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({})
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  const searchParams = new URLSearchParams(location.search)
  const urlProjectId = searchParams.get('projectId')
  const urlStoryId = searchParams.get('storyId')
  const urlTaskId = searchParams.get('taskId')
  const modalParam = searchParams.get('modal')
  
  // Fetch projects to get a default project if none selected
  const { data: projectsData } = useProjects({ limit: 100 }) // Increase limit to show all projects
  const projects = projectsData?.data || projectsData || []

  // Set projectId: from URL, selected, or first available project
  const projectId = urlProjectId || selectedProjectId || (projects.length > 0 ? (projects[0]._id || projects[0].id) : null)
  
  // Prepare project options for Select component
  const projectOptions = projects.map((project) => ({
    value: project._id || project.id,
    label: project.name || 'Unnamed Project',
  }))

  // Update selected project when URL changes
  useEffect(() => {
    if (urlProjectId && urlProjectId !== selectedProjectId) {
      setSelectedProjectId(urlProjectId)
    } else if (!urlProjectId && projects.length > 0 && !selectedProjectId) {
      const firstProjectId = projects[0]._id || projects[0].id
      if (firstProjectId) {
        setSelectedProjectId(firstProjectId)
      }
    }
  }, [urlProjectId, projects, selectedProjectId])

  useEffect(() => {
    if (urlStoryId) {
      setSelectedStoryId(urlStoryId)
    } else if (!urlStoryId) {
      setSelectedStoryId(null)
    }
  }, [urlStoryId])

  useEffect(() => {
    if (urlTaskId) {
      setSelectedTaskId(urlTaskId)
    } else if (!urlTaskId) {
      setSelectedTaskId(null)
    }
  }, [urlTaskId])

  useEffect(() => {
    if (modalParam === 'createStory') {
      setIsCreateStoryModalOpen(true)
    } else {
      setIsCreateStoryModalOpen(false)
    }
  }, [modalParam])

  const updateSearchParams = useCallback(
    (mutator) => {
      const params = new URLSearchParams(location.search)
      mutator(params)
      const nextSearch = params.toString()
      const target = nextSearch ? `${location.pathname}?${nextSearch}` : location.pathname
      navigate(target, { replace: true })
    },
    [location.pathname, location.search, navigate]
  )

  // Fetch data
  // For developers, backend filters stories to only show those with tasks assigned to them
  // If no projectId, fetch all stories (backend will filter by developer's tasks)
  const { data: storiesData, isLoading: storiesLoading } = useStories(projectId || undefined, {
    sprintId: selectedSprint,
    limit: 100, // Increase limit to show more stories
  })
  const { data: sprintsData } = useSprints(projectId)
  const { data: usersData } = useUsers()
  const createStory = useCreateStory()
  const updateStory = useUpdateStory()
  const deleteStory = useDeleteStory()
  const exportStoriesExcel = useExportStoriesExcel()
  const exportTasksExcel = useExportTasksExcel()

  // Extract data from response objects
  const stories = Array.isArray(storiesData) ? storiesData : storiesData?.data || []
  const sprints = Array.isArray(sprintsData) ? sprintsData : sprintsData?.data || sprintsData || []
  const users = Array.isArray(usersData) ? usersData : usersData?.data || usersData || []

  // Apply filters
  const filteredStories = useMemo(() => {
    let filtered = [...stories]

    // For developers, backend already filters stories with tasks assigned to them
    // But we can do additional client-side filtering if needed
    // Note: Backend now populates tasks for developers, so stories.tasks should have assigned tasks
    if (isDeveloper && user) {
      const userId = user._id || user.id
      filtered = filtered.filter((story) => {
        // Check if story has tasks assigned to this user (backend should have filtered, but double-check)
        if (story.tasks && Array.isArray(story.tasks) && story.tasks.length > 0) {
          return story.tasks.some((task) => {
            const assignedToId = task.assignedTo?._id || task.assignedTo || task.assignedToId
            return assignedToId && assignedToId.toString() === userId.toString()
          })
        }
        // Or if story itself is assigned to user
        const assignedToId = story.assignedTo?._id || story.assignedTo || story.assignedToId
        return assignedToId && assignedToId.toString() === userId.toString()
      })
    }

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter((s) => s.title.toLowerCase().includes(search))
    }

    if (filters.assignees && filters.assignees.length > 0) {
      filtered = filtered.filter((s) => filters.assignees.includes(s.assignedTo))
    }

    if (filters.priorities && filters.priorities.length > 0) {
      filtered = filtered.filter((s) => filters.priorities.includes(s.priority))
    }

    if (filters.minPoints) {
      filtered = filtered.filter((s) => s.storyPoints >= filters.minPoints)
    }

    if (filters.maxPoints) {
      filtered = filtered.filter((s) => s.storyPoints <= filters.maxPoints)
    }

    if (filters.sprintId) {
      filtered = filtered.filter((s) => s.sprintId === filters.sprintId)
    }

    return filtered
  }, [stories, filters])

  // Enhance stories with additional data and map statuses
  const enhancedStories = useMemo(() => {
    return filteredStories.map((story) => {
      // Map status to match Kanban columns
      // Valid story statuses: 'backlog', 'ready', 'in-progress', 'review', 'done'
      // Also handle 'todo' (maps to 'backlog') and 'in_progress' (normalize to 'in-progress')
      let mappedStatus = story.status || 'backlog'
      
      // Normalize status values
      if (mappedStatus === 'todo') {
        mappedStatus = 'backlog'
      } else if (mappedStatus === 'in_progress') {
        mappedStatus = 'in-progress' // Normalize underscore to hyphen
      } else if (!['backlog', 'ready', 'in-progress', 'review', 'done'].includes(mappedStatus)) {
        // If status is invalid, default to backlog
        mappedStatus = 'backlog'
      }
      
      const storyId = story._id || story.id
      const assignedToId = story.assignedTo?._id || story.assignedTo || story.assignedToId
      
      return {
        ...story,
        id: storyId, // Ensure id is set for compatibility
        _id: storyId, // Keep _id as well
        status: mappedStatus, // This will be used to group stories into columns
        assignedToName: users?.find((u) => {
          const userId = u._id || u.id
          return userId && assignedToId && userId.toString() === assignedToId.toString()
        })?.name,
        tasks: story.tasks || [], // Mock tasks - would come from API
        dependencies: story.dependencies || [], // Mock dependencies
        commentsCount: story.commentsCount || 0, // Mock comments count
      }
    })
  }, [filteredStories, users])

  const handleStoryUpdate = (story) => {
    const storyId = story._id || story.id
    if (!storyId) return
    
    updateStory.mutate(
      {
        id: storyId,
        data: { status: story.status },
      },
      {
        onSuccess: () => {
          toast.success('Story updated')
        },
      }
    )
  }

  const handleStoryAdd = (storyData) => {
    if (!projectId) {
      toast.error('Please select a project first')
      return
    }

    createStory.mutate(
      {
        ...storyData,
        projectId: projectId,
        sprintId: selectedSprint,
      },
      {
        onSuccess: () => {
          toast.success('Story created!')
        },
      }
    )
  }

  const handleProjectChange = (newProjectId) => {
    // Clear story and task modals when switching projects
    if (selectedStoryId) {
      setSelectedStoryId(null)
    }
    if (selectedTaskId) {
      setSelectedTaskId(null)
    }
    
    // Update selected project
    const projectIdToSet = newProjectId && newProjectId !== '' ? newProjectId : null
    setSelectedProjectId(projectIdToSet)
    
    // Update URL
    updateSearchParams((params) => {
      // Clear story and task from URL when switching projects
      params.delete('storyId')
      params.delete('taskId')
      
      if (projectIdToSet) {
        params.set('projectId', projectIdToSet)
      } else {
        params.delete('projectId')
      }
    })
    
    // Reset sprint selection when switching projects
    setSelectedSprint(null)
    
    // Show feedback
    if (projectIdToSet) {
      const projectName = projects.find(p => (p._id || p.id) === projectIdToSet)?.name
      toast.success(`Switched to project: ${projectName || 'Selected Project'}`)
    }
  }

  const handleStoryEdit = (story) => {
    // TODO: Open edit modal
    toast.info('Edit story feature coming soon')
  }

  const handleStoryDelete = (story) => {
    const storyId = story._id || story.id
    if (!storyId) return
    
    if (window.confirm(`Delete story "${story.title}"?`)) {
      deleteStory.mutate(storyId, {
        onSuccess: () => {
          toast.success('Story deleted')
        },
      })
    }
  }

  const handleExportBoardStories = () => {
    if (!projectId) {
      toast.error('Select a project to export stories')
      return
    }
    exportStoriesExcel.mutate({
      projectId,
      sprintId: selectedSprint || undefined,
    })
  }

  const handleExportBoardTasks = () => {
    if (!projectId) {
      toast.error('Select a project to export tasks')
      return
    }
    exportTasksExcel.mutate({
      projectId,
      sprintId: selectedSprint || undefined,
    })
  }

  const [selectedStoryId, setSelectedStoryId] = useState(urlStoryId)
  const [selectedTaskId, setSelectedTaskId] = useState(urlTaskId)
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false)

  const handleStoryClick = (story) => {
    const storyId = story._id || story.id
    if (storyId) {
      setSelectedStoryId(storyId)
      updateSearchParams((params) => {
        params.set('storyId', storyId)
      })
    }
  }

  const handleCloseStoryModal = () => {
    setSelectedStoryId(null)
    updateSearchParams((params) => {
      params.delete('storyId')
    })
  }

  const handleCloseTaskModal = () => {
    setSelectedTaskId(null)
    updateSearchParams((params) => {
      params.delete('taskId')
    })
  }

  const handleOpenCreateStoryModal = () => {
    setIsCreateStoryModalOpen(true)
    updateSearchParams((params) => {
      params.set('modal', 'createStory')
    })
  }

  const handleCloseCreateStoryModal = () => {
    setIsCreateStoryModalOpen(false)
    updateSearchParams((params) => {
      if (params.get('modal') === 'createStory') {
        params.delete('modal')
      }
    })
  }

  const appliedFiltersCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'string') return v.trim() !== ''
    return v !== null && v !== undefined
  }).length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Board</h1>
            {projectId && (
              <Badge variant="primary" size="md">
                {projects.find(p => (p._id || p.id) === projectId)?.name || 'Selected Project'}
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            {projectId 
              ? `Managing stories for: ${projects.find(p => (p._id || p.id) === projectId)?.name || 'Selected Project'}`
              : 'Manage your stories with Kanban board - Select a project to view stories'}
          </p>
        </div>
        <div className="flex items-start gap-3 flex-wrap">
          {projects.length > 0 && (
            <div className="w-full sm:w-64 min-w-[240px]">
              <Select
                label="Switch Project"
                options={projectOptions}
                value={projectId || ''}
                onChange={(value) => handleProjectChange(value || null)}
                placeholder="Select a project to view"
                className="w-full"
                required
                searchable={projects.length > 5}
              />
            </div>
          )}
          {projectId && (
            <div className="w-full sm:w-48">
              <Select
                label="Sprint"
                options={[
                  { value: 'all', label: 'All Sprints' },
                  ...(sprints?.map((sprint) => ({
                    value: sprint._id || sprint.id,
                    label: sprint.name || 'Unnamed Sprint',
                  })) || [])
                ]}
                value={selectedSprint || 'all'}
                onChange={(value) => setSelectedSprint(value === 'all' ? null : value)}
                placeholder="Select sprint"
                className="w-full"
              />
            </div>
          )}
          <div className="w-full sm:w-40">
            <Select
              label="Group By"
              options={[
                { value: 'status', label: 'Group by Status' },
                { value: 'assignee', label: 'Group by Assignee' },
                { value: 'priority', label: 'Group by Priority' },
              ]}
              value={groupBy}
              onChange={(value) => setGroupBy(value)}
              className="w-full"
            />
          </div>
          {projectId && (
            <Dropdown
              trigger={
                <Button
                  variant="outlined"
                  leftIcon={<FileSpreadsheet className="w-4 h-4" />}
                >
                  Export
                </Button>
              }
              items={[
                {
                  label: exportStoriesExcel.isPending ? 'Exporting stories…' : 'Stories (.xlsx)',
                  onClick: handleExportBoardStories,
                  disabled: exportStoriesExcel.isPending,
                },
                {
                  label: exportTasksExcel.isPending ? 'Exporting tasks…' : 'Tasks (.xlsx)',
                  onClick: handleExportBoardTasks,
                  disabled: exportTasksExcel.isPending,
                },
              ]}
              position="bottom-right"
            />
          )}
          <Button
            variant="outlined"
            onClick={() => setIsFilterOpen(true)}
            leftIcon={<Filter className="w-4 h-4" />}
          >
            Filters
            {appliedFiltersCount > 0 && (
              <Badge variant="primary" size="sm" className="ml-2">
                {appliedFiltersCount}
              </Badge>
            )}
          </Button>
          {projectId && canManageStories && (
            <Button
              variant="primary"
              onClick={handleOpenCreateStoryModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Story
            </Button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      {!projectId ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">Please select a project to view stories</p>
          {projects.length === 0 && (
            <Button variant="primary" onClick={() => navigate('/projects')}>
              Create Your First Project
            </Button>
          )}
        </div>
      ) : storiesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" color="primary" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
          <KanbanBoard
            stories={enhancedStories}
            onStoryUpdate={handleStoryUpdate}
            onStoryAdd={handleStoryAdd}
            onStoryEdit={handleStoryEdit}
            onStoryDelete={handleStoryDelete}
            onStoryClick={handleStoryClick}
          />
        </div>
      )}

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        users={users || []}
        sprints={sprints || []}
      />

      {/* Story Detail Modal */}
      {selectedStoryId && (
        <StoryDetailModal
          isOpen={!!selectedStoryId}
          onClose={handleCloseStoryModal}
          storyId={selectedStoryId}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          isOpen={!!selectedTaskId}
          onClose={handleCloseTaskModal}
          taskId={selectedTaskId}
        />
      )}

      <QuickCreateStoryModal
        isOpen={isCreateStoryModalOpen}
        onClose={handleCloseCreateStoryModal}
        defaultProjectId={projectId || ''}
      />
    </div>
  )
}
