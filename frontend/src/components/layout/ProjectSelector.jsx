import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Search, Check } from 'lucide-react'
import { cn } from '@/utils'
import Button from '@/components/ui/Button'

/**
 * ProjectSelector Component
 * Dropdown to switch between projects with search functionality
 * Current project display and create new project button
 */
export default function ProjectSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState({
    id: 1,
    name: 'AgileSAFe Platform',
    color: 'primary',
  })
  const [searchTerm, setSearchTerm] = useState('')

  const projects = [
    { id: 1, name: 'AgileSAFe Platform', color: 'primary' },
    { id: 2, name: 'Mobile App Redesign', color: 'secondary' },
    { id: 3, name: 'E-commerce Dashboard', color: 'success' },
    { id: 4, name: 'Marketing Campaign', color: 'warning' },
  ]

  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getColorClass = (color) => {
    const colors = {
      primary: 'bg-primary-500',
      secondary: 'bg-secondary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
    }
    return colors[color] || colors.primary
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div className={cn('w-3 h-3 rounded-full', getColorClass(selectedProject.color))} />
        <span className="hidden sm:inline">{selectedProject.name}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-strong z-50 animate-scale-in">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Projects List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No projects found
              </div>
            ) : (
              <div className="py-1">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors',
                      selectedProject.id === project.id && 'bg-primary-50'
                    )}
                  >
                    <div className={cn('w-3 h-3 rounded-full', getColorClass(project.color))} />
                    <span className="flex-1 text-left">{project.name}</span>
                    {selectedProject.id === project.id && (
                      <Check className="w-4 h-4 text-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create New Project */}
          <div className="p-3 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create New Project
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

