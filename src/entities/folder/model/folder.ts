import { Folder } from './types'

/**
 * Get folder display name with memo count
 * @param folder The folder object
 * @returns Display name with count
 */
export function getFolderDisplayName(folder: Folder): string {
  const count = folder._count?.memos || 0
  return `${folder.name} (${count})`
}

/**
 * Check if folder name is valid
 * @param name Folder name to validate
 * @returns True if name is valid
 */
export function isValidFolderName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 100
}

/**
 * Check if folder is empty (has no memos)
 * @param folder The folder object
 * @returns True if folder is empty
 */
export function isFolderEmpty(folder: Folder): boolean {
  return (folder._count?.memos || 0) === 0
}

/**
 * Compare folders by name (for sorting)
 * @param a First folder
 * @param b Second folder
 * @returns Comparison result
 */
export function compareFoldersByName(a: Folder, b: Folder): number {
  return a.name.localeCompare(b.name)
}

/**
 * Compare folders by memo count (for sorting)
 * @param a First folder
 * @param b Second folder
 * @returns Comparison result
 */
export function compareFoldersByCount(a: Folder, b: Folder): number {
  const countA = a._count?.memos || 0
  const countB = b._count?.memos || 0
  return countB - countA
}