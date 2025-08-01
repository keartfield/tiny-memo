import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearch } from './useSearch'
import { Memo, filterMemosByQuery } from '../../../entities/memo'

// filterMemosByQueryのモック
vi.mock('../../../entities/memo', () => ({
  filterMemosByQuery: vi.fn()
}))

const mockFilterMemosByQuery = vi.mocked(filterMemosByQuery)

const mockMemos: Memo[] = [
  {
    id: '1',
    content: 'JavaScriptの基本について学ぶ',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    folderId: 'folder-1'
  },
  {
    id: '2',
    content: 'TypeScriptの型システムを理解する',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    folderId: 'folder-1'
  },
  {
    id: '3',
    content: 'Reactのフックを使いこなす',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    folderId: null
  }
]

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useSearch())

    expect(result.current.searchQuery).toBe('')
    expect(result.current.isSearching).toBe(false)
    expect(result.current.searchResults).toEqual([])
  })

  describe('setSearchQuery', () => {
    it('検索クエリを設定する', () => {
      const { result } = renderHook(() => useSearch())

      act(() => {
        result.current.setSearchQuery('JavaScript')
      })

      expect(result.current.searchQuery).toBe('JavaScript')
    })

    it('空文字列を設定する', () => {
      const { result } = renderHook(() => useSearch())

      // 最初に何かを設定
      act(() => {
        result.current.setSearchQuery('test')
      })
      expect(result.current.searchQuery).toBe('test')

      // 空文字列に更新
      act(() => {
        result.current.setSearchQuery('')
      })
      expect(result.current.searchQuery).toBe('')
    })
  })

  describe('performSearch', () => {
    it('有効なクエリで検索を実行する', () => {
      const expectedResults = [mockMemos[0], mockMemos[1]]
      mockFilterMemosByQuery.mockReturnValue(expectedResults)
      const { result } = renderHook(() => useSearch())

      let searchResults: Memo[]
      act(() => {
        searchResults = result.current.performSearch('JavaScript', mockMemos)
      })

      expect(result.current.searchQuery).toBe('JavaScript')
      expect(result.current.isSearching).toBe(true)
      expect(result.current.searchResults).toEqual(expectedResults)
      expect(searchResults!).toEqual(expectedResults)
      expect(mockFilterMemosByQuery).toHaveBeenCalledWith(mockMemos, 'JavaScript')
    })

    it('空のクエリで検索を実行する', () => {
      const { result } = renderHook(() => useSearch())

      // 最初に何かを検索して状態を設定
      mockFilterMemosByQuery.mockReturnValue([mockMemos[0]])
      act(() => {
        result.current.performSearch('test', mockMemos)
      })
      expect(result.current.isSearching).toBe(true)

      // 空のクエリで検索
      let searchResults: Memo[]
      act(() => {
        searchResults = result.current.performSearch('', mockMemos)
      })

      expect(result.current.searchQuery).toBe('')
      expect(result.current.isSearching).toBe(false)
      expect(result.current.searchResults).toEqual([])
      expect(searchResults!).toEqual([])
      expect(mockFilterMemosByQuery).not.toHaveBeenCalledWith(mockMemos, '')
    })

    it('空白のみのクエリで検索を実行する', () => {
      const { result } = renderHook(() => useSearch())

      let searchResults: Memo[]
      act(() => {
        searchResults = result.current.performSearch('   ', mockMemos)
      })

      expect(result.current.searchQuery).toBe('   ')
      expect(result.current.isSearching).toBe(false)
      expect(result.current.searchResults).toEqual([])
      expect(searchResults!).toEqual([])
    })

    it('検索結果が見つからない場合', () => {
      mockFilterMemosByQuery.mockReturnValue([])
      const { result } = renderHook(() => useSearch())

      let searchResults: Memo[]
      act(() => {
        searchResults = result.current.performSearch('存在しない文字列', mockMemos)
      })

      expect(result.current.searchQuery).toBe('存在しない文字列')
      expect(result.current.isSearching).toBe(true)
      expect(result.current.searchResults).toEqual([])
      expect(searchResults!).toEqual([])
      expect(mockFilterMemosByQuery).toHaveBeenCalledWith(mockMemos, '存在しない文字列')
    })

    it('空のメモリストで検索を実行する', () => {
      mockFilterMemosByQuery.mockReturnValue([])
      const { result } = renderHook(() => useSearch())

      let searchResults: Memo[]
      act(() => {
        searchResults = result.current.performSearch('test', [])
      })

      expect(result.current.searchQuery).toBe('test')
      expect(result.current.isSearching).toBe(true)
      expect(result.current.searchResults).toEqual([])
      expect(searchResults!).toEqual([])
      expect(mockFilterMemosByQuery).toHaveBeenCalledWith([], 'test')
    })

    it('連続して検索を実行する', () => {
      const { result } = renderHook(() => useSearch())

      // 最初の検索
      mockFilterMemosByQuery.mockReturnValue([mockMemos[0]])
      act(() => {
        result.current.performSearch('JavaScript', mockMemos)
      })
      expect(result.current.searchResults).toEqual([mockMemos[0]])

      // 2回目の検索
      mockFilterMemosByQuery.mockReturnValue([mockMemos[1], mockMemos[2]])
      act(() => {
        result.current.performSearch('TypeScript', mockMemos)
      })
      expect(result.current.searchQuery).toBe('TypeScript')
      expect(result.current.searchResults).toEqual([mockMemos[1], mockMemos[2]])
    })
  })

  describe('clearSearch', () => {
    it('検索状態をクリアする', () => {
      const { result } = renderHook(() => useSearch())

      // 検索状態を設定
      mockFilterMemosByQuery.mockReturnValue([mockMemos[0]])
      act(() => {
        result.current.performSearch('JavaScript', mockMemos)
      })
      expect(result.current.searchQuery).toBe('JavaScript')
      expect(result.current.isSearching).toBe(true)
      expect(result.current.searchResults).toEqual([mockMemos[0]])

      // クリア実行
      act(() => {
        result.current.clearSearch()
      })

      expect(result.current.searchQuery).toBe('')
      expect(result.current.isSearching).toBe(false)
      expect(result.current.searchResults).toEqual([])
    })

    it('初期状態でクリアしても問題ない', () => {
      const { result } = renderHook(() => useSearch())

      act(() => {
        result.current.clearSearch()
      })

      expect(result.current.searchQuery).toBe('')
      expect(result.current.isSearching).toBe(false)
      expect(result.current.searchResults).toEqual([])
    })
  })

  describe('複合操作', () => {
    it('検索→クリア→再検索の流れが正しく動作する', () => {
      const { result } = renderHook(() => useSearch())

      // 最初の検索
      mockFilterMemosByQuery.mockReturnValue([mockMemos[0]])
      act(() => {
        result.current.performSearch('JavaScript', mockMemos)
      })
      expect(result.current.isSearching).toBe(true)
      expect(result.current.searchResults).toEqual([mockMemos[0]])

      // クリア
      act(() => {
        result.current.clearSearch()
      })
      expect(result.current.isSearching).toBe(false)
      expect(result.current.searchResults).toEqual([])

      // 2回目の検索
      mockFilterMemosByQuery.mockReturnValue([mockMemos[1]])
      act(() => {
        result.current.performSearch('TypeScript', mockMemos)
      })
      expect(result.current.searchQuery).toBe('TypeScript')
      expect(result.current.isSearching).toBe(true)
      expect(result.current.searchResults).toEqual([mockMemos[1]])
    })

    it('setSearchQueryは検索実行に影響しない', () => {
      const { result } = renderHook(() => useSearch())

      // setSearchQueryで設定
      act(() => {
        result.current.setSearchQuery('JavaScript')
      })
      expect(result.current.searchQuery).toBe('JavaScript')
      expect(result.current.isSearching).toBe(false) // まだ検索は実行されていない

      // performSearchで実際に検索
      mockFilterMemosByQuery.mockReturnValue([mockMemos[0]])
      act(() => {
        result.current.performSearch('TypeScript', mockMemos)
      })
      expect(result.current.searchQuery).toBe('TypeScript') // performSearchのクエリで上書き
      expect(result.current.isSearching).toBe(true)
    })
  })

  describe('インターフェース要件', () => {
    it('UseSearchResultインターフェースのすべてのプロパティを持つ', () => {
      const { result } = renderHook(() => useSearch())

      // プロパティの存在確認
      expect(result.current).toHaveProperty('searchQuery')
      expect(result.current).toHaveProperty('isSearching')
      expect(result.current).toHaveProperty('searchResults')
      expect(result.current).toHaveProperty('setSearchQuery')
      expect(result.current).toHaveProperty('performSearch')
      expect(result.current).toHaveProperty('clearSearch')

      // 関数プロパティの型確認
      expect(typeof result.current.setSearchQuery).toBe('function')
      expect(typeof result.current.performSearch).toBe('function')
      expect(typeof result.current.clearSearch).toBe('function')
    })
  })

  describe('エッジケース', () => {
    it('非常に長いクエリでも処理する', () => {
      const longQuery = 'a'.repeat(1000)
      mockFilterMemosByQuery.mockReturnValue([])
      const { result } = renderHook(() => useSearch())

      act(() => {
        result.current.performSearch(longQuery, mockMemos)
      })

      expect(result.current.searchQuery).toBe(longQuery)
      expect(mockFilterMemosByQuery).toHaveBeenCalledWith(mockMemos, longQuery)
    })

    it('Unicode文字を含むクエリを処理する', () => {
      const unicodeQuery = '🔍 検索 search العربية'
      mockFilterMemosByQuery.mockReturnValue([])
      const { result } = renderHook(() => useSearch())

      act(() => {
        result.current.performSearch(unicodeQuery, mockMemos)
      })

      expect(result.current.searchQuery).toBe(unicodeQuery)
      expect(mockFilterMemosByQuery).toHaveBeenCalledWith(mockMemos, unicodeQuery)
    })

    it('特殊文字を含むクエリを処理する', () => {
      const specialQuery = '!@#$%^&*()[]{}|\\:";\'<>?,./'
      mockFilterMemosByQuery.mockReturnValue([])
      const { result } = renderHook(() => useSearch())

      act(() => {
        result.current.performSearch(specialQuery, mockMemos)
      })

      expect(result.current.searchQuery).toBe(specialQuery)
      expect(mockFilterMemosByQuery).toHaveBeenCalledWith(mockMemos, specialQuery)
    })

    it('改行を含むクエリを処理する', () => {
      const queryWithNewlines = 'line1\nline2\nline3'
      mockFilterMemosByQuery.mockReturnValue([])
      const { result } = renderHook(() => useSearch())

      act(() => {
        result.current.performSearch(queryWithNewlines, mockMemos)
      })

      expect(result.current.searchQuery).toBe(queryWithNewlines)
      expect(mockFilterMemosByQuery).toHaveBeenCalledWith(mockMemos, queryWithNewlines)
    })

    it('filterMemosByQueryがエラーを投げても適切に処理する', () => {
      const error = new Error('Filter error')
      mockFilterMemosByQuery.mockImplementation(() => {
        throw error
      })
      const { result } = renderHook(() => useSearch())

      expect(() => {
        act(() => {
          result.current.performSearch('test', mockMemos)
        })
      }).toThrow('Filter error')
    })
  })
})