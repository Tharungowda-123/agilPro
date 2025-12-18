import PropTypes from 'prop-types'
import { cn } from '@/utils'
import Button from '@/components/ui/Button'

/**
 * EmptyState Component
 * Reusable component for empty lists/no data states
 * 
 * @example
 * <EmptyState
 *   icon={<Folder className="w-12 h-12" />}
 *   title="No projects yet"
 *   description="Get started by creating your first project"
 *   action={<Button onClick={handleCreate}>Create Project</Button>}
 * />
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="text-gray-400 mb-4">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="font-heading text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-gray-600 max-w-md mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.node,
  className: PropTypes.string,
}

