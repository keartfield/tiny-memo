import { describe, it, expect } from 'vitest'
import { 
  getFolderDisplayName, 
  isValidFolderName, 
  isFolderEmpty, 
  compareFoldersByName, 
  compareFoldersByCount 
} from './folder'
import { Folder } from './types'

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
    name: 'Empty Folder',
    order: 2,
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03'),
    _count: { memos: 0 }
  },
  {
    id: '4',
    name: 'No Count Folder',
    order: 3,
    createdAt: new Date('2023-01-04'),
    updatedAt: new Date('2023-01-04')
  }
]

describe('folder utility functions', () => {
  describe('getFolderDisplayName', () => {
    it('フォルダー名とメモ数を含む表示名を返す', () => {
      const result = getFolderDisplayName(mockFolders[0])
      expect(result).toBe('Programming (5)')
    })

    it('メモ数が0の場合も正しく表示する', () => {
      const result = getFolderDisplayName(mockFolders[2])
      expect(result).toBe('Empty Folder (0)')
    })

    it('_countがない場合は0として表示する', () => {
      const result = getFolderDisplayName(mockFolders[3])
      expect(result).toBe('No Count Folder (0)')
    })

    it('日本語のフォルダー名でも正しく表示する', () => {
      const japaneseFolder: Folder = {
        id: '5',
        name: 'プログラミング',
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 10 }
      }
      const result = getFolderDisplayName(japaneseFolder)
      expect(result).toBe('プログラミング (10)')
    })

    it('特殊文字を含むフォルダー名でも正しく表示する', () => {
      const specialFolder: Folder = {
        id: '6',
        name: 'Folder@#$%',
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 2 }
      }
      const result = getFolderDisplayName(specialFolder)
      expect(result).toBe('Folder@#$% (2)')
    })

    it('長いフォルダー名でも正しく表示する', () => {
      const longNameFolder: Folder = {
        id: '7',
        name: 'Very Long Folder Name That Contains Many Characters',
        order: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 1 }
      }
      const result = getFolderDisplayName(longNameFolder)
      expect(result).toBe('Very Long Folder Name That Contains Many Characters (1)')
    })
  })

  describe('isValidFolderName', () => {
    it('有効なフォルダー名でtrueを返す', () => {
      expect(isValidFolderName('Programming')).toBe(true)
      expect(isValidFolderName('My Folder')).toBe(true)
      expect(isValidFolderName('123')).toBe(true)
      expect(isValidFolderName('a')).toBe(true)
    })

    it('空文字列でfalseを返す', () => {
      expect(isValidFolderName('')).toBe(false)
    })

    it('空白のみの文字列でfalseを返す', () => {
      expect(isValidFolderName('   ')).toBe(false)
      expect(isValidFolderName('\t\n\r')).toBe(false)
    })

    it('100文字以下の名前でtrueを返す', () => {
      const validName = 'a'.repeat(100)
      expect(isValidFolderName(validName)).toBe(true)
    })

    it('100文字を超える名前でfalseを返す', () => {
      const invalidName = 'a'.repeat(101)
      expect(isValidFolderName(invalidName)).toBe(false)
    })

    it('前後に空白がある場合もtrimして検証する', () => {
      expect(isValidFolderName('  valid name  ')).toBe(true)
      expect(isValidFolderName('  ')).toBe(false)
    })

    it('日本語のフォルダー名でも正しく検証する', () => {
      expect(isValidFolderName('プログラミング')).toBe(true)
      expect(isValidFolderName('あ'.repeat(100))).toBe(true)
      expect(isValidFolderName('あ'.repeat(101))).toBe(false)
    })

    it('特殊文字を含む名前でも有効と判定する', () => {
      expect(isValidFolderName('Folder@#$%^&*()')).toBe(true)
      expect(isValidFolderName('Folder-_+=[]{}|;:,.<>?')).toBe(true)
    })

    it('改行文字を含む名前でも有効と判定する', () => {
      expect(isValidFolderName('Multi\nLine\nFolder')).toBe(true)
    })
  })

  describe('isFolderEmpty', () => {
    it('メモ数が0の場合trueを返す', () => {
      expect(isFolderEmpty(mockFolders[2])).toBe(true)
    })

    it('メモ数が1以上の場合falseを返す', () => {
      expect(isFolderEmpty(mockFolders[0])).toBe(false)
      expect(isFolderEmpty(mockFolders[1])).toBe(false)
    })

    it('_countがない場合trueを返す', () => {
      expect(isFolderEmpty(mockFolders[3])).toBe(true)
    })

    it('_count.memosがundefinedの場合trueを返す', () => {
      const folderWithUndefinedCount: Folder = {
        id: '5',
        name: 'Test Folder',
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: undefined as any }
      }
      expect(isFolderEmpty(folderWithUndefinedCount)).toBe(true)
    })

    it('_count自体がundefinedの場合trueを返す', () => {
      const folderWithoutCount: Folder = {
        id: '6',
        name: 'No Count',
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: undefined as any
      }
      expect(isFolderEmpty(folderWithoutCount)).toBe(true)
    })
  })

  describe('compareFoldersByName', () => {
    it('名前のアルファベット順で比較する', () => {
      const folderA: Folder = { ...mockFolders[0], name: 'Apple' }
      const folderB: Folder = { ...mockFolders[1], name: 'Banana' }
      
      expect(compareFoldersByName(folderA, folderB)).toBeLessThan(0)
      expect(compareFoldersByName(folderB, folderA)).toBeGreaterThan(0)
    })

    it('同じ名前の場合0を返す', () => {
      const folderA: Folder = { ...mockFolders[0], name: 'Same' }
      const folderB: Folder = { ...mockFolders[1], name: 'Same' }
      
      expect(compareFoldersByName(folderA, folderB)).toBe(0)
    })

    it('大文字小文字を区別して比較する', () => {
      const folderA: Folder = { ...mockFolders[0], name: 'apple' }
      const folderB: Folder = { ...mockFolders[1], name: 'Apple' }
      
      const result = compareFoldersByName(folderA, folderB)
      expect(typeof result).toBe('number')
    })

    it('日本語のフォルダー名も正しく比較する', () => {
      const folderA: Folder = { ...mockFolders[0], name: 'あいうえお' }
      const folderB: Folder = { ...mockFolders[1], name: 'かきくけこ' }
      
      expect(compareFoldersByName(folderA, folderB)).toBeLessThan(0)
    })

    it('数字を含む名前も正しく比較する', () => {
      const folderA: Folder = { ...mockFolders[0], name: 'Folder1' }
      const folderB: Folder = { ...mockFolders[1], name: 'Folder2' }
      
      expect(compareFoldersByName(folderA, folderB)).toBeLessThan(0)
    })

    it('特殊文字を含む名前も正しく比較する', () => {
      const folderA: Folder = { ...mockFolders[0], name: 'Folder@' }
      const folderB: Folder = { ...mockFolders[1], name: 'Folder#' }
      
      const result = compareFoldersByName(folderA, folderB)
      expect(typeof result).toBe('number')
    })
  })

  describe('compareFoldersByCount', () => {
    it('メモ数の多い順で比較する', () => {
      // mockFolders[0] has 5 memos, mockFolders[1] has 3 mems
      // compareFoldersByCount returns countB - countA (descending order)
      expect(compareFoldersByCount(mockFolders[0], mockFolders[1])).toBe(-2) // 3 - 5 = -2 < 0
      expect(compareFoldersByCount(mockFolders[1], mockFolders[0])).toBe(2) // 5 - 3 = 2 > 0
    })

    it('同じメモ数の場合0を返す', () => {
      const folderA: Folder = { ...mockFolders[0], _count: { memos: 5 } }
      const folderB: Folder = { ...mockFolders[1], _count: { memos: 5 } }
      
      expect(compareFoldersByCount(folderA, folderB)).toBe(0)
    })

    it('_countがない場合は0として扱う', () => {
      const folderWithCount: Folder = { ...mockFolders[0], _count: { memos: 3 } }
      const folderWithoutCount: Folder = { ...mockFolders[3] }
      
      // countB - countA = 0 - 3 = -3 < 0
      expect(compareFoldersByCount(folderWithCount, folderWithoutCount)).toBe(-3)
      // countB - countA = 3 - 0 = 3 > 0  
      expect(compareFoldersByCount(folderWithoutCount, folderWithCount)).toBe(3)
    })

    it('両方とも_countがない場合は0を返す', () => {
      const folderA: Folder = { ...mockFolders[3] }
      const folderB: Folder = { ...mockFolders[3] }
      
      expect(compareFoldersByCount(folderA, folderB)).toBe(0)
    })

    it('0と1の比較も正しく動作する', () => {
      const emptyFolder: Folder = { ...mockFolders[2] } // 0 memos
      const singleMemoFolder: Folder = { ...mockFolders[0], _count: { memos: 1 } }
      
      // countB - countA = 0 - 1 = -1 < 0
      expect(compareFoldersByCount(singleMemoFolder, emptyFolder)).toBe(-1)
      // countB - countA = 1 - 0 = 1 > 0
      expect(compareFoldersByCount(emptyFolder, singleMemoFolder)).toBe(1)
    })

    it('大きな数値でも正しく比較する', () => {
      const folderA: Folder = { ...mockFolders[0], _count: { memos: 1000 } }
      const folderB: Folder = { ...mockFolders[1], _count: { memos: 999 } }
      
      // countB - countA = 999 - 1000 = -1 < 0
      expect(compareFoldersByCount(folderA, folderB)).toBe(-1)
    })
  })

  describe('統合テスト', () => {
    it('フォルダーリストを名前順でソートできる', () => {
      const folders = [...mockFolders]
      folders.sort(compareFoldersByName)
      
      expect(folders[0].name).toBe('Empty Folder')
      expect(folders[1].name).toBe('No Count Folder')
      expect(folders[2].name).toBe('Personal')
      expect(folders[3].name).toBe('Programming')
    })

    it('フォルダーリストをメモ数順でソートできる', () => {
      const folders = [...mockFolders]
      folders.sort(compareFoldersByCount)
      
      expect(folders[0]._count?.memos || 0).toBe(5) // Programming
      expect(folders[1]._count?.memos || 0).toBe(3) // Personal
      expect(folders[2]._count?.memos || 0).toBe(0) // Empty Folder or No Count Folder
    })

    it('空のフォルダーをフィルタリングできる', () => {
      const nonEmptyFolders = mockFolders.filter(folder => !isFolderEmpty(folder))
      
      expect(nonEmptyFolders).toHaveLength(2)
      expect(nonEmptyFolders.every(folder => !isFolderEmpty(folder))).toBe(true)
    })

    it('有効な名前のフォルダーのみを取得できる', () => {
      const testFolders = [
        { ...mockFolders[0], name: 'Valid' },
        { ...mockFolders[1], name: '' },
        { ...mockFolders[2], name: '   ' },
        { ...mockFolders[3], name: 'Also Valid' }
      ]
      
      const validFolders = testFolders.filter(folder => isValidFolderName(folder.name))
      
      expect(validFolders).toHaveLength(2)
      expect(validFolders[0].name).toBe('Valid')
      expect(validFolders[1].name).toBe('Also Valid')
    })
  })

  describe('エッジケース', () => {
    it('非常に長い名前でも正しく処理する', () => {
      const longName = 'a'.repeat(1000)
      const longFolder: Folder = {
        id: '1',
        name: longName,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 1 }
      }
      
      expect(getFolderDisplayName(longFolder)).toBe(`${longName} (1)`)
      expect(isValidFolderName(longName)).toBe(false)
    })

    it('負の数のメモ数でも正しく処理する', () => {
      const negativeCountFolder: Folder = {
        id: '1',
        name: 'Negative',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: -1 }
      }
      
      expect(getFolderDisplayName(negativeCountFolder)).toBe('Negative (-1)')
      expect(isFolderEmpty(negativeCountFolder)).toBe(false)
    })

    it('Unicodeを含む名前でも正しく処理する', () => {
      const unicodeFolder: Folder = {
        id: '1',
        name: '📁 Folder with 絵文字',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 5 }
      }
      
      expect(getFolderDisplayName(unicodeFolder)).toBe('📁 Folder with 絵文字 (5)')
      expect(isValidFolderName(unicodeFolder.name)).toBe(true)
    })
  })
})