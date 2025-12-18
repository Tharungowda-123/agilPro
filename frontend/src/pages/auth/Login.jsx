import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/stores/useAuthStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Checkbox from '@/components/ui/Checkbox'
import Card from '@/components/ui/Card'
import GoogleButton from '@/components/auth/GoogleButton'
import AuthLayout from '@/components/layout/AuthLayout'
import authService from '@/services/api/authService'
import api from '@/services/api'
import { API_ENDPOINTS } from '@/constants'

/**
 * Login Page
 * Clean, centered login form with Google OAuth integration
 */
export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loginWithCredentials, loginWithGoogle } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Check for OAuth callback tokens
  const accessToken = searchParams.get('accessToken')
  const refreshToken = searchParams.get('refreshToken')
  
  if (accessToken) {
    // Handle OAuth callback
    const handleOAuthCallback = async () => {
      try {
        localStorage.setItem('token', accessToken)
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken)
        }
        const response = await authService.getCurrentUser()
        const user = response.user
        if (user) {
          useAuthStore.getState().login(user, accessToken, refreshToken)
          toast.success('Login successful!')
          navigate('/dashboard')
        }
      } catch (error) {
        toast.error('Failed to complete login')
        navigate('/login')
      }
    }
    handleOAuthCallback()
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await loginWithCredentials(data.email, data.password)
      toast.success('Login successful!')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('Login error:', error)
      console.error('Error response:', error.response?.data)
      
      // Extract error message from various possible locations
      let errorMessage = 'Invalid email or password'
      
      // Backend error response format: { status: 'error', message: '...', statusCode: 401 }
      if (error.response?.data) {
        errorMessage = error.response.data.message || 
                      error.response.data.error?.message ||
                      error.response.data.error ||
                      'Invalid email or password'
      } else if (error.message && !error.message.includes('status code')) {
        // Don't show generic Axios error messages
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <span className="font-heading text-2xl font-bold text-gray-900">
              AgileSAFe AI
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email address',
              },
            })}
            error={errors.email?.message}
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              rightIcon={
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowPassword(!showPassword)
                  }}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              error={errors.password?.message}
            />
            <div className="flex items-center justify-between mt-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                label="Remember me"
              />
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        {/* Google Sign-In */}
        <GoogleButton
          onSuccess={() => navigate('/dashboard')}
          className="mb-6"
        />

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  )
}

