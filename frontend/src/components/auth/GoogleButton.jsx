import PropTypes from 'prop-types'
import { useState } from 'react'
import { Chrome } from 'lucide-react'
import { cn } from '@/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { toast } from 'react-hot-toast'

/**
 * GoogleButton Component
 * Styled Google Sign-In button with OAuth flow
 * 
 * @example
 * <GoogleButton onSuccess={() => navigate('/dashboard')} />
 */
export default function GoogleButton({
  onSuccess,
  onError,
  className = '',
  variant = 'default',
}) {
  const [loading, setLoading] = useState(false)
  const { loginWithGoogle } = useAuthStore()

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

      if (!googleClientId || googleClientId === 'your_google_client_id') {
        toast.error('Google OAuth not configured')
        setLoading(false)
        return
      }

      // Redirect to backend Google OAuth endpoint
      window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/google`
    } catch (error) {
      console.error('Google login error:', error)
      toast.error('Failed to initiate Google login')
      if (onError) onError(error)
      setLoading(false)
    }
  }

  const variants = {
    default: 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50',
    outlined: 'bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50',
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className={cn(
        'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <Chrome className="w-5 h-5" />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  )
}

GoogleButton.propTypes = {
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'outlined']),
}

