import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Edit,
  Building2,
  Users,
  Settings as SettingsIcon,
  CreditCard,
  Calendar,
  Globe,
  Save,
  FileText,
} from 'lucide-react'
import { useOrganization, useUpdateOrganization, useOrganizationTeams } from '@/hooks/api/useOrganization'
import { useRole } from '@/hooks/useRole'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import FormGroup from '@/components/ui/FormGroup'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

/**
 * Organization Page
 * Display organization details with tabs for Overview, Settings, Teams, and Subscription
 * Only accessible by admins
 */
export default function Organization() {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const { isAdmin } = useRole()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditMode, setIsEditMode] = useState(false)
  const [localOrg, setLocalOrg] = useState(null)

  const { data: organization, isLoading } = useOrganization()
  const { data: teamsData } = useOrganizationTeams()
  const updateOrganization = useUpdateOrganization()

  // Initialize localOrg when organization data loads
  useEffect(() => {
    const orgData = organization?.data?.organization || organization
    if (!localOrg && orgData) {
      setLocalOrg({
        name: orgData.name || '',
        domain: orgData.domain || '',
        settings: { ...orgData.settings } || {},
      })
    }
  }, [organization, localOrg])

  const teams = teamsData || []

  // Redirect if not admin - AFTER all hooks
  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <p className="text-gray-600">Organization not found</p>
        </Card>
      </div>
    )
  }

  const orgData = organization?.data?.organization || organization

  const handleSave = () => {
    if (!localOrg) return

    updateOrganization.mutate(localOrg, {
      onSuccess: () => {
        setIsEditMode(false)
      },
    })
  }

  const handleCancel = () => {
    setLocalOrg(null)
    setIsEditMode(false)
  }

  const stats = orgData.statistics || {}

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{orgData.name || 'Organization'}</h1>
            {orgData.domain && (
              <p className="text-gray-600 mt-1 flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {orgData.domain}
              </p>
            )}
          </div>
        </div>
        {!isEditMode && (
          <Button
            variant="outlined"
            onClick={() => {
              setLocalOrg({
                name: orgData.name || '',
                domain: orgData.domain || '',
                settings: { ...orgData.settings } || {},
              })
              setIsEditMode(true)
            }}
            leftIcon={<Edit className="w-4 h-4" />}
          >
            Edit Organization
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
            { id: 'teams', label: 'Teams', icon: Users },
            { id: 'subscription', label: 'Subscription', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab organization={orgData} stats={stats} teams={teams} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            organization={orgData}
            localOrg={localOrg}
            setLocalOrg={setLocalOrg}
            isEditMode={isEditMode}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
        {activeTab === 'teams' && <TeamsTab teams={teams} />}
        {activeTab === 'subscription' && <SubscriptionTab organization={orgData} />}
      </div>
    </div>
  )
}

// Overview Tab
function OverviewTab({ organization, stats, teams }) {
  const navigate = useNavigate()
  const subscription = organization.subscription || {}
  const settings = organization.settings || {}

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Teams</p>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.teams || 0}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Projects</p>
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.projects || 0}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Users</p>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.users || 0}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Subscription Plan</p>
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          <Badge
            variant={subscription.plan === 'enterprise' ? 'success' : subscription.plan === 'pro' ? 'warning' : 'default'}
            className="mt-2"
          >
            {subscription.plan || 'free'}
          </Badge>
        </Card>
      </div>

      {/* Organization Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Organization Name</p>
            <p className="text-gray-900 font-medium">{organization.name}</p>
          </div>
          {organization.domain && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Domain</p>
              <p className="text-gray-900 font-medium">{organization.domain}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 mb-1">Sprint Duration</p>
            <p className="text-gray-900 font-medium">{settings.sprintDuration || 14} days</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Work Hours Per Day</p>
            <p className="text-gray-900 font-medium">{settings.workHoursPerDay || 8} hours</p>
          </div>
        </div>
      </Card>

      {/* Teams Overview */}
      {teams.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Teams Overview</h3>
          <div className="space-y-3">
            {teams.slice(0, 5).map((team) => (
              <button
                key={team._id || team.id}
                onClick={() => navigate(`/teams/${team._id || team.id}`)}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left w-full"
              >
                <div>
                  <p className="font-medium text-gray-900">{team.name}</p>
                  <p className="text-sm text-gray-600">
                    {team.members?.length || 0} members
                  </p>
                </div>
                <Badge variant={team.isActive ? 'success' : 'default'}>
                  {team.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// Settings Tab
function SettingsTab({ organization, localOrg, setLocalOrg, isEditMode, onSave, onCancel }) {
  const settings = localOrg?.settings || organization.settings || {}

  const handleChange = (field, value) => {
    setLocalOrg((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSettingsChange = (field, value) => {
    setLocalOrg((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }))
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Organization Settings</h3>
        <div className="space-y-6">
          <FormGroup label="Organization Name">
            <Input
              value={isEditMode ? (localOrg?.name || '') : (organization.name || '')}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={!isEditMode}
              placeholder="Organization name"
            />
          </FormGroup>

          <FormGroup label="Domain">
            <Input
              value={isEditMode ? (localOrg?.domain || '') : (organization.domain || '')}
              onChange={(e) => handleChange('domain', e.target.value)}
              disabled={!isEditMode}
              placeholder="example.com"
            />
          </FormGroup>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Sprint Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormGroup label="Sprint Duration (days)">
                <Input
                  type="number"
                  value={isEditMode ? (settings.sprintDuration || 14) : (organization.settings?.sprintDuration || 14)}
                  onChange={(e) => handleSettingsChange('sprintDuration', parseInt(e.target.value))}
                  disabled={!isEditMode}
                  min="1"
                  max="30"
                />
              </FormGroup>

              <FormGroup label="Work Hours Per Day">
                <Input
                  type="number"
                  value={isEditMode ? (settings.workHoursPerDay || 8) : (organization.settings?.workHoursPerDay || 8)}
                  onChange={(e) => handleSettingsChange('workHoursPerDay', parseInt(e.target.value))}
                  disabled={!isEditMode}
                  min="1"
                  max="24"
                />
              </FormGroup>
            </div>
          </div>

          {isEditMode && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={onSave} leftIcon={<Save className="w-4 h-4" />}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// Teams Tab
function TeamsTab({ teams }) {
  const navigate = useNavigate()

  if (teams.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No teams found</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Teams</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team._id || team.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/teams/${team._id || team.id}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{team.name}</h4>
                <Badge variant={team.isActive ? 'success' : 'default'}>
                  {team.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {team.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{team.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{team.members?.length || 0} members</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// Subscription Tab
function SubscriptionTab({ organization }) {
  const subscription = organization.subscription || {}
  const expiresAt = subscription.expiresAt
    ? new Date(subscription.expiresAt).toLocaleDateString()
    : 'N/A'
  const navigate = useNavigate()

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'enterprise':
        return 'success'
      case 'pro':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Subscription Details</h3>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <p className="text-sm text-gray-600">
            Manage billing, upgrades, and invoices from the billing center.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => navigate('/settings?section=billing')}>
              Manage Billing
            </Button>
            <Button variant="outlined" onClick={() => navigate('/settings?section=billing&intent=upgrade')}>
              Upgrade Plan
            </Button>
            <Button
              variant="ghost"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={() => navigate('/settings?section=billing&view=invoices')}
            >
              View Invoices
            </Button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Plan</p>
              <Badge variant={getPlanColor(subscription.plan)} className="mt-2">
                {subscription.plan || 'free'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Expires At</p>
              <p className="text-gray-900 font-medium mt-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {expiresAt}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Plan Features</h4>
            <div className="space-y-2">
              {subscription.plan === 'enterprise' && (
                <>
                  <p className="text-sm text-gray-700">✓ Unlimited projects and teams</p>
                  <p className="text-sm text-gray-700">✓ Advanced analytics and reporting</p>
                  <p className="text-sm text-gray-700">✓ Priority support</p>
                  <p className="text-sm text-gray-700">✓ Custom integrations</p>
                </>
              )}
              {subscription.plan === 'pro' && (
                <>
                  <p className="text-sm text-gray-700">✓ Up to 10 projects</p>
                  <p className="text-sm text-gray-700">✓ Basic analytics</p>
                  <p className="text-sm text-gray-700">✓ Email support</p>
                </>
              )}
              {(!subscription.plan || subscription.plan === 'free') && (
                <>
                  <p className="text-sm text-gray-700">✓ Up to 3 projects</p>
                  <p className="text-sm text-gray-700">✓ Basic features</p>
                  <p className="text-sm text-gray-700">✓ Community support</p>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

