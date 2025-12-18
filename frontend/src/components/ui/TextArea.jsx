import { useState } from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/utils'

/**
 * TextArea Component
 * 
 * @example
 * <TextArea
 *   label="Description"
 *   rows={4}
 *   maxLength={500}
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 * />
 * 
 * @example
 * <TextArea
 *   label="Comments"
 *   error="This field is required"
 *   showCount
 * />
 */
export default function TextArea({
  label,
  error,
  helperText,
  rows = 4,
  maxLength,
  showCount = false,
  className = '',
  disabled = false,
  required = false,
  resizable = true,
  ...props
}) {
  const [charCount, setCharCount] = useState(props.value?.length || 0)
  const hasError = !!error

  const handleChange = (e) => {
    if (maxLength) {
      setCharCount(e.target.value.length)
    }
    if (props.onChange) {
      props.onChange(e)
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
      <textarea
        className={cn(
          'input-field',
          hasError && 'border-error-500 focus:ring-error-500',
          disabled && 'bg-gray-50 cursor-not-allowed',
          !resizable && 'resize-none',
          className
        )}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={error ? `${props.id || 'textarea'}-error` : undefined}
        onChange={handleChange}
        {...props}
      />
      <div className="flex items-center justify-between mt-1">
        <div>
          {error && (
            <p
              id={`${props.id || 'textarea'}-error`}
              className="text-sm text-error-600"
              role="alert"
            >
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>
        {showCount && maxLength && (
          <p className="text-sm text-gray-500">
            {charCount || props.value?.length || 0} / {maxLength}
          </p>
        )}
      </div>
    </div>
  )
}

TextArea.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  rows: PropTypes.number,
  maxLength: PropTypes.number,
  showCount: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  resizable: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func,
  id: PropTypes.string,
}

