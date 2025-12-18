import { useState } from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/utils'

/**
 * Tabs Component
 * 
 * @example
 * <Tabs>
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </Tabs>
 */
export default function Tabs({
  defaultValue,
  value: controlledValue,
  onChange,
  children,
  className = '',
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const isControlled = controlledValue !== undefined
  const activeValue = isControlled ? controlledValue : internalValue

  const handleChange = (newValue) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {children.map((child) => {
        if (child.type === TabsList) {
          return (
            <child.type
              {...child.props}
              key="tabs-list"
              activeValue={activeValue}
              onValueChange={handleChange}
            />
          )
        }
        if (child.type === TabsContent) {
          return (
            <child.type
              {...child.props}
              key={child.props.value}
              activeValue={activeValue}
            />
          )
        }
        return child
      })}
    </div>
  )
}

Tabs.propTypes = {
  defaultValue: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

// TabsList Component
export function TabsList({ children, activeValue, onValueChange, className = '' }) {
  return (
    <div
      className={cn(
        'flex border-b border-gray-200 mb-4',
        className
      )}
      role="tablist"
    >
      {children.map((child) => (
        <child.type
          {...child.props}
          key={child.props.value}
          isActive={activeValue === child.props.value}
          onSelect={() => onValueChange(child.props.value)}
        />
      ))}
    </div>
  )
}

TabsList.propTypes = {
  children: PropTypes.node.isRequired,
  activeValue: PropTypes.string,
  onValueChange: PropTypes.func,
  className: PropTypes.string,
}

// TabsTrigger Component
export function TabsTrigger({
  value,
  children,
  isActive,
  onSelect,
  className = '',
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onSelect}
      className={cn(
        'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
        isActive
          ? 'border-primary-500 text-primary-600'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300',
        className
      )}
    >
      {children}
    </button>
  )
}

TabsTrigger.propTypes = {
  value: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func,
  className: PropTypes.string,
}

// TabsContent Component
export function TabsContent({
  value,
  children,
  activeValue,
  className = '',
}) {
  if (value !== activeValue) return null

  return (
    <div
      role="tabpanel"
      className={cn('animate-fade-in', className)}
    >
      {children}
    </div>
  )
}

TabsContent.propTypes = {
  value: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  activeValue: PropTypes.string,
  className: PropTypes.string,
}

