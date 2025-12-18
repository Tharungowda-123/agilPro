import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Target, TrendingUp, AlertTriangle, Calendar, Zap, CheckCircle } from 'lucide-react'
import { useProgramIncrement, useStartPI, useCompletePI } from '@/hooks/api/useProgramIncrements'
import Button from '@/components/ui/Button'
import ExportButton from '@/components/export/ExportButton'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/layout/EmptyState'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

/**
 * PI Dashboard
 * Overview of Program Increment with progress tracking, burndown, velocity, risks, dependencies
 */
export default function PIDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: piData, isLoading } = useProgramIncrement(id)
  const startPI = useStartPI()
  const completePI = useCompletePI()

  const programIncrement = piData?.programIncrement || piData?.data?.programIncrement || piData

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!programIncrement) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Target className="w-16 h-16" />}
          title="Program Increment Not Found"
          description="The PI you're looking for doesn't exist or has been deleted."
        />
      </div>
    )
  }

  const metrics = programIncrement.metrics || {}
  const features = programIncrement.features || []
  const sprints = programIncrement.sprints || []
  const objectives = programIncrement.objectives || []
  const risks = programIncrement.risks || []
  const dependencies = programIncrement.dependencies || []

  const completedFeatures = features.filter((f) => f.status === 'completed').length
  const progress = features.length > 0 ? Math.round((completedFeatures / features.length) * 100) : 0

  // Burndown data (mock for now, would come from actual sprint data)
  const burndownData = sprints.map((sprint, index) => ({
    sprint: `Sprint ${index + 1}`,
    planned: metrics.predictedVelocity || 0,
    actual: metrics.actualVelocity || 0,
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{programIncrement.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{programIncrement.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={
              programIncrement.status === 'active'
                ? 'bg-green-100 text-green-800'
                : programIncrement.status === 'completed'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }
          >
            {programIncrement.status}
          </Badge>
          {programIncrement.status === 'planning' && (
            <Button variant="primary" onClick={() => navigate(`/pi-planning/${id}`)}>
              Open Planning Board
            </Button>
          )}
          {programIncrement.status === 'planning' && (
            <Button variant="outlined" onClick={() => startPI.mutate({ piId: id })}>
              Start PI
            </Button>
          )}
          {programIncrement.status === 'active' && (
            <Button variant="primary" onClick={() => completePI.mutate({ piId: id })}>
              Complete PI
            </Button>
          )}
          <ExportButton piId={id} piName={programIncrement.name} />
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
            <Target className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{progress}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {completedFeatures} / {features.length} features
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Predicted Velocity</p>
            <TrendingUp className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {metrics.predictedVelocity || 0} pts
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across {sprints.length} sprints</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Actual Velocity</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {metrics.actualVelocity || 0} pts
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {metrics.featuresCompleted || 0} features completed
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Risks</p>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{risks.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {risks.filter((r) => r.severity === 'high' || r.severity === 'critical').length} high priority
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'burndown', label: 'Burndown' },
            { id: 'objectives', label: 'Objectives' },
            { id: 'risks', label: 'Risks' },
            { id: 'dependencies', label: 'Dependencies' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Features Progress</h3>
              <div className="space-y-3">
                {features.slice(0, 5).map((feature) => {
                  const featureId = feature._id || feature.id
                  return (
                    <div key={featureId} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{feature.title}</span>
                      <Badge
                        className={
                          feature.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : feature.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {feature.status}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Sprint Status</h3>
              <div className="space-y-3">
                {sprints.map((sprint) => {
                  const sprintId = sprint._id || sprint.id
                  return (
                    <div key={sprintId} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{sprint.name}</span>
                      <Badge
                        className={
                          sprint.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : sprint.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {sprint.status}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'burndown' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">PI Burndown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sprint" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="planned" stroke="#8884d8" name="Planned" />
                <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {activeTab === 'objectives' && (
          <div className="space-y-4">
            {objectives.map((objective, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{objective.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge>BV: {objective.businessValue}</Badge>
                      <Badge
                        className={
                          objective.status === 'committed'
                            ? 'bg-green-100 text-green-800'
                            : objective.status === 'stretch'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {objective.status}
                      </Badge>
                      {objective.progress !== undefined && (
                        <div className="flex-1 max-w-xs">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${objective.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="space-y-4">
            {risks.map((risk, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle
                        className={cn(
                          'w-5 h-5',
                          risk.severity === 'critical'
                            ? 'text-red-600'
                            : risk.severity === 'high'
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                        )}
                      />
                      <p className="font-medium text-gray-900 dark:text-gray-100">{risk.description}</p>
                      <Badge
                        className={
                          risk.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : risk.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {risk.severity}
                      </Badge>
                    </div>
                    {risk.mitigation && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <strong>Mitigation:</strong> {risk.mitigation}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'dependencies' && (
          <div className="space-y-4">
            {dependencies.map((dep, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {dep.fromFeature?.title || 'Feature'}
                  </span>
                  <span className="text-gray-500">→</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {dep.toFeature?.title || 'Feature'}
                  </span>
                  <Badge variant="outline">{dep.type}</Badge>
                </div>
                {dep.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{dep.description}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

