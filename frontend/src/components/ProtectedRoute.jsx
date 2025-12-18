import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuthStore } from '@/stores/useAuthStore'
import Spinner from '@/components/ui/Spinner'

/**
 * ProtectedRoute Component
 * Checks if user is authenticated and redirects to login if not
 * Shows loading spinner while checking auth
 * Supports role-based access control
 * 
 * @example
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * @example
 * <ProtectedRoute allowedRoles={['admin', 'manager']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation()
  const { isAuthenticated, user, isLoading, initAuth } = useAuthStore()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initialize = async () => {
      // Only initialize if not authenticated and not already loading
      if (!isAuthenticated && !isLoading) {
        await initAuth()
      }
      setIsInitializing(false)
    }
    initialize()
  }, []) // Run only once on mount
  
  // Update initializing state when auth state changes
  useEffect(() => {
    if (isAuthenticated || isLoading === false) {
      setIsInitializing(false)
    }
  }, [isAuthenticated, isLoading])

  // Show loading spinner while checking auth
  if (isInitializing || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role-based access
  if (allowedRoles.length > 0 && user) {
    const userRole = user.role || 'user'
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <Navigate to="/dashboard" replace />
          </div>
        </div>
      )
    }
  }

  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
}

