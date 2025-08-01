import { Theme } from '../types'

/**
 * Get initial theme from localStorage or system preference
 * @returns Theme preference
 */
export function getInitialTheme(): Theme {
  const saved = localStorage.getItem('theme')
  if (saved && (saved === 'light' || saved === 'dark')) {
    return saved as Theme
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Apply theme to document and save to localStorage
 * @param theme Theme to apply
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

/**
 * Toggle between light and dark theme
 * @param currentTheme Current theme
 * @returns New theme
 */
export function toggleTheme(currentTheme: Theme): Theme {
  return currentTheme === 'dark' ? 'light' : 'dark'
}