import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ServerCrash, RefreshCw, Home, Mail, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

/**
 * 500 Server Error Page
 * Server error page with retry and support options
 */
export default function ServerError() {
  const navigate = useNavigate()
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    // Wait a bit for better UX
    await new Promise((resolve) => setTimeout(resolve, 1000))
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full text-center">
        <Card className="p-12">
          {/* Illustration */}
          <div className="mb-8">
            <ServerCrash className="w-32 h-32 text-error-300 mx-auto" />
          </div>

          {/* Error Code */}
          <h1 className="text-9xl font-bold text-error-200 mb-4">500</h1>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Server Error
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            We're experiencing some technical difficulties. Our team has been notified and is
            working on a fix. Please try again in a few moments.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              onClick={handleRetry}
              variant="primary"
              size="lg"
              disabled={isRetrying}
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" size="lg">
              <Home className="w-5 h-5 mr-2" />
              Go to Home
            </Button>
            <Button onClick={() => navigate(-1)} variant="ghost" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Support Contact */}
          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600 mb-4">
              If the problem persists, please contact our support team:
            </p>
            <div className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <a
                href="mailto:support@agilesafe.ai"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                support@agilesafe.ai
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

