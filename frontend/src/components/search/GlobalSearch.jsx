import { useEffect, useRef, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { Search, X, Clock, ArrowUp, ArrowDown, Command, Save, Share2, Filter } from 'lucide-react'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/utils'
import { useShortcutAction } from '@/context/ShortcutContext'
import searchService from '@/services/searchService'
import { useAuthStore } from '@/stores/useAuthStore'

const STATUS_OPTIONS = ['todo', 'in-progress', 'done']
const PRIORITY_OPTIONS = ['low', 'medium', 'high']

/**
 * GlobalSearch Component
 * Global search with keyboard shortcut (Cmd+K / Ctrl+K)
 * 
 * @example
 * <GlobalSearch />
 */
export default function GlobalSearch({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [filters, setFilters] = useState({
    entityTypes: ['project', 'story', 'task', 'user'],
    statuses: [],
    priorities: [],
    assignees: [],
    teams: [],
  })
  const [savedFilters, setSavedFilters] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [shareSettings, setShareSettings] = useState({
    shareWithTeam: false,
    makePublic: false,
  })
  const [serverRecentSearches, setServerRecentSearches] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [newFilterName, setNewFilterName] = useState('')
  const [newFilterDescription, setNewFilterDescription] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [isSavingFilter, setIsSavingFilter] = useState(false)
  const inputRef = useRef(null)
  const resultsRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [localRecentSearches, setLocalRecentSearches] = useState(
    searchService.getRecentSearches()
  )

  const allResults = results
    ? [
        ...(results.projects || []),
        ...(results.sprints || []),
        ...(results.stories || []),
        ...(results.tasks || []),
        ...(results.users || []),
      ]
    : []

  const getGlobalIndex = (section, index) => {
    if (!results) return index
    const order = ['projects', 'sprints', 'stories', 'tasks', 'users']
    let offset = 0
    for (const key of order) {
      if (key === section) break
      offset += results[key]?.length || 0
    }
    return offset + index
  }

  const refreshSavedFilters = async () => {
    try {
      const saved = await searchService.fetchSavedFilters()
      setSavedFilters(saved.filters || saved || [])
    } catch (error) {
      console.error('Failed to load saved filters', error)
    }
  }

  const refreshServerRecent = async () => {
    try {
      const recent = await searchService.fetchServerRecentSearches()
      setServerRecentSearches(recent.history || recent || [])
    } catch (error) {
      console.error('Failed to load recent searches', error)
    }
  }

  const handleSaveCurrentFilter = async () => {
    if (!newFilterName.trim()) {
      return
    }
    setIsSavingFilter(true)
    try {
      await searchService.saveFilter({
        name: newFilterName,
        description: newFilterDescription,
        entityTypes: filters.entityTypes,
        criteria: { filters, query },
        shared: {
          isShared: shareSettings.shareWithTeam || shareSettings.makePublic,
          sharedWith:
            shareSettings.shareWithTeam && user?.team?._id
              ? [{ team: user.team._id }]
              : [],
        },
        isPublic: shareSettings.makePublic,
      })
      await refreshSavedFilters()
      setNewFilterName('')
      setNewFilterDescription('')
    } catch (error) {
      console.error('Error saving filter', error)
    } finally {
      setIsSavingFilter(false)
    }
  }

  const handleApplySavedFilter = (filter) => {
    if (!filter) return
    if (filter.criteria?.filters) {
      setFilters((prev) => ({
        ...prev,
        ...filter.criteria.filters,
      }))
    }
    if (filter.criteria?.query) {
      setQuery(filter.criteria.query)
    }
    setShowFilters(true)
  }

  const handleDeleteSavedFilter = async (filterId) => {
    try {
      await searchService.deleteFilter(filterId)
      await refreshSavedFilters()
    } catch (error) {
      console.error('Error deleting filter', error)
    }
  }

  const toggleShareSetting = (key) => {
    setShareSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleMultiValueChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    }))
  }

  const openSearch = useCallback(() => {
    setIsOpen(true)
  }, [])

  // Register keyboard shortcut (handles missing provider gracefully)
  useShortcutAction('search.open', openSearch, { enabled: true })

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
        setResults(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

useEffect(() => {
  if (!isOpen) return
  refreshSavedFilters()
  refreshServerRecent()
}, [isOpen])

  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      setIsSearching(false)
      setSuggestions([])
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const response = await searchService.searchAdvanced({
          query,
          filters,
        })
        setResults(response)
        setLocalRecentSearches(searchService.getRecentSearches())
        await refreshServerRecent()
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
        setSelectedIndex(0)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query, filters])

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const resp = await searchService.fetchSuggestions(query)
        setSuggestions(resp.suggestions || resp || [])
      } catch (error) {
        console.error('Suggestion error:', error)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (isOpen && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex, isOpen, results])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault()
      handleSelect(allResults[selectedIndex])
    }
  }

  const handleSelect = (result) => {
    navigate(result.url)
    setIsOpen(false)
    setQuery('')
    setResults(null)
  }

  useEffect(() => {
    if (isOpen) {
      setLocalRecentSearches(searchService.getRecentSearches())
    }
  }, [isOpen])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm text-gray-600',
          className
        )}
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">
          <Command className="w-3 h-3" />
          <span>K</span>
        </kbd>
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
        <div
          className="w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search projects, sprints, stories, tasks, users..."
              className="flex-1 border-0 focus:ring-0 text-lg"
              autoFocus
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showFilters ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-500'
              )}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700/70 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {showFilters && (
              <div className="border-b border-gray-200 bg-gray-50/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Filters</p>
                  <div className="flex gap-2">
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => {
                        setFilters({
                          entityTypes: ['project', 'story', 'task', 'user'],
                          statuses: [],
                          priorities: [],
                          assignees: [],
                          teams: [],
                        })
                        setShareSettings({ shareWithTeam: false, makePublic: false })
                      }}
                    >
                      Reset
                    </Button>
                    <Button variant="text" size="sm" onClick={() => setShowFilters(false)}>
                      Hide
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        Entity Types
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['project', 'story', 'task', 'user'].map((type) => (
                          <Badge
                            key={type}
                            size="sm"
                            variant={filters.entityTypes.includes(type) ? 'primary' : 'outlined'}
                            className="cursor-pointer"
                            onClick={() =>
                              setFilters((prev) => ({
                                ...prev,
                                entityTypes: prev.entityTypes.includes(type)
                                  ? prev.entityTypes.filter((item) => item !== type)
                                  : [...prev.entityTypes, type],
                              }))
                            }
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Statuses</label>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((status) => (
                          <Badge
                            key={status}
                            size="sm"
                            variant={filters.statuses.includes(status) ? 'primary' : 'outlined'}
                            className="cursor-pointer capitalize"
                            onClick={() =>
                              setFilters((prev) => ({
                                ...prev,
                                statuses: prev.statuses.includes(status)
                                  ? prev.statuses.filter((item) => item !== status)
                                  : [...prev.statuses, status],
                              }))
                            }
                          >
                            {status}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Priorities</label>
                      <div className="flex flex-wrap gap-2">
                        {PRIORITY_OPTIONS.map((priority) => (
                          <Badge
                            key={priority}
                            size="sm"
                            variant={filters.priorities.includes(priority) ? 'primary' : 'outlined'}
                            className="cursor-pointer capitalize"
                            onClick={() =>
                              setFilters((prev) => ({
                                ...prev,
                                priorities: prev.priorities.includes(priority)
                                  ? prev.priorities.filter((item) => item !== priority)
                                  : [...prev.priorities, priority],
                              }))
                            }
                          >
                            {priority}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        Assignees (comma separated IDs)
                      </label>
                      <Input
                        value={filters.assignees.join(', ')}
                        onChange={(e) => handleMultiValueChange('assignees', e.target.value)}
                        placeholder="e.g. 64f..., 64a..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        Teams (comma separated IDs)
                      </label>
                      <Input
                        value={filters.teams.join(', ')}
                        onChange={(e) => handleMultiValueChange('teams', e.target.value)}
                        placeholder="Team IDs"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        Filter Name
                      </label>
                      <Input
                        value={newFilterName}
                        onChange={(e) => setNewFilterName(e.target.value)}
                        placeholder="e.g. Critical backend tasks"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        Description
                      </label>
                      <Input
                        value={newFilterDescription}
                        onChange={(e) => setNewFilterDescription(e.target.value)}
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">Share</div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={shareSettings.shareWithTeam ? 'primary' : 'outlined'}
                        size="sm"
                        leftIcon={<Share2 className="w-4 h-4" />}
                        onClick={() => toggleShareSetting('shareWithTeam')}
                      >
                        Share with team
                      </Button>
                      <Button
                        type="button"
                        variant={shareSettings.makePublic ? 'primary' : 'outlined'}
                        size="sm"
                        onClick={() => toggleShareSetting('makePublic')}
                      >
                        Make public
                      </Button>
                    </div>
                    <Button
                      variant="primary"
                      leftIcon={<Save className="w-4 h-4" />}
                      onClick={handleSaveCurrentFilter}
                      loading={isSavingFilter}
                      disabled={!newFilterName.trim()}
                    >
                      Save Filter
                    </Button>
                  </div>
                </div>
                {savedFilters.length > 0 && (
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Saved Filters</p>
                    </div>
                    <div className="space-y-2">
                      {savedFilters.map((filter) => (
                        <div
                          key={filter._id}
                          className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2 bg-white"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{filter.name}</p>
                            {filter.description && (
                              <p className="text-xs text-gray-500">{filter.description}</p>
                            )}
                            <p className="text-[10px] text-gray-400">
                              {filter.isPublic
                                ? 'Public filter'
                                : filter.shared?.isShared
                                ? 'Shared with team'
                                : 'Private'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outlined"
                              size="sm"
                              onClick={() => handleApplySavedFilter(filter)}
                            >
                              Apply
                            </Button>
                            <Button
                              variant="text"
                              size="sm"
                              onClick={() => handleDeleteSavedFilter(filter._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {suggestions.length > 0 && query.trim() && (
              <div className="border-b border-gray-200 bg-white px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Suggestions</p>
                  <span className="text-xs text-gray-400">Click to autocomplete</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setQuery(suggestion)}
                      className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-600 hover:bg-gray-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isSearching ? (
              <div className="p-8 text-center text-gray-400">Searching...</div>
            ) : query.trim() ? (
              results && results.total > 0 ? (
                <div ref={resultsRef} className="p-2">
                  {/* Projects */}
                  {results.projects.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between px-3 py-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase">Projects</h3>
                        <Badge variant="outlined" size="sm">
                          {results.projects.length}
                        </Badge>
                      </div>
                      {results.projects.map((project, index) => {
                        const globalIndex = getGlobalIndex('projects', index)
                        return (
                          <SearchResultItem
                            key={project.id}
                            result={project}
                            isSelected={selectedIndex === globalIndex}
                            onClick={() => handleSelect(project)}
                            query={query}
                          />
                        )
                      })}
                    </div>
                  )}

                  {/* Sprints */}
                  {results.sprints.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between px-3 py-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase">Sprints</h3>
                        <Badge variant="outlined" size="sm">
                          {results.sprints.length}
                        </Badge>
                      </div>
                      {results.sprints.map((sprint, index) => {
                        const globalIndex = getGlobalIndex('sprints', index)
                        return (
                          <SearchResultItem
                            key={sprint.id}
                            result={sprint}
                            isSelected={selectedIndex === globalIndex}
                            onClick={() => handleSelect(sprint)}
                            query={query}
                          />
                        )
                      })}
                    </div>
                  )}

                  {/* Stories */}
                  {results.stories.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between px-3 py-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase">Stories</h3>
                        <Badge variant="outlined" size="sm">
                          {results.stories.length}
                        </Badge>
                      </div>
                      {results.stories.map((story, index) => {
                        const globalIndex = getGlobalIndex('stories', index)
                        return (
                          <SearchResultItem
                            key={story.id}
                            result={story}
                            isSelected={selectedIndex === globalIndex}
                            onClick={() => handleSelect(story)}
                            query={query}
                          />
                        )
                      })}
                    </div>
                  )}

                  {/* Tasks */}
                  {results.tasks.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between px-3 py-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase">Tasks</h3>
                        <Badge variant="outlined" size="sm">
                          {results.tasks.length}
                        </Badge>
                      </div>
                      {results.tasks.map((task, index) => {
                        const globalIndex = getGlobalIndex('tasks', index)
                        return (
                          <SearchResultItem
                            key={task.id}
                            result={task}
                            isSelected={selectedIndex === globalIndex}
                            onClick={() => handleSelect(task)}
                            query={query}
                          />
                        )
                      })}
                    </div>
                  )}

                  {/* Users */}
                  {results.users.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between px-3 py-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase">Users</h3>
                        <Badge variant="outlined" size="sm">
                          {results.users.length}
                        </Badge>
                      </div>
                      {results.users.map((user, index) => {
                        const globalIndex = getGlobalIndex('users', index)
                        return (
                          <SearchResultItem
                            key={user.id}
                            result={user}
                            isSelected={selectedIndex === globalIndex}
                            onClick={() => handleSelect(user)}
                            query={query}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <p>No results found for "{query}"</p>
                </div>
              )
            ) : (
              (serverRecentSearches.length > 0 || localRecentSearches.length > 0) && (
                <div className="p-4 space-y-4">
                  {serverRecentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase">
                          Team History
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {serverRecentSearches.map((history) => (
                          <button
                            key={history._id}
                            onClick={() => setQuery(history.query)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded text-left text-sm text-gray-700"
                          >
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{history.query}</p>
                              <p className="text-[11px] text-gray-500">
                                {history.resultsCount} results ·{' '}
                                {new Date(history.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {localRecentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase">
                          Your Recent Searches
                        </h3>
                        <button
                          onClick={() => {
                            searchService.clearRecentSearches()
                            setLocalRecentSearches([])
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-1">
                        {localRecentSearches.map((search, index) => (
                          <button
                            key={`${search}-${index}`}
                            onClick={() => setQuery(search)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded text-left text-sm text-gray-700"
                          >
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Footer */}
          {query.trim() && results && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  <ArrowDown className="w-3 h-3" />
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">Enter</kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">Esc</kbd>
                  <span>Close</span>
                </span>
              </div>
              <span>{results.total} results</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Search Result Item Component
function SearchResultItem({ result, isSelected, onClick, query }) {
  const highlight = (text) => {
    if (!text || !query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-primary-200 text-primary-900">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const getBreadcrumb = () => {
    const parts = []
    if (result.project) parts.push(result.project)
    if (result.sprint) parts.push(result.sprint)
    if (result.story) parts.push(result.story)
    return parts.join(' > ')
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-2 rounded transition-colors text-left',
        isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
      )}
    >
      <span className="text-xl mt-0.5">{result.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900">{highlight(result.title)}</h4>
          {result.key && (
            <Badge variant="outlined" size="sm" className="font-mono">
              {result.key}
            </Badge>
          )}
          {result.role && (
            <Badge variant="outlined" size="sm">
              {result.role}
            </Badge>
          )}
        </div>
        {result.description && (
          <p className="text-sm text-gray-600 line-clamp-1">{highlight(result.description)}</p>
        )}
        {getBreadcrumb() && (
          <p className="text-xs text-gray-400 mt-1">{getBreadcrumb()}</p>
        )}
      </div>
    </button>
  )
}

SearchResultItem.propTypes = {
  result: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  query: PropTypes.string,
}

GlobalSearch.propTypes = {
  className: PropTypes.string,
}

