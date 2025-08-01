import { useState, useCallback } from 'react'
import { Memo, filterMemosByQuery } from '../../../entities/memo'

export interface UseSearchResult {
  searchQuery: string
  isSearching: boolean
  searchResults: Memo[]
  setSearchQuery: (query: string) => void
  performSearch: (query: string, allMemos: Memo[]) => Memo[]
  clearSearch: () => void
}

export function useSearch(): UseSearchResult {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Memo[]>([])

  const performSearch = useCallback((query: string, allMemos: Memo[]): Memo[] => {
    setSearchQuery(query)
    
    if (query.trim()) {
      setIsSearching(true)
      const results = filterMemosByQuery(allMemos, query)
      setSearchResults(results)
      return results
    } else {
      setIsSearching(false)
      setSearchResults([])
      return []
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setIsSearching(false)
    setSearchResults([])
  }, [])

  return {
    searchQuery,
    isSearching,
    searchResults,
    setSearchQuery,
    performSearch,
    clearSearch
  }
}