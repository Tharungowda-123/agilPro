import { useState } from 'react'
import PropTypes from 'prop-types'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/utils'

/**
 * Select Component
 * 
 * @example
 * <Select
 *   label="Country"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'uk', label: 'United Kingdom' }
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 * 
 * @example
 * <Select
 *   multiple
 *   options={options}
 *   value={selectedValues}
 *   onChange={setSelectedValues}
 * />
 */
export default function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  disabled = false,
  required = false,
  multiple = false,
  searchable = false,
  className = '',
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  const selectedLabels = multiple
    ? options
        .filter((opt) => value?.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ')
    : options.find((opt) => opt.value === value)?.label

  const handleSelect = (optionValue) => {
    if (multiple) {
      const newValue = value || []
      if (newValue.includes(optionValue)) {
        onChange(newValue.filter((v) => v !== optionValue))
      } else {
        onChange([...newValue, optionValue])
      }
    } else {
      onChange(optionValue)
      setIsOpen(false)
    }
  }

  const removeValue = (optionValue) => {
    if (multiple) {
      onChange(value.filter((v) => v !== optionValue))
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'input-field flex items-center justify-between cursor-pointer',
            error && 'border-error-500 focus:ring-error-500',
            disabled && 'bg-gray-50 cursor-not-allowed',
            className
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          {...props}
        >
          <span className={cn('truncate', !selectedLabels && 'text-gray-400')}>
            {selectedLabels || placeholder}
          </span>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              isOpen && 'transform rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-strong max-h-60 overflow-auto">
              {searchable && (
                <div className="p-2 border-b">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="input-field text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <ul role="listbox" className="py-1">
                {filteredOptions.length === 0 ? (
                  <li className="px-4 py-2 text-sm text-gray-500">No options found</li>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = multiple
                      ? value?.includes(option.value)
                      : value === option.value

                    return (
                      <li
                        key={option.value}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          'px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between',
                          isSelected && 'bg-primary-50 text-primary-700'
                        )}
                      >
                        <span>{option.label}</span>
                        {isSelected && (
                          <span className="text-primary-600">✓</span>
                        )}
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          </>
        )}
      </div>

      {multiple && value && value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((val) => {
            const option = options.find((opt) => opt.value === val)
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm"
              >
                {option?.label}
                <button
                  type="button"
                  onClick={() => removeValue(val)}
                  className="hover:text-primary-900"
                  aria-label={`Remove ${option?.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-error-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

Select.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array,
  ]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  multiple: PropTypes.bool,
  searchable: PropTypes.bool,
  className: PropTypes.string,
}

