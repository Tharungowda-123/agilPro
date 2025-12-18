import PropTypes from 'prop-types'
import { AlertCircle } from 'lucide-react'
import Alert from '@/components/ui/Alert'
import { cn } from '@/utils'

/**
 * FormError Component
 * Displays form-level errors (e.g., API errors)
 */
export default function FormError({ error, className = '' }) {
  if (!error) {
    return null
  }

  return (
    <Alert variant="error" className={cn('mb-4', className)}>
      <div className="flex items-start gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    </Alert>
  )
}

FormError.propTypes = {
  error: PropTypes.string,
  className: PropTypes.string,
}

