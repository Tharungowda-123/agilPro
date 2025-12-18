import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/utils'
import FormGroup from '@/components/ui/FormGroup'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Select from '@/components/ui/Select'

/**
 * FormField Component
 * Enhanced form field with validation feedback
 * Shows success/error indicators and helper text
 */
const FormField = forwardRef(function FormField(
  {
    label,
    name,
    error,
    helperText,
    success,
    required,
    type = 'text',
    as = 'input',
    className = '',
    ...props
  },
  ref
) {
  const hasError = !!error
  const hasSuccess = success && !hasError

  const inputProps = {
    ref,
    name,
    id: name,
    type,
    'aria-invalid': hasError,
    'aria-describedby': hasError || helperText ? `${name}-helper` : undefined,
    className: cn(
      hasError && 'border-error-500 focus:border-error-500 focus:ring-error-500',
      hasSuccess && 'border-success-500 focus:border-success-500 focus:ring-success-500',
      className
    ),
    ...props,
  }

  const renderInput = () => {
    switch (as) {
      case 'textarea':
        return <TextArea {...inputProps} />
      case 'select':
        return <Select {...inputProps} />
      default:
        return <Input {...inputProps} />
    }
  }

  return (
    <FormGroup className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {renderInput()}

        {/* Success/Error Icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {hasError && (
            <AlertCircle className="w-5 h-5 text-error-500" aria-hidden="true" />
          )}
          {hasSuccess && (
            <CheckCircle2 className="w-5 h-5 text-success-500" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Helper Text / Error Message */}
      {(error || helperText) && (
        <p
          id={`${name}-helper`}
          className={cn(
            'mt-1 text-sm',
            hasError ? 'text-error-600' : 'text-gray-500'
          )}
          role={hasError ? 'alert' : undefined}
        >
          {error || helperText}
        </p>
      )}
    </FormGroup>
  )
})

FormField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  error: PropTypes.string,
  helperText: PropTypes.string,
  success: PropTypes.bool,
  required: PropTypes.bool,
  type: PropTypes.string,
  as: PropTypes.oneOf(['input', 'textarea', 'select']),
  className: PropTypes.string,
}

export default FormField

