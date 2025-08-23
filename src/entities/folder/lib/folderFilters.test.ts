import { describe, it, expect } from 'vitest'
import { sortFoldersByName, sortFoldersByCount, filterFoldersByName, findFolderById } from './folderFilters'
import { Folder } from '../model'

const mockFolders: Folder[] = [
  {
    id: '1',
    name: 'Programming',
    order: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    _count: { memos: 5 }
  },
  {
    id: '2',
    name: 'Personal',
    order: 1,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
    _count: { memos: 3 }
  },
  {
    id: '3',
    name: 'Work',
    order: 2,
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03'),
    _count: { memos: 8 }
  },
  {
    id: '4',
    name: 'Archive',
    order: 3,
    createdAt: new Date('2023-01-04'),
    updatedAt: new Date('2023-01-04'),
    _count: { memos: 1 }
  },
  {
    id: '5',
    name: 'プロジェクト',
    order: 4,
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2023-01-05'),
    _count: { memos: 0 }
  }
]

describe('folderFilters', () => {
  describe('sortFoldersByName', () => {
    it('フォルダーをアルファベット順にソートする', () => {
      const result = sortFoldersByName(mockFolders)
      
      expect(result[0].name).toBe('Archive')
      expect(result[1].name).toBe('Personal')
      expect(result[2].name).toBe('Programming')
      expect(result[3].name).toBe('Work')
      expect(result[4].name).toBe('プロジェクト')
    })

    it('元の配列を変更しない', () => {
      const originalFolders = [...mockFolders]
      sortFoldersByName(mockFolders)
      
      expect(mockFolders).toEqual(originalFolders)
    })

    it('空の配列でも正常に動作する', () => {
      const result = sortFoldersByName([])
      
      expect(result).toEqual([])
    })

    it('1つのフォルダーでも正常に動作する', () => {
      const singleFolder = [mockFolders[0]]
      const result = sortFoldersByName(singleFolder)
      
      expect(result).toEqual(singleFolder)
    })

    it('同じ名前の複数フォルダーでも正常に動作する', () => {
      const sameName: Folder[] = [
        { ...mockFolders[0], id: '1', name: 'Same' },
        { ...mockFolders[1], id: '2', name: 'Same' }
      ]
      
      const result = sortFoldersByName(sameName)
      
      expect(result).toHaveLength(2)
      expect(result.every(folder => folder.name === 'Same')).toBe(true)
    })

    it('日本語の名前も正しくソートする', () => {
      const japaneseFolders: Folder[] = [
        { ...mockFolders[0], name: 'かきくけこ' },
        { ...mockFolders[1], name: 'あいうえお' },
        { ...mockFolders[2], name: 'さしすせそ' }
      ]
      
      const result = sortFoldersByName(japaneseFolders)
      
      expect(result[0].name).toBe('あいうえお')
      expect(result[1].name).toBe('かきくけこ')
      expect(result[2].name).toBe('さしすせそ')
    })
  })

  describe('sortFoldersByCount', () => {
    it('フォルダーをメモ数の多い順にソートする', () => {
      const result = sortFoldersByCount(mockFolders)
      
      // メモ数の降順：Work(8) > Programming(5) > Personal(3) > Archive(1) > プロジェクト(0)
      expect(result[0].name).toBe('Work')
      expect(result[1].name).toBe('Programming')
      expect(result[2].name).toBe('Personal')
      expect(result[3].name).toBe('Archive')
      expect(result[4].name).toBe('プロジェクト')
    })

    it('元の配列を変更しない', () => {
      const originalFolders = [...mockFolders]
      sortFoldersByCount(mockFolders)
      
      expect(mockFolders).toEqual(originalFolders)
    })

    it('空の配列でも正常に動作する', () => {
      const result = sortFoldersByCount([])
      
      expect(result).toEqual([])
    })

    it('1つのフォルダーでも正常に動作する', () => {
      const singleFolder = [mockFolders[0]]
      const result = sortFoldersByCount(singleFolder)
      
      expect(result).toEqual(singleFolder)
    })

    it('_countがないフォルダーも正しく処理する', () => {
      const foldersWithoutCount: Folder[] = [
        { ...mockFolders[0], _count: { memos: 5 } },
        { ...mockFolders[1], _count: undefined } // _countなし
      ]
      
      const result = sortFoldersByCount(foldersWithoutCount)
      
      expect(result[0]._count?.memos).toBe(5)
      expect(result[1]._count).toBeUndefined()
    })

    it('同じメモ数のフォルダーでも正常に動作する', () => {
      const sameCount: Folder[] = [
        { ...mockFolders[0], _count: { memos: 5 } },
        { ...mockFolders[1], _count: { memos: 5 } }
      ]
      
      const result = sortFoldersByCount(sameCount)
      
      expect(result).toHaveLength(2)
      expect(result.every(folder => folder._count?.memos === 5)).toBe(true)
    })
  })

  describe('filterFoldersByName', () => {
    it('名前でフォルダーをフィルタリングする', () => {
      const result = filterFoldersByName(mockFolders, 'Pro')
      
      expect(result).toHaveLength(1)
      expect(result.some(folder => folder.name === 'Programming')).toBe(true)
    })

    it('大文字小文字を区別せずにフィルタリングする', () => {
      const result = filterFoldersByName(mockFolders, 'personal')
      
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Personal')
    })

    it('空のクエリの場合、全てのフォルダーを返す', () => {
      const result = filterFoldersByName(mockFolders, '')
      
      expect(result).toEqual(mockFolders)
    })

    it('空白のみのクエリの場合、全てのフォルダーを返す', () => {
      const result = filterFoldersByName(mockFolders, '   ')
      
      expect(result).toEqual(mockFolders)
    })

    it('マッチしないクエリの場合、空の配列を返す', () => {
      const result = filterFoldersByName(mockFolders, 'NonExistent')
      
      expect(result).toEqual([])
    })

    it('部分一致でフィルタリングする', () => {
      const result = filterFoldersByName(mockFolders, 'ram')
      
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Programming')
    })

    it('日本語でのフィルタリングも正しく動作する', () => {
      const result = filterFoldersByName(mockFolders, 'プロ')
      
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('プロジェクト')
    })

    it('空の配列でも正常に動作する', () => {
      const result = filterFoldersByName([], 'test')
      
      expect(result).toEqual([])
    })

    it('特殊文字を含むクエリでも正常に動作する', () => {
      const specialFolders: Folder[] = [
        { ...mockFolders[0], name: 'Folder@Special' },
        { ...mockFolders[1], name: 'Normal' }
      ]
      
      const result = filterFoldersByName(specialFolders, '@')
      
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Folder@Special')
    })

    it('数字を含むクエリでも正常に動作する', () => {
      const numberedFolders: Folder[] = [
        { ...mockFolders[0], name: 'Project2023' },
        { ...mockFolders[1], name: 'Archive2022' }
      ]
      
      const result = filterFoldersByName(numberedFolders, '2023')
      
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Project2023')
    })
  })

  describe('findFolderById', () => {
    it('IDでフォルダーを見つける', () => {
      const result = findFolderById(mockFolders, '2')
      
      expect(result).toBeDefined()
      expect(result?.id).toBe('2')
      expect(result?.name).toBe('Personal')
    })

    it('存在しないIDの場合、undefinedを返す', () => {
      const result = findFolderById(mockFolders, 'nonexistent')
      
      expect(result).toBeUndefined()
    })

    it('空の配列でも正常に動作する', () => {
      const result = findFolderById([], '1')
      
      expect(result).toBeUndefined()
    })

    it('最初にマッチしたフォルダーを返す', () => {
      const duplicateIds: Folder[] = [
        { ...mockFolders[0], id: 'same' },
        { ...mockFolders[1], id: 'same' }
      ]
      
      const result = findFolderById(duplicateIds, 'same')
      
      expect(result).toBeDefined()
      expect(result?.name).toBe('Programming') // 最初のフォルダー
    })

    it('文字列のIDも正しく処理する', () => {
      const stringIdFolders: Folder[] = [
        { ...mockFolders[0], id: 'folder-one' },
        { ...mockFolders[1], id: 'folder-two' }
      ]
      
      const result = findFolderById(stringIdFolders, 'folder-two')
      
      expect(result).toBeDefined()
      expect(result?.id).toBe('folder-two')
    })

    it('UUIDのようなIDも正しく処理する', () => {
      const uuidFolders: Folder[] = [
        { ...mockFolders[0], id: '550e8400-e29b-41d4-a716-446655440000' },
        { ...mockFolders[1], id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }
      ]
      
      const result = findFolderById(uuidFolders, '6ba7b810-9dad-11d1-80b4-00c04fd430c8')
      
      expect(result).toBeDefined()
      expect(result?.id).toBe('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
    })

    it('空文字列のIDでも正常に動作する', () => {
      const result = findFolderById(mockFolders, '')
      
      expect(result).toBeUndefined()
    })
  })

  describe('統合テスト', () => {
    it('フィルタリング後にソートできる', () => {
      const filtered = filterFoldersByName(mockFolders, 'r')
      const sorted = sortFoldersByName(filtered)
      
      expect(sorted).toHaveLength(4) // Archive, Personal, Programming, Work
      expect(sorted[0].name).toBe('Archive')
      expect(sorted[1].name).toBe('Personal')
      expect(sorted[2].name).toBe('Programming')
      expect(sorted[3].name).toBe('Work')
    })

    it('ソート後にフィルタリングできる', () => {
      const sorted = sortFoldersByCount(mockFolders)
      const filtered = filterFoldersByName(sorted, 'P')
      
      expect(filtered).toHaveLength(2) // Programming, プロジェクト
      expect(filtered.some(folder => folder.name === 'Programming')).toBe(true)
    })

    it('フィルタリング結果からIDで検索できる', () => {
      const filtered = filterFoldersByName(mockFolders, 'P')
      const found = findFolderById(filtered, '1')
      
      expect(found).toBeDefined()
      expect(found?.name).toBe('Programming')
    })
  })

  describe('エッジケース', () => {
    it('非常に長い名前のフォルダーも正しく処理する', () => {
      const longName = 'a'.repeat(1000)
      const longNameFolders: Folder[] = [
        { ...mockFolders[0], name: longName },
        { ...mockFolders[1], name: 'Short' }
      ]
      
      const result = filterFoldersByName(longNameFolders, 'aaa')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe(longName)
    })

    it('Unicodeを含む名前も正しく処理する', () => {
      const unicodeFolders: Folder[] = [
        { ...mockFolders[0], name: '📁 Folder with 絵文字' },
        { ...mockFolders[1], name: 'Normal Folder' }
      ]
      
      const result = filterFoldersByName(unicodeFolders, '📁')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('📁 Folder with 絵文字')
    })

    it('改行文字を含む名前も正しく処理する', () => {
      const multilineFolders: Folder[] = [
        { ...mockFolders[0], name: 'Multi\nLine\nFolder' },
        { ...mockFolders[1], name: 'SingleLine' }
      ]
      
      const result = filterFoldersByName(multilineFolders, 'Multi')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Multi\nLine\nFolder')
    })

    it('大きな配列でも効率的に動作する', () => {
      const largeFolders: Folder[] = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        name: `Folder ${i}`,
        order: i,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: i % 10 }
      }))
      
      const filtered = filterFoldersByName(largeFolders, '50')
      expect(filtered.length).toBeGreaterThan(0)
      
      const sorted = sortFoldersByCount(largeFolders)
      expect(sorted).toHaveLength(1000)
      
      const found = findFolderById(largeFolders, '500')
      expect(found).toBeDefined()
      expect(found?.name).toBe('Folder 500')
    })
  })
})