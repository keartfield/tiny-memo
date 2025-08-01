import { describe, it, expect, vi, beforeEach } from 'vitest'
import { memoApi } from './memoApi'
import { Memo, MemoCreateInput, MemoUpdateInput } from '../model'

// electronAPIのモック
const mockElectronAPI = {
  memos: {
    getAll: vi.fn(),
    getByFolder: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}

// windowオブジェクトにelectronAPIを追加
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})

const mockMemo: Memo = {
  id: '1',
  content: '# テストメモ\n\nこれはテストの内容です。',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02'),
  folderId: null
}

const mockMemos: Memo[] = [
  mockMemo,
  {
    id: '2',
    content: '別のメモ',
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-04'),
    folderId: 'folder1'
  }
]

describe('MemoApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('全てのメモを取得できる', async () => {
      mockElectronAPI.memos.getAll.mockResolvedValue(mockMemos)

      const result = await memoApi.getAll()

      expect(mockElectronAPI.memos.getAll).toHaveBeenCalledWith()
      expect(result).toEqual(mockMemos)
    })

    it('空の配列を取得できる', async () => {
      mockElectronAPI.memos.getAll.mockResolvedValue([])

      const result = await memoApi.getAll()

      expect(result).toEqual([])
    })

    it('エラーが発生した場合は例外を投げる', async () => {
      const error = new Error('データベースエラー')
      mockElectronAPI.memos.getAll.mockRejectedValue(error)

      await expect(memoApi.getAll()).rejects.toThrow('データベースエラー')
    })
  })

  describe('getByFolder', () => {
    it('特定のフォルダーのメモを取得できる', async () => {
      const folderMemos = [mockMemos[1]]
      mockElectronAPI.memos.getByFolder.mockResolvedValue(folderMemos)

      const result = await memoApi.getByFolder('folder1')

      expect(mockElectronAPI.memos.getByFolder).toHaveBeenCalledWith('folder1')
      expect(result).toEqual(folderMemos)
    })

    it('フォルダーIDがnullの場合のメモを取得できる', async () => {
      const noFolderMemos = [mockMemos[0]]
      mockElectronAPI.memos.getByFolder.mockResolvedValue(noFolderMemos)

      const result = await memoApi.getByFolder(null)

      expect(mockElectronAPI.memos.getByFolder).toHaveBeenCalledWith(null)
      expect(result).toEqual(noFolderMemos)
    })

    it('存在しないフォルダーの場合は空配列を返す', async () => {
      mockElectronAPI.memos.getByFolder.mockResolvedValue([])

      const result = await memoApi.getByFolder('nonexistent')

      expect(result).toEqual([])
    })

    it('エラーが発生した場合は例外を投げる', async () => {
      const error = new Error('フォルダー取得エラー')
      mockElectronAPI.memos.getByFolder.mockRejectedValue(error)

      await expect(memoApi.getByFolder('folder1')).rejects.toThrow('フォルダー取得エラー')
    })
  })

  describe('create', () => {
    it('新しいメモを作成できる', async () => {
      const createInput: MemoCreateInput = {
        content: '新しいメモの内容',
        folderId: null
      }
      const createdMemo: Memo = {
        id: 'new-memo',
        content: createInput.content,
        folderId: createInput.folderId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockElectronAPI.memos.create.mockResolvedValue(createdMemo)

      const result = await memoApi.create(createInput)

      expect(mockElectronAPI.memos.create).toHaveBeenCalledWith(createInput)
      expect(result).toEqual(createdMemo)
    })

    it('フォルダー指定ありでメモを作成できる', async () => {
      const createInput: MemoCreateInput = {
        content: 'フォルダー内のメモ',
        folderId: 'folder1'
      }
      const createdMemo: Memo = {
        id: 'folder-memo',
        content: createInput.content,
        folderId: createInput.folderId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockElectronAPI.memos.create.mockResolvedValue(createdMemo)

      const result = await memoApi.create(createInput)

      expect(mockElectronAPI.memos.create).toHaveBeenCalledWith(createInput)
      expect(result).toEqual(createdMemo)
    })

    it('空の内容でもメモを作成できる', async () => {
      const createInput: MemoCreateInput = {
        content: '',
        folderId: null
      }
      const createdMemo: Memo = {
        id: 'empty-memo',
        content: '',
        folderId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockElectronAPI.memos.create.mockResolvedValue(createdMemo)

      const result = await memoApi.create(createInput)

      expect(result).toEqual(createdMemo)
    })

    it('作成エラーが発生した場合は例外を投げる', async () => {
      const createInput: MemoCreateInput = {
        content: 'エラーメモ',
        folderId: null
      }
      const error = new Error('メモ作成エラー')
      mockElectronAPI.memos.create.mockRejectedValue(error)

      await expect(memoApi.create(createInput)).rejects.toThrow('メモ作成エラー')
    })
  })

  describe('update', () => {
    it('メモの内容を更新できる', async () => {
      const updateInput: MemoUpdateInput = {
        content: '更新されたメモの内容'
      }
      const updatedMemo: Memo = {
        ...mockMemo,
        content: updateInput.content!,
        updatedAt: new Date()
      }
      mockElectronAPI.memos.update.mockResolvedValue(updatedMemo)

      const result = await memoApi.update('1', updateInput)

      expect(mockElectronAPI.memos.update).toHaveBeenCalledWith('1', updateInput)
      expect(result).toEqual(updatedMemo)
    })

    it('メモのフォルダーを更新できる', async () => {
      const updateInput: MemoUpdateInput = {
        folderId: 'new-folder'
      }
      const updatedMemo: Memo = {
        ...mockMemo,
        folderId: updateInput.folderId!,
        updatedAt: new Date()
      }
      mockElectronAPI.memos.update.mockResolvedValue(updatedMemo)

      const result = await memoApi.update('1', updateInput)

      expect(mockElectronAPI.memos.update).toHaveBeenCalledWith('1', updateInput)
      expect(result).toEqual(updatedMemo)
    })

    it('メモの内容とフォルダーを同時に更新できる', async () => {
      const updateInput: MemoUpdateInput = {
        content: '更新された内容',
        folderId: 'updated-folder'
      }
      const updatedMemo: Memo = {
        ...mockMemo,
        content: updateInput.content!,
        folderId: updateInput.folderId!,
        updatedAt: new Date()
      }
      mockElectronAPI.memos.update.mockResolvedValue(updatedMemo)

      const result = await memoApi.update('1', updateInput)

      expect(result).toEqual(updatedMemo)
    })

    it('存在しないメモの更新でエラーを投げる', async () => {
      const updateInput: MemoUpdateInput = {
        content: '更新内容'
      }
      const error = new Error('メモが見つかりません')
      mockElectronAPI.memos.update.mockRejectedValue(error)

      await expect(memoApi.update('nonexistent', updateInput)).rejects.toThrow('メモが見つかりません')
    })
  })

  describe('delete', () => {
    it('メモを削除できる', async () => {
      mockElectronAPI.memos.delete.mockResolvedValue(undefined)

      await memoApi.delete('1')

      expect(mockElectronAPI.memos.delete).toHaveBeenCalledWith('1')
    })

    it('存在しないメモの削除でエラーを投げる', async () => {
      const error = new Error('削除対象のメモが見つかりません')
      mockElectronAPI.memos.delete.mockRejectedValue(error)

      await expect(memoApi.delete('nonexistent')).rejects.toThrow('削除対象のメモが見つかりません')
    })

    it('削除処理で一般的なエラーが発生した場合', async () => {
      const error = new Error('データベース削除エラー')
      mockElectronAPI.memos.delete.mockRejectedValue(error)

      await expect(memoApi.delete('1')).rejects.toThrow('データベース削除エラー')
    })
  })

  describe('API インターフェース準拠', () => {
    it('MemoApiがMemoApiInterfaceを実装している', () => {
      expect(typeof memoApi.getAll).toBe('function')
      expect(typeof memoApi.getByFolder).toBe('function')
      expect(typeof memoApi.create).toBe('function')
      expect(typeof memoApi.update).toBe('function')
      expect(typeof memoApi.delete).toBe('function')
    })

    it('各メソッドがPromiseを返す', () => {
      mockElectronAPI.memos.getAll.mockResolvedValue([])
      mockElectronAPI.memos.getByFolder.mockResolvedValue([])
      mockElectronAPI.memos.create.mockResolvedValue(mockMemo)
      mockElectronAPI.memos.update.mockResolvedValue(mockMemo)
      mockElectronAPI.memos.delete.mockResolvedValue(undefined)

      expect(memoApi.getAll()).toBeInstanceOf(Promise)
      expect(memoApi.getByFolder(null)).toBeInstanceOf(Promise)
      expect(memoApi.create({ content: '', folderId: null })).toBeInstanceOf(Promise)
      expect(memoApi.update('1', { content: '' })).toBeInstanceOf(Promise)
      expect(memoApi.delete('1')).toBeInstanceOf(Promise)
    })
  })

  describe('エッジケース', () => {
    it('非常に長い内容のメモも処理できる', async () => {
      const longContent = 'a'.repeat(10000)
      const createInput: MemoCreateInput = {
        content: longContent,
        folderId: null
      }
      const createdMemo: Memo = {
        id: 'long-memo',
        content: longContent,
        folderId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockElectronAPI.memos.create.mockResolvedValue(createdMemo)

      const result = await memoApi.create(createInput)

      expect(result.content).toBe(longContent)
    })

    it('特殊文字を含む内容も処理できる', async () => {
      const specialContent = '特殊文字: !@#$%^&*()_+-=[]{}|;:,.<>?'
      const createInput: MemoCreateInput = {
        content: specialContent,
        folderId: null
      }
      const createdMemo: Memo = {
        id: 'special-memo',
        content: specialContent,
        folderId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockElectronAPI.memos.create.mockResolvedValue(createdMemo)

      const result = await memoApi.create(createInput)

      expect(result.content).toBe(specialContent)
    })
  })
})