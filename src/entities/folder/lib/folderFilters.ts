import { Folder } from '../model'
import { compareFoldersByName, compareFoldersByCount } from '../model/folder'

/**
 * Sort folders by name alphabetically
 * @param folders Array of folders to sort
 * @returns Sorted folders
 */
export function sortFoldersByName(folders: Folder[]): Folder[] {
  return [...folders].sort(compareFoldersByName)
}

/**
 * Sort folders by memo count (descending)
 * @param folders Array of folders to sort
 * @returns Sorted folders
 */
export function sortFoldersByCount(folders: Folder[]): Folder[] {
  return [...folders].sort(compareFoldersByCount)
}

/**
 * Filter folders by name
 * @param folders Array of folders to filter
 * @param query Search query
 * @returns Filtered folders
 */
export function filterFoldersByName(folders: Folder[], query: string): Folder[] {
  if (!query.trim()) {
    return folders
  }

  const lowerQuery = query.toLowerCase()
  return folders.filter(folder => 
    folder.name.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Find folder by ID
 * @param folders Array of folders to search
 * @param id Folder ID to find
 * @returns Found folder or undefined
 */
export function findFolderById(folders: Folder[], id: string): Folder | undefined {
  return folders.find(folder => folder.id === id)
}