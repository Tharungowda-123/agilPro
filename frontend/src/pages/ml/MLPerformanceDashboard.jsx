import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Brain, TrendingUp, RefreshCw, Activity } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { getFeedbackStats, getPerformanceTrends } from '@/services/api/mlFeedbackService'
import { useRole } from '@/hooks/useRole'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

/**
 * ML Performance Dashboard
 * Displays ML model performance metrics and allows manual retraining
 */
export default function MLPerformanceDashboard() {
  const { isAdmin, isManager } = useRole()
  const [modelStats, setModelStats] = useState({})
  const [selectedModel, setSelectedModel] = useState('task_assignment')
  const [performanceHistory, setPerformanceHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRetraining, setIsRetraining] = useState(false)
  const [feedbackStats, setFeedbackStats] = useState({})

  useEffect(() => {
    fetchModelStats()
    fetchPerformanceHistory(selectedModel)
    fetchFeedbackStats()
  }, [selectedModel])

  const fetchModelStats = async () => {
    try {
      setIsLoading(true)
      const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000'
      const response = await fetch(`${ML_API_URL}/api/ml/training/models/stats`, {
        headers: {
          'X-API-Key': import.meta.env.VITE_ML_API_KEY || '',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch model stats')
      }

      const data = await response.json()
      setModelStats(data.models || {})
    } catch (error) {
      console.error('Error fetching model stats:', error)
      toast.error('Failed to load model statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPerformanceHistory = async (modelType) => {
    try {
      const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000'
      const response = await fetch(
        `${ML_API_URL}/api/ml/training/models/performance/${modelType}`,
        {
          headers: {
            'X-API-Key': import.meta.env.VITE_ML_API_KEY || '',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch performance history')
      }

      const data = await response.json()
      setPerformanceHistory(data.metrics || [])
    } catch (error) {
      console.error('Error fetching performance history:', error)
      toast.error('Failed to load performance history')
    }
  }

  const fetchFeedbackStats = async () => {
    try {
      const stats = {}
      const modelTypes = ['task_assignment', 'velocity_forecast', 'story_estimation']

      for (const modelType of modelTypes) {
        try {
          const data = await getFeedbackStats(modelType)
          stats[modelType] = data.data || {}
        } catch (error) {
          console.warn(`Could not fetch stats for ${modelType}:`, error)
        }
      }

      setFeedbackStats(stats)
    } catch (error) {
      console.error('Error fetching feedback stats:', error)
    }
  }

  const triggerRetrain = async (modelType) => {
    if (!confirm(`Manually retrain ${modelType.replace('_', ' ')} model?`)) {
      return
    }

    try {
      setIsRetraining(true)
      const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000'
      const response = await fetch(`${ML_API_URL}/api/ml/training/retrain/${modelType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_ML_API_KEY || '',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to trigger retraining')
      }

      toast.success('Retraining started in background. Check back in a few minutes.')
      
      // Refresh stats after a delay
      setTimeout(() => {
        fetchModelStats()
        fetchPerformanceHistory(selectedModel)
      }, 5000)
    } catch (error) {
      console.error('Error triggering retrain:', error)
      toast.error('Failed to trigger retraining')
    } finally {
      setIsRetraining(false)
    }
  }

  // Chart data
  const chartData = {
    labels:
      performanceHistory
        .map((m) => new Date(m.trained_at).toLocaleDateString())
        .reverse() || [],
    datasets: [
      {
        label: 'Accuracy',
        data: performanceHistory.map((m) => m.accuracy).reverse() || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Model Accuracy Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          callback: (value) => `${(value * 100).toFixed(0)}%`,
        },
      },
    },
  }

  if (!isAdmin && !isManager) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            ML Model Performance
          </h1>
        </div>
        <Button
          variant="outlined"
          onClick={() => {
            fetchModelStats()
            fetchPerformanceHistory(selectedModel)
            fetchFeedbackStats()
          }}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Model Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(modelStats).map(([modelType, stats]) => (
              <Card key={modelType} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {modelType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </h3>
                  <Activity className="w-5 h-5 text-primary-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Version:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      v{stats.version || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Accuracy:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {((stats.accuracy || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  {stats.training_samples !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Training Samples:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {stats.training_samples}
                      </span>
                    </div>
                  )}
                  {stats.trained_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Trained:</span>
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {new Date(stats.trained_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {feedbackStats[modelType] && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total Predictions:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {feedbackStats[modelType].totalPredictions || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Acceptance Rate:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {((feedbackStats[modelType].acceptanceRate || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => triggerRetrain(modelType)}
                  loading={isRetraining}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Retrain Now
                </Button>
              </Card>
            ))}
          </div>

          {/* Performance Chart */}
          {performanceHistory.length > 0 && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Accuracy Over Time
                </h2>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {Object.keys(modelStats).map((modelType) => (
                    <option key={modelType} value={modelType}>
                      {modelType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <Line data={chartData} options={chartOptions} />
            </Card>
          )}

          {/* Training History Table */}
          {performanceHistory.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Training History
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">
                        Version
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">
                        Accuracy
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">
                        Improvement
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">
                        Samples
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceHistory.map((metric) => (
                      <tr
                        key={metric._id}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          v{metric.version}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          {((metric.accuracy || 0) * 100).toFixed(2)}%
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={
                              (metric.improvement || 0) >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }
                          >
                            {(metric.improvement || 0) >= 0 ? '+' : ''}
                            {((metric.improvement || 0) * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          {metric.training_samples || 0}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          {new Date(metric.trained_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

