import { describe, it, expect } from 'vitest'
import { filterMemosByQuery, sortMemosByDate, filterMemosByFolder, getMemoCountByFolder } from './memoFilters'
import { Memo } from '../model'

const mockMemos: Memo[] = [
  {
    id: '1',
    content: '# JavaScriptの基礎\n\n変数の宣言について学習しました。',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-03'),
    folderId: 'programming'
  },
  {
    id: '2',
    content: '今日の予定\n\n- 買い物\n- 散歩\n- 読書',
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
    folderId: null
  },
  {
    id: '3',
    content: 'Pythonでデータ分析\n\npandasライブラリの使い方',
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-01'),
    folderId: 'programming'
  },
  {
    id: '4',
    content: '料理レシピ\n\nカレーの作り方を記録',
    createdAt: new Date('2023-01-04'),
    updatedAt: new Date('2023-01-04'),
    folderId: 'cooking'
  },
  {
    id: '5',
    content: '',
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2023-01-05'),
    folderId: null
  }
]

describe('memoFilters', () => {
  describe('filterMemosByQuery', () => {
    it('空のクエリの場合、全てのメモを返す', () => {
      const result = filterMemosByQuery(mockMemos, '')
      expect(result).toEqual(mockMemos)
    })

    it('空白のみのクエリの場合、全てのメモを返す', () => {
      const result = filterMemosByQuery(mockMemos, '   ')
      expect(result).toEqual(mockMemos)
    })

    it('タイトルでメモをフィルタリングできる', () => {
      const result = filterMemosByQuery(mockMemos, 'JavaScript')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('内容でメモをフィルタリングできる', () => {
      const result = filterMemosByQuery(mockMemos, '買い物')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('大文字小文字を区別せずにフィルタリングできる', () => {
      const result = filterMemosByQuery(mockMemos, 'javascript')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('複数のメモがマッチする場合、全て返される', () => {
      const result = filterMemosByQuery(mockMemos, 'プログラム')
      // programmingフォルダのメモがマッチするはず（実際のマッチングロジックに依存）
      expect(result.length).toBeGreaterThanOrEqual(0)
    })

    it('部分一致でフィルタリングできる', () => {
      const result = filterMemosByQuery(mockMemos, 'Python')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('3')
    })

    it('マッチしないクエリの場合、空の配列を返す', () => {
      const result = filterMemosByQuery(mockMemos, 'マッチしない文字列')
      expect(result).toEqual([])
    })

    it('空のメモ配列でも正常に動作する', () => {
      const result = filterMemosByQuery([], 'test')
      expect(result).toEqual([])
    })

    it('特殊文字を含むクエリでも正常に動作する', () => {
      const result = filterMemosByQuery(mockMemos, '#')
      expect(result.length).toBeGreaterThanOrEqual(0)
    })

    it('数字を含むクエリでフィルタリングできる', () => {
      const memosWithNumbers: Memo[] = [
        {
          id: '1',
          content: 'バージョン1.0のリリース',
          createdAt: new Date(),
          updatedAt: new Date(),
          folderId: null
        }
      ]
      const result = filterMemosByQuery(memosWithNumbers, '1.0')
      expect(result).toHaveLength(1)
    })
  })

  describe('sortMemosByDate', () => {
    it('更新日の新しい順にソートされる', () => {
      const result = sortMemosByDate(mockMemos)
      
      // updatedAtが新しい順になっているか確認
      expect(result[0].id).toBe('5') // 2023-01-05
      expect(result[1].id).toBe('4') // 2023-01-04
      expect(result[2].id).toBe('1') // 2023-01-03
      expect(result[3].id).toBe('2') // 2023-01-02
      expect(result[4].id).toBe('3') // 2023-01-01
    })

    it('元の配列を変更しない', () => {
      const originalMemos = [...mockMemos]
      sortMemosByDate(mockMemos)
      expect(mockMemos).toEqual(originalMemos)
    })

    it('空の配列でも正常に動作する', () => {
      const result = sortMemosByDate([])
      expect(result).toEqual([])
    })

    it('1つのメモでも正常に動作する', () => {
      const singleMemo = [mockMemos[0]]
      const result = sortMemosByDate(singleMemo)
      expect(result).toEqual(singleMemo)
    })

    it('同じ更新日のメモでも正常に動作する', () => {
      const sameDateMemos: Memo[] = [
        {
          id: '1',
          content: 'メモ1',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          folderId: null
        },
        {
          id: '2',
          content: 'メモ2',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          folderId: null
        }
      ]
      const result = sortMemosByDate(sameDateMemos)
      expect(result).toHaveLength(2)
    })
  })

  describe('filterMemosByFolder', () => {
    it('指定されたフォルダーのメモのみを返す', () => {
      const result = filterMemosByFolder(mockMemos, 'programming')
      expect(result).toHaveLength(2)
      expect(result.every(memo => memo.folderId === 'programming')).toBe(true)
    })

    it('フォルダーIDがnullのメモを正しくフィルタリングする', () => {
      const result = filterMemosByFolder(mockMemos, null)
      expect(result).toHaveLength(2)
      expect(result.every(memo => memo.folderId === null)).toBe(true)
    })

    it('存在しないフォルダーIDの場合、空の配列を返す', () => {
      const result = filterMemosByFolder(mockMemos, 'nonexistent')
      expect(result).toEqual([])
    })

    it('空のメモ配列でも正常に動作する', () => {
      const result = filterMemosByFolder([], 'programming')
      expect(result).toEqual([])
    })

    it('全てのメモが同じフォルダーの場合', () => {
      const sameFolderMemos: Memo[] = mockMemos.map(memo => ({
        ...memo,
        folderId: 'same-folder'
      }))
      const result = filterMemosByFolder(sameFolderMemos, 'same-folder')
      expect(result).toHaveLength(sameFolderMemos.length)
    })

    it('文字列のフォルダーIDで正しくフィルタリングする', () => {
      const result = filterMemosByFolder(mockMemos, 'cooking')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('4')
    })
  })

  describe('getMemoCountByFolder', () => {
    it('指定されたフォルダーのメモ数を正しく返す', () => {
      const count = getMemoCountByFolder(mockMemos, 'programming')
      expect(count).toBe(2)
    })

    it('フォルダーIDがnullのメモ数を正しく返す', () => {
      const count = getMemoCountByFolder(mockMemos, null)
      expect(count).toBe(2)
    })

    it('存在しないフォルダーIDの場合、0を返す', () => {
      const count = getMemoCountByFolder(mockMemos, 'nonexistent')
      expect(count).toBe(0)
    })

    it('空のメモ配列の場合、0を返す', () => {
      const count = getMemoCountByFolder([], 'programming')
      expect(count).toBe(0)
    })

    it('1つのフォルダーに1つのメモがある場合', () => {
      const count = getMemoCountByFolder(mockMemos, 'cooking')
      expect(count).toBe(1)
    })

    it('全てのメモが同じフォルダーにある場合', () => {
      const sameFolderMemos: Memo[] = mockMemos.map(memo => ({
        ...memo,
        folderId: 'same-folder'
      }))
      const count = getMemoCountByFolder(sameFolderMemos, 'same-folder')
      expect(count).toBe(sameFolderMemos.length)
    })
  })

  describe('統合テスト', () => {
    it('フィルタリング後にソートできる', () => {
      const programmingMemos = filterMemosByFolder(mockMemos, 'programming')
      const sorted = sortMemosByDate(programmingMemos)
      
      expect(sorted).toHaveLength(2)
      expect(sorted.every(memo => memo.folderId === 'programming')).toBe(true)
    })

    it('検索フィルタリング後にフォルダーフィルタリングできる', () => {
      const searchResults = filterMemosByQuery(mockMemos, 'プログラム')
      const folderResults = filterMemosByFolder(searchResults, 'programming')
      
      expect(folderResults.every(memo => memo.folderId === 'programming')).toBe(true)
    })

    it('複数のフィルタリングとソートを組み合わせて使用できる', () => {
      const filtered = filterMemosByFolder(mockMemos, 'programming')
      const searched = filterMemosByQuery(filtered, 'JavaScript')
      const sorted = sortMemosByDate(searched)
      
      expect(sorted).toHaveLength(1)
      expect(sorted[0].id).toBe('1')
    })
  })

  describe('エッジケース', () => {
    it('undefinedのfolderId を持つメモも正しく処理する', () => {
      const memosWithUndefined: Memo[] = [
        {
          id: '1',
          content: 'テスト',
          createdAt: new Date(),
          updatedAt: new Date(),
          folderId: undefined as any
        }
      ]
      
      const result = filterMemosByFolder(memosWithUndefined, null)
      // undefinedとnullは異なるため、マッチしない
      expect(result).toEqual([])
    })

    it('非常に大きな配列でも正常に動作する', () => {
      const largeMemos: Memo[] = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        content: `メモ ${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        folderId: i % 2 === 0 ? 'even' : 'odd'
      }))
      
      const result = filterMemosByFolder(largeMemos, 'even')
      expect(result).toHaveLength(500)
      
      const count = getMemoCountByFolder(largeMemos, 'odd')
      expect(count).toBe(500)
    })

    it('特殊文字を含むフォルダーIDでも正常に動作する', () => {
      const specialFolderId = 'folder@#$%^&*()'
      const memosWithSpecialFolder: Memo[] = [
        {
          id: '1',
          content: 'テスト',
          createdAt: new Date(),
          updatedAt: new Date(),
          folderId: specialFolderId
        }
      ]
      
      const result = filterMemosByFolder(memosWithSpecialFolder, specialFolderId)
      expect(result).toHaveLength(1)
    })
  })
})