import { describe, it, expect, vi, beforeEach } from 'vitest'
import { foldersApi } from './folders'
import { Folder } from '../types'

// ElectronAPIのモック
const mockElectronAPI = {
  folders: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn()
  },
  memos: {
    getAll: vi.fn(),
    getByFolder: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}

// テスト用のモックデータ
const mockFolders: Folder[] = [
  {
    id: 'folder1',
    name: 'プログラミング',
    memos: 5,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-05')
  },
  {
    id: 'folder2',
    name: '読書ノート',
    memos: 3,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-04')
  },
  {
    id: 'folder3',
    name: '日記',
    memos: 10,
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03')
  }
]

describe('foldersApi', () => {
  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks()
    
    // globalオブジェクトにモックを設定
    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true
    })
  })

  describe('getAll', () => {
    it('全てのフォルダを正常に取得する', async () => {
      mockElectronAPI.folders.getAll.mockResolvedValue(mockFolders)

      const result = await foldersApi.getAll()

      expect(mockElectronAPI.folders.getAll).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockFolders)
      expect(result).toHaveLength(3)
    })

    it('空のフォルダリストを正常に取得する', async () => {
      mockElectronAPI.folders.getAll.mockResolvedValue([])

      const result = await foldersApi.getAll()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('ElectronAPIがエラーを投げる場合、エラーが伝播される', async () => {
      const error = new Error('フォルダの取得に失敗しました')
      mockElectronAPI.folders.getAll.mockRejectedValue(error)

      await expect(foldersApi.getAll()).rejects.toThrow('フォルダの取得に失敗しました')
      expect(mockElectronAPI.folders.getAll).toHaveBeenCalledTimes(1)
    })

    it('ネットワークエラーの場合も正しくエラーを処理する', async () => {
      const networkError = new Error('Network error')
      mockElectronAPI.folders.getAll.mockRejectedValue(networkError)

      await expect(foldersApi.getAll()).rejects.toThrow('Network error')
    })

    it('複数回呼び出しても正しく動作する', async () => {
      mockElectronAPI.folders.getAll.mockResolvedValue(mockFolders)

      const result1 = await foldersApi.getAll()
      const result2 = await foldersApi.getAll()

      expect(mockElectronAPI.folders.getAll).toHaveBeenCalledTimes(2)
      expect(result1).toEqual(mockFolders)
      expect(result2).toEqual(mockFolders)
    })

    it('異なるタイミングで異なる結果を返すことができる', async () => {
      const firstCall = mockFolders.slice(0, 2)
      const secondCall = mockFolders

      mockElectronAPI.folders.getAll
        .mockResolvedValueOnce(firstCall)
        .mockResolvedValueOnce(secondCall)

      const result1 = await foldersApi.getAll()
      const result2 = await foldersApi.getAll()

      expect(result1).toEqual(firstCall)
      expect(result1).toHaveLength(2)
      expect(result2).toEqual(secondCall)
      expect(result2).toHaveLength(3)
    })

    it('プロミスの解決を正しく待機する', async () => {
      let resolvePromise: (value: Folder[]) => void
      const promise = new Promise<Folder[]>((resolve) => {
        resolvePromise = resolve
      })

      mockElectronAPI.folders.getAll.mockReturnValue(promise)

      const resultPromise = foldersApi.getAll()
      
      // プロミスが解決される前はpending状態
      expect(mockElectronAPI.folders.getAll).toHaveBeenCalledTimes(1)
      
      // プロミスを解決
      resolvePromise!(mockFolders)
      const result = await resultPromise

      expect(result).toEqual(mockFolders)
    })
  })

  describe('create', () => {
    const newFolder: Folder = {
      id: 'new-folder',
      name: '新しいフォルダ',
      memos: 0,
      createdAt: new Date('2023-01-06'),
      updatedAt: new Date('2023-01-06')
    }

    it('新しいフォルダを正常に作成する', async () => {
      mockElectronAPI.folders.create.mockResolvedValue(newFolder)

      const result = await foldersApi.create('新しいフォルダ')

      expect(mockElectronAPI.folders.create).toHaveBeenCalledWith('新しいフォルダ')
      expect(mockElectronAPI.folders.create).toHaveBeenCalledTimes(1)
      expect(result).toEqual(newFolder)
    })

    it('英語のフォルダ名でも正常に作成する', async () => {
      const englishFolder: Folder = {
        id: 'english-folder',
        name: 'Programming Notes',
        memos: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockElectronAPI.folders.create.mockResolvedValue(englishFolder)

      const result = await foldersApi.create('Programming Notes')

      expect(mockElectronAPI.folders.create).toHaveBeenCalledWith('Programming Notes')
      expect(result).toEqual(englishFolder)
    })

    it('空文字列のフォルダ名でも呼び出しは行われる', async () => {
      const emptyNameFolder: Folder = {
        id: 'empty-folder',
        name: '',
        memos: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockElectronAPI.folders.create.mockResolvedValue(emptyNameFolder)

      const result = await foldersApi.create('')

      expect(mockElectronAPI.folders.create).toHaveBeenCalledWith('')
      expect(result).toEqual(emptyNameFolder)
    })

    it('フォルダ作成時にエラーが発生した場合、エラーが伝播される', async () => {
      const error = new Error('フォルダの作成に失敗しました')
      mockElectronAPI.folders.create.mockRejectedValue(error)

      await expect(foldersApi.create('テストフォルダ')).rejects.toThrow('フォルダの作成に失敗しました')
      expect(mockElectronAPI.folders.create).toHaveBeenCalledWith('テストフォルダ')
    })

    it('重複したフォルダ名のエラーを正しく処理する', async () => {
      const duplicateError = new Error('同じ名前のフォルダが既に存在します')
      mockElectronAPI.folders.create.mockRejectedValue(duplicateError)

      await expect(foldersApi.create('既存フォルダ')).rejects.toThrow('同じ名前のフォルダが既に存在します')
    })

    it('特殊文字を含むフォルダ名でも正常に処理する', async () => {
      const specialFolder: Folder = {
        id: 'special-folder',
        name: '📝 メモ & ノート (2023)',
        memos: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockElectronAPI.folders.create.mockResolvedValue(specialFolder)

      const result = await foldersApi.create('📝 メモ & ノート (2023)')

      expect(result.name).toBe('📝 メモ & ノート (2023)')
    })

    it('非常に長いフォルダ名でも正常に処理する', async () => {
      const longName = 'あ'.repeat(1000)
      const longNameFolder: Folder = {
        id: 'long-name-folder',
        name: longName,
        memos: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockElectronAPI.folders.create.mockResolvedValue(longNameFolder)

      const result = await foldersApi.create(longName)

      expect(mockElectronAPI.folders.create).toHaveBeenCalledWith(longName)
      expect(result.name).toBe(longName)
    })

    it('複数のフォルダを連続で作成できる', async () => {
      const folder1: Folder = { id: '1', name: 'フォルダ1', memos: 0, createdAt: new Date(), updatedAt: new Date() }
      const folder2: Folder = { id: '2', name: 'フォルダ2', memos: 0, createdAt: new Date(), updatedAt: new Date() }

      mockElectronAPI.folders.create
        .mockResolvedValueOnce(folder1)
        .mockResolvedValueOnce(folder2)

      const result1 = await foldersApi.create('フォルダ1')
      const result2 = await foldersApi.create('フォルダ2')

      expect(mockElectronAPI.folders.create).toHaveBeenCalledTimes(2)
      expect(result1).toEqual(folder1)
      expect(result2).toEqual(folder2)
    })
  })

  describe('delete', () => {
    it('指定されたIDのフォルダを正常に削除する', async () => {
      mockElectronAPI.folders.delete.mockResolvedValue(undefined)

      await foldersApi.delete('folder1')

      expect(mockElectronAPI.folders.delete).toHaveBeenCalledWith('folder1')
      expect(mockElectronAPI.folders.delete).toHaveBeenCalledTimes(1)
    })

    it('複数のフォルダを連続で削除できる', async () => {
      mockElectronAPI.folders.delete.mockResolvedValue(undefined)

      await foldersApi.delete('folder1')
      await foldersApi.delete('folder2')
      await foldersApi.delete('folder3')

      expect(mockElectronAPI.folders.delete).toHaveBeenCalledTimes(3)
      expect(mockElectronAPI.folders.delete).toHaveBeenNthCalledWith(1, 'folder1')
      expect(mockElectronAPI.folders.delete).toHaveBeenNthCalledWith(2, 'folder2')
      expect(mockElectronAPI.folders.delete).toHaveBeenNthCalledWith(3, 'folder3')
    })

    it('存在しないフォルダIDを削除しようとした場合、エラーが発生する', async () => {
      const error = new Error('フォルダが見つかりません')
      mockElectronAPI.folders.delete.mockRejectedValue(error)

      await expect(foldersApi.delete('non-existent')).rejects.toThrow('フォルダが見つかりません')
      expect(mockElectronAPI.folders.delete).toHaveBeenCalledWith('non-existent')
    })

    it('フォルダ削除時に権限エラーが発生した場合、エラーが伝播される', async () => {
      const permissionError = new Error('フォルダの削除権限がありません')
      mockElectronAPI.folders.delete.mockRejectedValue(permissionError)

      await expect(foldersApi.delete('protected-folder')).rejects.toThrow('フォルダの削除権限がありません')
    })

    it('空文字列のIDを削除しようとした場合も呼び出しは行われる', async () => {
      const error = new Error('無効なフォルダIDです')
      mockElectronAPI.folders.delete.mockRejectedValue(error)

      await expect(foldersApi.delete('')).rejects.toThrow('無効なフォルダIDです')
      expect(mockElectronAPI.folders.delete).toHaveBeenCalledWith('')
    })

    it('メモが含まれているフォルダを削除しようとした場合のエラー処理', async () => {
      const error = new Error('メモが含まれているフォルダは削除できません')
      mockElectronAPI.folders.delete.mockRejectedValue(error)

      await expect(foldersApi.delete('folder-with-memos')).rejects.toThrow('メモが含まれているフォルダは削除できません')
    })

    it('同じフォルダを複数回削除しようとした場合のエラー処理', async () => {
      mockElectronAPI.folders.delete
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('フォルダが見つかりません'))

      // 最初の削除は成功
      await foldersApi.delete('folder1')
      expect(mockElectronAPI.folders.delete).toHaveBeenNthCalledWith(1, 'folder1')

      // 2回目の削除は失敗
      await expect(foldersApi.delete('folder1')).rejects.toThrow('フォルダが見つかりません')
      expect(mockElectronAPI.folders.delete).toHaveBeenCalledTimes(2)
    })

    it('削除処理中にネットワークエラーが発生した場合', async () => {
      const networkError = new Error('ネットワークエラーが発生しました')
      mockElectronAPI.folders.delete.mockRejectedValue(networkError)

      await expect(foldersApi.delete('folder1')).rejects.toThrow('ネットワークエラーが発生しました')
    })

    it('削除が成功した場合、戻り値はundefinedである', async () => {
      mockElectronAPI.folders.delete.mockResolvedValue(undefined)

      const result = await foldersApi.delete('folder1')

      expect(result).toBeUndefined()
    })
  })

  describe('統合テスト', () => {
    it('フォルダの作成、取得、削除のワークフローが正しく動作する', async () => {
      const newFolder: Folder = {
        id: 'workflow-folder',
        name: 'ワークフローテスト',
        memos: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // フォルダ作成
      mockElectronAPI.folders.create.mockResolvedValue(newFolder)
      const created = await foldersApi.create('ワークフローテスト')
      expect(created).toEqual(newFolder)

      // フォルダ一覧取得
      mockElectronAPI.folders.getAll.mockResolvedValue([...mockFolders, newFolder])
      const allFolders = await foldersApi.getAll()
      expect(allFolders).toHaveLength(4)
      expect(allFolders).toContain(newFolder)

      // フォルダ削除
      mockElectronAPI.folders.delete.mockResolvedValue(undefined)
      await foldersApi.delete(newFolder.id)
      expect(mockElectronAPI.folders.delete).toHaveBeenCalledWith(newFolder.id)
    })

    it('エラーが発生したワークフローでも適切に処理される', async () => {
      // フォルダ作成に失敗
      mockElectronAPI.folders.create.mockRejectedValue(new Error('作成失敗'))
      await expect(foldersApi.create('失敗フォルダ')).rejects.toThrow('作成失敗')

      // フォルダ取得は成功
      mockElectronAPI.folders.getAll.mockResolvedValue(mockFolders)
      const folders = await foldersApi.getAll()
      expect(folders).toEqual(mockFolders)

      // 存在しないフォルダの削除に失敗
      mockElectronAPI.folders.delete.mockRejectedValue(new Error('フォルダが見つかりません'))
      await expect(foldersApi.delete('non-existent')).rejects.toThrow('フォルダが見つかりません')
    })
  })

  describe('エッジケース', () => {
    it('ElectronAPIが存在しない場合はエラーが発生する', async () => {
      // windowオブジェクトからelectronAPIを削除
      Object.defineProperty(window, 'electronAPI', {
        value: undefined,
        writable: true
      })

      await expect(foldersApi.getAll()).rejects.toThrow()
      await expect(foldersApi.create('テスト')).rejects.toThrow()
      await expect(foldersApi.delete('test')).rejects.toThrow()
    })

    it('ElectronAPIのfoldersプロパティが存在しない場合', async () => {
      Object.defineProperty(window, 'electronAPI', {
        value: { memos: {} },
        writable: true
      })

      await expect(foldersApi.getAll()).rejects.toThrow()
    })

    it('非常に大きなフォルダリストでも正常に処理する', async () => {
      const largeFolderList: Folder[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `folder-${i}`,
        name: `フォルダ${i}`,
        memos: i % 10,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      mockElectronAPI.folders.getAll.mockResolvedValue(largeFolderList)

      const result = await foldersApi.getAll()
      expect(result).toHaveLength(10000)
      expect(result[0].name).toBe('フォルダ0')
      expect(result[9999].name).toBe('フォルダ9999')
    })

    it('プロミスの同時実行が正しく動作する', async () => {
      mockElectronAPI.folders.getAll.mockResolvedValue(mockFolders)
      mockElectronAPI.folders.create.mockResolvedValue(mockFolders[0])
      mockElectronAPI.folders.delete.mockResolvedValue(undefined)

      // 複数の操作を同時実行
      const [getAllResult, createResult, deleteResult] = await Promise.all([
        foldersApi.getAll(),
        foldersApi.create('同時実行テスト'),
        foldersApi.delete('test-id')
      ])

      expect(getAllResult).toEqual(mockFolders)
      expect(createResult).toEqual(mockFolders[0])
      expect(deleteResult).toBeUndefined()
    })

    it('TypeScriptの型安全性を確認', () => {
      // コンパイル時に型チェックが行われることを確認
      // 実行時には型情報は失われるが、型定義が正しいことを確認
      expect(typeof foldersApi.getAll).toBe('function')
      expect(typeof foldersApi.create).toBe('function')
      expect(typeof foldersApi.delete).toBe('function')
    })
  })
})