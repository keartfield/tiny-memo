import { describe, it, expect, vi, beforeEach } from 'vitest'
import { folderApi } from './folderApi'

// Electron APIをモック
const mockElectronAPI = {
  folders: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateOrder: vi.fn(),
    reorderFolders: vi.fn(),
    delete: vi.fn()
  }
}

// window.electronAPIをモック
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})

const mockFolders = [
  {
    id: 'folder1',
    name: 'フォルダー1',
    order: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    _count: { memos: 3 }
  },
  {
    id: 'folder2',
    name: 'フォルダー2',
    order: 1,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
    _count: { memos: 5 }
  },
  {
    id: 'folder3',
    name: 'フォルダー3',
    order: 2,
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-01-03'),
    _count: { memos: 2 }
  }
]

describe('FolderApi - 並び替え機能', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('reorderFolders関数', () => {
    it('フォルダーIDの配列を正しく渡してElectron APIを呼び出す', async () => {
      const folderIds = ['folder3', 'folder1', 'folder2']
      mockElectronAPI.folders.reorderFolders.mockResolvedValue(undefined)

      await folderApi.reorderFolders(folderIds)

      expect(mockElectronAPI.folders.reorderFolders).toHaveBeenCalledWith(folderIds)
      expect(mockElectronAPI.folders.reorderFolders).toHaveBeenCalledTimes(1)
    })

    it('空の配列を渡しても正常に動作する', async () => {
      mockElectronAPI.folders.reorderFolders.mockResolvedValue(undefined)

      await folderApi.reorderFolders([])

      expect(mockElectronAPI.folders.reorderFolders).toHaveBeenCalledWith([])
    })

    it('重複するIDを含む配列も正常に渡される', async () => {
      const folderIds = ['folder1', 'folder1', 'folder2']
      mockElectronAPI.folders.reorderFolders.mockResolvedValue(undefined)

      await folderApi.reorderFolders(folderIds)

      expect(mockElectronAPI.folders.reorderFolders).toHaveBeenCalledWith(folderIds)
    })

    it('Electron APIでエラーが発生した場合はエラーが再スローされる', async () => {
      const folderIds = ['folder1', 'folder2', 'folder3']
      const error = new Error('Database connection failed')
      mockElectronAPI.folders.reorderFolders.mockRejectedValue(error)

      await expect(folderApi.reorderFolders(folderIds)).rejects.toThrow('Database connection failed')
    })

    it('ネットワークエラーの場合も適切にエラーハンドリングされる', async () => {
      const folderIds = ['folder1', 'folder2']
      const networkError = new Error('Network timeout')
      mockElectronAPI.folders.reorderFolders.mockRejectedValue(networkError)

      await expect(folderApi.reorderFolders(folderIds)).rejects.toThrow('Network timeout')
    })
  })

  describe('updateOrder関数', () => {
    it('個別フォルダーの順序を更新できる', async () => {
      const updatedFolder = { ...mockFolders[0], order: 5 }
      mockElectronAPI.folders.updateOrder.mockResolvedValue(updatedFolder)

      const result = await folderApi.updateOrder('folder1', 5)

      expect(mockElectronAPI.folders.updateOrder).toHaveBeenCalledWith('folder1', 5)
      expect(result).toEqual(updatedFolder)
    })

    it('負の値のorder指定でも正常に動作する', async () => {
      const updatedFolder = { ...mockFolders[0], order: -1 }
      mockElectronAPI.folders.updateOrder.mockResolvedValue(updatedFolder)

      const result = await folderApi.updateOrder('folder1', -1)

      expect(mockElectronAPI.folders.updateOrder).toHaveBeenCalledWith('folder1', -1)
      expect(result).toEqual(updatedFolder)
    })

    it('存在しないフォルダーIDでエラーが発生する', async () => {
      const error = new Error('Folder not found')
      mockElectronAPI.folders.updateOrder.mockRejectedValue(error)

      await expect(folderApi.updateOrder('nonexistent', 0)).rejects.toThrow('Folder not found')
    })

    it('無効なorderで更新を試行するとエラーが発生する', async () => {
      const error = new Error('Invalid order value')
      mockElectronAPI.folders.updateOrder.mockRejectedValue(error)

      await expect(folderApi.updateOrder('folder1', NaN)).rejects.toThrow('Invalid order value')
    })
  })

  describe('API呼び出しのパフォーマンス', () => {
    it('大量のフォルダーIDでも適切に処理される', async () => {
      const largeIdArray = Array.from({ length: 1000 }, (_, i) => `folder${i}`)
      mockElectronAPI.folders.reorderFolders.mockResolvedValue(undefined)

      await folderApi.reorderFolders(largeIdArray)

      expect(mockElectronAPI.folders.reorderFolders).toHaveBeenCalledWith(largeIdArray)
    })

    it('並び替え操作は単一のAPI呼び出しで実行される', async () => {
      mockElectronAPI.folders.reorderFolders.mockResolvedValue(undefined)

      await folderApi.reorderFolders(['folder3', 'folder1', 'folder2'])

      expect(mockElectronAPI.folders.reorderFolders).toHaveBeenCalledTimes(1)
      expect(mockElectronAPI.folders.updateOrder).not.toHaveBeenCalled()
    })
  })

  describe('戻り値の検証', () => {
    it('reorderFoldersは正常時にundefinedを返す', async () => {
      mockElectronAPI.folders.reorderFolders.mockResolvedValue(undefined)

      const result = await folderApi.reorderFolders(['folder1', 'folder2'])

      expect(result).toBeUndefined()
    })

    it('updateOrderは更新されたフォルダーオブジェクトを返す', async () => {
      const updatedFolder = { 
        id: 'folder1',
        name: 'フォルダー1',
        order: 10,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-31'),
        _count: { memos: 3 }
      }
      mockElectronAPI.folders.updateOrder.mockResolvedValue(updatedFolder)

      const result = await folderApi.updateOrder('folder1', 10)

      expect(result).toEqual(updatedFolder)
      expect(result.order).toBe(10)
      expect(result.updatedAt).toEqual(new Date('2025-01-31'))
    })
  })

  describe('並行実行の処理', () => {
    it('複数のreorderFolders呼び出しが並行して実行される', async () => {
      mockElectronAPI.folders.reorderFolders.mockImplementation(
        (_ids: string[]) => new Promise(resolve => setTimeout(() => resolve(undefined), 10))
      )

      const promises = [
        folderApi.reorderFolders(['folder1', 'folder2']),
        folderApi.reorderFolders(['folder3', 'folder1']),
        folderApi.reorderFolders(['folder2', 'folder3'])
      ]

      await Promise.all(promises)

      expect(mockElectronAPI.folders.reorderFolders).toHaveBeenCalledTimes(3)
    })

    it('一つのAPI呼び出しが失敗しても他に影響しない', async () => {
      mockElectronAPI.folders.reorderFolders
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(undefined)

      const results = await Promise.allSettled([
        folderApi.reorderFolders(['folder1', 'folder2']),
        folderApi.reorderFolders(['folder3', 'folder1']),
        folderApi.reorderFolders(['folder2', 'folder3'])
      ])

      expect(results[0].status).toBe('fulfilled')
      expect(results[1].status).toBe('rejected')
      expect(results[2].status).toBe('fulfilled')
    })
  })

  describe('エラーハンドリングの詳細', () => {
    it('TypeError が適切に処理される', async () => {
      const typeError = new TypeError('Cannot read property of undefined')
      mockElectronAPI.folders.reorderFolders.mockRejectedValue(typeError)

      await expect(folderApi.reorderFolders(['folder1'])).rejects.toThrow(TypeError)
    })

    it('カスタムエラーオブジェクトが正しく伝播される', async () => {
      const customError = {
        code: 'FOLDER_REORDER_FAILED',
        message: 'Failed to reorder folders',
        details: { conflictingIds: ['folder1', 'folder2'] }
      }
      mockElectronAPI.folders.reorderFolders.mockRejectedValue(customError)

      await expect(folderApi.reorderFolders(['folder1', 'folder2'])).rejects.toEqual(customError)
    })
  })
})