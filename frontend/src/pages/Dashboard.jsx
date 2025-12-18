import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Calendar, Folder, Target, CheckCircle, Users, TrendingUp, BarChart3 } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRole } from '@/hooks/useRole'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import Spinner from '@/components/ui/Spinner'
import StatsCard from '@/components/dashboard/StatsCard'
import VelocityChart from '@/components/dashboard/VelocityChart'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines'
import AIInsightsPanel from '@/components/dashboard/AIInsightsPanel'
import QuickActions from '@/components/dashboard/QuickActions'
import WorkloadWidget from '@/components/workload/WorkloadWidget'
import ExportButton from '@/components/export/ExportButton'
import Card from '@/components/ui/Card'
import {
  useDashboardStats,
  useVelocityData,
  useRecentActivities,
  useUpcomingDeadlines,
  useAIInsights,
  useVelocityForecast,
  useRiskAlerts,
} from '@/hooks/api/useDashboard'
import { useExportDashboardPDF } from '@/hooks/api/useExport'
import { toast } from 'react-hot-toast'
import VelocityForecastCard from '@/components/dashboard/VelocityForecastCard'
import RiskAlertsPanel from '@/components/dashboard/RiskAlertsPanel'
import { AIRecommendationsPanel } from '@/components/ai'
import { useTeamAvailabilityForecast, useTeamAvailabilityDashboard } from '@/hooks/api/useTeams'

/**
 * Dashboard Page
 * Main dashboard with widgets, stats, charts, and activity feed
 */
export default function Dashboard() {
  const { user } = useAuthStore()
  const { isAdmin, isManager, isDeveloper, isViewer, getRoleDisplayName } = useRole()
  const queryClient = useQueryClient()
  const [showAIRecommendations, setShowAIRecommendations] = useState(false)

  // Fetch all dashboard data
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: velocityData, isLoading: velocityLoading } = useVelocityData()
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities()
  const { data: deadlines, isLoading: deadlinesLoading } = useUpcomingDeadlines()
  const { data: insights, isLoading: insightsLoading } = useAIInsights()
  const exportDashboardPDF = useExportDashboardPDF()
  const showManagerInsights = isAdmin || isManager
  const { data: velocityForecast, isLoading: velocityForecastLoading } = useVelocityForecast({
    enabled: showManagerInsights,
  })
  const { data: riskAlerts, isLoading: riskAlertsLoading } = useRiskAlerts({
    enabled: showManagerInsights,
  })
  const resolvedTeamId =
    typeof user?.team === 'object' ? user?.team?._id || user?.team?.id : user?.team || null
  const showTeamAvailability = !!resolvedTeamId && !isViewer
  const { data: teamAvailabilityDashboard, isLoading: teamAvailabilityDashboardLoading } =
    useTeamAvailabilityDashboard(showTeamAvailability ? resolvedTeamId : null)
  const { data: teamAvailabilityForecast, isLoading: teamAvailabilityForecastLoading } = useTeamAvailabilityForecast(
    showTeamAvailability ? resolvedTeamId : null,
    { horizon: 14 }
  )
  const teamAvailabilityLoading = teamAvailabilityDashboardLoading || teamAvailabilityForecastLoading

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [queryClient])

  // Manual refresh handler
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back, {user?.name || 'User'}! 👋
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-600">{currentDate}</p>
            <span className="text-gray-400">•</span>
            <p className="text-sm text-gray-500">{getRoleDisplayName()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            onExportPDF={() => exportDashboardPDF.mutate()}
            onExportExcel={() => {
              // Excel export for dashboard can be added later
              toast.info('Excel export for dashboard coming soon')
            }}
            loading={exportDashboardPDF.isPending}
          />
          {!isViewer && (
            <Button
              variant="outlined"
              onClick={handleRefresh}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Role-specific welcome message */}
      {isDeveloper && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                You have {stats?.tasksAssignedToMe || 0} tasks assigned to you
              </p>
              <p className="text-sm text-blue-700">
                Focus on your assigned tasks and update their status as you progress.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Developer Workload Widget */}
      {isDeveloper && (
        <div className="mb-6">
          <WorkloadWidget />
        </div>
      )}

      {isViewer && (
        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Read-Only Access</p>
              <p className="text-sm text-gray-700">
                You have view-only access. You can view projects, reports, and analytics but cannot create or edit anything.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards - Role-specific */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </>
        ) : (
          <>
            {/* Admin & Manager: Show all projects */}
            {(isAdmin || isManager) && (
              <StatsCard
                title={isAdmin ? "All Projects" : "Team Projects"}
                value={stats?.activeProjects || 0}
                icon={<Folder className="w-6 h-6" />}
                trend={{ value: 5, direction: 'up' }}
                color="primary"
              />
            )}
            
            {/* Developer & Viewer: Show assigned tasks */}
            {(isDeveloper || isViewer) && (
              <StatsCard
                title="Tasks Assigned to Me"
                value={stats?.tasksAssignedToMe || 0}
                icon={<CheckCircle className="w-6 h-6" />}
                trend={{ value: 12, direction: 'up' }}
                color="warning"
              />
            )}

            {/* Admin & Manager: Show active sprints */}
            {(isAdmin || isManager) && (
              <StatsCard
                title="Active Sprints"
                value={stats?.activeSprints || 0}
                icon={<Target className="w-6 h-6" />}
                trend={{ value: 0, direction: 'neutral' }}
                color="success"
              />
            )}

            {/* Developer: Show completed tasks */}
            {isDeveloper && (
              <StatsCard
                title="Completed This Week"
                value={stats?.completedThisWeek || 0}
                icon={<Calendar className="w-6 h-6" />}
                trend={{ value: 8, direction: 'up' }}
                color="info"
              />
            )}

            {/* Admin: Show organization-wide metrics */}
            {isAdmin && (
              <>
                <StatsCard
                  title="Total Users"
                  value={stats?.totalUsers || 0}
                  icon={<Users className="w-6 h-6" />}
                  trend={{ value: 3, direction: 'up' }}
                  color="info"
                />
                <StatsCard
                  title="Team Performance"
                  value={stats?.teamPerformance || 'N/A'}
                  icon={<TrendingUp className="w-6 h-6" />}
                  trend={{ value: 15, direction: 'up' }}
                  color="success"
                />
              </>
            )}

            {/* Manager: Show team-specific metrics */}
            {isManager && (
              <>
                <StatsCard
                  title="Team Members"
                  value={stats?.teamMembers || 0}
                  icon={<Users className="w-6 h-6" />}
                  trend={{ value: 0, direction: 'neutral' }}
                  color="info"
                />
                <StatsCard
                  title="Team Velocity"
                  value={stats?.teamVelocity || 'N/A'}
                  icon={<TrendingUp className="w-6 h-6" />}
                  trend={{ value: 10, direction: 'up' }}
                  color="success"
                />
              </>
            )}

            {/* Viewer: Show read-only stats */}
            {isViewer && (
              <>
                <StatsCard
                  title="Active Projects"
                  value={stats?.activeProjects || 0}
                  icon={<Folder className="w-6 h-6" />}
                  trend={{ value: 0, direction: 'neutral' }}
                  color="primary"
                />
                <StatsCard
                  title="Active Sprints"
                  value={stats?.activeSprints || 0}
                  icon={<Target className="w-6 h-6" />}
                  trend={{ value: 0, direction: 'neutral' }}
                  color="success"
                />
                <StatsCard
                  title="Completed This Week"
                  value={stats?.completedThisWeek || 0}
                  icon={<Calendar className="w-6 h-6" />}
                  trend={{ value: 0, direction: 'neutral' }}
                  color="info"
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width on desktop */}
        <div className="lg:col-span-2 space-y-6">
          {/* Velocity Chart */}
          <VelocityChart data={velocityData?.history || []} loading={velocityLoading} />

          {/* Activity Feed */}
          <ActivityFeed activities={activities || []} loading={activitiesLoading} />
        </div>

        {/* Right Column - 1/3 width on desktop */}
        <div className="space-y-6">
          {/* Quick Actions - Hide for viewers */}
          {!isViewer && (
            <QuickActions onOpenAIRecommendations={() => setShowAIRecommendations(true)} />
          )}

          {showManagerInsights && (
            <VelocityForecastCard
              data={velocityForecast}
              loading={velocityForecastLoading}
            />
          )}

          {showManagerInsights && (
            <RiskAlertsPanel
              data={riskAlerts}
              loading={riskAlertsLoading}
            />
          )}

          {/* Upcoming Deadlines */}
          <UpcomingDeadlines items={deadlines || []} loading={deadlinesLoading} />

          {showTeamAvailability && (
            <TeamAvailabilitySummary
              teamName={user?.team?.name}
              dashboard={teamAvailabilityDashboard}
              forecast={teamAvailabilityForecast}
              loading={teamAvailabilityLoading}
            />
          )}

          {/* AI Insights - Show for admin and manager only */}
          {(isAdmin || isManager) && (
            <AIInsightsPanel insights={insights || []} loading={insightsLoading} />
          )}
        </div>
      </div>

      <AIRecommendationsPanel
        isOpen={showAIRecommendations}
        onClose={() => setShowAIRecommendations(false)}
        context={null}
      />
    </div>
  )
}

function TeamAvailabilitySummary({ teamName, dashboard, forecast, loading }) {
  const forecastWindow = (forecast || []).slice(0, 4)
  const averageAvailable =
    forecastWindow.length > 0
      ? forecastWindow.reduce(
          (sum, entry) => sum + (entry.availableCapacity || entry.availableHours || entry.available || 0),
          0
        ) / forecastWindow.length
      : null
  const averageWorkload =
    forecastWindow.length > 0
      ? forecastWindow.reduce(
          (sum, entry) => sum + (entry.bookedCapacity || entry.bookedHours || entry.workload || 0),
          0
        ) / forecastWindow.length
      : null
  const nextSpike = forecastWindow.find(
    (entry) =>
      (entry.bookedCapacity || entry.bookedHours || entry.workload || 0) >
      (entry.availableCapacity || entry.availableHours || entry.available || 0)
  )
  const upcomingTimeOff = dashboard?.timeOff?.slice(0, 3) || []
  const utilization = dashboard?.utilization?.overallPercent

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Team Availability</h3>
          {teamName && <p className="text-xs text-gray-500">{teamName}</p>}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-28">
          <Spinner size="sm" color="primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Avg Available (next 2 weeks)</p>
              <p className="text-2xl font-bold text-gray-900">
                {averageAvailable !== null ? `${averageAvailable.toFixed(1)} pts` : '--'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Booked</p>
              <p className="text-2xl font-bold text-gray-900">
                {averageWorkload !== null ? `${averageWorkload.toFixed(1)} pts` : '--'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Utilization</p>
              <p className="text-2xl font-bold text-gray-900">
                {utilization !== undefined ? `${utilization}%` : '--'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Upcoming Time Off</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingTimeOff.length}</p>
            </div>
          </div>
          {nextSpike && (
            <div className="p-3 bg-warning-50 border border-warning-100 rounded-lg text-xs text-warning-700">
              High workload expected on{' '}
              <span className="font-semibold">
                {nextSpike.dateLabel ||
                  nextSpike.date ||
                  new Date(nextSpike.timestamp || Date.now()).toLocaleDateString()}
              </span>
              . Consider rebalancing tasks.
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Upcoming Time Off</p>
            {upcomingTimeOff.length === 0 ? (
              <p className="text-sm text-gray-500">No time-off events recorded.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingTimeOff.map((event) => (
                  <li
                    key={`${event.userId}-${event.start}`}
                    className="flex items-center justify-between text-sm text-gray-700"
                  >
                    <span className="font-medium">{event.userName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.start).toLocaleDateString()} - {new Date(event.end).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
