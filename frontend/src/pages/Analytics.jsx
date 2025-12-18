import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { TrendingUp, Brain, ShieldCheck, Layers, ArrowRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function Analytics() {
  const navigate = useNavigate()
  const [selectedWidget, setSelectedWidget] = useState(null)

  const widgets = [
    {
      id: 'team-performance',
      title: 'Team Performance',
      description: 'Deep dive into velocity, throughput, and quality metrics for each team.',
      icon: TrendingUp,
      link: '/reports?tab=teams',
    },
    {
      id: 'predictive-ai',
      title: 'Predictive Insights',
      description: 'Assess AI accuracy and predictive planning models by sprint.',
      icon: Brain,
      link: '/reports?tab=ai',
    },
    {
      id: 'risk-analytics',
      title: 'Risk Analytics',
      description: 'Track high-risk projects, dependencies, and mitigation progress.',
      icon: ShieldCheck,
      link: '/reports?tab=risks',
    },
    {
      id: 'portfolio-view',
      title: 'Portfolio Overview',
      description: 'Compare projects across health, budget, and schedule dimensions.',
      icon: Layers,
      link: '/reports?tab=portfolio',
    },
  ]

  const handleWidgetClick = (widget) => {
    setSelectedWidget(widget.id)
    navigate(widget.link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">Analytics Hub</h1>
          <p className="text-gray-600">
            Explore advanced dashboards powered by AI insights and historical data.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/reports')}>
          Open Reports
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets.map((widget) => {
          const Icon = widget.icon
          const isActive = selectedWidget === widget.id
          return (
            <Card
              key={widget.id}
              className={`p-6 flex flex-col gap-4 cursor-pointer transition-all border ${
                isActive ? 'border-primary-400 shadow-lg' : 'border-gray-200 hover:shadow-md'
              }`}
              onClick={() => handleWidgetClick(widget)}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-50 rounded-full">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{widget.title}</h2>
                  <p className="text-sm text-gray-600">{widget.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-primary-600">
                <span>Open dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

