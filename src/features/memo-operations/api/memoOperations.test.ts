import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoOperations, memoOperations } from './memoOperations'
import { memoApi } from '../../../entities/memo'

// memoApiのモック
vi.mock('../../../entities/memo', () => ({
  memoApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  isMemoEmpty: vi.fn()
}))

const mockMemoApi = memoApi as any

describe('MemoOperations', () => {
  let operations: MemoOperations

  beforeEach(() => {
    vi.clearAllMocks()
    operations = new MemoOperations()
  })

  describe('validateMemoContent', () => {
    it('有効なメモ内容の場合はtrueを返す', () => {
      const result = operations.validateMemoContent('有効なメモ内容')
      
      expect(result).toBe(true)
    })

    it('空の文字列の場合はfalseを返す', () => {
      const result = operations.validateMemoContent('')
      
      expect(result).toBe(false)
    })

    it('空白のみの文字列の場合はfalseを返す', () => {
      const result = operations.validateMemoContent('   ')
      
      expect(result).toBe(false)
    })

    it('改行のみの文字列の場合はfalseを返す', () => {
      const result = operations.validateMemoContent('\n\n\n')
      
      expect(result).toBe(false)
    })

    it('前後に空白があっても有効な内容があればtrueを返す', () => {
      const result = operations.validateMemoContent('  有効な内容  ')
      
      expect(result).toBe(true)
    })
  })

  describe('createMemo', () => {
    it('有効な内容でメモを作成する', async () => {
      mockMemoApi.create.mockResolvedValue({ id: '1', content: '新しいメモ' })
      
      await operations.createMemo('新しいメモ', 'folder-1')
      
      expect(mockMemoApi.create).toHaveBeenCalledWith({
        content: '新しいメモ',
        folderId: 'folder-1'
      })
    })

    it('フォルダIDがnullでもメモを作成する', async () => {
      mockMemoApi.create.mockResolvedValue({ id: '1', content: '新しいメモ' })
      
      await operations.createMemo('新しいメモ', null)
      
      expect(mockMemoApi.create).toHaveBeenCalledWith({
        content: '新しいメモ',
        folderId: null
      })
    })

    it('無効な内容の場合はエラーを投げる', async () => {
      await expect(operations.createMemo('', 'folder-1')).rejects.toThrow('Memo content cannot be empty')
      expect(mockMemoApi.create).not.toHaveBeenCalled()
    })

    it('空白のみの内容の場合はエラーを投げる', async () => {
      await expect(operations.createMemo('   ', 'folder-1')).rejects.toThrow('Memo content cannot be empty')
      expect(mockMemoApi.create).not.toHaveBeenCalled()
    })

    it('APIエラーが発生した場合はエラーを再投げする', async () => {
      const apiError = new Error('API error')
      mockMemoApi.create.mockRejectedValue(apiError)
      
      await expect(operations.createMemo('有効な内容', 'folder-1')).rejects.toThrow('API error')
    })
  })

  describe('updateMemo', () => {
    it('メモの内容を更新する', async () => {
      const updatedMemo = { id: '1', content: '更新された内容' }
      mockMemoApi.update.mockResolvedValue(updatedMemo)
      
      await operations.updateMemo('1', '更新された内容')
      
      expect(mockMemoApi.update).toHaveBeenCalledWith('1', { content: '更新された内容' })
    })

    it('空の内容でも更新する（バリデーションなし）', async () => {
      const updatedMemo = { id: '1', content: '' }
      mockMemoApi.update.mockResolvedValue(updatedMemo)
      
      await operations.updateMemo('1', '')
      
      expect(mockMemoApi.update).toHaveBeenCalledWith('1', { content: '' })
    })

    it('APIエラーが発生した場合はエラーを再投げする', async () => {
      const apiError = new Error('Update failed')
      mockMemoApi.update.mockRejectedValue(apiError)
      
      await expect(operations.updateMemo('1', '内容')).rejects.toThrow('Update failed')
    })
  })

  describe('updateMemoFolder', () => {
    it('メモのフォルダーを更新する', async () => {
      const updatedMemo = { id: '1', folderId: 'folder-2' }
      mockMemoApi.update.mockResolvedValue(updatedMemo)
      
      await operations.updateMemoFolder('1', 'folder-2')
      
      expect(mockMemoApi.update).toHaveBeenCalledWith('1', { folderId: 'folder-2' })
    })

    it('フォルダーをnullに設定する（フォルダーから外す）', async () => {
      const updatedMemo = { id: '1', folderId: null }
      mockMemoApi.update.mockResolvedValue(updatedMemo)
      
      await operations.updateMemoFolder('1', null)
      
      expect(mockMemoApi.update).toHaveBeenCalledWith('1', { folderId: null })
    })

    it('APIエラーが発生した場合はエラーを再投げする', async () => {
      const apiError = new Error('Folder update failed')
      mockMemoApi.update.mockRejectedValue(apiError)
      
      await expect(operations.updateMemoFolder('1', 'folder-1')).rejects.toThrow('Folder update failed')
    })
  })

  describe('deleteMemo', () => {
    it('指定されたIDのメモを削除する', async () => {
      mockMemoApi.delete.mockResolvedValue(undefined)
      
      await operations.deleteMemo('memo-1')
      
      expect(mockMemoApi.delete).toHaveBeenCalledWith('memo-1')
    })

    it('APIエラーが発生した場合はエラーを再投げする', async () => {
      const apiError = new Error('Delete failed')
      mockMemoApi.delete.mockRejectedValue(apiError)
      
      await expect(operations.deleteMemo('memo-1')).rejects.toThrow('Delete failed')
    })
  })
})

describe('memoOperations singleton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('シングルトンインスタンスが正しく動作する', () => {
    expect(memoOperations).toBeInstanceOf(MemoOperations)
  })

  it('validateMemoContentメソッドが使用できる', () => {
    const result = memoOperations.validateMemoContent('テストメモ')
    
    expect(result).toBe(true)
  })

  it('createMemoメソッドが使用できる', async () => {
    mockMemoApi.create.mockResolvedValue({ id: '1', content: 'テストメモ' })
    
    await memoOperations.createMemo('テストメモ', 'folder-1')
    
    expect(mockMemoApi.create).toHaveBeenCalledWith({
      content: 'テストメモ',
      folderId: 'folder-1'
    })
  })

  it('updateMemoメソッドが使用できる', async () => {
    mockMemoApi.update.mockResolvedValue({ id: '1', content: '更新されたメモ' })
    
    await memoOperations.updateMemo('1', '更新されたメモ')
    
    expect(mockMemoApi.update).toHaveBeenCalledWith('1', { content: '更新されたメモ' })
  })

  it('updateMemoFolderメソッドが使用できる', async () => {
    mockMemoApi.update.mockResolvedValue({ id: '1', folderId: 'folder-2' })
    
    await memoOperations.updateMemoFolder('1', 'folder-2')
    
    expect(mockMemoApi.update).toHaveBeenCalledWith('1', { folderId: 'folder-2' })
  })

  it('deleteMemoメソッドが使用できる', async () => {
    mockMemoApi.delete.mockResolvedValue(undefined)
    
    await memoOperations.deleteMemo('test-id')
    
    expect(mockMemoApi.delete).toHaveBeenCalledWith('test-id')
  })
})

describe('MemoOperationsInterface', () => {
  it('MemoOperationsクラスがインターフェースを実装している', () => {
    const operations = new MemoOperations()
    
    // インターフェースのメソッドが存在することを確認
    expect(typeof operations.validateMemoContent).toBe('function')
    expect(typeof operations.createMemo).toBe('function')
    expect(typeof operations.updateMemo).toBe('function')
    expect(typeof operations.updateMemoFolder).toBe('function')
    expect(typeof operations.deleteMemo).toBe('function')
  })
})

describe('エッジケース', () => {
  let operations: MemoOperations

  beforeEach(() => {
    vi.clearAllMocks()
    operations = new MemoOperations()
  })

  it('特殊文字を含む内容でも正しく処理する', async () => {
    const specialContent = '特殊文字: !@#$%^&*()[]{}|\\:";\'<>?,./'
    mockMemoApi.create.mockResolvedValue({ id: '1', content: specialContent })
    
    await operations.createMemo(specialContent, 'folder-1')
    
    expect(mockMemoApi.create).toHaveBeenCalledWith({
      content: specialContent,
      folderId: 'folder-1'
    })
  })

  it('非常に長いメモ内容でも処理する', async () => {
    const longContent = 'a'.repeat(10000)
    mockMemoApi.create.mockResolvedValue({ id: '1', content: longContent })
    
    await operations.createMemo(longContent, 'folder-1')
    
    expect(mockMemoApi.create).toHaveBeenCalledWith({
      content: longContent,
      folderId: 'folder-1'
    })
  })

  it('Unicode文字を含む内容でも正しく処理する', async () => {
    const unicodeContent = '🌟 Unicode テスト 🎉 emoji test 中文 العربية'
    mockMemoApi.create.mockResolvedValue({ id: '1', content: unicodeContent })
    
    await operations.createMemo(unicodeContent, 'folder-1')
    
    expect(mockMemoApi.create).toHaveBeenCalledWith({
      content: unicodeContent,
      folderId: 'folder-1'
    })
  })
})