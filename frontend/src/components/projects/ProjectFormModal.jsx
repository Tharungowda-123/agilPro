import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import { useTeams } from '@/hooks/api/useTeams'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Select from '@/components/ui/Select'
import FormGroup from '@/components/ui/FormGroup'

/**
 * ProjectFormModal Component
 * Modal form for creating or editing projects
 * 
 * @example
 * <ProjectFormModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onSubmit={handleSubmit}
 *   project={project} // For edit mode
 *   loading={false}
 * />
 */
export default function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  project = null,
  loading = false,
}) {
  const isEditMode = !!project
  const { data: teamsData } = useTeams()
  
  // Extract teams array from response
  const teams = Array.isArray(teamsData) 
    ? teamsData 
    : teamsData?.data || teamsData || []
  
  // Get project team ID (handle both populated and non-populated)
  const projectTeamId = project?.team?._id || project?.team || null
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: project || {
      name: '',
      key: '',
      description: '',
      startDate: '',
      endDate: '',
      team: projectTeamId,
      priority: 'medium',
    },
  })

  const projectName = watch('name')

  // Auto-generate project key from name
  useEffect(() => {
    if (!isEditMode && projectName) {
      const key = projectName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10)
      setValue('key', key)
    }
  }, [projectName, isEditMode, setValue])

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      const teamId = project.team?._id || project.team || null
      reset({
        ...project,
        team: teamId,
      })
    } else {
      reset({
        name: '',
        key: '',
        description: '',
        startDate: '',
        endDate: '',
        team: null,
        priority: 'medium',
      })
    }
  }, [project, reset])

  const handleFormSubmit = (data) => {
    const cleaned = {
      name: data.name?.trim(),
      key: data.key?.toUpperCase(),
      description: data.description?.trim() || undefined,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      priority: data.priority || undefined,
    }
    // Include team (can be null to remove team assignment)
    cleaned.team = data.team && data.team !== '' ? data.team : null
    onSubmit(cleaned)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Project' : 'Create New Project'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isEditMode ? 'Update project details' : 'Fill in the information to create a new project'}
          </p>
        </div>

        <div className="space-y-5">
          <FormGroup label="Project Name" required error={errors.name?.message}>
            <Input
              placeholder="Enter project name"
              {...register('name', {
                required: 'Project name is required',
                minLength: {
                  value: 3,
                  message: 'Project name must be at least 3 characters',
                },
              })}
              error={errors.name?.message}
            />
          </FormGroup>

          <FormGroup label="Project Key" required error={errors.key?.message}>
            <Input
              placeholder="PROJECT_KEY"
              {...register('key', {
                required: 'Project key is required',
                pattern: {
                  value: /^[A-Z0-9]+$/,
                  message: 'Project key must contain only uppercase letters and numbers',
                },
                maxLength: {
                  value: 10,
                  message: 'Project key must be 10 characters or less',
                },
              })}
              error={errors.key?.message}
              className="uppercase"
              onChange={(e) => {
                setValue('key', e.target.value.toUpperCase())
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-generated from project name. Must be unique.
            </p>
          </FormGroup>

          <FormGroup label="Description" error={errors.description?.message}>
            <TextArea
              placeholder="Enter project description"
              rows={4}
              {...register('description')}
              error={errors.description?.message}
            />
          </FormGroup>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Start Date" error={errors.startDate?.message}>
              <Input
                type="date"
                {...register('startDate', {
                  required: 'Start date is required',
                })}
                error={errors.startDate?.message}
              />
            </FormGroup>

            <FormGroup label="End Date" error={errors.endDate?.message}>
              <Input
                type="date"
                {...register('endDate', {
                  required: 'End date is required',
                  validate: (value) => {
                    const startDate = watch('startDate')
                    if (startDate && value && new Date(value) < new Date(startDate)) {
                      return 'End date must be after start date'
                    }
                    return true
                  },
                })}
                error={errors.endDate?.message}
              />
            </FormGroup>
          </div>

          <FormGroup label="Priority" error={errors.priority?.message}>
            <Select
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
              value={watch('priority')}
              onChange={(val) => setValue('priority', val, { shouldValidate: true })}
              placeholder="Select an option"
              error={errors.priority?.message}
              required
            />
          </FormGroup>

          <FormGroup label="Team" error={errors.team?.message}>
            <Select
              options={[
                { value: '', label: 'No Team' },
                ...teams.map((team) => ({
                  value: team._id || team.id,
                  label: team.name || 'Unnamed Team',
                })),
              ]}
              value={watch('team') || ''}
              onChange={(val) => setValue('team', val || null, { shouldValidate: true })}
              placeholder="Select a team"
              error={errors.team?.message}
            />
            <p className="text-xs text-gray-500 mt-1">
              Assign a team to enable AI planning features
            </p>
          </FormGroup>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditMode ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

ProjectFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  project: PropTypes.object,
  loading: PropTypes.bool,
}

