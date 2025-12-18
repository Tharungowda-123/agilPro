export const SHORTCUT_GROUPS = [
  {
    id: 'global',
    title: 'Global',
    shortcuts: [
      {
        id: 'search.open',
        label: 'Open global search',
        description: 'Quickly jump to anything in the workspace.',
        defaultCombo: 'Mod+K',
      },
      {
        id: 'task.new',
        label: 'Quick create task',
        description: 'Open quick-create to add a new task from anywhere.',
        defaultCombo: 'N',
      },
      {
        id: 'shortcuts.help',
        label: 'Show shortcuts help',
        description: 'Display this shortcuts reference.',
        defaultCombo: 'Shift+/',
      },
    ],
  },
  {
    id: 'navigation',
    title: 'Navigation',
    shortcuts: [
      {
        id: 'item.next',
        label: 'Next item',
        description: 'Move focus to the next item in focused lists.',
        defaultCombo: 'J',
      },
      {
        id: 'item.previous',
        label: 'Previous item',
        description: 'Move focus to the previous item in focused lists.',
        defaultCombo: 'K',
      },
    ],
  },
  {
    id: 'actions',
    title: 'Item actions',
    shortcuts: [
      {
        id: 'item.edit',
        label: 'Edit selected item',
        description: 'Start editing the currently highlighted item.',
        defaultCombo: 'E',
      },
      {
        id: 'item.delete',
        label: 'Delete selected item',
        description: 'Delete or archive the highlighted item.',
        defaultCombo: 'Shift+D',
      },
      {
        id: 'item.comment',
        label: 'Add comment',
        description: 'Jump to the comment composer.',
        defaultCombo: 'C',
      },
    ],
  },
]

export const DEFAULT_SHORTCUT_MAP = SHORTCUT_GROUPS.reduce((map, group) => {
  group.shortcuts.forEach((shortcut) => {
    map[shortcut.id] = shortcut.defaultCombo
  })
  return map
}, {})

export const getShortcutMeta = (actionId) => {
  for (const group of SHORTCUT_GROUPS) {
    const match = group.shortcuts.find((shortcut) => shortcut.id === actionId)
    if (match) {
      return { ...match, group: group.title }
    }
  }
  return null
}

