import { Memo } from './types'

/**
 * Extract title from memo content (first line)
 * @param memo The memo object
 * @returns The extracted title
 */
export function getMemoTitle(memo: Memo): string {
  if (memo.content || memo.content.trim() !== '') {
    const firstLine = memo.content.split('\n')[0].trim()
    const cleanTitle = firstLine.replace(/^#+\s*/, '')
    
    return cleanTitle
  }
  return ''
}

/**
 * Get memo preview text (first few lines without title)
 * @param memo The memo object
 * @param maxLines Maximum number of lines to include
 * @returns Preview text
 */
export function getMemoPreview(memo: Memo, maxLines: number = 3): string {
  if (!memo.content) return ''
  
  const lines = memo.content.split('\n')
  const contentLines = lines.slice(1, maxLines + 1)
  return contentLines.join('\n').trim()
}

/**
 * Check if memo is empty (no content or only whitespace)
 * @param memo The memo object
 * @returns True if memo is empty
 */
export function isMemoEmpty(memo: Memo): boolean {
  return !memo.content || memo.content.trim() === ''
}

/**
 * Check if memo matches search query
 * @param memo The memo object
 * @param query Search query
 * @returns True if memo matches query
 */
export function memoMatchesQuery(memo: Memo, query: string): boolean {
  if (!query.trim()) return true
  
  const lowerQuery = query.toLowerCase()
  const title = getMemoTitle(memo).toLowerCase()
  const content = memo.content.toLowerCase()
  
  return title.includes(lowerQuery) || content.includes(lowerQuery)
}

/**
 * Compare memos by updated date (for sorting)
 * @param a First memo
 * @param b Second memo
 * @returns Comparison result
 */
export function compareMemosByDate(a: Memo, b: Memo): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}
