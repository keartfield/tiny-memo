import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMemos } from './useMemos'
import { memoApi, Memo, sortMemosByDate } from '../../../entities/memo'

// memoApiのモック
vi.mock('../../../entities/memo', () => ({
  memoApi: {
    getAll: vi.fn(),
    getByFolder: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  sortMemosByDate: vi.fn((memos) => [...memos].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ))
}))

const mockMemoApi = vi.mocked(memoApi)
const mockSortMemosByDate = vi.mocked(sortMemosByDate)

const mockMemos: Memo[] = [
  {
    id: '1',
    content: 'メモ1の内容',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    folderId: 'folder-1'
  },
  {
    id: '2',
    content: 'メモ2の内容',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    folderId: 'folder-1'
  },
  {
    id: '3',
    content: 'メモ3の内容',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    folderId: null
  }
]

describe('useMemos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトでソート関数をモック
    mockSortMemosByDate.mockImplementation((memos) => 
      [...memos].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    )
  })

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useMemos())

    expect(result.current.memos).toEqual([])
    expect(result.current.allMemos).toEqual([])
    expect(result.current.selectedMemo).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  describe('loadMemos', () => {
    it('指定されたフォルダのメモを正常に読み込む', async () => {
      const folderMemos = mockMemos.filter(m => m.folderId === 'folder-1')
      mockMemoApi.getByFolder.mockResolvedValue(folderMemos)
      const { result } = renderHook(() => useMemos())

      await act(async () => {
        await result.current.loadMemos('folder-1')
      })

      expect(result.current.memos).toEqual(folderMemos)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockMemoApi.getByFolder).toHaveBeenCalledWith('folder-1')
    })

    it('フォルダIDがnullの場合はフォルダなしのメモを読み込む', async () => {
      const noFolderMemos = mockMemos.filter(m => m.folderId === null)
      mockMemoApi.getByFolder.mockResolvedValue(noFolderMemos)
      const { result } = renderHook(() => useMemos())

      await act(async () => {
        await result.current.loadMemos(null)
      })

      expect(result.current.memos).toEqual(noFolderMemos)
      expect(mockMemoApi.getByFolder).toHaveBeenCalledWith(null)
    })

    it('読み込み中はisLoadingがtrueになる', async () => {
      let resolvePromise: (value: Memo[]) => void
      const loadingPromise = new Promise<Memo[]>((resolve) => {
        resolvePromise = resolve
      })
      mockMemoApi.getByFolder.mockReturnValue(loadingPromise)

      const { result } = renderHook(() => useMemos())

      act(() => {
        result.current.loadMemos('folder-1')
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()

      await act(async () => {
        resolvePromise!(mockMemos)
        await loadingPromise
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('選択中のメモが新しいリストに含まれない場合は選択を解除する', async () => {
      const { result } = renderHook(() => useMemos())

      // メモを選択
      act(() => {
        result.current.selectMemo(mockMemos[0])
      })
      expect(result.current.selectedMemo).toEqual(mockMemos[0])

      // 選択中のメモを含まないリストを読み込み
      const otherMemos = [mockMemos[1]]
      mockMemoApi.getByFolder.mockResolvedValue(otherMemos)

      await act(async () => {
        await result.current.loadMemos('other-folder')
      })

      expect(result.current.selectedMemo).toBeNull()
      expect(result.current.memos).toEqual(otherMemos)
    })

    it('選択中のメモが新しいリストに含まれる場合は選択を維持する', async () => {
      const { result } = renderHook(() => useMemos())

      // メモを選択
      act(() => {
        result.current.selectMemo(mockMemos[0])
      })

      // 選択中のメモを含むリストを読み込み
      const memosWithSelected = [mockMemos[0], mockMemos[1]]
      mockMemoApi.getByFolder.mockResolvedValue(memosWithSelected)

      await act(async () => {
        await result.current.loadMemos('folder-1')
      })

      expect(result.current.selectedMemo).toEqual(mockMemos[0])
      expect(result.current.memos).toEqual(memosWithSelected)
    })

    it('エラーが発生した場合はエラー状態を設定する', async () => {
      const error = new Error('読み込みエラー')
      mockMemoApi.getByFolder.mockRejectedValue(error)
      const { result } = renderHook(() => useMemos())

      await act(async () => {
        await result.current.loadMemos('folder-1')
      })

      expect(result.current.memos).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('読み込みエラー')
    })
  })

  describe('loadAllMemos', () => {
    it('全てのメモを正常に読み込む', async () => {
      mockMemoApi.getAll.mockResolvedValue(mockMemos)
      const { result } = renderHook(() => useMemos())

      await act(async () => {
        await result.current.loadAllMemos()
      })

      expect(result.current.allMemos).toEqual(mockMemos)
      expect(result.current.error).toBeNull()
      expect(mockMemoApi.getAll).toHaveBeenCalledTimes(1)
    })

    it('エラーが発生した場合はエラー状態を設定する', async () => {
      const error = new Error('全メモ読み込みエラー')
      mockMemoApi.getAll.mockRejectedValue(error)
      const { result } = renderHook(() => useMemos())

      await act(async () => {
        await result.current.loadAllMemos()
      })

      expect(result.current.allMemos).toEqual([])
      expect(result.current.error).toBe('全メモ読み込みエラー')
    })
  })

  describe('selectMemo', () => {
    it('メモを選択する', () => {
      const { result } = renderHook(() => useMemos())

      act(() => {
        result.current.selectMemo(mockMemos[0])
      })

      expect(result.current.selectedMemo).toEqual(mockMemos[0])
    })

    it('nullを渡すと選択を解除する', () => {
      const { result } = renderHook(() => useMemos())

      act(() => {
        result.current.selectMemo(mockMemos[0])
      })
      expect(result.current.selectedMemo).toEqual(mockMemos[0])

      act(() => {
        result.current.selectMemo(null)
      })
      expect(result.current.selectedMemo).toBeNull()
    })
  })

  describe('createMemo', () => {
    it('メモを正常に作成する', async () => {
      const newMemo: Memo = {
        id: '4',
        content: '新しいメモ',
        createdAt: new Date(),
        updatedAt: new Date(),
        folderId: 'folder-1'
      }
      mockMemoApi.create.mockResolvedValue(newMemo)
      const { result } = renderHook(() => useMemos())

      let createdMemo: Memo
      await act(async () => {
        createdMemo = await result.current.createMemo('新しいメモ', 'folder-1')
      })

      expect(createdMemo!).toEqual(newMemo)
      expect(result.current.memos).toContain(newMemo)
      expect(result.current.allMemos).toContain(newMemo)
      expect(result.current.selectedMemo).toEqual(newMemo)
      expect(mockMemoApi.create).toHaveBeenCalledWith({
        content: '新しいメモ',
        folderId: 'folder-1'
      })
    })

    it('作成エラーが発生した場合はエラー状態を設定する', async () => {
      const error = new Error('作成エラー')
      mockMemoApi.create.mockRejectedValue(error)
      const { result } = renderHook(() => useMemos())

      await act(async () => {
        try {
          await result.current.createMemo('テスト内容', 'folder-1')
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      expect(result.current.error).toBe('作成エラー')
    })
  })

  describe('updateMemo', () => {
    it('メモを正常に更新する', async () => {
      const updatedMemo = {
        ...mockMemos[0],
        content: '更新された内容',
        updatedAt: new Date('2024-02-01')
      }
      mockMemoApi.update.mockResolvedValue(updatedMemo)
      
      const { result } = renderHook(() => useMemos())

      // 初期状態を設定
      act(() => {
        result.current.memos.push(...mockMemos)
        result.current.allMemos.push(...mockMemos)
        result.current.selectMemo(mockMemos[0])
      })

      await act(async () => {
        await result.current.updateMemo('1', '更新された内容')
      })

      expect(mockMemoApi.update).toHaveBeenCalledWith('1', { content: '更新された内容' })
      expect(mockSortMemosByDate).toHaveBeenCalledTimes(2) // memos と allMemos の両方
      expect(result.current.selectedMemo?.content).toBe('更新された内容')
    })

    it('選択中でないメモを更新した場合は選択状態を変更しない', async () => {
      const updatedMemo = {
        ...mockMemos[1],
        content: '更新された内容',
        updatedAt: new Date('2024-02-01')
      }
      mockMemoApi.update.mockResolvedValue(updatedMemo)
      
      const { result } = renderHook(() => useMemos())

      // 別のメモを選択
      act(() => {
        result.current.memos.push(...mockMemos)
        result.current.selectMemo(mockMemos[0])
      })

      await act(async () => {
        await result.current.updateMemo('2', '更新された内容')
      })

      expect(result.current.selectedMemo).toEqual(mockMemos[0]) // 変更されない
    })

    it('更新エラーが発生した場合はエラー状態を設定する', async () => {
      const error = new Error('更新エラー')
      mockMemoApi.update.mockRejectedValue(error)
      const { result } = renderHook(() => useMemos())

      await act(async () => {
        try {
          await result.current.updateMemo('1', '内容')
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      expect(result.current.error).toBe('更新エラー')
    })
  })

  describe('updateMemoFolder', () => {
    it('メモのフォルダを正常に更新する', async () => {
      const updatedMemo = {
        ...mockMemos[0],
        folderId: 'folder-2',
        updatedAt: new Date('2024-02-01')
      }
      mockMemoApi.update.mockResolvedValue(updatedMemo)
      
      const { result } = renderHook(() => useMemos())

      act(() => {
        result.current.memos.push(...mockMemos)
        result.current.allMemos.push(...mockMemos)
        result.current.selectMemo(mockMemos[0])
      })

      await act(async () => {
        await result.current.updateMemoFolder('1', 'folder-2')
      })

      expect(mockMemoApi.update).toHaveBeenCalledWith('1', { folderId: 'folder-2' })
      expect(result.current.selectedMemo?.folderId).toBe('folder-2')
    })

    it('別のフォルダに移動した場合は現在のリストから削除する', async () => {
      const updatedMemo = {
        ...mockMemos[0],
        folderId: 'different-folder',
        updatedAt: new Date('2024-02-01')
      }
      mockMemoApi.update.mockResolvedValue(updatedMemo)
      
      const { result } = renderHook(() => useMemos())

      // フォルダ1のメモをセット
      act(() => {
        result.current.memos.push(...mockMemos.filter(m => m.folderId === 'folder-1'))
      })

      await act(async () => {
        await result.current.updateMemoFolder('1', 'different-folder')
      })

      // メモが現在のリストから削除されることを確認
      expect(result.current.memos.find(m => m.id === '1')).toBeUndefined()
    })

    it('フォルダ更新エラーが発生した場合はエラー状態を設定する', async () => {
      const error = new Error('フォルダ更新エラー')
      mockMemoApi.update.mockRejectedValue(error)
      const { result } = renderHook(() => useMemos())

      await act(async () => {
        try {
          await result.current.updateMemoFolder('1', 'folder-2')
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      expect(result.current.error).toBe('フォルダ更新エラー')
    })
  })

  describe('deleteMemo', () => {
    it('メモを正常に削除する', async () => {
      mockMemoApi.delete.mockResolvedValue(undefined)
      const { result } = renderHook(() => useMemos())

      act(() => {
        result.current.memos.push(...mockMemos)
        result.current.allMemos.push(...mockMemos)
      })

      await act(async () => {
        await result.current.deleteMemo('1')
      })

      expect(mockMemoApi.delete).toHaveBeenCalledWith('1')
      expect(result.current.memos.find(m => m.id === '1')).toBeUndefined()
      expect(result.current.allMemos.find(m => m.id === '1')).toBeUndefined()
    })

    it('選択中のメモを削除した場合は選択を解除する', async () => {
      mockMemoApi.delete.mockResolvedValue(undefined)
      const { result } = renderHook(() => useMemos())

      act(() => {
        result.current.memos.push(...mockMemos)
        result.current.selectMemo(mockMemos[0])
      })
      expect(result.current.selectedMemo).toEqual(mockMemos[0])

      await act(async () => {
        await result.current.deleteMemo('1')
      })

      expect(result.current.selectedMemo).toBeNull()
    })

    it('削除エラーが発生した場合はエラー状態を設定する', async () => {
      const error = new Error('削除エラー')
      mockMemoApi.delete.mockRejectedValue(error)
      const { result } = renderHook(() => useMemos())

      await act(async () => {
        try {
          await result.current.deleteMemo('1')
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      expect(result.current.error).toBe('削除エラー')
    })
  })

  describe('setMemosFromSearch', () => {
    it('検索結果でメモリストを更新する', () => {
      const { result } = renderHook(() => useMemos())
      const searchResults = [mockMemos[0], mockMemos[2]]

      act(() => {
        result.current.selectMemo(mockMemos[1]) // 何かを選択
      })

      act(() => {
        result.current.setMemosFromSearch(searchResults)
      })

      expect(result.current.memos).toEqual(searchResults)
      expect(result.current.selectedMemo).toBeNull() // 選択は解除される
    })

    it('空の検索結果でも正しく処理する', () => {
      const { result } = renderHook(() => useMemos())

      act(() => {
        result.current.memos.push(...mockMemos)
        result.current.selectMemo(mockMemos[0])
      })

      act(() => {
        result.current.setMemosFromSearch([])
      })

      expect(result.current.memos).toEqual([])
      expect(result.current.selectedMemo).toBeNull()
    })
  })

  describe('インターフェース要件', () => {
    it('UseMemosResultインターフェースのすべてのプロパティを持つ', () => {
      const { result } = renderHook(() => useMemos())

      // プロパティの存在確認
      expect(result.current).toHaveProperty('memos')
      expect(result.current).toHaveProperty('allMemos')
      expect(result.current).toHaveProperty('selectedMemo')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('loadMemos')
      expect(result.current).toHaveProperty('loadAllMemos')
      expect(result.current).toHaveProperty('selectMemo')
      expect(result.current).toHaveProperty('createMemo')
      expect(result.current).toHaveProperty('updateMemo')
      expect(result.current).toHaveProperty('updateMemoFolder')
      expect(result.current).toHaveProperty('deleteMemo')
      expect(result.current).toHaveProperty('setMemosFromSearch')

      // 関数プロパティの型確認
      expect(typeof result.current.loadMemos).toBe('function')
      expect(typeof result.current.loadAllMemos).toBe('function')
      expect(typeof result.current.selectMemo).toBe('function')
      expect(typeof result.current.createMemo).toBe('function')
      expect(typeof result.current.updateMemo).toBe('function')
      expect(typeof result.current.updateMemoFolder).toBe('function')
      expect(typeof result.current.deleteMemo).toBe('function')
      expect(typeof result.current.setMemosFromSearch).toBe('function')
    })
  })
})