import PropTypes from 'prop-types'
import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils'

/**
 * Breadcrumbs Component
 * 
 * @example
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Projects', href: '/projects' },
 *     { label: 'Current Project' }
 *   ]}
 * />
 */
export default function Breadcrumbs({
  items = [],
  className = '',
  showHomeIcon = true,
}) {
  if (items.length === 0) return null

  return (
    <nav
      className={cn('flex items-center space-x-2 text-sm', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center">
              {index === 0 && showHomeIcon ? (
                <Link
                  to={item.href || '#'}
                  className={cn(
                    'flex items-center',
                    isLast
                      ? 'text-gray-500 cursor-default'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  <Home className="w-4 h-4" />
                  <span className="sr-only">{item.label || 'Home'}</span>
                </Link>
              ) : (
                <>
                  {item.href && !isLast ? (
                    <Link
                      to={item.href}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        isLast ? 'text-gray-900 font-medium' : 'text-gray-600'
                      )}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                </>
              )}

              {!isLast && (
                <ChevronRight className="mx-2 w-4 h-4 text-gray-400" aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
    })
  ),
  className: PropTypes.string,
  showHomeIcon: PropTypes.bool,
}

