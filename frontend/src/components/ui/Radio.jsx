import PropTypes from 'prop-types'
import { cn } from '@/utils'

/**
 * Radio Component
 * 
 * @example
 * <Radio
 *   id="option1"
 *   name="choice"
 *   value="option1"
 *   label="Option 1"
 *   checked={selected === "option1"}
 *   onChange={(e) => setSelected(e.target.value)}
 * />
 */
export default function Radio({
  id,
  name,
  value,
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
          type="radio"
          id={id}
          name={name}
          value={value}
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
            'flex items-center justify-center w-5 h-5 border-2 rounded-full cursor-pointer transition-all',
            checked
              ? 'bg-primary-500 border-primary-500'
              : 'border-gray-300 bg-white',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-error-500'
          )}
        >
          {checked && (
            <span className="w-2 h-2 bg-white rounded-full" />
          )}
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

Radio.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
}

