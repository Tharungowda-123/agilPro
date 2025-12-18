import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { DEFAULT_SHORTCUT_MAP } from '@/constants/shortcuts'
import { useAuthStore } from '@/stores/useAuthStore'
import ShortcutHelpModal from '@/components/shortcuts/ShortcutHelpModal'
import QuickCreateTaskModal from '@/components/shortcuts/QuickCreateTaskModal'
import { eventToCombo, normalizeCombo } from '@/utils/shortcuts'

const ShortcutContext = createContext(null)

const isEditableTarget = (element) => {
  if (!element) return false
  const tag = element.tagName
  if (!tag) return false
  const editableTags = ['INPUT', 'TEXTAREA', 'SELECT']
  if (editableTags.includes(tag)) return true
  if (element.isContentEditable) return true
  return false
}

const normalizePreferenceObject = (value) => {
  if (!value) return {}
  if (value instanceof Map) {
    return Object.fromEntries(value.entries())
  }
  if (typeof value === 'object') {
    return { ...value }
  }
  return {}
}

const getInitialCustomShortcuts = (user) => {
  const storageKey = user?._id || user?.id ? `shortcuts:${user._id || user.id}` : 'shortcuts:anonymous'
  const persisted = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null
  const preferenceShortcuts = normalizePreferenceObject(user?.preferences?.shortcuts)
  if (Object.keys(preferenceShortcuts).length > 0) {
    return preferenceShortcuts
  }
  if (persisted) {
    try {
      return JSON.parse(persisted)
    } catch (error) {
      console.error('Failed to parse shortcut preferences', error)
    }
  }
  return {}
}

export function ShortcutProvider({ children }) {
  const { user, setUser, isAuthenticated } = useAuthStore()
  const [customShortcuts, setCustomShortcuts] = useState(() => getInitialCustomShortcuts(user))
  const [helpOpen, setHelpOpen] = useState(false)

  const storageKey = user?._id || user?.id ? `shortcuts:${user._id || user.id}` : 'shortcuts:anonymous'

  useEffect(() => {
    setCustomShortcuts(getInitialCustomShortcuts(user))
  }, [user?._id, user?.id])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(customShortcuts))
    }
  }, [customShortcuts, storageKey])

  const shortcuts = useMemo(() => {
    const resolved = { ...DEFAULT_SHORTCUT_MAP }
    Object.entries(customShortcuts || {}).forEach(([actionId, combo]) => {
      if (combo) {
        resolved[actionId] = combo
      }
    })
    return resolved
  }, [customShortcuts])

  const handlerMapRef = useRef(new Map())

  const registerHandler = useCallback((actionId, handler) => {
    if (!actionId || typeof handler !== 'function') return () => {}
    const map = handlerMapRef.current
    const existing = map.get(actionId) || new Set()
    existing.add(handler)
    map.set(actionId, existing)

    return () => {
      const current = map.get(actionId)
      if (current) {
        current.delete(handler)
        if (current.size === 0) {
          map.delete(actionId)
        }
      }
    }
  }, [])

  const executeAction = useCallback((actionId, event) => {
    const handlers = handlerMapRef.current.get(actionId)
    if (handlers && handlers.size > 0) {
      handlers.forEach((handler) => handler(event))
      return true
    }
    if (actionId === 'shortcuts.help') {
      setHelpOpen((prev) => !prev)
      return true
    }
    return false
  }, [])

  const matchAction = useCallback(
    (event) => {
      const combo = eventToCombo(event)
      if (!combo) return null
      const normalizedCombo = normalizeCombo(combo)
      const entries = Object.entries(shortcuts)
      for (const [actionId, actionCombo] of entries) {
        if (normalizedCombo === normalizeCombo(actionCombo)) {
          return actionId
        }
      }
      return null
    },
    [shortcuts]
  )

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    const handleKeydown = (event) => {
      if (event.defaultPrevented) return
      if (
        isEditableTarget(event.target) &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        return
      }
      const actionId = matchAction(event)
      if (!actionId) return
      event.preventDefault()
      executeAction(actionId, event)
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [executeAction, matchAction, isAuthenticated])

  const updateShortcutBinding = useCallback((actionId, combo) => {
    setCustomShortcuts((prev) => ({
      ...prev,
      [actionId]: combo,
    }))
  }, [])

  const resetShortcut = useCallback((actionId) => {
    setCustomShortcuts((prev) => {
      const updated = { ...prev }
      delete updated[actionId]
      return updated
    })
  }, [])

  const value = useMemo(
    () => ({
      shortcuts,
      customShortcuts,
      updateShortcutBinding,
      resetShortcut,
      registerHandler,
      openHelp: () => setHelpOpen(true),
      closeHelp: () => setHelpOpen(false),
      helpOpen,
      setUserShortcuts: (nextMap) => {
        setCustomShortcuts(nextMap)
        if (user) {
          const updatedUser = {
            ...user,
            preferences: {
              ...user.preferences,
              shortcuts: nextMap,
            },
          }
          setUser(updatedUser)
        }
      },
    }),
    [
      shortcuts,
      customShortcuts,
      updateShortcutBinding,
      resetShortcut,
      registerHandler,
      helpOpen,
      user,
      setUser,
    ]
  )

  return (
    <ShortcutContext.Provider value={value}>
      {children}
      {isAuthenticated && (
        <>
          <ShortcutHelpModal
            isOpen={helpOpen}
            onClose={() => setHelpOpen(false)}
            shortcuts={shortcuts}
          />
          <QuickCreateTaskModal />
        </>
      )}
    </ShortcutContext.Provider>
  )
}

ShortcutProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export const useShortcuts = () => {
  const context = useContext(ShortcutContext)
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutProvider')
  }
  return context
}

export const useShortcutAction = (actionId, handler, { enabled = true } = {}) => {
  const context = useContext(ShortcutContext)
  
  // If context is not available, skip registration (don't throw)
  if (!context) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('useShortcutAction: ShortcutProvider not available, shortcut will not be registered')
    }
    return
  }

  const { registerHandler } = context

  useEffect(() => {
    if (!enabled || !actionId || typeof handler !== 'function' || !registerHandler) {
      return () => {}
    }
    return registerHandler(actionId, handler)
  }, [actionId, handler, registerHandler, enabled])
}

