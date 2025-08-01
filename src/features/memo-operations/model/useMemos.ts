import { useState, useCallback } from 'react'
import { Memo, memoApi, sortMemosByDate } from '../../../entities/memo'

export interface UseMemosResult {
  memos: Memo[]
  allMemos: Memo[]
  selectedMemo: Memo | null
  isLoading: boolean
  error: string | null
  loadMemos: (folderId: string | null) => Promise<void>
  loadAllMemos: () => Promise<void>
  selectMemo: (memo: Memo | null) => void
  createMemo: (content: string, folderId: string | null) => Promise<Memo>
  updateMemo: (id: string, content: string) => Promise<void>
  updateMemoFolder: (id: string, folderId: string | null) => Promise<void>
  deleteMemo: (id: string) => Promise<void>
  setMemosFromSearch: (searchResults: Memo[]) => void
}

export function useMemos(): UseMemosResult {
  const [memos, setMemos] = useState<Memo[]>([])
  const [allMemos, setAllMemos] = useState<Memo[]>([])
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMemos = useCallback(async (folderId: string | null) => {
    try {
      setIsLoading(true)
      setError(null)
      const memoData = await memoApi.getByFolder(folderId)
      setMemos(memoData)
      
      // Keep selected memo if it exists in the new list, otherwise clear selection
      if (selectedMemo) {
        const memoStillExists = memoData.find(m => m.id === selectedMemo.id)
        if (!memoStillExists) {
          setSelectedMemo(null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memos')
    } finally {
      setIsLoading(false)
    }
  }, [selectedMemo?.id]) // Only depend on selected memo ID

  const loadAllMemos = useCallback(async () => {
    try {
      setError(null)
      const allMemoData = await memoApi.getAll()
      setAllMemos(allMemoData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load all memos')
    }
  }, [])

  const selectMemo = useCallback((memo: Memo | null) => {
    setSelectedMemo(memo)
  }, [])

  const createMemo = useCallback(async (content: string, folderId: string | null): Promise<Memo> => {
    try {
      setError(null)
      const newMemo = await memoApi.create({ content, folderId })
      
      // Update memos list if we're viewing the same folder
      setMemos(prevMemos => [newMemo, ...prevMemos])
      
      // Update cached allMemos
      setAllMemos(prevAllMemos => [newMemo, ...prevAllMemos])
      
      setSelectedMemo(newMemo)
      return newMemo
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create memo')
      throw err
    }
  }, [])

  const updateMemo = useCallback(async (id: string, content: string) => {
    try {
      setError(null)
      const updatedMemo = await memoApi.update(id, { content })
      
      // Update memo in current list
      setMemos(prevMemos => 
        sortMemosByDate(prevMemos.map(memo => 
          memo.id === id 
            ? { ...memo, content, updatedAt: updatedMemo.updatedAt }
            : memo
        ))
      )
      
      // Update cached allMemos
      setAllMemos(prevAllMemos => 
        sortMemosByDate(prevAllMemos.map(memo => 
          memo.id === id 
            ? { ...memo, content, updatedAt: updatedMemo.updatedAt }
            : memo
        ))
      )
      
      // Update selected memo if it's the one being updated
      if (selectedMemo?.id === id) {
        setSelectedMemo(prevSelected => ({
          ...prevSelected!,
          content,
          updatedAt: updatedMemo.updatedAt
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update memo')
      throw err
    }
  }, [selectedMemo?.id]) // Only depend on selected memo ID

  const updateMemoFolder = useCallback(async (id: string, folderId: string | null) => {
    try {
      setError(null)
      const updatedMemo = await memoApi.update(id, { folderId })
      
      // Update selected memo
      if (selectedMemo?.id === id) {
        setSelectedMemo({ ...selectedMemo, folderId, updatedAt: updatedMemo.updatedAt })
      }
      
      // Update memo lists (might need to filter out if moved to different folder)
      setMemos(prevMemos => {
        // If memo moved to different folder context, remove from current view
        const currentFolder = prevMemos.find(m => m.id === id)?.folderId
        if (currentFolder !== folderId) {
          return prevMemos.filter(memo => memo.id !== id)
        } else {
          return prevMemos.map(memo => 
            memo.id === id 
              ? { ...memo, folderId, updatedAt: updatedMemo.updatedAt }
              : memo
          )
        }
      })
      
      // Update cached allMemos
      setAllMemos(prevAllMemos => 
        prevAllMemos.map(memo => 
          memo.id === id 
            ? { ...memo, folderId, updatedAt: updatedMemo.updatedAt }
            : memo
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update memo folder')
      throw err
    }
  }, [selectedMemo])

  const deleteMemo = useCallback(async (id: string) => {
    try {
      setError(null)
      await memoApi.delete(id)
      
      // Clear selection if deleted memo was selected
      if (selectedMemo?.id === id) {
        setSelectedMemo(null)
      }
      
      // Remove from current list
      setMemos(prevMemos => prevMemos.filter(memo => memo.id !== id))
      
      // Remove from cached allMemos
      setAllMemos(prevAllMemos => prevAllMemos.filter(memo => memo.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete memo')
      throw err
    }
  }, [selectedMemo])

  const setMemosFromSearch = useCallback((searchResults: Memo[]) => {
    setMemos(searchResults)
    setSelectedMemo(null)
  }, [])

  return {
    memos,
    allMemos,
    selectedMemo,
    isLoading,
    error,
    loadMemos,
    loadAllMemos,
    selectMemo,
    createMemo,
    updateMemo,
    updateMemoFolder,
    deleteMemo,
    setMemosFromSearch
  }
}