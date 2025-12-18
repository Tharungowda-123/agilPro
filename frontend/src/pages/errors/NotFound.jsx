import { useNavigate } from 'react-router-dom'
import { FileQuestion, Home, Search, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

/**
 * 404 Not Found Page
 * Friendly 404 page with navigation options
 */
export default function NotFound() {
  const navigate = useNavigate()

  const suggestions = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Projects', path: '/projects' },
    { label: 'Sprints', path: '/sprints' },
    { label: 'Analytics', path: '/analytics' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full text-center">
        <Card className="p-12">
          {/* Illustration */}
          <div className="mb-8">
            <FileQuestion className="w-32 h-32 text-gray-300 mx-auto" />
          </div>

          {/* Error Code */}
          <h1 className="text-9xl font-bold text-gray-200 mb-4">404</h1>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back
            on track.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button onClick={() => navigate('/')} variant="primary" size="lg">
              <Home className="w-5 h-5 mr-2" />
              Go to Home
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Search Suggestions */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              Popular Pages
            </h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion.path}
                  onClick={() => navigate(suggestion.path)}
                  variant="ghost"
                  size="sm"
                >
                  {suggestion.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

