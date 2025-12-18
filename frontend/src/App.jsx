import { lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '@/components/layout/ErrorBoundary'
import MainLayout from '@/components/layout/MainLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoadingBoundary from '@/components/ui/LoadingBoundary'
import { queryClient } from '@/services/queryClient'
import { useAuthStore } from '@/stores/useAuthStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { ShortcutProvider } from '@/context/ShortcutContext'

// Lazy load all route components
const Home = lazy(() => import('@/pages/Home'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const ProjectsList = lazy(() => import('@/pages/projects/ProjectsList'))
const ProjectDetail = lazy(() => import('@/pages/projects/ProjectDetail'))
const Features = lazy(() => import('@/pages/Features'))
const FeatureDetail = lazy(() => import('@/pages/features/FeatureDetail'))
const PIPlanningBoard = lazy(() => import('@/pages/pi-planning/PIPlanningBoard'))
const PIDashboard = lazy(() => import('@/pages/pi-planning/PIDashboard'))
const SprintsList = lazy(() => import('@/pages/sprints/SprintsList'))
const SprintDetail = lazy(() => import('@/pages/sprints/SprintDetail'))
const SprintPlanning = lazy(() => import('@/pages/sprints/SprintPlanning'))
const Board = lazy(() => import('@/pages/Board'))
const KanbanBoard = lazy(() => import('@/pages/KanbanBoard'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const TeamsList = lazy(() => import('@/pages/teams/TeamsList'))
const TeamDetail = lazy(() => import('@/pages/teams/TeamDetail'))
const Organization = lazy(() => import('@/pages/organization/Organization'))
const UserProfile = lazy(() => import('@/pages/users/UserProfile'))
const UserSettings = lazy(() => import('@/pages/users/UserSettings'))
const UserManagement = lazy(() => import('@/pages/users/UserManagement'))
const Unsubscribe = lazy(() => import('@/pages/users/Unsubscribe'))
const TimeTrackingDashboard = lazy(() => import('@/pages/timeTracking/TimeTrackingDashboard'))
const Reports = lazy(() => import('@/pages/Reports'))
const CustomReportBuilder = lazy(() => import('@/pages/reports/CustomReportBuilder'))
const AuditLogs = lazy(() => import('@/pages/admin/AuditLogs'))
const SystemHealth = lazy(() => import('@/pages/admin/SystemHealth'))
const CacheManagement = lazy(() => import('@/pages/admin/CacheManagement'))
const AIRecommendations = lazy(() => import('@/pages/AIRecommendations'))
const MLPerformanceDashboard = lazy(() => import('@/pages/ml/MLPerformanceDashboard'))
const Settings = lazy(() => import('@/pages/Settings'))
const NotFound = lazy(() => import('@/pages/errors/NotFound'))
const ServerError = lazy(() => import('@/pages/errors/ServerError'))
const Forbidden = lazy(() => import('@/pages/errors/Forbidden'))

// Public Route Component (redirect if already authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  // Don't redirect while loading (to avoid flickering)
  if (isLoading) {
    return children
  }
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function ThemeInitializer() {
  const initTheme = useThemeStore((state) => state.initTheme)

  useEffect(() => {
    initTheme()
  }, [initTheme])

  return null
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ShortcutProvider>
          <ThemeInitializer />
          <BrowserRouter>
            <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <LoadingBoundary>
                  <Home />
                </LoadingBoundary>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoadingBoundary>
                    <Login />
                  </LoadingBoundary>
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <LoadingBoundary>
                    <Register />
                  </LoadingBoundary>
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <LoadingBoundary>
                    <ForgotPassword />
                  </LoadingBoundary>
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <LoadingBoundary>
                    <ResetPassword />
                  </LoadingBoundary>
                </PublicRoute>
              }
            />
            <Route
              path="/unsubscribe/:token"
              element={
                <LoadingBoundary>
                  <Unsubscribe />
                </LoadingBoundary>
              }
            />
            <Route
              path="/settings/notifications"
              element={
                <PublicRoute>
                  <LoadingBoundary>
                    <Unsubscribe />
                  </LoadingBoundary>
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route
                path="/projects"
                element={
                  <LoadingBoundary>
                    <ProjectsList />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <LoadingBoundary>
                    <ProjectDetail />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/features"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <LoadingBoundary>
                      <Features />
                    </LoadingBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/features/:id"
                element={
                  <LoadingBoundary>
                    <FeatureDetail />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/pi-planning/:id"
                element={
                  <LoadingBoundary>
                    <PIPlanningBoard />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/pi/:id"
                element={
                  <LoadingBoundary>
                    <PIDashboard />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/sprints"
                element={
                  <LoadingBoundary>
                    <SprintsList />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/sprints/:id"
                element={
                  <LoadingBoundary>
                    <SprintDetail />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/sprints/:id/planning"
                element={
                  <LoadingBoundary>
                    <SprintPlanning />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/reports"
                element={
                  <LoadingBoundary>
                    <Reports />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/reports/custom"
                element={
                  <LoadingBoundary>
                    <CustomReportBuilder />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <LoadingBoundary>
                    <Dashboard />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/board"
                element={
                  <LoadingBoundary>
                    <Board />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/kanban"
                element={
                  <LoadingBoundary>
                    <KanbanBoard />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/analytics"
                element={
                  <LoadingBoundary>
                    <Analytics />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/teams"
                element={
                  <LoadingBoundary>
                    <TeamsList />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/teams/:id"
                element={
                  <LoadingBoundary>
                    <TeamDetail />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/organization"
                element={
                  <LoadingBoundary>
                    <Organization />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <LoadingBoundary>
                      <UserManagement />
                    </LoadingBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <LoadingBoundary>
                      <AuditLogs />
                    </LoadingBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system-health"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <LoadingBoundary>
                      <SystemHealth />
                    </LoadingBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cache-management"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <LoadingBoundary>
                      <CacheManagement />
                    </LoadingBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:id"
                element={
                  <LoadingBoundary>
                    <UserProfile />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/settings"
                element={
                  <LoadingBoundary>
                    <UserSettings />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/time-tracking"
                element={
                  <LoadingBoundary>
                    <TimeTrackingDashboard />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/ai-recommendations"
                element={
                  <LoadingBoundary>
                    <AIRecommendations />
                  </LoadingBoundary>
                }
              />
              <Route
                path="/ml-performance"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <LoadingBoundary>
                      <MLPerformanceDashboard />
                    </LoadingBoundary>
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Error Routes */}
            <Route
              path="/not-found"
              element={
                <LoadingBoundary>
                  <NotFound />
                </LoadingBoundary>
              }
            />
            <Route
              path="/server-error"
              element={
                <LoadingBoundary>
                  <ServerError />
                </LoadingBoundary>
              }
            />
            <Route
              path="/forbidden"
              element={
                <LoadingBoundary>
                  <Forbidden />
                </LoadingBoundary>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/not-found" replace />} />
            </Routes>
          </BrowserRouter>
        </ShortcutProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'theme-toast',
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 15px 35px -15px rgba(15, 23, 42, 0.55)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
