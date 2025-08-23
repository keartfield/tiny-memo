import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FolderOperations, folderOperations } from './folderOperations'
import { folderApi, isValidFolderName } from '../../../entities/folder'

// folderApiのモック
vi.mock('../../../entities/folder', () => ({
  folderApi: {
    create: vi.fn(),
    delete: vi.fn()
  },
  isValidFolderName: vi.fn()
}))

const mockFolderApi = vi.mocked(folderApi)
const mockIsValidFolderName = vi.mocked(isValidFolderName)

const mockFolder = {
  id: '1',
  name: 'テストフォルダー',
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('FolderOperations', () => {
  let operations: FolderOperations

  beforeEach(() => {
    vi.clearAllMocks()
    operations = new FolderOperations()
  })

  describe('validateFolderName', () => {
    it('有効なフォルダー名の場合はtrueを返す', () => {
      mockIsValidFolderName.mockReturnValue(true)
      
      const result = operations.validateFolderName('有効なフォルダー名')
      
      expect(result).toBe(true)
      expect(mockIsValidFolderName).toHaveBeenCalledWith('有効なフォルダー名')
    })

    it('無効なフォルダー名の場合はfalseを返す', () => {
      mockIsValidFolderName.mockReturnValue(false)
      
      const result = operations.validateFolderName('')
      
      expect(result).toBe(false)
      expect(mockIsValidFolderName).toHaveBeenCalledWith('')
    })
  })

  describe('createFolder', () => {
    it('有効なフォルダー名でフォルダーを作成する', async () => {
      mockIsValidFolderName.mockReturnValue(true)
      mockFolderApi.create.mockResolvedValue(mockFolder)
      
      await operations.createFolder('新しいフォルダー')
      
      expect(mockFolderApi.create).toHaveBeenCalledWith('新しいフォルダー')
    })

    it('無効なフォルダー名の場合はエラーを投げる', async () => {
      mockIsValidFolderName.mockReturnValue(false)
      
      await expect(operations.createFolder('')).rejects.toThrow('Invalid folder name')
      expect(mockFolderApi.create).not.toHaveBeenCalled()
    })

    it('APIエラーが発生した場合はエラーを再投げする', async () => {
      mockIsValidFolderName.mockReturnValue(true)
      const apiError = new Error('API error')
      mockFolderApi.create.mockRejectedValue(apiError)
      
      await expect(operations.createFolder('フォルダー名')).rejects.toThrow('API error')
    })
  })

  describe('deleteFolder', () => {
    it('指定されたIDのフォルダーを削除する', async () => {
      mockFolderApi.delete.mockResolvedValue(undefined)
      
      await operations.deleteFolder('folder-1')
      
      expect(mockFolderApi.delete).toHaveBeenCalledWith('folder-1')
    })

    it('APIエラーが発生した場合はエラーを再投げする', async () => {
      const apiError = new Error('Delete failed')
      mockFolderApi.delete.mockRejectedValue(apiError)
      
      await expect(operations.deleteFolder('folder-1')).rejects.toThrow('Delete failed')
    })
  })
})

describe('folderOperations singleton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('シングルトンインスタンスが正しく動作する', () => {
    expect(folderOperations).toBeInstanceOf(FolderOperations)
  })

  it('validateFolderNameメソッドが使用できる', () => {
    mockIsValidFolderName.mockReturnValue(true)
    
    const result = folderOperations.validateFolderName('テストフォルダー')
    
    expect(result).toBe(true)
    expect(mockIsValidFolderName).toHaveBeenCalledWith('テストフォルダー')
  })

  it('createFolderメソッドが使用できる', async () => {
    mockIsValidFolderName.mockReturnValue(true)
    mockFolderApi.create.mockResolvedValue(mockFolder)
    
    await folderOperations.createFolder('テストフォルダー')
    
    expect(mockFolderApi.create).toHaveBeenCalledWith('テストフォルダー')
  })

  it('deleteFolderメソッドが使用できる', async () => {
    mockFolderApi.delete.mockResolvedValue(undefined)
    
    await folderOperations.deleteFolder('test-id')
    
    expect(mockFolderApi.delete).toHaveBeenCalledWith('test-id')
  })
})

describe('FolderOperationsInterface', () => {
  it('FolderOperationsクラスがインターフェースを実装している', () => {
    const operations = new FolderOperations()
    
    // インターフェースのメソッドが存在することを確認
    expect(typeof operations.validateFolderName).toBe('function')
    expect(typeof operations.createFolder).toBe('function')
    expect(typeof operations.deleteFolder).toBe('function')
  })
})