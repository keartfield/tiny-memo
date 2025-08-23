import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFolders } from './useFolders'
import { folderApi, Folder } from '../../../entities/folder'

// folderApiのモック
vi.mock('../../../entities/folder', () => ({
  folderApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn()
  }
}))

const mockFolderApi = folderApi as any

const mockFolders: Folder[] = [
  {
    id: '1',
    name: 'フォルダー1',
    order: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    _count: { memos: 5 }
  },
  {
    id: '2',
    name: 'フォルダー2',
    order: 1,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    _count: { memos: 3 }
  }
]

describe('useFolders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useFolders())

    expect(result.current.folders).toEqual([])
    expect(result.current.selectedFolder).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  describe('loadFolders', () => {
    it('フォルダーを正常に読み込む', async () => {
      mockFolderApi.getAll.mockResolvedValue(mockFolders)
      const { result } = renderHook(() => useFolders())

      await act(async () => {
        await result.current.loadFolders()
      })

      expect(result.current.folders).toEqual(mockFolders)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockFolderApi.getAll).toHaveBeenCalledTimes(1)
    })

    it('読み込み中はisLoadingがtrueになる', async () => {
      let resolvePromise: (value: Folder[]) => void
      const loadingPromise = new Promise<Folder[]>((resolve) => {
        resolvePromise = resolve
      })
      mockFolderApi.getAll.mockReturnValue(loadingPromise)

      const { result } = renderHook(() => useFolders())

      act(() => {
        result.current.loadFolders()
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()

      await act(async () => {
        resolvePromise!(mockFolders)
        await loadingPromise
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.folders).toEqual(mockFolders)
    })

    it('エラーが発生した場合はエラー状態を設定する', async () => {
      const error = new Error('読み込みエラー')
      mockFolderApi.getAll.mockRejectedValue(error)
      const { result } = renderHook(() => useFolders())

      await act(async () => {
        await result.current.loadFolders()
      })

      expect(result.current.folders).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('読み込みエラー')
    })

    it('非Errorオブジェクトのエラーの場合はデフォルトメッセージを設定する', async () => {
      mockFolderApi.getAll.mockRejectedValue('string error')
      const { result } = renderHook(() => useFolders())

      await act(async () => {
        await result.current.loadFolders()
      })

      expect(result.current.error).toBe('Failed to load folders')
    })
  })

  describe('selectFolder', () => {
    it('フォルダーを選択する', () => {
      const { result } = renderHook(() => useFolders())

      act(() => {
        result.current.selectFolder(mockFolders[0])
      })

      expect(result.current.selectedFolder).toEqual(mockFolders[0])
    })

    it('nullを渡すと選択を解除する', () => {
      const { result } = renderHook(() => useFolders())

      act(() => {
        result.current.selectFolder(mockFolders[0])
      })
      expect(result.current.selectedFolder).toEqual(mockFolders[0])

      act(() => {
        result.current.selectFolder(null)
      })
      expect(result.current.selectedFolder).toBeNull()
    })
  })

  describe('createFolder', () => {
    it('フォルダーを正常に作成する', async () => {
      mockFolderApi.create.mockResolvedValue(undefined)
      mockFolderApi.getAll.mockResolvedValue([...mockFolders, {
        id: '3',
        name: '新しいフォルダー',
        createdAt: new Date(),
        updatedAt: new Date()
      }])

      const { result } = renderHook(() => useFolders())

      await act(async () => {
        await result.current.createFolder('新しいフォルダー')
      })

      expect(mockFolderApi.create).toHaveBeenCalledWith('新しいフォルダー')
      expect(mockFolderApi.getAll).toHaveBeenCalledTimes(1)
      expect(result.current.error).toBeNull()
    })

    it('作成エラーが発生した場合はエラー状態を設定する', async () => {
      const error = new Error('作成エラー')
      mockFolderApi.create.mockRejectedValue(error)
      const { result } = renderHook(() => useFolders())

      await act(async () => {
        try {
          await result.current.createFolder('テストフォルダー')
        } catch (e) {
          // エラーが再投げされることを確認
          expect(e).toBe(error)
        }
      })

      expect(result.current.error).toBe('作成エラー')
      expect(mockFolderApi.getAll).not.toHaveBeenCalled()
    })

    it('非Errorオブジェクトのエラーの場合はデフォルトメッセージを設定する', async () => {
      mockFolderApi.create.mockRejectedValue('string error')
      const { result } = renderHook(() => useFolders())

      await act(async () => {
        try {
          await result.current.createFolder('テストフォルダー')
        } catch (e) {
          // エラーが再投げされることを確認
        }
      })

      expect(result.current.error).toBe('Failed to create folder')
    })
  })

  describe('deleteFolder', () => {
    it('フォルダーを正常に削除する', async () => {
      mockFolderApi.delete.mockResolvedValue(undefined)
      mockFolderApi.getAll.mockResolvedValue([mockFolders[1]]) // 1つ目を削除後の状態

      const { result } = renderHook(() => useFolders())

      await act(async () => {
        await result.current.deleteFolder('1')
      })

      expect(mockFolderApi.delete).toHaveBeenCalledWith('1')
      expect(mockFolderApi.getAll).toHaveBeenCalledTimes(1)
      expect(result.current.error).toBeNull()
    })

    it('選択中のフォルダーを削除した場合は選択を解除する', async () => {
      mockFolderApi.delete.mockResolvedValue(undefined)
      mockFolderApi.getAll.mockResolvedValue([mockFolders[1]])

      const { result } = renderHook(() => useFolders())

      // フォルダーを選択
      act(() => {
        result.current.selectFolder(mockFolders[0])
      })
      expect(result.current.selectedFolder).toEqual(mockFolders[0])

      // 選択中のフォルダーを削除
      await act(async () => {
        await result.current.deleteFolder('1')
      })

      expect(result.current.selectedFolder).toBeNull()
    })

    it('選択中でないフォルダーを削除した場合は選択を維持する', async () => {
      mockFolderApi.delete.mockResolvedValue(undefined)
      mockFolderApi.getAll.mockResolvedValue([mockFolders[0]])

      const { result } = renderHook(() => useFolders())

      // フォルダーを選択
      act(() => {
        result.current.selectFolder(mockFolders[0])
      })
      expect(result.current.selectedFolder).toEqual(mockFolders[0])

      // 別のフォルダーを削除
      await act(async () => {
        await result.current.deleteFolder('2')
      })

      expect(result.current.selectedFolder).toEqual(mockFolders[0])
    })

    it('削除エラーが発生した場合はエラー状態を設定する', async () => {
      const error = new Error('削除エラー')
      mockFolderApi.delete.mockRejectedValue(error)
      const { result } = renderHook(() => useFolders())

      await act(async () => {
        try {
          await result.current.deleteFolder('1')
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      expect(result.current.error).toBe('削除エラー')
      expect(mockFolderApi.getAll).not.toHaveBeenCalled()
    })
  })

  describe('updateFolderCounts', () => {
    it('指定されたフォルダーのメモ数を更新する', () => {
      const { result } = renderHook(() => useFolders())

      // 初期状態を設定
      act(() => {
        result.current.loadFolders = vi.fn() // loadFoldersをモック化
      })
      
      // フォルダーデータを直接設定（内部状態なのでこの方法を使用）
      act(() => {
        result.current.folders.length = 0
        result.current.folders.push(...mockFolders)
      })

      // メモ数を増加
      act(() => {
        result.current.updateFolderCounts('1', 2)
      })

      const updatedFolder = result.current.folders.find(f => f.id === '1')
      expect(updatedFolder?._count?.memos).toBe(7) // 5 + 2
    })

    it('メモ数が負の値にならないように制限する', () => {
      const { result } = renderHook(() => useFolders())

      // 初期状態を設定
      act(() => {
        result.current.folders.length = 0
        result.current.folders.push(...mockFolders)
      })

      // 大きな負の値を減算
      act(() => {
        result.current.updateFolderCounts('1', -10)
      })

      const updatedFolder = result.current.folders.find(f => f.id === '1')
      expect(updatedFolder?._count?.memos).toBe(0) // 5 - 10 = -5 → 0に制限
    })

    it('存在しないフォルダーIDの場合は何も変更しない', () => {
      const { result } = renderHook(() => useFolders())

      // 初期状態を設定
      act(() => {
        result.current.folders.length = 0
        result.current.folders.push(...mockFolders)
      })

      const originalFolders = [...result.current.folders]

      // 存在しないIDで更新
      act(() => {
        result.current.updateFolderCounts('nonexistent', 1)
      })

      expect(result.current.folders).toEqual(originalFolders)
    })

    it('_countが存在しないフォルダーの場合は0から計算する', () => {
      const folderWithoutCount = {
        id: '3',
        name: 'フォルダー3',
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const { result } = renderHook(() => useFolders())

      // _countを持たないフォルダーを設定
      act(() => {
        result.current.folders.length = 0
        result.current.folders.push(folderWithoutCount)
      })

      act(() => {
        result.current.updateFolderCounts('3', 3)
      })

      const updatedFolder = result.current.folders.find(f => f.id === '3')
      expect(updatedFolder?._count?.memos).toBe(3) // 0 + 3
    })

    it('nullのfolderIdを指定した場合は何も変更しない', () => {
      const { result } = renderHook(() => useFolders())

      act(() => {
        result.current.folders.length = 0
        result.current.folders.push(...mockFolders)
      })

      const originalFolders = [...result.current.folders]

      act(() => {
        result.current.updateFolderCounts(null, 1)
      })

      expect(result.current.folders).toEqual(originalFolders)
    })
  })

  describe('インターフェース要件', () => {
    it('UseFoldersResultインターフェースのすべてのプロパティを持つ', () => {
      const { result } = renderHook(() => useFolders())

      // プロパティの存在確認
      expect(result.current).toHaveProperty('folders')
      expect(result.current).toHaveProperty('selectedFolder')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('loadFolders')
      expect(result.current).toHaveProperty('selectFolder')
      expect(result.current).toHaveProperty('createFolder')
      expect(result.current).toHaveProperty('deleteFolder')
      expect(result.current).toHaveProperty('updateFolderCounts')

      // 関数プロパティの型確認
      expect(typeof result.current.loadFolders).toBe('function')
      expect(typeof result.current.selectFolder).toBe('function')
      expect(typeof result.current.createFolder).toBe('function')
      expect(typeof result.current.deleteFolder).toBe('function')
      expect(typeof result.current.updateFolderCounts).toBe('function')
    })
  })
})