import { useState } from 'react'
import PropTypes from 'prop-types'
import { Filter, X } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import { useTeams } from '@/hooks/api/useTeams'
import { useProjects } from '@/hooks/api/useProjects'
import { useSprints } from '@/hooks/api/useSprints'
import { useUsers } from '@/hooks/api/useUsers'

/**
 * FilterPanel Component
 * Sidebar panel for filtering reports data
 * 
 * @example
 * <FilterPanel
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   isOpen={isOpen}
 *   onClose={handleClose}
 * />
 */
export default function FilterPanel({
  filters = {},
  onFiltersChange,
  isOpen,
  onClose,
  className = '',
}) {
  const [localFilters, setLocalFilters] = useState(filters)

  const { data: teamsData } = useTeams()
  const { data: projectsData } = useProjects()
  // Note: useSprints requires projectId. For reports, you may need to get all projects first
  // For now, we'll disable this query if no projectId is available
  const { data: sprintsData } = useSprints(null) // This will be disabled if projectId is null
  const { data: usersData } = useUsers()

  const teams = teamsData?.data || teamsData || []
  const projects = (projectsData?.data || projectsData?.items || projectsData || []).slice(0, 50) // Limit for dropdown
  const sprints = sprintsData?.data || sprintsData || []
  const users = usersData?.data || usersData || []

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
  }

  const handleApply = () => {
    onFiltersChange?.(localFilters)
  }

  const handleClear = () => {
    const clearedFilters = {}
    setLocalFilters(clearedFilters)
    onFiltersChange?.(clearedFilters)
  }

  const appliedCount = Object.values(localFilters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'string') return v.trim() !== ''
    return v !== null && v !== undefined
  }).length

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${className}`}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              {appliedCount > 0 && (
                <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full">
                  {appliedCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <Select
              value={localFilters.dateRange || '30'}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="custom">Custom</option>
            </Select>
          </div>

          {/* Team */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team
            </label>
            <Select
              value={localFilters.teamId || ''}
              onChange={(e) => handleFilterChange('teamId', e.target.value || null)}
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>
            <Select
              value={localFilters.projectId || ''}
              onChange={(e) => handleFilterChange('projectId', e.target.value || null)}
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Sprint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sprint
            </label>
            <Select
              value={localFilters.sprintId || ''}
              onChange={(e) => handleFilterChange('sprintId', e.target.value || null)}
            >
              <option value="">All Sprints</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </Select>
          </div>

          {/* User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User
            </label>
            <Select
              value={localFilters.userId || ''}
              onChange={(e) => handleFilterChange('userId', e.target.value || null)}
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Button variant="outlined" onClick={handleClear} className="flex-1">
              Clear
            </Button>
            <Button variant="primary" onClick={handleApply} className="flex-1">
              Apply
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

FilterPanel.propTypes = {
  filters: PropTypes.object,
  onFiltersChange: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
}

