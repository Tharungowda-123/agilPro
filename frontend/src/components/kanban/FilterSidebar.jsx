import PropTypes from 'prop-types'
import { useState } from 'react'
import { X, Filter } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { cn } from '@/utils'

/**
 * FilterSidebar Component
 * Slide-in sidebar for filtering Kanban board stories
 * 
 * @example
 * <FilterSidebar
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   filters={filters}
 *   onFiltersChange={handleFiltersChange}
 *   users={users}
 *   sprints={sprints}
 * />
 */
export default function FilterSidebar({
  isOpen,
  onClose,
  filters = {},
  onFiltersChange,
  users = [],
  sprints = [],
  className = '',
}) {
  const [localFilters, setLocalFilters] = useState(filters)

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

  const appliedFiltersCount = Object.values(localFilters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'string') return v.trim() !== ''
    return v !== null && v !== undefined
  }).length

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              {appliedFiltersCount > 0 && (
                <Badge variant="primary" size="sm">
                  {appliedFiltersCount}
                </Badge>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <Input
              placeholder="Search by title..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignee
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <Checkbox
                    checked={(localFilters.assignees || []).includes(user.id)}
                    onChange={(e) => {
                      const assignees = localFilters.assignees || []
                      const newAssignees = e.target.checked
                        ? [...assignees, user.id]
                        : assignees.filter((id) => id !== user.id)
                      handleFilterChange('assignees', newAssignees)
                    }}
                  />
                  <Avatar name={user.name} size="sm" src={user.avatar} />
                  <span className="text-sm text-gray-700">{user.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="space-y-2">
              {['high', 'medium', 'low'].map((priority) => (
                <label
                  key={priority}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <Checkbox
                    checked={(localFilters.priorities || []).includes(priority)}
                    onChange={(e) => {
                      const priorities = localFilters.priorities || []
                      const newPriorities = e.target.checked
                        ? [...priorities, priority]
                        : priorities.filter((p) => p !== priority)
                      handleFilterChange('priorities', newPriorities)
                    }}
                  />
                  <span className="text-sm text-gray-700 capitalize">{priority}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Story Points Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Story Points
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={localFilters.minPoints || ''}
                onChange={(e) => handleFilterChange('minPoints', e.target.value ? Number(e.target.value) : null)}
              />
              <Input
                type="number"
                placeholder="Max"
                value={localFilters.maxPoints || ''}
                onChange={(e) => handleFilterChange('maxPoints', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
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

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Button variant="outlined" onClick={handleClear} className="flex-1">
              Clear All
            </Button>
            <Button variant="primary" onClick={handleApply} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

FilterSidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  filters: PropTypes.object,
  onFiltersChange: PropTypes.func.isRequired,
  users: PropTypes.array,
  sprints: PropTypes.array,
  className: PropTypes.string,
}

