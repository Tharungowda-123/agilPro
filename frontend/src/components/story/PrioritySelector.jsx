import PropTypes from 'prop-types'
import Select from '@/components/ui/Select'
import { cn } from '@/utils'

/**
 * PrioritySelector Component
 * Dropdown for selecting story/task priority
 * 
 * @example
 * <PrioritySelector value={priority} onChange={setPriority} />
 */
export default function PrioritySelector({ value, onChange, className = '' }) {
  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ]

  return (
    <Select 
      options={priorityOptions}
      value={value || 'medium'} 
      onChange={onChange} 
      className={className}
      placeholder="Select priority"
    />
  )
}

PrioritySelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
}

