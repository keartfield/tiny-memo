import { Memo } from '../types'

/**
 * Extract title from memo content (first line)
 * @param content The memo content
 * @returns The first line as title, or "Untitled" if empty
 */
export function extractTitle(content: string): string {
  if (!content || content.trim() === '') {
    return 'Untitled'
  }
  
  const firstLine = content.split('\n')[0].trim()
  
  // Remove markdown heading syntax if present
  const cleanTitle = firstLine.replace(/^#+\s*/, '')
  
  return cleanTitle || 'Untitled'
}

/**
 * Get display title for a memo
 * @param memo The memo object
 * @returns The extracted title
 */
export function getMemoTitle(memo: { content: string }): string {
  return extractTitle(memo.content)
}

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

  const lowerQuery = query.toLowerCase()
  return memos.filter(memo => 
    extractTitle(memo.content).toLowerCase().includes(lowerQuery) ||
    memo.content.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Sort memos by updated date (newest first)
 * @param memos Array of memos to sort
 * @returns Sorted memos
 */
export function sortMemosByDate(memos: Memo[]): Memo[] {
  return [...memos].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}