import PropTypes from 'prop-types'
import Select from '@/components/ui/Select'
import { cn } from '@/utils'

/**
 * StatusSelector Component
 * Dropdown for selecting story/task status
 * 
 * @example
 * <StatusSelector value={status} onChange={setStatus} />
 */
export default function StatusSelector({ value, onChange, className = '', forTask = false }) {
  // Task statuses: ['todo', 'in-progress', 'done']
  // Story statuses: ['backlog', 'ready', 'in-progress', 'review', 'done']
  const taskStatusOptions = [
    { value: 'todo', label: 'To Do', color: 'text-gray-600' },
    { value: 'in-progress', label: 'In Progress', color: 'text-yellow-600' },
    { value: 'done', label: 'Done', color: 'text-green-600' },
  ]
  
  const storyStatusOptions = [
    { value: 'backlog', label: 'Backlog', color: 'text-gray-600' },
    { value: 'ready', label: 'Ready', color: 'text-blue-600' },
    { value: 'in-progress', label: 'In Progress', color: 'text-yellow-600' },
    { value: 'review', label: 'Review', color: 'text-purple-600' },
    { value: 'done', label: 'Done', color: 'text-green-600' },
  ]
  
  // Use task options if forTask is true, otherwise use story options
  const statusOptions = forTask ? taskStatusOptions : storyStatusOptions
  
  // Normalize value for display (handle both 'in-progress' and 'in_progress')
  // Also provide default value if undefined/null
  const normalizedValue = value === 'in_progress' 
    ? 'in-progress' 
    : value || (forTask ? 'todo' : 'backlog')

  return (
    <Select 
      options={statusOptions}
      value={normalizedValue} 
      onChange={onChange} 
      className={className}
      placeholder={`Select ${forTask ? 'task' : 'story'} status`}
    />
  )
}

StatusSelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  forTask: PropTypes.bool, // If true, use task status options; if false, use story status options
}

