import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Filter, Download, Calendar, User, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Table from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import { useAuditLogs, useExportAuditLogsCSV } from '@/hooks/api/useAuditLogs'
import { useUsers } from '@/hooks/api/useUsers'
// Format time ago helper
const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return `${seconds} seconds ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hours ago`
  const days = Math.floor(hours / 24)
  return `${days} days ago`
}
import { toast } from 'react-hot-toast'

/**
 * Audit Logs Page
 * Admin-only page to view and filter audit logs
 */
export default function AuditLogs() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialAction = searchParams.get('action') || ''
  const initialEntityType = searchParams.get('entityType') || ''
  const initialUserId = searchParams.get('userId') || ''
  const initialSearch = searchParams.get('search') || ''
  const initialPage = Number(searchParams.get('page') || 1)

  const [page, setPage] = useState(initialPage)
  const [limit] = useState(50)
  const [filters, setFilters] = useState({
    userId: initialUserId,
    action: initialAction,
    entityType: initialEntityType,
    search: initialSearch,
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    archived: searchParams.get('archived') === 'true',
  })

  const { data, isLoading } = useAuditLogs({
    page,
    limit,
    ...filters,
  })

  const { data: usersData } = useUsers()
  const users = usersData?.data || usersData || []
  const exportCSV = useExportAuditLogsCSV()

  const auditLogs = data?.data || []
  const pagination = data?.pagination || {}

  // Action types for filter
  const actionTypes = [
    'user_created',
    'user_updated',
    'user_deleted',
    'user_role_changed',
    'user_activated',
    'user_deactivated',
    'project_created',
    'project_updated',
    'sprint_started',
    'sprint_completed',
    'story_created',
    'story_updated',
    'task_created',
    'task_updated',
    'task_assigned',
    'comment_created',
    'comment_updated',
    'team_created',
    'team_updated',
    'settings_updated',
    'login',
    'logout',
  ]

  // Entity types for filter
  const entityTypes = ['user', 'project', 'sprint', 'story', 'task', 'comment', 'team', 'settings']

  const updateQueryParams = (nextFilters, nextPage = 1) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    if (nextPage > 1) {
      params.set('page', nextPage.toString())
    } else {
      params.delete('page')
    }
    setSearchParams(params, { replace: true })
  }

  const handleFilterChange = (key, value) => {
    const nextFilters = { ...filters, [key]: value }
    setFilters(nextFilters)
    setPage(1)
    updateQueryParams(nextFilters, 1)
  }

  const handleExport = () => {
    exportCSV.mutate(filters)
  }

  const handleClearFilters = () => {
    const cleared = {
      userId: '',
      action: '',
      entityType: '',
      search: '',
      startDate: '',
      endDate: '',
      archived: false,
    }
    setFilters(cleared)
    setPage(1)
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  // Table columns
  const columns = [
    {
      header: 'Timestamp',
      accessor: (log) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {new Date(log.createdAt).toLocaleString()}
          </div>
          <div className="text-gray-500 text-xs">
            {formatTimeAgo(log.createdAt)}
          </div>
        </div>
      ),
    },
    {
      header: 'User',
      accessor: (log) => (
        <div>
          <div className="font-medium text-gray-900">{log.userName || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{log.userEmail || ''}</div>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: (log) => (
        <Badge
          variant={
            log.action?.includes('created')
              ? 'success'
              : log.action?.includes('deleted')
              ? 'error'
              : log.action?.includes('updated')
              ? 'warning'
              : 'default'
          }
          size="sm"
        >
          {log.action?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </Badge>
      ),
    },
    {
      header: 'Entity',
      accessor: (log) => (
        <div>
          <div className="font-medium text-gray-900 capitalize">{log.entityType || 'N/A'}</div>
          {log.entityName && (
            <div className="text-sm text-gray-500 truncate max-w-xs">{log.entityName}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: (log) => (
        <div className="text-sm text-gray-700 max-w-md truncate">{log.description || 'N/A'}</div>
      ),
    },
    {
      header: 'IP Address',
      accessor: (log) => (
        <div className="text-sm text-gray-600 font-mono">{log.ipAddress || 'N/A'}</div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Audit Logs</h1>
          <p className="text-gray-600">Track all system actions and changes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            onClick={handleExport}
            loading={exportCSV.isPending}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by description, user, or entity..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* User Filter */}
          <Select
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user._id || user.id} value={user._id || user.id}>
                {user.name}
              </option>
            ))}
          </Select>

          {/* Action Filter */}
          <Select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">All Actions</option>
            {actionTypes.map((action) => (
              <option key={action} value={action}>
                {action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </Select>

          {/* Entity Type Filter */}
          <Select
            value={filters.entityType}
            onChange={(e) => handleFilterChange('entityType', e.target.value)}
          >
            <option value="">All Entities</option>
            {entityTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </Select>

          {/* Start Date */}
          <Input
            type="date"
            label="Start Date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />

          {/* End Date */}
          <Input
            type="date"
            label="End Date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />

          {/* Archived Filter */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="archived"
              checked={filters.archived}
              onChange={(e) => handleFilterChange('archived', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="archived" className="text-sm text-gray-700">
              Show Archived
            </label>
          </div>

          {/* Clear Filters */}
          <Button variant="outlined" onClick={handleClearFilters} className="lg:col-span-4">
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading audit logs...</div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audit logs found</div>
        ) : (
          <>
            <Table columns={columns} data={auditLogs} />
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-200">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

