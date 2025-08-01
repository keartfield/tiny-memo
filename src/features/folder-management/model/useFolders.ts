import { useState, useCallback, useRef, useEffect } from 'react'
import { Folder, folderApi } from '../../../entities/folder'

export interface UseFoldersResult {
  folders: Folder[]
  selectedFolder: Folder | null
  isLoading: boolean
  error: string | null
  loadFolders: () => Promise<void>
  selectFolder: (folder: Folder | null) => void
  createFolder: (name: string) => Promise<void>
  updateFolder: (id: string, name: string) => Promise<void>
  reorderFolders: (folderIds: string[]) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  updateFolderCounts: (folderId: string | null, delta: number) => void
}

export function useFolders(): UseFoldersResult {
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedFolderRef = useRef<Folder | null>(null)
  
  // 選択されたフォルダの参照を常に最新に保つ
  useEffect(() => {
    selectedFolderRef.current = selectedFolder
  }, [selectedFolder])
  
  // フォルダリストが変更された際に選択状態を同期
  useEffect(() => {
    if (selectedFolder && folders.length > 0) {
      const updatedFolder = folders.find(f => f.id === selectedFolder.id)
      if (updatedFolder && updatedFolder !== selectedFolder) {
        setSelectedFolder(updatedFolder)
      }
    }
  }, [folders, selectedFolder])

  const loadFolders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const folderData = await folderApi.getAll()
      setFolders(folderData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const selectFolder = useCallback((folder: Folder | null) => {
    setSelectedFolder(folder)
  }, [])

  const createFolder = useCallback(async (name: string) => {
    try {
      setError(null)
      await folderApi.create(name)
      await loadFolders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder')
      throw err
    }
  }, [loadFolders])

  const updateFolder = useCallback(async (id: string, name: string) => {
    try {
      setError(null)
      await folderApi.update(id, name)
      await loadFolders()
      // Update selected folder if it was the one being updated
      if (selectedFolder?.id === id) {
        setSelectedFolder(prev => prev ? { ...prev, name } : null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update folder')
      throw err
    }
  }, [loadFolders, selectedFolder])

  const deleteFolder = useCallback(async (id: string) => {
    try {
      setError(null)
      await folderApi.delete(id)
      
      // Clear selection if deleted folder was selected
      if (selectedFolder?.id === id) {
        setSelectedFolder(null)
      }
      
      await loadFolders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder')
      throw err
    }
  }, [selectedFolder, loadFolders])

  const reorderFolders = useCallback(async (folderIds: string[]) => {
    try {
      setError(null)
      
      // ローカルステートを即座に更新
      setFolders(prevFolders => {
        const folderMap = new Map(prevFolders.map(f => [f.id, f]))
        const reorderedFolders = folderIds.map((id, index) => {
          const folder = folderMap.get(id)
          return folder ? { ...folder, order: index } : null
        }).filter(Boolean) as Folder[]
        
        return reorderedFolders
      })
      
      // サーバーに順序を保存
      await folderApi.reorderFolders(folderIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder folders')
      // エラーが発生した場合は元の順序に戻す
      await loadFolders()
      throw err
    }
  }, [loadFolders])

  const updateFolderCounts = useCallback((folderId: string | null, delta: number) => {
    setFolders(prevFolders => 
      prevFolders.map(folder => {
        if (folder.id === folderId) {
          const currentCount = folder._count?.memos || 0
          const newCount = Math.max(currentCount + delta, 0)
          return { ...folder, _count: { memos: newCount } }
        }
        return folder
      })
    )
  }, [])

  return {
    folders,
    selectedFolder,
    isLoading,
    error,
    loadFolders,
    selectFolder,
    createFolder,
    updateFolder,
    reorderFolders,
    deleteFolder,
    updateFolderCounts
  }
}