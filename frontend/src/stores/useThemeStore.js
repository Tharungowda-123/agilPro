import { create } from 'zustand'

const THEME_KEY = 'agilpro_theme'
const CONTRAST_KEY = 'agilpro_contrast'

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false

const applyContrastToDom = (contrast) => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.contrast = contrast
}

const applyThemeToDom = (theme) => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useThemeStore = create((set, get) => ({
  theme: 'light',
  contrast: 'normal',
  autoMode: true,
  initialized: false,
  initTheme: () => {
    if (get().initialized || typeof window === 'undefined') {
      return
    }

    const storedTheme = window.localStorage.getItem(THEME_KEY)
    const storedContrast = window.localStorage.getItem(CONTRAST_KEY) || 'normal'
    const systemTheme = prefersDark() ? 'dark' : 'light'
    const theme = storedTheme || systemTheme

    applyThemeToDom(theme)
    applyContrastToDom(storedContrast)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = (event) => {
      if (get().autoMode) {
        get().applyTheme(event.matches ? 'dark' : 'light', { persist: false })
      }
    }
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange)
    } else {
      mediaQuery.addListener(handleSystemChange)
    }

    set({
      theme,
      contrast: storedContrast,
      autoMode: !storedTheme,
      initialized: true,
    })
  },
  applyTheme: (theme, { persist = true } = {}) => {
    applyThemeToDom(theme)
    if (persist && typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, theme)
    }
    if (!persist && typeof window !== 'undefined') {
      window.localStorage.removeItem(THEME_KEY)
    }
    set({ theme, autoMode: !persist })
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark'
    get().applyTheme(nextTheme)
  },
  useSystemTheme: () => {
    const theme = prefersDark() ? 'dark' : 'light'
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(THEME_KEY)
    }
    get().applyTheme(theme, { persist: false })
  },
  setContrast: (contrast) => {
    const value = contrast || 'normal'
    applyContrastToDom(value)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CONTRAST_KEY, value)
    }
    set({ contrast: value })
  },
}))

