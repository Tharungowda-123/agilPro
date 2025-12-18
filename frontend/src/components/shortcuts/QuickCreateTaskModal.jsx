import { useState, useEffect, useMemo } from 'react'
import { Dialog } from '@headlessui/react'
import { useProjects } from '@/hooks/api/useProjects'
import { useStories } from '@/hooks/api/useStories'
import { useCreateTask } from '@/hooks/api/useTasks'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useShortcutAction } from '@/context/ShortcutContext'
import { toast } from 'react-hot-toast'

export default function QuickCreateTaskModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [storyId, setStoryId] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [notes, setNotes] = useState('')

  const { data: projectsData } = useProjects({ limit: 100 })
  const projects = useMemo(() => projectsData?.data || projectsData || [], [projectsData])

  const { data: storiesData } = useStories(projectId || undefined, { status: 'todo' })
  const stories = storiesData?.data || storiesData || []

  const createTask = useCreateTask()

  useShortcutAction(
    'task.new',
    () => {
      setIsOpen(true)
    },
    { enabled: true }
  )

  useEffect(() => {
    if (!isOpen) {
      setProjectId('')
      setStoryId('')
      setTitle('')
      setPriority('medium')
      setNotes('')
    }
  }, [isOpen])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!storyId || !title.trim()) {
      toast.error('Select a story and enter a task title')
      return
    }

    createTask.mutate(
      {
        storyId,
        title: title.trim(),
        description: notes,
        priority,
      },
      {
        onSuccess: () => {
          toast.success('Task created')
          setIsOpen(false)
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-[115]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-surface border theme-border shadow-2xl">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Create Task
              </Dialog.Title>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                Esc
              </Button>
            </div>
            <Select
              label="Project"
              value={projectId}
              onChange={(event) => {
                setProjectId(event.target.value)
                setStoryId('')
              }}
              options={[
                { value: '', label: 'Select project' },
                ...projects.map((project) => ({
                  value: project._id || project.id,
                  label: project.name,
                })),
              ]}
              required
            />
            <Select
              label="Story"
              value={storyId}
              onChange={(event) => setStoryId(event.target.value)}
              disabled={!projectId}
              options={[
                { value: '', label: projectId ? 'Select story' : 'Select project first' },
                ...stories.map((story) => ({
                  value: story._id || story.id,
                  label: story.title || story.name,
                })),
              ]}
              required
            />
            <Input
              label="Task title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Implement API endpoint..."
              required
            />
            <Select
              label="Priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="Add extra context..."
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={createTask.isPending}>
                Create Task
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

