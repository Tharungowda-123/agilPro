import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Trash2, Edit3, Star } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import FormGroup from '@/components/ui/FormGroup'
import Spinner from '@/components/ui/Spinner'
import {
  useSprintTemplates,
  useCreateSprintTemplate,
  useUpdateSprintTemplate,
  useDeleteSprintTemplate,
  useSetDefaultSprintTemplate,
} from '@/hooks/api/useSprintTemplates'
import { useTeams } from '@/hooks/api/useTeams'
import { cn } from '@/utils'

const STATUS_OPTIONS = ['backlog', 'ready', 'in-progress', 'review', 'done']
const PRIORITY_OPTIONS = ['high', 'medium', 'low']

const initialFormState = {
  name: '',
  description: '',
  durationDays: 14,
  capacity: 80,
  statuses: ['ready'],
  priorities: ['high', 'medium'],
  limit: 20,
  includeUnassignedOnly: false,
  includeCompleted: false,
  autoSelect: true,
  sharedWithTeams: [],
  isGlobal: false,
}

export default function SprintTemplateManagerModal({
  isOpen,
  onClose,
  projectId,
}) {
  const [formState, setFormState] = useState(initialFormState)
  const [editingTemplateId, setEditingTemplateId] = useState(null)

  const { data: templateData, isLoading } = useSprintTemplates(projectId, {
    includeShared: true,
  })
  const templates = templateData?.templates || []

  const { data: teamsData } = useTeams({ limit: 100 })
  const teams = useMemo(() => {
    if (Array.isArray(teamsData)) {
      return teamsData
    }
    return teamsData?.data || []
  }, [teamsData])

  const createTemplate = useCreateSprintTemplate()
  const updateTemplate = useUpdateSprintTemplate()
  const deleteTemplate = useDeleteSprintTemplate()
  const setDefaultTemplate = useSetDefaultSprintTemplate()

  const handleClose = () => {
    setEditingTemplateId(null)
    setFormState(initialFormState)
    onClose()
  }

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleArrayToggle = (field, option) => {
    setFormState((prev) => {
      const exists = prev[field].includes(option)
      return {
        ...prev,
        [field]: exists
          ? prev[field].filter((value) => value !== option)
          : [...prev[field], option],
      }
    })
  }

  const handleSharedTeamToggle = (teamId) => {
    setFormState((prev) => {
      const exists = prev.sharedWithTeams.includes(teamId)
      return {
        ...prev,
        sharedWithTeams: exists
          ? prev.sharedWithTeams.filter((id) => id !== teamId)
          : [...prev.sharedWithTeams, teamId],
      }
    })
  }

  const resetForm = () => {
    setFormState(initialFormState)
    setEditingTemplateId(null)
  }

  const handleEditTemplate = (template) => {
    setEditingTemplateId(template._id)
    setFormState({
      name: template.name,
      description: template.description || '',
      durationDays: template.durationDays || 14,
      capacity: template.capacity || 0,
      statuses: template.storyCriteria?.statuses || [],
      priorities: template.storyCriteria?.priorities || [],
      limit: template.storyCriteria?.limit || 20,
      includeUnassignedOnly: template.storyCriteria?.includeUnassignedOnly || false,
      includeCompleted: template.storyCriteria?.includeCompleted || false,
      autoSelect:
        template.storyCriteria?.autoSelect !== undefined
          ? template.storyCriteria.autoSelect
          : true,
      sharedWithTeams:
        template.sharedWithTeams?.map((team) => team._id || team.id || team) || [],
      isGlobal: template.isGlobal,
    })
  }

  const handleDeleteTemplate = (templateId) => {
    deleteTemplate.mutate(
      { id: templateId, projectId },
      {
        onSuccess: () => {
          if (editingTemplateId === templateId) {
            resetForm()
          }
        },
      }
    )
  }

  const handleSetDefault = (templateId) => {
    if (!projectId) return
    setDefaultTemplate.mutate({ projectId, templateId })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!formState.name.trim()) {
      return
    }

    const payload = {
      name: formState.name.trim(),
      description: formState.description,
      durationDays: Number(formState.durationDays) || 14,
      capacity: Number(formState.capacity) || 0,
      storyCriteria: {
        statuses: formState.statuses,
        priorities: formState.priorities,
        limit: Number(formState.limit) || 20,
        includeUnassignedOnly: formState.includeUnassignedOnly,
        includeCompleted: formState.includeCompleted,
        autoSelect: formState.autoSelect,
      },
      sharedWithTeams: formState.isGlobal ? [] : formState.sharedWithTeams,
      isGlobal: formState.isGlobal,
      projectId,
    }

    if (editingTemplateId) {
      updateTemplate.mutate(
        { id: editingTemplateId, data: payload, projectId },
        {
          onSuccess: () => resetForm(),
        }
      )
    } else {
      createTemplate.mutate(
        { ...payload, setAsDefault: false },
        {
          onSuccess: () => resetForm(),
        }
      )
    }
  }

  const renderTemplateList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner size="md" />
        </div>
      )
    }

    if (templates.length === 0) {
      return (
        <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center space-y-2">
          <p className="text-sm text-gray-600">
            No sprint templates yet. Create one using the form on the right.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
        {templates.map((template) => (
          <div
            key={template._id}
            className={cn(
              'border rounded-lg p-4 space-y-2',
              template._id === editingTemplateId ? 'border-primary-300 bg-primary-25' : 'border-gray-200'
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{template.name}</p>
                <p className="text-xs text-gray-500">
                  {template.durationDays || 0} days · {template.capacity || 0} pts
                </p>
              </div>
              <div className="flex items-center gap-2">
                {template.isDefaultForProject && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3" />
                    Default
                  </span>
                )}
                {template.isGlobal && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                    Global
                  </span>
                )}
              </div>
            </div>
            {template.description && (
              <p className="text-sm text-gray-600">{template.description}</p>
            )}
            <p className="text-xs text-gray-500">
              Statuses:{' '}
              {template.storyCriteria?.statuses?.length
                ? template.storyCriteria.statuses.join(', ')
                : 'Default'}
              {' · '}Priorities:{' '}
              {template.storyCriteria?.priorities?.length
                ? template.storyCriteria.priorities.join(', ')
                : 'Default'}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Shared:{' '}
                {template.isGlobal
                  ? 'All teams'
                  : template.sharedWithTeams?.length
                  ? template.sharedWithTeams.map((team) => team.name).join(', ')
                  : 'Private'}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditTemplate(template)}
                  leftIcon={<Edit3 className="w-4 h-4" />}
                >
                  Edit
                </Button>
                {projectId && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleSetDefault(
                        template.isDefaultForProject ? null : template._id
                      )
                    }
                    leftIcon={<Star className="w-4 h-4" />}
                  >
                    {template.isDefaultForProject ? 'Unset Default' : 'Set Default'}
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteTemplate(template._id)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Sprint Templates</h3>
            <p className="text-sm text-gray-600">
              Save reusable sprint setups and share them across teams.
            </p>
          </div>
          <Button variant="ghost" onClick={handleClose}>
            Close
          </Button>
        </div>

        {!projectId && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
            Select a project before managing sprint templates.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>{renderTemplateList()}</div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormGroup label="Template Name" required>
              <Input
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                placeholder="e.g., Two-week Capacity 80pts"
                required
              />
            </FormGroup>

            <FormGroup label="Description">
              <TextArea
                name="description"
                value={formState.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Explain when to use this template"
              />
            </FormGroup>

            <div className="grid grid-cols-2 gap-4">
              <FormGroup label="Duration (days)" required>
                <Input
                  type="number"
                  name="durationDays"
                  min="1"
                  value={formState.durationDays}
                  onChange={handleInputChange}
                />
              </FormGroup>
              <FormGroup label="Capacity (story points)" required>
                <Input
                  type="number"
                  name="capacity"
                  min="0"
                  value={formState.capacity}
                  onChange={handleInputChange}
                />
              </FormGroup>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-gray-900">Story Selection Criteria</p>
              <div>
                <p className="text-xs text-gray-500 mb-2">Statuses</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <label key={status} className="flex items-center gap-1 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={formState.statuses.includes(status)}
                        onChange={() => handleArrayToggle('statuses', status)}
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Priorities</p>
                <div className="flex flex-wrap gap-2">
                  {PRIORITY_OPTIONS.map((priority) => (
                    <label key={priority} className="flex items-center gap-1 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={formState.priorities.includes(priority)}
                        onChange={() => handleArrayToggle('priorities', priority)}
                      />
                      {priority}
                    </label>
                  ))}
                </div>
              </div>

              <FormGroup label="Story Limit">
                <Input
                  type="number"
                  name="limit"
                  min="1"
                  value={formState.limit}
                  onChange={handleInputChange}
                />
              </FormGroup>

              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  name="includeUnassignedOnly"
                  checked={formState.includeUnassignedOnly}
                  onChange={handleInputChange}
                />
                Only include unassigned stories
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  name="includeCompleted"
                  checked={formState.includeCompleted}
                  onChange={handleInputChange}
                />
                Include completed stories
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  name="autoSelect"
                  checked={formState.autoSelect}
                  onChange={handleInputChange}
                />
                Auto-select matching stories when applying this template
              </label>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-gray-900">Sharing</p>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="isGlobal"
                  checked={formState.isGlobal}
                  onChange={handleInputChange}
                />
                Share with all teams (global template)
              </label>

              {!formState.isGlobal && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Share with specific teams</p>
                  <div className="max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-2 space-y-1">
                    {teams.length === 0 ? (
                      <p className="text-xs text-gray-400">No teams available</p>
                    ) : (
                      teams.map((team) => (
                        <label
                          key={team.id || team._id}
                          className="flex items-center gap-2 text-xs text-gray-600"
                        >
                          <input
                            type="checkbox"
                            checked={formState.sharedWithTeams.includes(team.id || team._id)}
                            onChange={() => handleSharedTeamToggle(team.id || team._id)}
                          />
                          {team.name}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                onClick={resetForm}
                disabled={createTemplate.isPending || updateTemplate.isPending}
              >
                Clear
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={createTemplate.isPending || updateTemplate.isPending}
                disabled={!formState.name.trim()}
              >
                {editingTemplateId ? 'Update Template' : 'Save Template'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  )
}

SprintTemplateManagerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  projectId: PropTypes.string,
}

