import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useAIInsights } from '@/hooks/api/useDashboard'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/layout/EmptyState'
import { Brain } from 'lucide-react'

export default function AIRecommendations() {
  const navigate = useNavigate()
  const { data: insights, isLoading } = useAIInsights()

  const grouped = useMemo(() => {
    if (!insights || insights.length === 0) return {}
    return insights.reduce((acc, insight) => {
      const key = insight.entityType || 'general'
      if (!acc[key]) acc[key] = []
      acc[key].push(insight)
      return acc
    }, {})
  }, [insights])

  const handleOpenLink = (link) => {
    if (link) navigate(link)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!insights || insights.length === 0) {
    return (
      <EmptyState
        icon={<Brain className="w-12 h-12" />}
        title="No AI Recommendations Yet"
        description="Once the AI model analyzes enough activity, recommendations will appear here."
        action={
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">AI Recommendations</h1>
          <p className="text-gray-600">
            Curated suggestions grouped by stories, tasks, projects, and sprints.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([entityType, items]) => (
          <div key={entityType} className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 capitalize">
              {entityType.replace(/_/g, ' ')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((insight) => (
                <Card
                  key={insight.id}
                  className="p-4 border hover:border-primary-300 transition-colors cursor-pointer"
                  onClick={() => handleOpenLink(insight.link)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                    <span className="text-xs uppercase text-primary-600">
                      {insight.type || 'AI'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{insight.message}</p>
                  <div className="mt-3 text-sm text-primary-600 flex items-center gap-1">
                    <span>{insight.action || 'View details'}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

