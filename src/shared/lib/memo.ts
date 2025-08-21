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

// Re-export filtering functions from entities layer for consistency
export { 
  filterMemosByQuery, 
  sortMemosByDate, 
  filterMemosByFolder, 
  getMemoCountByFolder 
} from '../../entities/memo/lib/memoFilters'