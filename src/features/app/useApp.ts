import { useState, useEffect, useCallback } from 'react'
import { ViewMode, getInitialTheme, applyTheme, toggleTheme as toggleThemeUtil, getStoredViewMode, saveViewMode, toggleViewMode as toggleViewModeUtil } from '../../shared'
import { Folder } from '../../entities/folder'
import { Memo } from '../../entities/memo'
import { useFolders } from '../folder-management'
import { useMemos } from '../memo-operations'
import { useSearch } from '../search'

export interface UseAppResult {
  // Theme and view mode
  isDarkMode: boolean
  viewMode: ViewMode
  handleToggleTheme: () => void
  handleToggleViewMode: () => void
  
  // Layout dimensions
  folderSidebarWidth: number
  memoListWidth: number
  handleFolderSidebarResize: (delta: number) => void
  handleMemoListResize: (delta: number) => void
  
  // Folder management
  folders: Folder[]
  selectedFolder: Folder | null
  lastSelectedFolder: Folder | null
  handleFolderSelect: (folder: Folder | null) => void
  handleFolderCreate: (name: string) => Promise<void>
  handleFolderUpdate: (id: string, name: string) => Promise<void>
  handleFolderReorder: (folderIds: string[]) => Promise<void>
  handleFolderDelete: (id: string) => Promise<void>
  
  // Memo operations
  memos: Memo[]
  selectedMemo: Memo | null
  handleMemoSelect: (memo: Memo) => void
  handleMemoCreate: (content: string) => Promise<void>
  handleMemoUpdate: (id: string, content: string) => Promise<void>
  handleMemoFolderUpdate: (id: string, folderId: string | null) => Promise<void>
  handleMemoDelete: (id: string) => Promise<void>
  
  // Search
  searchQuery: string
  isSearching: boolean
  handleSearch: (query: string) => void
}

export function useApp(): UseAppResult {
  // Theme and view mode state
  const [isDarkMode, setIsDarkMode] = useState(() => getInitialTheme() === 'dark')
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode())
  
  // Layout dimensions
  const [folderSidebarWidth, setFolderSidebarWidth] = useState(150)
  const [memoListWidth, setMemoListWidth] = useState(200)
  const [lastSelectedFolder, setLastSelectedFolder] = useState<Folder | null>(null)

  // Feature hooks
  const foldersFeature = useFolders()
  const memosFeature = useMemos()
  const searchFeature = useSearch()

  // Initialize data
  useEffect(() => {
    foldersFeature.loadFolders()
    memosFeature.loadAllMemos()
  }, [])

  // Apply theme changes
  useEffect(() => {
    applyTheme(isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  // Save view mode changes
  useEffect(() => {
    saveViewMode(viewMode)
  }, [viewMode])


  // Load memos when folder selection or search state changes
  useEffect(() => {
    if (foldersFeature.selectedFolder || (!foldersFeature.selectedFolder && !searchFeature.isSearching)) {
      memosFeature.loadMemos(foldersFeature.selectedFolder?.id || null)
    }
  }, [foldersFeature.selectedFolder, searchFeature.isSearching])

  // Theme and view mode handlers
  const handleToggleTheme = useCallback(() => {
    const newTheme = toggleThemeUtil(isDarkMode ? 'dark' : 'light')
    setIsDarkMode(newTheme === 'dark')
  }, [isDarkMode])

  const handleToggleViewMode = useCallback(() => {
    setViewMode(prev => toggleViewModeUtil(prev))
  }, [])

  // Layout handlers
  const handleFolderSidebarResize = useCallback((delta: number) => {
    setFolderSidebarWidth(prev => Math.max(100, Math.min(500, prev + delta)))
  }, [])

  const handleMemoListResize = useCallback((delta: number) => {
    setMemoListWidth(prev => Math.max(150, Math.min(600, prev + delta)))
  }, [])

  // Folder handlers
  const handleFolderSelect = useCallback((folder: Folder | null) => {
    // Only clear memo selection if we're actually changing folders
    const currentFolderId = foldersFeature.selectedFolder?.id || null
    const newFolderId = folder?.id || null
    
    foldersFeature.selectFolder(folder)
    setLastSelectedFolder(folder)
    
    if (currentFolderId !== newFolderId) {
      memosFeature.selectMemo(null)
    }
    
    searchFeature.clearSearch()
  }, [foldersFeature, memosFeature, searchFeature])

  const handleFolderCreate = useCallback(async (name: string) => {
    await foldersFeature.createFolder(name)
  }, [foldersFeature])

  const handleFolderUpdate = useCallback(async (id: string, name: string) => {
    await foldersFeature.updateFolder(id, name)
  }, [foldersFeature])

  const handleFolderReorder = useCallback(async (folderIds: string[]) => {
    await foldersFeature.reorderFolders(folderIds)
  }, [foldersFeature])

  const handleFolderDelete = useCallback(async (id: string) => {
    await foldersFeature.deleteFolder(id)
    if (foldersFeature.selectedFolder?.id === id) {
      memosFeature.selectMemo(null)
    }
  }, [foldersFeature, memosFeature])

  // Memo handlers
  const handleMemoSelect = useCallback((memo: Memo) => {
    memosFeature.selectMemo(memo)
  }, [memosFeature])

  const handleMemoCreate = useCallback(async (content: string) => {
    const newMemo = await memosFeature.createMemo(content, foldersFeature.selectedFolder?.id || null)
    foldersFeature.updateFolderCounts(newMemo.folderId, 1)
  }, [memosFeature, foldersFeature])

  const handleMemoUpdate = useCallback(async (id: string, content: string) => {
    await memosFeature.updateMemo(id, content)
  }, [memosFeature.updateMemo])

  const handleMemoFolderUpdate = useCallback(async (id: string, folderId: string | null) => {
    const currentMemo = memosFeature.memos.find(m => m.id === id) || memosFeature.selectedMemo
    const oldFolderId = currentMemo?.folderId
    
    await memosFeature.updateMemoFolder(id, folderId)
    
    // Update folder counts
    if (oldFolderId !== folderId) {
      if (oldFolderId) foldersFeature.updateFolderCounts(oldFolderId, -1)
      if (folderId) foldersFeature.updateFolderCounts(folderId, 1)
    }
  }, [memosFeature, foldersFeature])

  const handleMemoDelete = useCallback(async (id: string) => {
    const memoToDelete = memosFeature.memos.find(m => m.id === id)
    await memosFeature.deleteMemo(id)
    
    // Update folder counts
    if (memoToDelete?.folderId) {
      foldersFeature.updateFolderCounts(memoToDelete.folderId, -1)
    }
  }, [memosFeature, foldersFeature])

  // Search handlers
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      const results = searchFeature.performSearch(query, memosFeature.allMemos)
      memosFeature.setMemosFromSearch(results)
      foldersFeature.selectFolder(null)
    } else {
      searchFeature.clearSearch()
      foldersFeature.selectFolder(lastSelectedFolder)
    }
  }, [searchFeature, memosFeature, foldersFeature, lastSelectedFolder])

  return {
    // Theme and view mode
    isDarkMode,
    viewMode,
    handleToggleTheme,
    handleToggleViewMode,
    
    // Layout dimensions
    folderSidebarWidth,
    memoListWidth,
    handleFolderSidebarResize,
    handleMemoListResize,
    
    // Folder management
    folders: foldersFeature.folders,
    selectedFolder: foldersFeature.selectedFolder,
    lastSelectedFolder,
    handleFolderSelect,
    handleFolderCreate,
    handleFolderUpdate,
    handleFolderReorder,
    handleFolderDelete,
    
    // Memo operations
    memos: memosFeature.memos,
    selectedMemo: memosFeature.selectedMemo,
    handleMemoSelect,
    handleMemoCreate,
    handleMemoUpdate,
    handleMemoFolderUpdate,
    handleMemoDelete,
    
    // Search
    searchQuery: searchFeature.searchQuery,
    isSearching: searchFeature.isSearching,
    handleSearch
  }
}