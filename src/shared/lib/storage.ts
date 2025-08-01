import { ViewMode } from '../types'

/**
 * Get view mode from localStorage
 * @returns Saved view mode or default
 */
export function getStoredViewMode(): ViewMode {
  const saved = localStorage.getItem('viewMode')
  return (saved as ViewMode) || 'folder-list-memo'
}

/**
 * Save view mode to localStorage
 * @param viewMode View mode to save
 */
export function saveViewMode(viewMode: ViewMode): void {
  localStorage.setItem('viewMode', viewMode)
}

/**
 * Toggle between view modes
 * @param currentMode Current view mode
 * @returns New view mode
 */
export function toggleViewMode(currentMode: ViewMode): ViewMode {
  return currentMode === 'folder-list-memo' ? 'list-memo' : 'folder-list-memo'
}