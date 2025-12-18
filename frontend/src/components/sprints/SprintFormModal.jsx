import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import FormGroup from '@/components/ui/FormGroup'
import Select from '@/components/ui/Select'
import SprintTemplateManagerModal from './SprintTemplateManagerModal'
import { useSprintTemplates } from '@/hooks/api/useSprintTemplates'

/**
 * SprintFormModal Component
 * Modal form for creating or editing sprints
 * 
 * @example
 * <SprintFormModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onSubmit={handleSubmit}
 *   sprint={sprint} // For edit mode
 *   projectId="1"
 *   loading={false}
 * />
 */
export default function SprintFormModal({
  isOpen,
  onClose,
  onSubmit,
  sprint = null,
  projectId,
  loading = false,
}) {
  const isEditMode = !!sprint
  const initialValues = sprint
    ? {
        ...sprint,
        templateId:
          sprint.appliedTemplate?._id ||
          sprint.appliedTemplate ||
          sprint.templateId ||
          null,
        autoSelectStories: true,
      }
    : {
        name: '',
        goal: '',
        startDate: '',
        endDate: '',
        capacity: 80,
        templateId: null,
        autoSelectStories: true,
      }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: initialValues,
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const templateIdValue = watch('templateId')

  const [isTemplateManagerOpen, setTemplateManagerOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialValues.templateId || null
  )

  const { data: templateData, isLoading: templatesLoading } = useSprintTemplates(projectId)
  const templates = templateData?.templates || []
  const defaultTemplateId = templateData?.defaultTemplateId

  const applyTemplateToForm = (template) => {
    if (!template) return
    let effectiveStart = startDate ? new Date(startDate) : new Date()
    if (Number.isNaN(effectiveStart.getTime())) {
      effectiveStart = new Date()
    }
    const startISO = effectiveStart.toISOString().split('T')[0]
    setValue('startDate', startISO)

    if (template.durationDays) {
      const end = new Date(effectiveStart)
      end.setDate(end.getDate() + template.durationDays)
      setValue('endDate', end.toISOString().split('T')[0])
    }

    if (template.capacity) {
      setValue('capacity', template.capacity)
    }

    setValue('autoSelectStories', true)
  }

  // Auto-calculate end date (2 weeks from start) when template not applied
  useEffect(() => {
    if (!isEditMode && startDate && !selectedTemplateId) {
      const start = new Date(startDate)
      if (!Number.isNaN(start.getTime())) {
        const end = new Date(start)
        end.setDate(end.getDate() + 14) // 2 weeks
        setValue('endDate', end.toISOString().split('T')[0])
      }
    }
  }, [startDate, isEditMode, setValue, selectedTemplateId])

  useEffect(() => {
    if (
      !isEditMode &&
      !selectedTemplateId &&
      defaultTemplateId &&
      templates.length > 0
    ) {
      const defaultTemplate = templates.find(
        (tpl) => tpl._id === defaultTemplateId
      )
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate._id)
        setValue('templateId', defaultTemplate._id)
        applyTemplateToForm(defaultTemplate)
      }
    }
  }, [isEditMode, defaultTemplateId, templates, selectedTemplateId, setValue])

  useEffect(() => {
    if ((templateIdValue || null) !== selectedTemplateId) {
      setSelectedTemplateId(templateIdValue || null)
    }
  }, [templateIdValue, selectedTemplateId])

  const handleTemplateSelect = (value) => {
    const templateId = value || null
    setSelectedTemplateId(templateId)
    setValue('templateId', templateId)
    if (templateId) {
      const template = templates.find((tpl) => tpl._id === templateId)
      applyTemplateToForm(template)
    }
  }

  const currentTemplate = templates.find(
    (template) => template._id === selectedTemplateId
  )

  // Calculate duration
  const duration = startDate && endDate
    ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    : 0

  // Reset form when sprint changes
  useEffect(() => {
    if (sprint) {
      reset({
        ...sprint,
        templateId:
          sprint.appliedTemplate?._id ||
          sprint.appliedTemplate ||
          sprint.templateId ||
          null,
        autoSelectStories: true,
      })
      setSelectedTemplateId(
        sprint.appliedTemplate?._id ||
          sprint.appliedTemplate ||
          sprint.templateId ||
          null
      )
    } else {
      reset({
        name: '',
        goal: '',
        startDate: '',
        endDate: '',
        capacity: 80,
        templateId: null,
        autoSelectStories: true,
      })
      setSelectedTemplateId(null)
    }
  }, [sprint, reset])

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      projectId,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Sprint' : 'Create New Sprint'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isEditMode ? 'Update sprint details' : 'Fill in the information to create a new sprint'}
          </p>
        </div>

        <input type="hidden" {...register('templateId')} />

        {projectId ? (
          <div className="mb-6 space-y-3">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <FormGroup label="Sprint Template">
                {templatesLoading ? (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                    Loading templates...
                  </div>
                ) : (
                  <Select
                    value={selectedTemplateId || ''}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                  >
                    <option value="">No template</option>
                    {templates.map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.name}
                        {template.isDefaultForProject ? ' (Default)' : template.isGlobal ? ' (Global)' : ''}
                      </option>
                    ))}
                  </Select>
                )}
              </FormGroup>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => setTemplateManagerOpen(true)}
                >
                  Manage Templates
                </Button>
                {selectedTemplateId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => applyTemplateToForm(currentTemplate)}
                  >
                    Reapply Template
                  </Button>
                )}
              </div>
            </div>
            {selectedTemplateId && currentTemplate && (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                <p className="text-sm text-gray-700">
                  Duration:{' '}
                  <span className="font-medium text-gray-900">
                    {currentTemplate.durationDays || 0} days
                  </span>{' '}
                  · Capacity:{' '}
                  <span className="font-medium text-gray-900">
                    {currentTemplate.capacity || 0} pts
                  </span>
                </p>
                {currentTemplate.storyCriteria && (
                  <p className="text-xs text-gray-600">
                    Story criteria:{' '}
                    {currentTemplate.storyCriteria.statuses?.length
                      ? `Statuses ${currentTemplate.storyCriteria.statuses.join(', ')}`
                      : 'Default backlog/ready'}{' '}
                    ·{' '}
                    {currentTemplate.storyCriteria.priorities?.length
                      ? `Priorities ${currentTemplate.storyCriteria.priorities.join(', ')}`
                      : 'Default priority mix'}{' '}
                    · Limit {currentTemplate.storyCriteria.limit || 20} stories
                  </p>
                )}
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    {...register('autoSelectStories')}
                    disabled={!selectedTemplateId}
                  />
                  Auto-select stories that match this template
                </label>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
            Select a project to access sprint templates and sharing options.
          </div>
        )}

        <div className="space-y-5">
          <FormGroup label="Sprint Name" required error={errors.name?.message}>
            <Input
              placeholder="e.g., Sprint 1, Sprint 2"
              {...register('name', {
                required: 'Sprint name is required',
                minLength: {
                  value: 3,
                  message: 'Sprint name must be at least 3 characters',
                },
              })}
              error={errors.name?.message}
            />
          </FormGroup>

          <FormGroup label="Sprint Goal" error={errors.goal?.message}>
            <TextArea
              placeholder="What is the goal of this sprint?"
              rows={4}
              {...register('goal')}
              error={errors.goal?.message}
            />
          </FormGroup>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Start Date" required error={errors.startDate?.message}>
              <Input
                type="date"
                {...register('startDate', {
                  required: 'Start date is required',
                })}
                error={errors.startDate?.message}
              />
            </FormGroup>

            <FormGroup label="End Date" required error={errors.endDate?.message}>
              <Input
                type="date"
                {...register('endDate', {
                  required: 'End date is required',
                  validate: (value) => {
                    if (startDate && value && new Date(value) <= new Date(startDate)) {
                      return 'End date must be after start date'
                    }
                    return true
                  },
                })}
                error={errors.endDate?.message}
              />
            </FormGroup>
          </div>

          {duration > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Sprint Duration: <span className="font-medium text-gray-900">{duration} days</span>
              </p>
            </div>
          )}

          <FormGroup label="Capacity (Story Points)" required error={errors.capacity?.message}>
            <Input
              type="number"
              min="1"
              placeholder="80"
              {...register('capacity', {
                required: 'Capacity is required',
                min: {
                  value: 1,
                  message: 'Capacity must be at least 1',
                },
                valueAsNumber: true,
              })}
              error={errors.capacity?.message}
            />
            <p className="text-xs text-gray-500 mt-1">
              Total story points the team can commit to in this sprint
            </p>
          </FormGroup>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditMode ? 'Update Sprint' : 'Create Sprint'}
          </Button>
        </div>
      </form>
      <SprintTemplateManagerModal
        isOpen={isTemplateManagerOpen}
        onClose={() => setTemplateManagerOpen(false)}
        projectId={projectId}
      />
    </Modal>
  )
}

SprintFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  sprint: PropTypes.object,
  projectId: PropTypes.string,
  loading: PropTypes.bool,
}

