import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils'

/**
 * Dropdown Component
 * 
 * @example
 * <Dropdown
 *   trigger={<Button>Menu</Button>}
 *   items={[
 *     { label: 'Profile', onClick: () => {} },
 *     { label: 'Settings', onClick: () => {} },
 *     { type: 'divider' },
 *     { label: 'Logout', onClick: () => {}, variant: 'danger' }
 *   ]}
 * />
 */
export default function Dropdown({
  trigger,
  items = [],
  position = 'bottom-left',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const positions = {
    'bottom-left': 'top-full left-0 mt-1',
    'bottom-right': 'top-full right-0 mt-1',
    'top-left': 'bottom-full left-0 mb-1',
    'top-right': 'bottom-full right-0 mb-1',
  }

  return (
    <div className={cn('relative inline-block', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-strong py-1 animate-scale-in',
            positions[position]
          )}
          role="menu"
        >
          {items.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={index} className="my-1 border-t border-gray-200" />
            }

            if (item.custom) {
              return <div key={index}>{item.label}</div>
            }

            const itemVariants = {
              default: 'text-gray-700 hover:bg-gray-100',
              danger: 'text-error-600 hover:bg-error-50',
            }

            return (
              <button
                key={index}
                type="button"
                role="menuitem"
                onClick={() => {
                  if (item.onClick) item.onClick()
                  setIsOpen(false)
                }}
                disabled={item.disabled}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm transition-colors',
                  itemVariants[item.variant || 'default'],
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

Dropdown.propTypes = {
  trigger: PropTypes.node.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node,
      onClick: PropTypes.func,
      variant: PropTypes.oneOf(['default', 'danger']),
      disabled: PropTypes.bool,
      type: PropTypes.oneOf(['divider']),
    })
  ),
  position: PropTypes.oneOf(['bottom-left', 'bottom-right', 'top-left', 'top-right']),
  className: PropTypes.string,
}

