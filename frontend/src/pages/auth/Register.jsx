import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/stores/useAuthStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Checkbox from '@/components/ui/Checkbox'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import GoogleButton from '@/components/auth/GoogleButton'
import AuthLayout from '@/components/layout/AuthLayout'
import { getPasswordStrength } from '@/utils/passwordStrength'
import api from '@/services/api'
import { API_ENDPOINTS } from '@/constants'

/**
 * Register Page
 * Registration form with password strength indicator and Google OAuth
 */
export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const passwordValue = watch('password', '')
  const passwordStrength = getPasswordStrength(passwordValue)

  const onSubmit = async (data) => {
    if (!acceptedTerms) {
      toast.error('Please accept the terms and conditions')
      return
    }

    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      })
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          error.message || 
                          'Registration failed'
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
            Create Account
          </h1>
          <p className="text-gray-600">Sign up to get started</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            autoComplete="name"
            {...register('name', {
              required: 'Name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters',
              },
            })}
            error={errors.name?.message}
          />

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
              placeholder="Create a password"
              autoComplete="new-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain uppercase, lowercase, and number',
                },
                onChange: (e) => setPassword(e.target.value),
              })}
              error={errors.password?.message}
            />

            {/* Password Strength Indicator */}
            {passwordValue && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-600">Password strength:</span>
                  <Badge variant={passwordStrength.color} size="sm">
                    {passwordStrength.label}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength.level
                          ? passwordStrength.color === 'error'
                            ? 'bg-error-500'
                            : passwordStrength.color === 'warning'
                            ? 'bg-warning-500'
                            : 'bg-success-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="mt-2 text-xs text-gray-500 space-y-1">
                    {passwordStrength.feedback.map((item, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <Input
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            autoComplete="new-password"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            }
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === passwordValue || 'Passwords do not match',
            })}
            error={errors.confirmPassword?.message}
          />

          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            label={
              <span>
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:underline">
                  Terms and Conditions
                </Link>
              </span>
            }
            error={!acceptedTerms && errors.terms?.message}
          />

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Create Account
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

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  )
}

