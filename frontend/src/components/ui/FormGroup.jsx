import PropTypes from 'prop-types'
import { cn } from '@/utils'

/**
 * FormGroup Component - Wrapper for consistent form field spacing
 * 
 * @example
 * <FormGroup label="Email">
 *   <Input type="email" />
 * </FormGroup>
 */
export default function FormGroup({
  label,
  required,
  children,
  className = '',
  ...props
}) {
  return (
    <div className={cn('flex flex-col', className)} {...props}>
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex-1">
      {children}
      </div>
    </div>
  )
}

FormGroup.propTypes = {
  label: PropTypes.string,
  required: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

