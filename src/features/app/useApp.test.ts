import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useApp } from './useApp'
import type { Memo } from '../../entities/memo'
import type { Folder } from '../../entities/folder'

// モック関数の型定義
const mockUseFolders = {
  folders: [] as Folder[],
  selectedFolder: null as Folder | null,
  loadFolders: vi.fn(),
  selectFolder: vi.fn(),
  createFolder: vi.fn(),
  deleteFolder: vi.fn(),
  updateFolderCounts: vi.fn()
}

const mockUseMemos = {
  memos: [] as Memo[],
  allMemos: [] as Memo[],
  selectedMemo: null as Memo | null,
  loadAllMemos: vi.fn(),
  loadMemos: vi.fn(),
  selectMemo: vi.fn(),
  createMemo: vi.fn(),
  updateMemo: vi.fn(),
  updateMemoFolder: vi.fn(),
  deleteMemo: vi.fn(),
  setMemosFromSearch: vi.fn()
}

const mockUseSearch = {
  searchQuery: '',
  isSearching: false,
  performSearch: vi.fn(),
  clearSearch: vi.fn()
}

// フィーチャーフックをモック
vi.mock('../folder-management', () => ({
  useFolders: () => mockUseFolders
}))

vi.mock('../memo-operations', () => ({
  useMemos: () => mockUseMemos
}))

vi.mock('../search', () => ({
  useSearch: () => mockUseSearch
}))

// sharedのユーティリティをモック
vi.mock('../../shared', () => ({
  getInitialTheme: vi.fn(() => 'light'),
  applyTheme: vi.fn(),
  toggleTheme: vi.fn((theme) => theme === 'light' ? 'dark' : 'light'),
  getStoredViewMode: vi.fn(() => 'folder-list-memo'),
  saveViewMode: vi.fn(),
  toggleViewMode: vi.fn((mode) => mode === 'folder-list-memo' ? 'list-memo' : 'folder-list-memo')
}))

describe('useApp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルト値をリセット
    mockUseFolders.folders = []
    mockUseFolders.selectedFolder = null
    mockUseMemos.memos = []
    mockUseMemos.allMemos = []
    mockUseMemos.selectedMemo = null
    mockUseSearch.searchQuery = ''
    mockUseSearch.isSearching = false
  })

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useApp())
    
    expect(result.current.isDarkMode).toBe(false)
    expect(result.current.viewMode).toBe('folder-list-memo')
    expect(result.current.folderSidebarWidth).toBe(150)
    expect(result.current.memoListWidth).toBe(200)
    expect(result.current.selectedFolder).toBeNull()
    expect(result.current.selectedMemo).toBeNull()
    expect(result.current.searchQuery).toBe('')
    expect(result.current.isSearching).toBe(false)
  })

  it('初期化時にデータロードが実行される', () => {
    renderHook(() => useApp())
    
    expect(mockUseFolders.loadFolders).toHaveBeenCalledTimes(1)
    expect(mockUseMemos.loadAllMemos).toHaveBeenCalledTimes(1)
  })

  it('テーマの切り替えが正しく動作する', () => {
    const { result } = renderHook(() => useApp())
    
    act(() => {
      result.current.handleToggleTheme()
    })
    
    expect(result.current.isDarkMode).toBe(true)
  })

  it('ビューモードの切り替えが正しく動作する', () => {
    const { result } = renderHook(() => useApp())
    
    act(() => {
      result.current.handleToggleViewMode()
    })
    
    expect(result.current.viewMode).toBe('list-memo')
  })

  it('フォルダーサイドバーのリサイズが正しく動作する', () => {
    const { result } = renderHook(() => useApp())
    
    act(() => {
      result.current.handleFolderSidebarResize(50)
    })
    
    expect(result.current.folderSidebarWidth).toBe(200) // 150 + 50
    
    // 最小値のテスト
    act(() => {
      result.current.handleFolderSidebarResize(-200)
    })
    
    expect(result.current.folderSidebarWidth).toBe(100) // 最小値
  })

  it('メモリストのリサイズが正しく動作する', () => {
    const { result } = renderHook(() => useApp())
    
    act(() => {
      result.current.handleMemoListResize(100)
    })
    
    expect(result.current.memoListWidth).toBe(300) // 200 + 100
    
    // 最大値のテスト
    act(() => {
      result.current.handleMemoListResize(500)
    })
    
    expect(result.current.memoListWidth).toBe(600) // 最大値
  })

  it('フォルダー選択が正しく動作する', () => {
    const { result } = renderHook(() => useApp())
    const testFolder: Folder = {
      id: '1',
      name: 'テストフォルダー',
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    act(() => {
      result.current.handleFolderSelect(testFolder)
    })
    
    expect(mockUseFolders.selectFolder).toHaveBeenCalledWith(testFolder)
    expect(mockUseMemos.selectMemo).toHaveBeenCalledWith(null)
    expect(mockUseSearch.clearSearch).toHaveBeenCalledTimes(1)
    expect(result.current.lastSelectedFolder).toBe(testFolder)
  })

  it('フォルダー作成が正しく動作する', async () => {
    const { result } = renderHook(() => useApp())
    
    await act(async () => {
      await result.current.handleFolderCreate('新しいフォルダー')
    })
    
    expect(mockUseFolders.createFolder).toHaveBeenCalledWith('新しいフォルダー')
  })

  it('フォルダー削除が正しく動作する', async () => {
    const { result } = renderHook(() => useApp())
    mockUseFolders.selectedFolder = { id: '1', name: 'テスト', order: 0, createdAt: new Date(), updatedAt: new Date() }
    
    await act(async () => {
      await result.current.handleFolderDelete('1')
    })
    
    expect(mockUseFolders.deleteFolder).toHaveBeenCalledWith('1')
    expect(mockUseMemos.selectMemo).toHaveBeenCalledWith(null)
  })

  it('メモ選択が正しく動作する', () => {
    const { result } = renderHook(() => useApp())
    const testMemo: Memo = {
      id: '1',
      content: 'テスト内容',
      createdAt: new Date(),
      updatedAt: new Date(),
      folderId: null
    }
    
    act(() => {
      result.current.handleMemoSelect(testMemo)
    })
    
    expect(mockUseMemos.selectMemo).toHaveBeenCalledWith(testMemo)
  })

  it('メモ作成が正しく動作する', async () => {
    const { result } = renderHook(() => useApp())
    const mockNewMemo: Memo = {
      id: '1',
      content: 'Test content',
      createdAt: new Date(),
      updatedAt: new Date(),
      folderId: null
    }
    
    mockUseMemos.createMemo.mockResolvedValue(mockNewMemo)
    
    await act(async () => {
      await result.current.handleMemoCreate('Test content')
    })
    
    expect(mockUseMemos.createMemo).toHaveBeenCalledWith('Test content', null)
    expect(mockUseFolders.updateFolderCounts).toHaveBeenCalledWith(null, 1)
  })

  it('メモ更新が正しく動作する', async () => {
    const { result } = renderHook(() => useApp())
    
    await act(async () => {
      await result.current.handleMemoUpdate('1', '更新された内容')
    })
    
    expect(mockUseMemos.updateMemo).toHaveBeenCalledWith('1', '更新された内容')
  })

  it('メモフォルダー更新が正しく動作する', async () => {
    const { result } = renderHook(() => useApp())
    const mockMemo: Memo = {
      id: '1',
      content: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
      folderId: 'old-folder'
    }
    
    mockUseMemos.memos = [mockMemo]
    
    await act(async () => {
      await result.current.handleMemoFolderUpdate('1', 'new-folder')
    })
    
    expect(mockUseMemos.updateMemoFolder).toHaveBeenCalledWith('1', 'new-folder')
    expect(mockUseFolders.updateFolderCounts).toHaveBeenCalledWith('old-folder', -1)
    expect(mockUseFolders.updateFolderCounts).toHaveBeenCalledWith('new-folder', 1)
  })

  it('メモ削除が正しく動作する', async () => {
    const { result } = renderHook(() => useApp())
    const mockMemo: Memo = {
      id: '1',
      content: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
      folderId: 'test-folder'
    }
    
    mockUseMemos.memos = [mockMemo]
    
    await act(async () => {
      await result.current.handleMemoDelete('1')
    })
    
    expect(mockUseMemos.deleteMemo).toHaveBeenCalledWith('1')
    expect(mockUseFolders.updateFolderCounts).toHaveBeenCalledWith('test-folder', -1)
  })

  it('検索が正しく動作する', () => {
    const { result } = renderHook(() => useApp())
    const mockSearchResults = [
      {
        id: '1',
        title: 'Search Result',
        content: 'Found content',
        createdAt: new Date(),
        updatedAt: new Date(),
        folderId: null
      }
    ]
    
    mockUseSearch.performSearch.mockReturnValue(mockSearchResults)
    
    act(() => {
      result.current.handleSearch('test query')
    })
    
    expect(mockUseSearch.performSearch).toHaveBeenCalledWith('test query', mockUseMemos.allMemos)
    expect(mockUseMemos.setMemosFromSearch).toHaveBeenCalledWith(mockSearchResults)
    expect(mockUseFolders.selectFolder).toHaveBeenCalledWith(null)
  })

  it('空の検索クエリで検索をクリアする', () => {
    const { result } = renderHook(() => useApp())
    const testFolder: Folder = {
      id: '1',
      name: 'Last Selected',
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // 最後に選択されたフォルダーを設定
    act(() => {
      result.current.handleFolderSelect(testFolder)
    })
    
    // 空の検索クエリで検索
    act(() => {
      result.current.handleSearch('   ') // 空白のみ
    })
    
    expect(mockUseSearch.clearSearch).toHaveBeenCalledTimes(2) // handleFolderSelectでも1回呼ばれる
    expect(mockUseFolders.selectFolder).toHaveBeenCalledWith(testFolder)
  })

  it('フォルダー選択の変更時にメモが読み込まれる', () => {
    const testFolder: Folder = {
      id: '1',
      name: 'Test Folder',
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    mockUseFolders.selectedFolder = testFolder
    mockUseSearch.isSearching = false
    
    renderHook(() => useApp())
    
    expect(mockUseMemos.loadMemos).toHaveBeenCalledWith('1')
  })

  it('検索状態でない場合にメモが読み込まれる', () => {
    mockUseFolders.selectedFolder = null
    mockUseSearch.isSearching = false
    
    renderHook(() => useApp())
    
    expect(mockUseMemos.loadMemos).toHaveBeenCalledWith(null)
  })

  it('リサイザーの境界値テストが正しく動作する', () => {
    const { result } = renderHook(() => useApp())
    
    // フォルダーサイドバーの最小値テスト
    act(() => {
      result.current.handleFolderSidebarResize(-100) // 150 - 100 = 50 -> 100 (最小値)
    })
    expect(result.current.folderSidebarWidth).toBe(100)
    
    // フォルダーサイドバーの最大値テスト
    act(() => {
      result.current.handleFolderSidebarResize(500) // 100 + 500 = 600 -> 500 (最大値)
    })
    expect(result.current.folderSidebarWidth).toBe(500)
    
    // メモリストの最小値テスト
    act(() => {
      result.current.handleMemoListResize(-100) // 200 - 100 = 100 -> 150 (最小値)
    })
    expect(result.current.memoListWidth).toBe(150)
    
    // メモリストの最大値テスト
    act(() => {
      result.current.handleMemoListResize(500) // 150 + 500 = 650 -> 600 (最大値)
    })
    expect(result.current.memoListWidth).toBe(600)
  })
})
