import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SearchOperations, searchOperations } from './searchOperations'
import { Memo, filterMemosByQuery } from '../../../entities/memo'

// filterMemosByQueryのモック
vi.mock('../../../entities/memo', () => ({
  filterMemosByQuery: vi.fn()
}))

const mockFilterMemosByQuery = vi.mocked(filterMemosByQuery)

const mockMemos: Memo[] = [
  {
    id: '1',
    content: 'JavaScriptの基本について',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    folderId: 'folder-1'
  },
  {
    id: '2',
    content: 'TypeScriptの型システム',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    folderId: 'folder-1'
  },
  {
    id: '3',
    content: 'Reactのフック',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    folderId: null
  }
]

describe('SearchOperations', () => {
  let operations: SearchOperations

  beforeEach(() => {
    vi.clearAllMocks()
    operations = new SearchOperations()
  })

  describe('searchMemos', () => {
    it('検索クエリとメモリストを使ってフィルタリングする', () => {
      const expectedResults = [mockMemos[0], mockMemos[1]]
      mockFilterMemosByQuery.mockReturnValue(expectedResults)

      const result = operations.searchMemos('JavaScript', mockMemos)

      expect(result).toEqual(expectedResults)
      expect(mockFilterMemosByQuery).toHaveBeenCalledWith(mockMemos, 'JavaScript')
    })

    it('空のクエリでも正しく処理する', () => {
      const expectedResults = []
      mockFilterMemosByQuery.mockReturnValue(expectedResults)

      const result = operations.searchMemos('', mockMemos)

      expect(result).toEqual(expectedResults)
      expect(mockFilterMemosByQuery).toHaveBeenCalledWith(mockMemos, '')
    })

    it('空のメモリストでも正しく処理する', () => {
      const expectedResults = []
      mockFilterMemosByQuery.mockReturnValue(expectedResults)

      const result = operations.searchMemos('test', [])

      expect(result).toEqual(expectedResults)
      expect(mockFilterMemosByQuery).toHaveBeenCalledWith([], 'test')
    })

    it('検索結果が見つからない場合は空配列を返す', () => {
      mockFilterMemosByQuery.mockReturnValue([])

      const result = operations.searchMemos('存在しない文字列', mockMemos)

      expect(result).toEqual([])
      expect(mockFilterMemosByQuery).toHaveBeenCalledWith(mockMemos, '存在しない文字列')
    })

    it('大文字小文字を区別しない検索をサポートする', () => {
      const expectedResults = [mockMemos[0]]
      mockFilterMemosByQuery.mockReturnValue(expectedResults)

      const result = operations.searchMemos('javascript', mockMemos)

      expect(result).toEqual(expectedResults)
      expect(mockFilterMemosByQuery).toHaveBeenCalledWith(mockMemos, 'javascript')
    })
  })

  describe('validateSearchQuery', () => {
    it('有効な検索クエリの場合はtrueを返す', () => {
      const result = operations.validateSearchQuery('JavaScript')
      
      expect(result).toBe(true)
    })

    it('1文字のクエリでも有効とする', () => {
      const result = operations.validateSearchQuery('a')
      
      expect(result).toBe(true)
    })

    it('空の文字列の場合はfalseを返す', () => {
      const result = operations.validateSearchQuery('')
      
      expect(result).toBe(false)
    })

    it('空白のみの文字列の場合はfalseを返す', () => {
      const result = operations.validateSearchQuery('   ')
      
      expect(result).toBe(false)
    })

    it('タブや改行を含む空白のみの場合はfalseを返す', () => {
      const result = operations.validateSearchQuery('\t\n\r ')
      
      expect(result).toBe(false)
    })

    it('前後に空白があっても有効な内容があればtrueを返す', () => {
      const result = operations.validateSearchQuery('  JavaScript  ')
      
      expect(result).toBe(true)
    })

    it('特殊文字を含むクエリでも有効とする', () => {
      const result = operations.validateSearchQuery('React.js')
      
      expect(result).toBe(true)
    })

    it('日本語のクエリでも有効とする', () => {
      const result = operations.validateSearchQuery('検索テスト')
      
      expect(result).toBe(true)
    })

    it('数字のみのクエリでも有効とする', () => {
      const result = operations.validateSearchQuery('123')
      
      expect(result).toBe(true)
    })

    it('記号のみのクエリでも有効とする', () => {
      const result = operations.validateSearchQuery('!@#')
      
      expect(result).toBe(true)
    })
  })
})

describe('searchOperations singleton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('シングルトンインスタンスが正しく動作する', () => {
    expect(searchOperations).toBeInstanceOf(SearchOperations)
  })

  it('searchMemosメソッドが使用できる', () => {
    const expectedResults = [mockMemos[0]]
    mockFilterMemosByQuery.mockReturnValue(expectedResults)

    const result = searchOperations.searchMemos('test', mockMemos)

    expect(result).toEqual(expectedResults)
    expect(mockFilterMemosByQuery).toHaveBeenCalledWith(mockMemos, 'test')
  })

  it('validateSearchQueryメソッドが使用できる', () => {
    const result = searchOperations.validateSearchQuery('テストクエリ')

    expect(result).toBe(true)
  })
})

describe('SearchOperationsInterface', () => {
  it('SearchOperationsクラスがインターフェースを実装している', () => {
    const operations = new SearchOperations()

    // インターフェースのメソッドが存在することを確認
    expect(typeof operations.searchMemos).toBe('function')
    expect(typeof operations.validateSearchQuery).toBe('function')
  })
})

describe('エッジケース', () => {
  let operations: SearchOperations

  beforeEach(() => {
    vi.clearAllMocks()
    operations = new SearchOperations()
  })

  it('非常に長いクエリでも処理する', () => {
    const longQuery = 'a'.repeat(1000)
    const result = operations.validateSearchQuery(longQuery)

    expect(result).toBe(true)
  })

  it('Unicode文字を含むクエリを処理する', () => {
    const unicodeQuery = '🔍 検索 search العربية'
    mockFilterMemosByQuery.mockReturnValue([])

    const result = operations.searchMemos(unicodeQuery, mockMemos)

    expect(mockFilterMemosByQuery).toHaveBeenCalledWith(mockMemos, unicodeQuery)
  })

  it('複数の空白を含むクエリを適切に処理する', () => {
    const queryWithSpaces = 'Java    Script'
    const result = operations.validateSearchQuery(queryWithSpaces)

    expect(result).toBe(true)
  })

  it('改行を含むクエリを処理する', () => {
    const queryWithNewlines = 'line1\nline2'
    const result = operations.validateSearchQuery(queryWithNewlines)

    expect(result).toBe(true)
  })

  it('nullやundefinedが渡された場合の処理', () => {
    // TypeScriptでは型エラーになるが、実行時の安全性テスト
    // 実際の実装では型安全性のためこれらは例外を投げる
    expect(() => operations.validateSearchQuery(null as any)).toThrow()
    expect(() => operations.validateSearchQuery(undefined as any)).toThrow()
  })

  it('filterMemosByQueryがエラーを投げた場合の処理', () => {
    const error = new Error('Filter error')
    mockFilterMemosByQuery.mockImplementation(() => {
      throw error
    })

    expect(() => operations.searchMemos('test', mockMemos)).toThrow('Filter error')
  })
})