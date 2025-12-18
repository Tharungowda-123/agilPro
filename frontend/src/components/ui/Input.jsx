import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/utils'

/**
 * Input Component
 * Supports react-hook-form with forwardRef
 * 
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error="Email is required"
 * />
 * 
 * @example
 * <Input
 *   label="Password"
 *   type="password"
 *   leftIcon={<Lock />}
 *   helperText="Must be at least 8 characters"
 * />
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className = '',
    disabled = false,
    required = false,
    id,
    ...props
  },
  ref
) {
  const hasError = !!error
  const inputId = id || props.name || 'input'

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'input-field',
            hasError && 'border-error-500 focus:ring-error-500',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            disabled && 'bg-gray-50 cursor-not-allowed',
            className
          )}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-20 pointer-events-auto">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-error-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.oneOf(['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'datetime-local']),
  error: PropTypes.string,
  helperText: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
}

export default Input
