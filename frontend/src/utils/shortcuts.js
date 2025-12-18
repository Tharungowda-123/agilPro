const formatKey = (key) => {
  if (!key) return ''
  if (key.length === 1) {
    return key.toUpperCase()
  }
  switch (key.toLowerCase()) {
    case ' ':
    case 'space':
      return 'Space'
    default:
      return key
  }
}

export const normalizeCombo = (combo) => {
  if (!combo) return ''
  return combo
    .split('+')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      switch (segment.toLowerCase()) {
        case 'cmd':
        case 'command':
        case 'meta':
        case '⌘':
          return 'Meta'
        case 'ctrl':
        case 'control':
          return 'Ctrl'
        case 'alt':
        case 'option':
          return 'Alt'
        case 'shift':
          return 'Shift'
        case 'mod':
          return navigator?.platform?.includes('Mac') ? 'Meta' : 'Ctrl'
        default:
          return segment.length === 1 ? segment.toUpperCase() : segment
      }
    })
    .join('+')
}

export const eventToCombo = (event) => {
  const parts = []
  if (event.ctrlKey) parts.push('Ctrl')
  if (event.metaKey) parts.push('Meta')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey && event.key !== 'Shift') parts.push('Shift')

  const key = formatKey(event.key)
  if (
    key &&
    key !== 'Shift' &&
    key !== 'Control' &&
    key !== 'Alt' &&
    key !== 'Meta'
  ) {
    parts.push(key.length === 1 ? key.toUpperCase() : key)
  }

  return parts.join('+')
}

