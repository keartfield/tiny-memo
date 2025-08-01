import { describe, it, expect, vi, beforeEach } from 'vitest'
import { folderApi } from './folderApi'
import { Folder } from '../model'

// electronAPIのモック
const mockElectronAPI = {
  folders: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn()
  }
}

// windowオブジェクトにelectronAPIを追加
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})

const mockFolder: Folder = {
  id: '1',
  name: 'テストフォルダー',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  _count: { memos: 5 }
}

const mockFolders: Folder[] = [
  mockFolder,
  {
    id: '2',
    name: 'フォルダー2',
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
    _count: { memos: 3 }
  },
  {
    id: '3',
    name: 'Empty Folder',
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03'),
    _count: { memos: 0 }
  }
]

describe('FolderApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('全てのフォルダーを取得できる', async () => {
      mockElectronAPI.folders.getAll.mockResolvedValue(mockFolders)

      const result = await folderApi.getAll()

      expect(mockElectronAPI.folders.getAll).toHaveBeenCalledWith()
      expect(result).toEqual(mockFolders)
    })

    it('空の配列を取得できる', async () => {
      mockElectronAPI.folders.getAll.mockResolvedValue([])

      const result = await folderApi.getAll()

      expect(result).toEqual([])
    })

    it('エラーが発生した場合は例外を投げる', async () => {
      const error = new Error('データベースエラー')
      mockElectronAPI.folders.getAll.mockRejectedValue(error)

      await expect(folderApi.getAll()).rejects.toThrow('データベースエラー')
    })

    it('複数回呼び出しても正しく動作する', async () => {
      mockElectronAPI.folders.getAll.mockResolvedValue(mockFolders)

      const result1 = await folderApi.getAll()
      const result2 = await folderApi.getAll()

      expect(mockElectronAPI.folders.getAll).toHaveBeenCalledTimes(2)
      expect(result1).toEqual(mockFolders)
      expect(result2).toEqual(mockFolders)
    })

    it('ネットワークエラーでも適切に例外を投げる', async () => {
      const networkError = new Error('Network connection failed')
      mockElectronAPI.folders.getAll.mockRejectedValue(networkError)

      await expect(folderApi.getAll()).rejects.toThrow('Network connection failed')
    })
  })

  describe('create', () => {
    it('新しいフォルダーを作成できる', async () => {
      const folderName = '新しいフォルダー'
      const createdFolder: Folder = {
        id: 'new-folder',
        name: folderName,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 0 }
      }
      mockElectronAPI.folders.create.mockResolvedValue(createdFolder)

      const result = await folderApi.create(folderName)

      expect(mockElectronAPI.folders.create).toHaveBeenCalledWith(folderName)
      expect(result).toEqual(createdFolder)
    })

    it('英語名のフォルダーを作成できる', async () => {
      const folderName = 'New Folder'
      const createdFolder: Folder = {
        id: 'english-folder',
        name: folderName,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 0 }
      }
      mockElectronAPI.folders.create.mockResolvedValue(createdFolder)

      const result = await folderApi.create(folderName)

      expect(result.name).toBe(folderName)
    })

    it('特殊文字を含む名前のフォルダーを作成できる', async () => {
      const folderName = 'Folder@#$%^&*()'
      const createdFolder: Folder = {
        id: 'special-folder',
        name: folderName,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 0 }
      }
      mockElectronAPI.folders.create.mockResolvedValue(createdFolder)

      const result = await folderApi.create(folderName)

      expect(result.name).toBe(folderName)
    })

    it('空白を含む名前のフォルダーを作成できる', async () => {
      const folderName = '  Folder with spaces  '
      const createdFolder: Folder = {
        id: 'spaced-folder',
        name: folderName,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 0 }
      }
      mockElectronAPI.folders.create.mockResolvedValue(createdFolder)

      const result = await folderApi.create(folderName)

      expect(result.name).toBe(folderName)
    })

    it('数字のみの名前のフォルダーを作成できる', async () => {
      const folderName = '12345'
      const createdFolder: Folder = {
        id: 'numeric-folder',
        name: folderName,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 0 }
      }
      mockElectronAPI.folders.create.mockResolvedValue(createdFolder)

      const result = await folderApi.create(folderName)

      expect(result.name).toBe(folderName)
    })

    it('長い名前のフォルダーを作成できる', async () => {
      const folderName = 'Very Long Folder Name That Contains Many Characters And Should Still Work'
      const createdFolder: Folder = {
        id: 'long-folder',
        name: folderName,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 0 }
      }
      mockElectronAPI.folders.create.mockResolvedValue(createdFolder)

      const result = await folderApi.create(folderName)

      expect(result.name).toBe(folderName)
    })

    it('作成エラーが発生した場合は例外を投げる', async () => {
      const folderName = 'エラーフォルダー'
      const error = new Error('フォルダー作成エラー')
      mockElectronAPI.folders.create.mockRejectedValue(error)

      await expect(folderApi.create(folderName)).rejects.toThrow('フォルダー作成エラー')
    })

    it('重複する名前のエラーを適切に処理する', async () => {
      const folderName = '既存フォルダー'
      const duplicateError = new Error('フォルダー名が既に存在します')
      mockElectronAPI.folders.create.mockRejectedValue(duplicateError)

      await expect(folderApi.create(folderName)).rejects.toThrow('フォルダー名が既に存在します')
    })

    it('権限エラーを適切に処理する', async () => {
      const folderName = '権限フォルダー'
      const permissionError = new Error('Permission denied')
      mockElectronAPI.folders.create.mockRejectedValue(permissionError)

      await expect(folderApi.create(folderName)).rejects.toThrow('Permission denied')
    })
  })

  describe('delete', () => {
    it('フォルダーを削除できる', async () => {
      mockElectronAPI.folders.delete.mockResolvedValue(undefined)

      await folderApi.delete('1')

      expect(mockElectronAPI.folders.delete).toHaveBeenCalledWith('1')
    })

    it('文字列IDのフォルダーを削除できる', async () => {
      const folderId = 'folder-abc-123'
      mockElectronAPI.folders.delete.mockResolvedValue(undefined)

      await folderApi.delete(folderId)

      expect(mockElectronAPI.folders.delete).toHaveBeenCalledWith(folderId)
    })

    it('UUIDのフォルダーを削除できる', async () => {
      const folderId = '550e8400-e29b-41d4-a716-446655440000'
      mockElectronAPI.folders.delete.mockResolvedValue(undefined)

      await folderApi.delete(folderId)

      expect(mockElectronAPI.folders.delete).toHaveBeenCalledWith(folderId)
    })

    it('存在しないフォルダーの削除でエラーを投げる', async () => {
      const error = new Error('削除対象のフォルダーが見つかりません')
      mockElectronAPI.folders.delete.mockRejectedValue(error)

      await expect(folderApi.delete('nonexistent')).rejects.toThrow('削除対象のフォルダーが見つかりません')
    })

    it('削除処理で一般的なエラーが発生した場合', async () => {
      const error = new Error('データベース削除エラー')
      mockElectronAPI.folders.delete.mockRejectedValue(error)

      await expect(folderApi.delete('1')).rejects.toThrow('データベース削除エラー')
    })

    it('空文字列のIDでも適切にエラーを処理する', async () => {
      const error = new Error('Invalid folder ID')
      mockElectronAPI.folders.delete.mockRejectedValue(error)

      await expect(folderApi.delete('')).rejects.toThrow('Invalid folder ID')
    })

    it('特殊文字を含むIDでも正しく処理する', async () => {
      const folderId = 'folder@#$%'
      mockElectronAPI.folders.delete.mockResolvedValue(undefined)

      await folderApi.delete(folderId)

      expect(mockElectronAPI.folders.delete).toHaveBeenCalledWith(folderId)
    })

    it('複数回同じフォルダーの削除を試行できる', async () => {
      mockElectronAPI.folders.delete
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('フォルダーが見つかりません'))

      // 最初の削除は成功
      await folderApi.delete('1')
      expect(mockElectronAPI.folders.delete).toHaveBeenNthCalledWith(1, '1')

      // 2回目の削除は失敗
      await expect(folderApi.delete('1')).rejects.toThrow('フォルダーが見つかりません')
      expect(mockElectronAPI.folders.delete).toHaveBeenNthCalledWith(2, '1')
    })
  })

  describe('API インターフェース準拠', () => {
    it('FolderApiがFolderApiInterfaceを実装している', () => {
      expect(typeof folderApi.getAll).toBe('function')
      expect(typeof folderApi.create).toBe('function')
      expect(typeof folderApi.delete).toBe('function')
    })

    it('各メソッドがPromiseを返す', () => {
      mockElectronAPI.folders.getAll.mockResolvedValue([])
      mockElectronAPI.folders.create.mockResolvedValue(mockFolder)
      mockElectronAPI.folders.delete.mockResolvedValue(undefined)

      expect(folderApi.getAll()).toBeInstanceOf(Promise)
      expect(folderApi.create('test')).toBeInstanceOf(Promise)
      expect(folderApi.delete('1')).toBeInstanceOf(Promise)
    })

    it('メソッドが正しい引数の型を受け取る', async () => {
      mockElectronAPI.folders.getAll.mockResolvedValue([])
      mockElectronAPI.folders.create.mockResolvedValue(mockFolder)
      mockElectronAPI.folders.delete.mockResolvedValue(undefined)

      // getAll は引数なし
      await folderApi.getAll()

      // create は文字列を受け取る
      await folderApi.create('テスト')

      // delete は文字列を受け取る
      await folderApi.delete('1')

      expect(mockElectronAPI.folders.getAll).toHaveBeenCalledWith()
      expect(mockElectronAPI.folders.create).toHaveBeenCalledWith('テスト')
      expect(mockElectronAPI.folders.delete).toHaveBeenCalledWith('1')
    })
  })

  describe('エッジケース', () => {
    it('非常に長い名前でも正しく処理する', async () => {
      const longName = 'a'.repeat(1000)
      const createdFolder: Folder = {
        id: 'long-name-folder',
        name: longName,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 0 }
      }
      mockElectronAPI.folders.create.mockResolvedValue(createdFolder)

      const result = await folderApi.create(longName)

      expect(result.name).toBe(longName)
    })

    it('Unicodeを含む名前でも正しく処理する', async () => {
      const unicodeName = '📁 Folder with 絵文字 🎌'
      const createdFolder: Folder = {
        id: 'unicode-folder',
        name: unicodeName,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 0 }
      }
      mockElectronAPI.folders.create.mockResolvedValue(createdFolder)

      const result = await folderApi.create(unicodeName)

      expect(result.name).toBe(unicodeName)
    })

    it('改行文字を含む名前でも正しく処理する', async () => {
      const multilineName = 'Multi\nLine\nFolder'
      const createdFolder: Folder = {
        id: 'multiline-folder',
        name: multilineName,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 0 }
      }
      mockElectronAPI.folders.create.mockResolvedValue(createdFolder)

      const result = await folderApi.create(multilineName)

      expect(result.name).toBe(multilineName)
    })

    it('非常に大きなID番号でも正しく処理する', async () => {
      const largeId = '999999999999999999999'
      mockElectronAPI.folders.delete.mockResolvedValue(undefined)

      await folderApi.delete(largeId)

      expect(mockElectronAPI.folders.delete).toHaveBeenCalledWith(largeId)
    })

    it('同時に複数のAPI呼び出しを行っても正しく動作する', async () => {
      mockElectronAPI.folders.getAll.mockResolvedValue(mockFolders)
      mockElectronAPI.folders.create.mockResolvedValue(mockFolder)
      mockElectronAPI.folders.delete.mockResolvedValue(undefined)

      // 並行して複数のAPI呼び出しを実行
      const promises = [
        folderApi.getAll(),
        folderApi.create('Test 1'),
        folderApi.create('Test 2'),
        folderApi.delete('1'),
        folderApi.delete('2')
      ]

      const results = await Promise.all(promises)

      expect(results[0]).toEqual(mockFolders) // getAll result
      expect(results[1]).toEqual(mockFolder) // create result
      expect(results[2]).toEqual(mockFolder) // create result
      expect(results[3]).toBeUndefined() // delete result
      expect(results[4]).toBeUndefined() // delete result
    })
  })
})