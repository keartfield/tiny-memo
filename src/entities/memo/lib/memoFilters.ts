import { Memo } from '../model'
import { memoMatchesQuery, compareMemosByDate } from '../model/memo'

/**
 * Filter memos by search query
 * @param memos Array of memos to filter
 * @param query Search query string
 * @returns Filtered memos
 */
export function filterMemosByQuery(memos: Memo[], query: string): Memo[] {
  if (!query.trim()) {
    return memos
  }

  return memos.filter(memo => memoMatchesQuery(memo, query))
}

/**
 * Sort memos by updated date (newest first)
 * @param memos Array of memos to sort
 * @returns Sorted memos
 */
export function sortMemosByDate(memos: Memo[]): Memo[] {
  return [...memos].sort(compareMemosByDate)
}

/**
 * Filter memos by folder
 * @param memos Array of memos to filter
 * @param folderId Folder ID to filter by (null for unfiled)
 * @returns Filtered memos
 */
export function filterMemosByFolder(memos: Memo[], folderId: string | null): Memo[] {
  return memos.filter(memo => memo.folderId === folderId)
}

/**
 * Get memos count by folder
 * @param memos Array of all memos
 * @param folderId Folder ID to count for
 * @returns Number of memos in folder
 */
export function getMemoCountByFolder(memos: Memo[], folderId: string | null): number {
  return filterMemosByFolder(memos, folderId).length
}