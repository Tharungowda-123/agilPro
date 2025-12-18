import { useNavigate } from 'react-router-dom'
import { Lock, Home, ArrowLeft, Shield } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * 403 Forbidden Page
 * Access denied page with explanation
 */
export default function Forbidden() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  
  const handleGoHome = () => {
    navigate('/dashboard', { replace: true })
  }
  
  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      navigate('/login', { replace: true })
      setTimeout(() => {
        if (location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }, 50)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full text-center">
        <Card className="p-12">
          {/* Illustration */}
          <div className="mb-8">
            <Lock className="w-32 h-32 text-warning-300 mx-auto" />
          </div>

          {/* Error Code */}
          <h1 className="text-9xl font-bold text-warning-200 mb-4">403</h1>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>

          {/* Description */}
          <div className="text-lg text-gray-600 mb-8 max-w-md mx-auto space-y-3">
            <p>
              You don't have permission to access this resource.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm bg-warning-50 border border-warning-200 rounded-lg p-4">
              <Shield className="w-5 h-5 text-warning-600" />
              <p className="text-warning-800">
                This page requires specific permissions. If you believe this is an error,
                please contact your administrator.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleGoHome} variant="primary" size="lg">
              <Home className="w-5 h-5 mr-2" />
              Go to Home
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
            <Button onClick={handleLogout} variant="danger" size="lg">
              Logout
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

