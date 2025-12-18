import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, KanbanSquare, BarChart3 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="container-custom py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              AgileSAFe AI Platform
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Your AI-powered Agile and SAFe methodology platform for modern project management
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" variant="primary">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card hover className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <KanbanSquare className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-heading text-xl font-semibold mb-2">Kanban Boards</h3>
            <p className="text-gray-600">
              Visualize your workflow with powerful Kanban boards and drag-and-drop functionality
            </p>
          </Card>

          <Card hover className="text-center">
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-secondary-600" />
            </div>
            <h3 className="font-heading text-xl font-semibold mb-2">Analytics</h3>
            <p className="text-gray-600">
              Get insights with comprehensive analytics and real-time reporting
            </p>
          </Card>

          <Card hover className="text-center">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-success-600" />
            </div>
            <h3 className="font-heading text-xl font-semibold mb-2">AI Recommendations</h3>
            <p className="text-gray-600">
              Leverage AI-powered recommendations to optimize your workflow
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
