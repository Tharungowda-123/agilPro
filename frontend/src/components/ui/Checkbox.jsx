import PropTypes from 'prop-types'
import { Check } from 'lucide-react'
import { cn } from '@/utils'

/**
 * Checkbox Component
 * 
 * @example
 * <Checkbox
 *   id="terms"
 *   label="I agree to the terms"
 *   checked={checked}
 *   onChange={(e) => setChecked(e.target.checked)}
 * />
 */
export default function Checkbox({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={cn('flex items-start', className)}>
      <div className="relative flex items-center">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            'flex items-center justify-center w-5 h-5 border-2 rounded cursor-pointer transition-all',
            checked
              ? 'bg-primary-500 border-primary-500'
              : 'border-gray-300 bg-white',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-error-500'
          )}
        >
          {checked && <Check className="w-3 h-3 text-white" />}
        </label>
      </div>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'ml-3 text-sm cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed',
            error ? 'text-error-600' : 'text-gray-700'
          )}
        >
          {label}
        </label>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-error-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

Checkbox.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.node,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
}

