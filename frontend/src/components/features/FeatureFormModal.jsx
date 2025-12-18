import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Sparkles } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Select from '@/components/ui/Select'
import FormGroup from '@/components/ui/FormGroup'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import { useProjects } from '@/hooks/api/useProjects'

const defaultForm = {
  title: '',
  description: '',
  priority: 'medium',
  status: 'draft',
  businessValue: '',
  acceptanceCriteria: '',
  estimatedStoryPoints: '',
}

export default function FeatureFormModal({ isOpen, onClose, onSubmit, loading, defaultProjectId, feature }) {
  const [formState, setFormState] = useState(defaultForm)
  const { data: projectsData } = useProjects()
  const projects = Array.isArray(projectsData?.data) ? projectsData.data : projectsData || []

  useEffect(() => {
    if (isOpen) {
      if (feature) {
        setFormState({
          title: feature.title || '',
          description: feature.description || '',
          priority: feature.priority || 'medium',
          status: feature.status || 'draft',
          businessValue: feature.businessValue || '',
          acceptanceCriteria: Array.isArray(feature.acceptanceCriteria)
            ? feature.acceptanceCriteria.join('\n')
            : feature.acceptanceCriteria || '',
          estimatedStoryPoints: feature.estimatedStoryPoints || '',
        })
      } else {
        setFormState({ ...defaultForm, projectId: defaultProjectId })
      }
    }
  }, [isOpen, feature, defaultProjectId])

  const handleChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!formState.title.trim()) {
      toast.error('Feature title is required')
      return
    }

    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      priority: formState.priority,
      status: formState.status,
      businessValue: formState.businessValue || undefined,
      estimatedStoryPoints: formState.estimatedStoryPoints ? Number(formState.estimatedStoryPoints) : undefined,
      acceptanceCriteria: formState.acceptanceCriteria
        ? formState.acceptanceCriteria
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
        : [],
      projectId: formState.projectId || defaultProjectId,
    }

    onSubmit(payload)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={feature ? "Edit Feature" : "New Feature / Epic"} size="md">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {!defaultProjectId && !feature?.project && (
          <FormGroup label="Project" required>
            <Select
              value={formState.projectId || ''}
              onChange={(e) => handleChange('projectId', e.target.value)}
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id || project._id} value={project.id || project._id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </FormGroup>
        )}

        <FormGroup label="Feature Title" required>
          <Input
            placeholder="Authentication overhaul"
            value={formState.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </FormGroup>

        <FormGroup label="Description" description="Describe the business outcome or high-level requirement.">
          <TextArea
            rows={4}
            placeholder="As a platform, we need a unified authentication experience across web and mobile..."
            value={formState.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </FormGroup>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup label="Priority">
            <Select value={formState.priority} onChange={(e) => handleChange('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </FormGroup>

          <FormGroup label="Status">
            <Select value={formState.status} onChange={(e) => handleChange('status', e.target.value)}>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="in-breakdown">In Breakdown</option>
              <option value="broken-down">Broken Down</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </Select>
          </FormGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup label="Business Value" description="Describe the business value this feature provides.">
            <TextArea
              rows={2}
              placeholder="Improves user experience, reduces support tickets..."
              value={formState.businessValue}
              onChange={(e) => handleChange('businessValue', e.target.value)}
            />
          </FormGroup>

          <FormGroup label="Estimated Story Points">
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={formState.estimatedStoryPoints}
              onChange={(e) => handleChange('estimatedStoryPoints', e.target.value)}
            />
          </FormGroup>
        </div>

        <FormGroup
          label="Acceptance Criteria (optional)"
          description="Write one criterion per line. The AI breakdown uses these for generating stories."
        >
          <TextArea
            rows={4}
            placeholder={'User can reset password via email\nMFA challenge appears after 3 failed attempts'}
            value={formState.acceptanceCriteria}
            onChange={(e) => handleChange('acceptanceCriteria', e.target.value)}
          />
        </FormGroup>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outlined" onClick={onClose} type="button" disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={loading}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Save Feature
          </Button>
        </div>
      </form>
    </Modal>
  )
}

FeatureFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  defaultProjectId: PropTypes.string,
  feature: PropTypes.object,
}

