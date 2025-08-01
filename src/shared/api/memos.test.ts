import { describe, it, expect, vi, beforeEach } from 'vitest'
import { memosApi } from './memos'
import { Memo, MemoCreateInput, MemoUpdateInput } from '../types'

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
const mockMemos: Memo[] = [
  {
    id: '1',
    content: '# JavaScript基礎\n\n変数の宣言について学習',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-03'),
    folderId: 'programming'
  },
  {
    id: '2',
    content: '今日の予定\n\n- 買い物\n- 散歩',
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
    folderId: null
  },
  {
    id: '3',
    content: '## TypeScript学習\n\n型安全性について',
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-04'),
    folderId: 'programming'
  }
]

describe('memosApi', () => {
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
    it('全てのメモを正常に取得する', async () => {
      mockElectronAPI.memos.getAll.mockResolvedValue(mockMemos)

      const result = await memosApi.getAll()

      expect(mockElectronAPI.memos.getAll).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockMemos)
      expect(result).toHaveLength(3)
    })

    it('空のメモリストを正常に取得する', async () => {
      mockElectronAPI.memos.getAll.mockResolvedValue([])

      const result = await memosApi.getAll()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('ElectronAPIがエラーを投げる場合、エラーが伝播される', async () => {
      const error = new Error('メモの取得に失敗しました')
      mockElectronAPI.memos.getAll.mockRejectedValue(error)

      await expect(memosApi.getAll()).rejects.toThrow('メモの取得に失敗しました')
      expect(mockElectronAPI.memos.getAll).toHaveBeenCalledTimes(1)
    })

    it('複数回呼び出しても正しく動作する', async () => {
      mockElectronAPI.memos.getAll.mockResolvedValue(mockMemos)

      const result1 = await memosApi.getAll()
      const result2 = await memosApi.getAll()

      expect(mockElectronAPI.memos.getAll).toHaveBeenCalledTimes(2)
      expect(result1).toEqual(mockMemos)
      expect(result2).toEqual(mockMemos)
    })

    it('非常に大きなメモリストでも正常に処理する', async () => {
      const largeMemoList: Memo[] = Array.from({ length: 5000 }, (_, i) => ({
        id: i.toString(),
        content: `メモ${i}の内容`,
        createdAt: new Date(),
        updatedAt: new Date(),
        folderId: i % 2 === 0 ? 'folder1' : null
      }))

      mockElectronAPI.memos.getAll.mockResolvedValue(largeMemoList)

      const result = await memosApi.getAll()
      expect(result).toHaveLength(5000)
    })
  })

  describe('getByFolder', () => {
    const programmingMemos = mockMemos.filter(memo => memo.folderId === 'programming')
    const uncategorizedMemos = mockMemos.filter(memo => memo.folderId === null)

    it('指定されたフォルダIDのメモを正常に取得する', async () => {
      mockElectronAPI.memos.getByFolder.mockResolvedValue(programmingMemos)

      const result = await memosApi.getByFolder('programming')

      expect(mockElectronAPI.memos.getByFolder).toHaveBeenCalledWith('programming')
      expect(mockElectronAPI.memos.getByFolder).toHaveBeenCalledTimes(1)
      expect(result).toEqual(programmingMemos)
      expect(result).toHaveLength(2)
    })

    it('nullフォルダID（未分類）のメモを正常に取得する', async () => {
      mockElectronAPI.memos.getByFolder.mockResolvedValue(uncategorizedMemos)

      const result = await memosApi.getByFolder(null)

      expect(mockElectronAPI.memos.getByFolder).toHaveBeenCalledWith(null)
      expect(result).toEqual(uncategorizedMemos)
      expect(result).toHaveLength(1)
    })

    it('存在しないフォルダIDを指定した場合、空の配列を返す', async () => {
      mockElectronAPI.memos.getByFolder.mockResolvedValue([])

      const result = await memosApi.getByFolder('non-existent')

      expect(mockElectronAPI.memos.getByFolder).toHaveBeenCalledWith('non-existent')
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('フォルダIDの取得でエラーが発生した場合、エラーが伝播される', async () => {
      const error = new Error('フォルダのメモ取得に失敗しました')
      mockElectronAPI.memos.getByFolder.mockRejectedValue(error)

      await expect(memosApi.getByFolder('programming')).rejects.toThrow('フォルダのメモ取得に失敗しました')
    })

    it('空文字列のフォルダIDでも呼び出しは行われる', async () => {
      mockElectronAPI.memos.getByFolder.mockResolvedValue([])

      const result = await memosApi.getByFolder('')

      expect(mockElectronAPI.memos.getByFolder).toHaveBeenCalledWith('')
      expect(result).toEqual([])
    })

    it('複数の異なるフォルダIDで連続取得できる', async () => {
      mockElectronAPI.memos.getByFolder
        .mockResolvedValueOnce(programmingMemos)
        .mockResolvedValueOnce(uncategorizedMemos)

      const result1 = await memosApi.getByFolder('programming')
      const result2 = await memosApi.getByFolder(null)

      expect(mockElectronAPI.memos.getByFolder).toHaveBeenCalledTimes(2)
      expect(result1).toEqual(programmingMemos)
      expect(result2).toEqual(uncategorizedMemos)
    })
  })

  describe('create', () => {
    const createInput: MemoCreateInput = {
      content: '新しいメモの内容',
      folderId: 'programming'
    }

    const createdMemo: Memo = {
      id: 'new-memo',
      content: '新しいメモの内容',
      createdAt: new Date('2023-01-05'),
      updatedAt: new Date('2023-01-05'),
      folderId: 'programming'
    }

    it('新しいメモを正常に作成する', async () => {
      mockElectronAPI.memos.create.mockResolvedValue(createdMemo)

      const result = await memosApi.create(createInput)

      expect(mockElectronAPI.memos.create).toHaveBeenCalledWith(createInput)
      expect(mockElectronAPI.memos.create).toHaveBeenCalledTimes(1)
      expect(result).toEqual(createdMemo)
    })

    it('フォルダIDがnullのメモを作成する', async () => {
      const uncategorizedInput: MemoCreateInput = {
        content: '未分類のメモ',
        folderId: null
      }
      const uncategorizedMemo: Memo = {
        id: 'uncategorized-memo',
        content: '未分類のメモ',
        createdAt: new Date(),
        updatedAt: new Date(),
        folderId: null
      }

      mockElectronAPI.memos.create.mockResolvedValue(uncategorizedMemo)

      const result = await memosApi.create(uncategorizedInput)

      expect(mockElectronAPI.memos.create).toHaveBeenCalledWith(uncategorizedInput)
      expect(result).toEqual(uncategorizedMemo)
    })

    it('空のコンテンツでメモを作成する', async () => {
      const emptyInput: MemoCreateInput = {
        content: '',
        folderId: null
      }
      const emptyMemo: Memo = {
        id: 'empty-memo',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        folderId: null
      }

      mockElectronAPI.memos.create.mockResolvedValue(emptyMemo)

      const result = await memosApi.create(emptyInput)

      expect(result).toEqual(emptyMemo)
    })

    it('Markdownコンテンツでメモを作成する', async () => {
      const markdownInput: MemoCreateInput = {
        content: '# タイトル\n\n**太字**と*斜体*のテキスト\n\n- リスト項目1\n- リスト項目2',
        folderId: 'notes'
      }
      const markdownMemo: Memo = {
        id: 'markdown-memo',
        content: markdownInput.content,
        createdAt: new Date(),
        updatedAt: new Date(),
        folderId: 'notes'
      }

      mockElectronAPI.memos.create.mockResolvedValue(markdownMemo)

      const result = await memosApi.create(markdownInput)

      expect(result.content).toBe(markdownInput.content)
    })

    it('メモ作成時にエラーが発生した場合、エラーが伝播される', async () => {
      const error = new Error('メモの作成に失敗しました')
      mockElectronAPI.memos.create.mockRejectedValue(error)

      await expect(memosApi.create(createInput)).rejects.toThrow('メモの作成に失敗しました')
    })

    it('存在しないフォルダIDでメモ作成を試みた場合のエラー処理', async () => {
      const invalidInput: MemoCreateInput = {
        content: 'テスト',
        folderId: 'non-existent-folder'
      }
      const error = new Error('指定されたフォルダが存在しません')
      mockElectronAPI.memos.create.mockRejectedValue(error)

      await expect(memosApi.create(invalidInput)).rejects.toThrow('指定されたフォルダが存在しません')
    })

    it('非常に長いコンテンツでメモを作成する', async () => {
      const longContent = 'あ'.repeat(100000)
      const longInput: MemoCreateInput = {
        content: longContent,
        folderId: null
      }
      const longMemo: Memo = {
        id: 'long-memo',
        content: longContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        folderId: null
      }

      mockElectronAPI.memos.create.mockResolvedValue(longMemo)

      const result = await memosApi.create(longInput)

      expect(result.content).toBe(longContent)
    })
  })

  describe('update', () => {
    const updateInput: MemoUpdateInput = {
      content: '更新されたメモの内容',
      folderId: 'updated-folder'
    }

    const updatedMemo: Memo = {
      id: '1',
      content: '更新されたメモの内容',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-06'),
      folderId: 'updated-folder'
    }

    it('既存のメモを正常に更新する', async () => {
      mockElectronAPI.memos.update.mockResolvedValue(updatedMemo)

      const result = await memosApi.update('1', updateInput)

      expect(mockElectronAPI.memos.update).toHaveBeenCalledWith('1', updateInput)
      expect(mockElectronAPI.memos.update).toHaveBeenCalledTimes(1)
      expect(result).toEqual(updatedMemo)
    })

    it('コンテンツのみを更新する', async () => {
      const contentOnlyInput: MemoUpdateInput = {
        content: 'コンテンツのみ更新'
      }
      const contentOnlyUpdated: Memo = {
        ...mockMemos[0],
        content: 'コンテンツのみ更新',
        updatedAt: new Date()
      }

      mockElectronAPI.memos.update.mockResolvedValue(contentOnlyUpdated)

      const result = await memosApi.update('1', contentOnlyInput)

      expect(mockElectronAPI.memos.update).toHaveBeenCalledWith('1', contentOnlyInput)
      expect(result.content).toBe('コンテンツのみ更新')
    })

    it('フォルダIDのみを更新する', async () => {
      const folderOnlyInput: MemoUpdateInput = {
        folderId: 'new-folder'
      }
      const folderOnlyUpdated: Memo = {
        ...mockMemos[0],
        folderId: 'new-folder',
        updatedAt: new Date()
      }

      mockElectronAPI.memos.update.mockResolvedValue(folderOnlyUpdated)

      const result = await memosApi.update('1', folderOnlyInput)

      expect(result.folderId).toBe('new-folder')
    })

    it('フォルダIDをnullに更新する（未分類に移動）', async () => {
      const nullFolderInput: MemoUpdateInput = {
        folderId: null
      }
      const nullFolderUpdated: Memo = {
        ...mockMemos[0],
        folderId: null,
        updatedAt: new Date()
      }

      mockElectronAPI.memos.update.mockResolvedValue(nullFolderUpdated)

      const result = await memosApi.update('1', nullFolderInput)

      expect(result.folderId).toBe(null)
    })

    it('空のコンテンツで更新する', async () => {
      const emptyInput: MemoUpdateInput = {
        content: ''
      }
      const emptyUpdated: Memo = {
        ...mockMemos[0],
        content: '',
        updatedAt: new Date()
      }

      mockElectronAPI.memos.update.mockResolvedValue(emptyUpdated)

      const result = await memosApi.update('1', emptyInput)

      expect(result.content).toBe('')
    })

    it('存在しないメモIDを更新しようとした場合、エラーが発生する', async () => {
      const error = new Error('メモが見つかりません')
      mockElectronAPI.memos.update.mockRejectedValue(error)

      await expect(memosApi.update('non-existent', updateInput)).rejects.toThrow('メモが見つかりません')
    })

    it('存在しないフォルダIDに更新しようとした場合のエラー処理', async () => {
      const invalidFolderInput: MemoUpdateInput = {
        folderId: 'non-existent-folder'
      }
      const error = new Error('指定されたフォルダが存在しません')
      mockElectronAPI.memos.update.mockRejectedValue(error)

      await expect(memosApi.update('1', invalidFolderInput)).rejects.toThrow('指定されたフォルダが存在しません')
    })

    it('複数のメモを連続で更新できる', async () => {
      const update1: MemoUpdateInput = { content: '更新1' }
      const update2: MemoUpdateInput = { content: '更新2' }
      const updated1: Memo = { ...mockMemos[0], content: '更新1', updatedAt: new Date() }
      const updated2: Memo = { ...mockMemos[1], content: '更新2', updatedAt: new Date() }

      mockElectronAPI.memos.update
        .mockResolvedValueOnce(updated1)
        .mockResolvedValueOnce(updated2)

      const result1 = await memosApi.update('1', update1)
      const result2 = await memosApi.update('2', update2)

      expect(mockElectronAPI.memos.update).toHaveBeenCalledTimes(2)
      expect(result1.content).toBe('更新1')
      expect(result2.content).toBe('更新2')
    })
  })

  describe('delete', () => {
    it('指定されたIDのメモを正常に削除する', async () => {
      mockElectronAPI.memos.delete.mockResolvedValue(undefined)

      await memosApi.delete('1')

      expect(mockElectronAPI.memos.delete).toHaveBeenCalledWith('1')
      expect(mockElectronAPI.memos.delete).toHaveBeenCalledTimes(1)
    })

    it('複数のメモを連続で削除できる', async () => {
      mockElectronAPI.memos.delete.mockResolvedValue(undefined)

      await memosApi.delete('1')
      await memosApi.delete('2')
      await memosApi.delete('3')

      expect(mockElectronAPI.memos.delete).toHaveBeenCalledTimes(3)
      expect(mockElectronAPI.memos.delete).toHaveBeenNthCalledWith(1, '1')
      expect(mockElectronAPI.memos.delete).toHaveBeenNthCalledWith(2, '2')
      expect(mockElectronAPI.memos.delete).toHaveBeenNthCalledWith(3, '3')
    })

    it('存在しないメモIDを削除しようとした場合、エラーが発生する', async () => {
      const error = new Error('メモが見つかりません')
      mockElectronAPI.memos.delete.mockRejectedValue(error)

      await expect(memosApi.delete('non-existent')).rejects.toThrow('メモが見つかりません')
    })

    it('削除権限がない場合のエラー処理', async () => {
      const permissionError = new Error('メモの削除権限がありません')
      mockElectronAPI.memos.delete.mockRejectedValue(permissionError)

      await expect(memosApi.delete('protected-memo')).rejects.toThrow('メモの削除権限がありません')
    })

    it('同じメモを複数回削除しようとした場合のエラー処理', async () => {
      mockElectronAPI.memos.delete
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('メモが見つかりません'))

      // 最初の削除は成功
      await memosApi.delete('1')
      
      // 2回目の削除は失敗
      await expect(memosApi.delete('1')).rejects.toThrow('メモが見つかりません')
    })

    it('削除が成功した場合、戻り値はundefinedである', async () => {
      mockElectronAPI.memos.delete.mockResolvedValue(undefined)

      const result = await memosApi.delete('1')

      expect(result).toBeUndefined()
    })
  })

  describe('統合テスト', () => {
    it('メモの作成、取得、更新、削除のワークフローが正しく動作する', async () => {
      const createInput: MemoCreateInput = {
        content: 'ワークフローテスト',
        folderId: 'test-folder'
      }
      const createdMemo: Memo = {
        id: 'workflow-memo',
        content: 'ワークフローテスト',
        createdAt: new Date(),
        updatedAt: new Date(),
        folderId: 'test-folder'
      }

      // メモ作成
      mockElectronAPI.memos.create.mockResolvedValue(createdMemo)
      const created = await memosApi.create(createInput)
      expect(created).toEqual(createdMemo)

      // メモ取得
      mockElectronAPI.memos.getAll.mockResolvedValue([...mockMemos, createdMemo])
      const allMemos = await memosApi.getAll()
      expect(allMemos).toContain(createdMemo)

      // メモ更新
      const updateInput: MemoUpdateInput = { content: '更新されたワークフローテスト' }
      const updatedMemo: Memo = { ...createdMemo, content: '更新されたワークフローテスト' }
      mockElectronAPI.memos.update.mockResolvedValue(updatedMemo)
      const updated = await memosApi.update(createdMemo.id, updateInput)
      expect(updated.content).toBe('更新されたワークフローテスト')

      // メモ削除
      mockElectronAPI.memos.delete.mockResolvedValue(undefined)
      await memosApi.delete(createdMemo.id)
      expect(mockElectronAPI.memos.delete).toHaveBeenCalledWith(createdMemo.id)
    })

    it('フォルダ間でのメモ移動が正しく動作する', async () => {
      // プログラミングフォルダのメモを取得
      const programmingMemos = mockMemos.filter(memo => memo.folderId === 'programming')
      mockElectronAPI.memos.getByFolder.mockResolvedValueOnce(programmingMemos)
      const beforeMove = await memosApi.getByFolder('programming')
      expect(beforeMove).toHaveLength(2)

      // メモを別のフォルダに移動
      const moveInput: MemoUpdateInput = { folderId: 'notes' }
      const movedMemo: Memo = { ...programmingMemos[0], folderId: 'notes' }
      mockElectronAPI.memos.update.mockResolvedValue(movedMemo)
      const moved = await memosApi.update(programmingMemos[0].id, moveInput)
      expect(moved.folderId).toBe('notes')

      // 移動後のフォルダ状態を確認
      mockElectronAPI.memos.getByFolder.mockResolvedValueOnce([programmingMemos[1]])
      const afterMove = await memosApi.getByFolder('programming')
      expect(afterMove).toHaveLength(1)
    })
  })

  describe('エッジケース', () => {
    it('ElectronAPIが存在しない場合はエラーが発生する', async () => {
      Object.defineProperty(window, 'electronAPI', {
        value: undefined,
        writable: true
      })

      await expect(memosApi.getAll()).rejects.toThrow()
      await expect(memosApi.getByFolder('test')).rejects.toThrow()
      await expect(memosApi.create({ content: 'test', folderId: null })).rejects.toThrow()
      await expect(memosApi.update('1', { content: 'test' })).rejects.toThrow()
      await expect(memosApi.delete('1')).rejects.toThrow()
    })

    it('ElectronAPIのmemosプロパティが存在しない場合', async () => {
      Object.defineProperty(window, 'electronAPI', {
        value: { folders: {} },
        writable: true
      })

      await expect(memosApi.getAll()).rejects.toThrow()
    })

    it('プロミスの同時実行が正しく動作する', async () => {
      mockElectronAPI.memos.getAll.mockResolvedValue(mockMemos)
      mockElectronAPI.memos.getByFolder.mockResolvedValue([mockMemos[0]])
      mockElectronAPI.memos.create.mockResolvedValue(mockMemos[0])

      const [getAllResult, getByFolderResult, createResult] = await Promise.all([
        memosApi.getAll(),
        memosApi.getByFolder('programming'),
        memosApi.create({ content: 'test', folderId: null })
      ])

      expect(getAllResult).toEqual(mockMemos)
      expect(getByFolderResult).toEqual([mockMemos[0]])
      expect(createResult).toEqual(mockMemos[0])
    })

    it('TypeScriptの型安全性を確認', () => {
      expect(typeof memosApi.getAll).toBe('function')
      expect(typeof memosApi.getByFolder).toBe('function')
      expect(typeof memosApi.create).toBe('function')
      expect(typeof memosApi.update).toBe('function')
      expect(typeof memosApi.delete).toBe('function')
    })

    it('特殊文字を含むメモコンテンツの処理', async () => {
      const specialContent = '🎉 特殊文字 & HTML <script>alert("test")</script> 📝'
      const specialInput: MemoCreateInput = {
        content: specialContent,
        folderId: null
      }
      const specialMemo: Memo = {
        id: 'special-memo',
        content: specialContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        folderId: null
      }

      mockElectronAPI.memos.create.mockResolvedValue(specialMemo)

      const result = await memosApi.create(specialInput)

      expect(result.content).toBe(specialContent)
    })

    it('日付オブジェクトが正しく処理される', async () => {
      const dateTestMemo: Memo = {
        id: 'date-test',
        content: 'テスト',
        createdAt: new Date('2023-01-01T10:30:00Z'),
        updatedAt: new Date('2023-01-02T15:45:30Z'),
        folderId: null
      }

      mockElectronAPI.memos.create.mockResolvedValue(dateTestMemo)

      const result = await memosApi.create({ content: 'テスト', folderId: null })

      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })
  })
})