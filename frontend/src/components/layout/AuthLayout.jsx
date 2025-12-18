import PropTypes from 'prop-types'
import { Sparkles, KanbanSquare, BarChart3, Users } from 'lucide-react'

/**
 * AuthLayout Component
 * Two-column layout for authentication pages
 * Left: Branding, image, features
 * Right: Auth form
 * Single column on mobile
 */
export default function AuthLayout({ children, showFeatures }) {
  // Default showFeatures to true if not provided
  const shouldShowFeatures = showFeatures !== undefined ? showFeatures : true
  const features = [
    {
      icon: KanbanSquare,
      title: 'Kanban Boards',
      description: 'Visualize your workflow',
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Track your progress',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work together seamlessly',
    },
    {
      icon: Sparkles,
      title: 'AI Recommendations',
      description: 'Smart insights powered by AI',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="min-h-screen flex">
        {/* Left Column - Branding & Features (Desktop) */}
        {shouldShowFeatures && (
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-secondary-600 p-12 flex-col justify-between text-white">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-bold text-2xl">A</span>
                </div>
                <span className="font-heading text-2xl font-bold">AgileSAFe AI</span>
              </div>
              <h1 className="font-heading text-4xl font-bold mb-4">
                Welcome to AgileSAFe AI Platform
              </h1>
              <p className="text-lg text-white/90 mb-12">
                Your AI-powered Agile and SAFe methodology platform for modern project management
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <Icon className="w-6 h-6 mb-2" />
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-white/80">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Right Column - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  )
}

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showFeatures: PropTypes.bool,
}

