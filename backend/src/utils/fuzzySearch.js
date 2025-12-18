export const normalizeText = (text = '') => text.toLowerCase().trim()

export const fuzzyMatch = (text = '', query = '') => {
  const normalizedText = normalizeText(text)
  const normalizedQuery = normalizeText(query)

  if (!normalizedText || !normalizedQuery) {
    return 0
  }

  if (normalizedText.includes(normalizedQuery)) {
    return 1
  }

  const distance = levenshteinDistance(normalizedText, normalizedQuery)
  const maxLen = Math.max(normalizedText.length, normalizedQuery.length)
  return 1 - distance / maxLen
}

export const levenshteinDistance = (a, b) => {
  if (!a.length) return b.length
  if (!b.length) return a.length

  const matrix = Array.from({ length: b.length + 1 }, () => [])

  for (let i = 0; i <= b.length; i++) {
    matrix[i][0] = i
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

export const buildSearchVector = (doc, fields) => {
  return fields
    .map((field) => {
      const value = field
        .split('.')
        .reduce((obj, key) => (obj ? obj[key] : null), doc)
      return value ? normalizeText(String(value)) : ''
    })
    .filter(Boolean)
    .join(' ')
}

