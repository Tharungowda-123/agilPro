import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Dialog } from '@headlessui/react'
import { toast } from 'react-hot-toast'
import { useProjects } from '@/hooks/api/useProjects'
import { useCreateStory } from '@/hooks/api/useStories'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Button from '@/components/ui/Button'

/**
 * QuickCreateStoryModal Component
 * Lightweight modal for creating a story from anywhere (e.g., dashboard quick actions)
 */
export default function QuickCreateStoryModal({ isOpen, onClose, defaultProjectId }) {
  const { data: projectsData, isLoading: projectsLoading } = useProjects({ limit: 100 })
  const projects = useMemo(() => projectsData?.data || projectsData || [], [projectsData])
  const createStory = useCreateStory()

  const [projectId, setProjectId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [storyPoints, setStoryPoints] = useState('3')

  useEffect(() => {
    if (isOpen) {
      setProjectId(defaultProjectId || projects[0]?._id || projects[0]?.id || '')
      setTitle('')
      setDescription('')
      setPriority('medium')
      setStoryPoints('3')
    }
  }, [isOpen, defaultProjectId, projects])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!projectId) {
      toast.error('Select a project')
      return
    }
    if (!title.trim()) {
      toast.error('Enter a story title')
      return
    }

    createStory.mutate(
      {
        projectId,
        title: title.trim(),
        description: description.trim(),
        priority,
        storyPoints: Number(storyPoints),
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[115]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Create Story
              </Dialog.Title>
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Esc
              </Button>
            </div>

            <Select
              label="Project"
              disabled={projectsLoading || projects.length === 0}
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              options={[
                { value: '', label: projectsLoading ? 'Loading projects...' : 'Select project' },
                ...projects.map((project) => ({
                  value: project._id || project.id,
                  label: project.name,
                })),
              ]}
              required
            />

            <Input
              label="Story Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Implement payment webhook..."
              required
            />

            <TextArea
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Add acceptance criteria or background context..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Story Points"
                value={storyPoints}
                onChange={(event) => setStoryPoints(event.target.value)}
                options={['1', '2', '3', '5', '8', '13'].map((value) => ({
                  value,
                  label: `${value} pts`,
                }))}
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
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={createStory.isPending}>
                Create Story
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

QuickCreateStoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  defaultProjectId: PropTypes.string,
}


