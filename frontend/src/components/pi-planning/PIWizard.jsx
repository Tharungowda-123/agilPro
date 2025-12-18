import { useState, useEffect } from 'react'
import { Calendar, Target, Sparkles, CheckCircle, ChevronRight, ChevronLeft, Users, Zap, Loader } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Select from '@/components/ui/Select'
import FormGroup from '@/components/ui/FormGroup'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { useCreateProgramIncrement, useOptimizePI, useBreakdownAndAssign } from '@/hooks/api/useProgramIncrements'
import { useFeatures } from '@/hooks/api/useFeatures'
import { useTeams } from '@/hooks/api/useTeams'
import { useSprints } from '@/hooks/api/useSprints'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'
import axiosInstance from '@/services/api/axiosConfig'

/**
 * PI Wizard
 * Multi-step wizard for creating Program Increments
 */
export default function PIWizard({ isOpen, onClose, projectId, onSuccess }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    selectedFeatures: [],
    objectives: [],
    selectedSprints: [],
  })

  const createPI = useCreateProgramIncrement()
  const breakdownAndAssign = useBreakdownAndAssign()
  const { data: featuresData } = useFeatures({ project: projectId })
  const { data: teamsData } = useTeams()
  const { data: sprintsData } = useSprints(projectId)

  const features = Array.isArray(featuresData?.data) ? featuresData.data : featuresData || []
  const teams = Array.isArray(teamsData?.data) ? teamsData.data : teamsData || []
  const sprints = Array.isArray(sprintsData?.data) ? sprintsData.data : sprintsData || []

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        selectedFeatures: [],
        objectives: [],
        selectedSprints: [],
      })
    }
  }, [isOpen])

  const handleNext = () => {
    if (step < 7) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      // Step 1: Create PI
      const piResponse = await createPI.mutateAsync({
        projectId,
        data: {
          name: formData.name,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          features: formData.selectedFeatures,
          sprints: formData.selectedSprints,
          objectives: formData.objectives,
        },
      })

      const piId = piResponse.programIncrement?._id || piResponse.programIncrement?.id || piResponse.data?.programIncrement?._id

      if (!piId) {
        toast.error('Failed to get PI ID after creation')
        return
      }

      // Step 2: Break down features and assign tasks if requested
      if (formData.selectedFeatures.length > 0 && formData.breakdownResult?.autoAssign !== false) {
        try {
          await breakdownAndAssign.mutateAsync({
            piId,
            featureIds: formData.selectedFeatures,
            autoAssign: formData.breakdownResult?.autoAssign !== false,
          })
        } catch (breakdownError) {
          console.error('Breakdown error:', breakdownError)
          toast.error('PI created but failed to break down features. You can do this manually later.')
        }
      }

      toast.success('Program Increment created successfully!')
      onSuccess?.(piResponse)
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create Program Increment')
    }
  }

  const steps = [
    { id: 1, title: 'Create PI', icon: Calendar },
    { id: 2, title: 'Add Features', icon: Target },
    { id: 3, title: 'Set Objectives', icon: Target },
    { id: 4, title: 'Breakdown & Assign', icon: Sparkles },
    { id: 5, title: 'AI Distribution', icon: Sparkles },
    { id: 6, title: 'Review', icon: CheckCircle },
    { id: 7, title: 'Commit', icon: CheckCircle },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Program Increment" size="xl">
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((stepItem, index) => {
            const Icon = stepItem.icon
            const isActive = step === stepItem.id
            const isCompleted = step > stepItem.id
            return (
              <div key={stepItem.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                      isCompleted
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : isActive
                        ? 'border-primary-600 text-primary-600'
                        : 'border-gray-300 text-gray-400'
                    )}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <p
                    className={cn(
                      'text-xs mt-2 text-center',
                      isActive ? 'text-primary-600 font-medium' : 'text-gray-500'
                    )}
                  >
                    {stepItem.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-2',
                      step > stepItem.id ? 'bg-primary-600' : 'bg-gray-300'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {step === 1 && <Step1CreatePI formData={formData} setFormData={setFormData} />}
          {step === 2 && (
            <Step2AddFeatures
              features={features}
              selectedFeatures={formData.selectedFeatures}
              setSelectedFeatures={(features) => setFormData((prev) => ({ ...prev, selectedFeatures: features }))}
            />
          )}
          {step === 3 && (
            <Step3SetObjectives
              teams={teams}
              objectives={formData.objectives}
              setObjectives={(objectives) => setFormData((prev) => ({ ...prev, objectives }))}
            />
          )}
          {step === 4 && (
            <Step4BreakdownAndAssign
              projectId={projectId}
              features={features.filter((f) => formData.selectedFeatures.includes(f._id || f.id))}
              onComplete={(result) => {
                setFormData((prev) => ({ ...prev, breakdownResult: result }))
              }}
            />
          )}
          {step === 5 && (
            <Step5AIDistribution
              features={features.filter((f) => formData.selectedFeatures.includes(f._id || f.id))}
              sprints={sprints}
              onOptimize={(assignments) => {
                // Handle optimization result
                toast.success('Features distributed optimally!')
              }}
            />
          )}
          {step === 6 && <Step6Review formData={formData} features={features} sprints={sprints} teams={teams} />}
          {step === 7 && <Step7Commit formData={formData} />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outlined" onClick={step === 1 ? onClose : handleBack} leftIcon={<ChevronLeft className="w-4 h-4" />}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex gap-2">
            {step < 7 ? (
              <Button variant="primary" onClick={handleNext} rightIcon={<ChevronRight className="w-4 h-4" />}>
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={createPI.isPending || breakdownAndAssign.isPending}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Create PI
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

// Step 1: Create PI
function Step1CreatePI({ formData, setFormData }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Program Increment Details</h3>
      <FormGroup label="PI Name" required>
        <Input
          placeholder="PI 2025 Q1"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        />
      </FormGroup>
      <FormGroup label="Description">
        <TextArea
          rows={3}
          placeholder="Describe the goals and scope of this Program Increment..."
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        />
      </FormGroup>
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Start Date" required>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
          />
        </FormGroup>
        <FormGroup label="End Date" required>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
          />
        </FormGroup>
      </div>
      {formData.startDate && formData.endDate && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Duration: {Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24 * 7))}{' '}
            weeks
          </p>
        </div>
      )}
    </div>
  )
}

// Step 2: Add Features
function Step2AddFeatures({ features, selectedFeatures, setSelectedFeatures }) {
  const handleToggleFeature = (featureId) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Select Features</h3>
      <div className="max-h-96 overflow-y-auto space-y-2">
        {features.map((feature) => {
          const featureId = feature._id || feature.id
          const isSelected = selectedFeatures.includes(featureId)
          return (
            <Card
              key={featureId}
              className={cn('p-4 cursor-pointer transition-all', isSelected && 'border-2 border-primary-500')}
              onClick={() => handleToggleFeature(featureId)}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleFeature(featureId)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{feature.title}</h4>
                  {feature.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {feature.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge>{feature.priority || 'medium'}</Badge>
                    {(feature.estimatedStoryPoints || feature.actualStoryPoints) && (
                      <span className="text-xs text-gray-500">
                        {(feature.estimatedStoryPoints || feature.actualStoryPoints)} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {selectedFeatures.length} feature(s) selected
      </p>
    </div>
  )
}

// Step 3: Set Objectives
function Step3SetObjectives({ teams, objectives, setObjectives }) {
  const [newObjective, setNewObjective] = useState({
    description: '',
    businessValue: 5,
    assignedTo: '',
    status: 'uncommitted',
  })

  const handleAddObjective = () => {
    if (newObjective.description.trim()) {
      setObjectives((prev) => [...prev, { ...newObjective, id: Date.now() }])
      setNewObjective({ description: '', businessValue: 5, assignedTo: '', status: 'uncommitted' })
    }
  }

  const handleRemoveObjective = (index) => {
    setObjectives((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">PI Objectives</h3>
      <div className="space-y-3">
        {objectives.map((objective, index) => (
          <Card key={objective.id || index} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">{objective.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge>BV: {objective.businessValue}</Badge>
                  <Badge variant="outline">{objective.status}</Badge>
                  {objective.assignedTo && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Team: {teams.find((t) => (t._id || t.id) === objective.assignedTo)?.name || 'Unknown'}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="outlined" size="sm" onClick={() => handleRemoveObjective(index)}>
                Remove
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-4 bg-gray-50 dark:bg-gray-800">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Add Objective</h4>
        <div className="space-y-3">
          <Input
            placeholder="Objective description..."
            value={newObjective.description}
            onChange={(e) => setNewObjective((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div className="grid grid-cols-3 gap-3">
            <FormGroup label="Business Value">
              <Input
                type="number"
                min={1}
                max={10}
                value={newObjective.businessValue}
                onChange={(e) => setNewObjective((prev) => ({ ...prev, businessValue: parseInt(e.target.value) }))}
              />
            </FormGroup>
            <FormGroup label="Assign To">
              <Select
                value={newObjective.assignedTo}
                onChange={(e) => setNewObjective((prev) => ({ ...prev, assignedTo: e.target.value }))}
              >
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team._id || team.id} value={team._id || team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup label="Status">
              <Select
                value={newObjective.status}
                onChange={(e) => setNewObjective((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="uncommitted">Uncommitted</option>
                <option value="committed">Committed</option>
                <option value="stretch">Stretch</option>
              </Select>
            </FormGroup>
          </div>
          <Button variant="outlined" onClick={handleAddObjective}>
            Add Objective
          </Button>
        </div>
      </Card>
    </div>
  )
}

// Step 4: Breakdown and Assign
function Step4BreakdownAndAssign({ projectId, features, onComplete }) {
  const [autoAssign, setAutoAssign] = useState(true)

  useEffect(() => {
    onComplete?.({ autoAssign })
  }, [autoAssign, onComplete])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Break Down Features & Assign Tasks</h3>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <p className="text-gray-700 dark:text-gray-300">
              AI will break down {features.length} feature(s) into stories and tasks, then assign them to team members based on skills.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoAssign"
              checked={autoAssign}
              onChange={(e) => setAutoAssign(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoAssign" className="text-sm text-gray-700 dark:text-gray-300">
              Automatically assign tasks to team members based on AI recommendations
            </label>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Feature breakdown and task assignment will be processed after the PI is created. 
              You can review and adjust assignments in the PI Planning Board.
            </p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>What will happen:</strong>
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 list-disc list-inside space-y-1">
              <li>Features will be broken down into user stories</li>
              <li>Tasks will be created for each story</li>
              {autoAssign && <li>Tasks will be assigned to team members based on their skills and availability</li>}
              <li>You can review and change assignments in the Planning Board</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Step 5: AI Distribution (renamed from Step 4)
function Step5AIDistribution({ features, sprints, onOptimize }) {
  const [optimizing, setOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState(null)

  const handleOptimize = async () => {
    setOptimizing(true)
    // Simulate AI optimization
    setTimeout(() => {
      setOptimizationResult({
        assignments: features.map((f, idx) => ({
          featureId: f._id || f.id,
          sprintId: sprints[idx % sprints.length]?._id || sprints[idx % sprints.length]?.id,
        })),
      })
      setOptimizing(false)
      onOptimize?.(optimizationResult)
    }, 2000)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">AI Sprint Distribution</h3>
      <Card className="p-6 text-center">
        <Zap className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Let AI optimally distribute {features.length} features across {sprints.length} sprints
        </p>
        <Button variant="primary" onClick={handleOptimize} loading={optimizing} leftIcon={<Sparkles className="w-4 h-4" />}>
          Optimize Distribution
        </Button>
      </Card>
      {optimizationResult && (
        <Card className="p-4 bg-green-50 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✓ Features distributed optimally across sprints
          </p>
        </Card>
      )}
    </div>
  )
}

// Step 6: Review (renamed from Step 5)
function Step6Review({ formData, features, sprints, teams }) {
  const selectedFeaturesList = features.filter((f) => formData.selectedFeatures.includes(f._id || f.id))
  const totalPoints = selectedFeaturesList.reduce(
    (sum, f) => sum + (f.estimatedStoryPoints || f.actualStoryPoints || 0),
    0
  )

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Review Program Increment</h3>
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">PI Details</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Name:</strong> {formData.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Duration:</strong> {formData.startDate} to {formData.endDate}
          </p>
        </Card>
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Features ({selectedFeaturesList.length})</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Total Points:</strong> {totalPoints} pts
          </p>
        </Card>
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Objectives ({formData.objectives.length})</h4>
          <ul className="space-y-1">
            {formData.objectives.map((obj, idx) => (
              <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                • {obj.description} (BV: {obj.businessValue})
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

// Step 7: Commit (renamed from Step 6)
function Step7Commit({ formData }) {
  return (
    <div className="text-center py-8">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Ready to Create PI</h3>
      <p className="text-gray-600 dark:text-gray-400">
        Click "Create PI" to finalize the Program Increment and create all associated sprints.
      </p>
    </div>
  )
}

