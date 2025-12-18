import PropTypes from 'prop-types'
import { Dialog } from '@headlessui/react'
import { SHORTCUT_GROUPS, getShortcutMeta } from '@/constants/shortcuts'
import { cn } from '@/utils'

export default function ShortcutHelpModal({ isOpen, onClose, shortcuts }) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[120]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-3xl rounded-2xl bg-surface shadow-2xl border theme-border">
          <div className="flex items-center justify-between px-6 py-4 border-b theme-border">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                Keyboard Shortcuts
              </Dialog.Title>
              <p className="text-sm text-muted">Boost your productivity with power shortcuts.</p>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm rounded-lg border border-transparent hover:border-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/70 transition-colors"
            >
              Esc
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.id} className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                  {group.title}
                </p>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-xl border theme-border bg-surface"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {shortcut.label}
                        </p>
                        <p className="text-xs text-muted">{shortcut.description}</p>
                      </div>
                      <ShortcutPill combo={shortcuts[shortcut.id] || shortcut.defaultCombo} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

ShortcutHelpModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  shortcuts: PropTypes.object.isRequired,
}

export function ShortcutPill({ combo }) {
  const keys = (combo || '').split('+').filter(Boolean)
  return (
    <div className="flex items-center gap-1">
      {keys.map((key) => (
        <kbd
          key={key}
          className={cn(
            'px-2 py-1 rounded-lg border theme-border bg-white dark:bg-slate-900 dark:border-slate-700 text-xs font-semibold uppercase tracking-wider',
            key.length > 1 ? 'text-[11px]' : 'text-sm'
          )}
        >
          {key}
        </kbd>
      ))}
    </div>
  )
}

ShortcutPill.propTypes = {
  combo: PropTypes.string,
}

