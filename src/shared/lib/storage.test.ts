import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getStoredViewMode, saveViewMode, toggleViewMode } from './storage'
import { ViewMode } from '../types'

// localStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

describe('storage utilities', () => {
  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks()
    
    // localStorageモックをリセット
    localStorageMock.getItem.mockReset()
    localStorageMock.setItem.mockReset()
    localStorageMock.removeItem.mockReset()
    localStorageMock.clear.mockReset()
    
    // globalオブジェクトにモックを設定
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  })

  describe('getStoredViewMode', () => {
    it('localStorageに保存されたfolder-list-memoビューモードを取得する', () => {
      localStorageMock.getItem.mockReturnValue('folder-list-memo')

      const result = getStoredViewMode()

      expect(localStorageMock.getItem).toHaveBeenCalledWith('viewMode')
      expect(result).toBe('folder-list-memo')
    })

    it('localStorageに保存されたlist-memoビューモードを取得する', () => {
      localStorageMock.getItem.mockReturnValue('list-memo')

      const result = getStoredViewMode()

      expect(result).toBe('list-memo')
    })

    it('localStorageにビューモードが保存されていない場合、デフォルト値を返す', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = getStoredViewMode()

      expect(result).toBe('folder-list-memo')
    })

    it('localStorageに空文字が保存されている場合、デフォルト値を返す', () => {
      localStorageMock.getItem.mockReturnValue('')

      const result = getStoredViewMode()

      expect(result).toBe('folder-list-memo')
    })

    it('localStorageにundefinedが保存されている場合、デフォルト値を返す', () => {
      localStorageMock.getItem.mockReturnValue(undefined)

      const result = getStoredViewMode()

      expect(result).toBe('folder-list-memo')
    })

    it('localStorageに無効な値が保存されている場合、その値をそのまま返す', () => {
      localStorageMock.getItem.mockReturnValue('invalid-mode')

      const result = getStoredViewMode()

      // TypeScriptの型チェックは実行時には行われないため、
      // 実際には無効な値もそのまま返される
      expect(result).toBe('invalid-mode')
    })

    it('localStorageのgetItemが例外を投げる場合', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied')
      })

      expect(() => getStoredViewMode()).toThrow('localStorage access denied')
    })

    it('複数回呼び出しても一貫した結果を返す', () => {
      localStorageMock.getItem.mockReturnValue('list-memo')

      const result1 = getStoredViewMode()
      const result2 = getStoredViewMode()

      expect(result1).toBe('list-memo')
      expect(result2).toBe('list-memo')
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(2)
    })

    it('数値が保存されている場合も文字列として扱う', () => {
      localStorageMock.getItem.mockReturnValue('123')

      const result = getStoredViewMode()

      expect(result).toBe('123')
    })

    it('真偽値が保存されている場合も文字列として扱う', () => {
      localStorageMock.getItem.mockReturnValue('true')

      const result = getStoredViewMode()

      expect(result).toBe('true')
    })
  })

  describe('saveViewMode', () => {
    it('folder-list-memoビューモードを保存する', () => {
      const viewMode: ViewMode = 'folder-list-memo'

      saveViewMode(viewMode)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('viewMode', 'folder-list-memo')
    })

    it('list-memoビューモードを保存する', () => {
      const viewMode: ViewMode = 'list-memo'

      saveViewMode(viewMode)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('viewMode', 'list-memo')
    })

    it('複数回保存しても正しく動作する', () => {
      saveViewMode('folder-list-memo')
      saveViewMode('list-memo')
      saveViewMode('folder-list-memo')

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3)
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('viewMode', 'folder-list-memo')
    })

    it('localStorageのsetItemが例外を投げる場合', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage write failed')
      })

      expect(() => saveViewMode('list-memo')).toThrow('localStorage write failed')
    })

    it('localStorageが満杯の場合のエラーハンドリング', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError')
      })

      expect(() => saveViewMode('list-memo')).toThrow('QuotaExceededError')
    })

    it('同じ値を連続で保存しても正しく動作する', () => {
      const viewMode: ViewMode = 'folder-list-memo'

      saveViewMode(viewMode)
      saveViewMode(viewMode)
      saveViewMode(viewMode)

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('viewMode', 'folder-list-memo')
    })
  })

  describe('toggleViewMode', () => {
    it('folder-list-memoからlist-memoに切り替える', () => {
      const result = toggleViewMode('folder-list-memo')

      expect(result).toBe('list-memo')
    })

    it('list-memoからfolder-list-memoに切り替える', () => {
      const result = toggleViewMode('list-memo')

      expect(result).toBe('folder-list-memo')
    })

    it('複数回切り替えても正しく動作する', () => {
      let mode: ViewMode = 'folder-list-memo'
      
      mode = toggleViewMode(mode) // folder-list-memo -> list-memo
      expect(mode).toBe('list-memo')
      
      mode = toggleViewMode(mode) // list-memo -> folder-list-memo
      expect(mode).toBe('folder-list-memo')
      
      mode = toggleViewMode(mode) // folder-list-memo -> list-memo
      expect(mode).toBe('list-memo')
    })

    it('元のビューモード値を変更しない', () => {
      const originalMode: ViewMode = 'folder-list-memo'
      const newMode = toggleViewMode(originalMode)

      expect(originalMode).toBe('folder-list-memo') // 元の値は変更されない
      expect(newMode).toBe('list-memo')
    })

    it('非常に多くの連続した切り替えでも正しく動作する', () => {
      let mode: ViewMode = 'folder-list-memo'
      
      // 1000回切り替え
      for (let i = 0; i < 1000; i++) {
        mode = toggleViewMode(mode)
      }
      
      // 偶数回なので元に戻る
      expect(mode).toBe('folder-list-memo')
    })

    it('1001回切り替えた場合は異なる値になる', () => {
      let mode: ViewMode = 'folder-list-memo'
      
      // 1001回切り替え
      for (let i = 0; i < 1001; i++) {
        mode = toggleViewMode(mode)
      }
      
      // 奇数回なので切り替わる
      expect(mode).toBe('list-memo')
    })
  })

  describe('統合テスト', () => {
    it('完全なビューモード管理ワークフローが正しく動作する', () => {
      // 初期ビューモードの取得
      localStorageMock.getItem.mockReturnValue('folder-list-memo')
      const initialMode = getStoredViewMode()
      expect(initialMode).toBe('folder-list-memo')

      // ビューモードの切り替え
      const newMode = toggleViewMode(initialMode)
      expect(newMode).toBe('list-memo')

      // 新しいビューモードの保存
      saveViewMode(newMode)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('viewMode', 'list-memo')
    })

    it('デフォルト値からの切り替えと保存が正しく動作する', () => {
      // localStorageにビューモードが保存されていない
      localStorageMock.getItem.mockReturnValue(null)

      const initialMode = getStoredViewMode()
      expect(initialMode).toBe('folder-list-memo') // デフォルト値

      // ビューモードを切り替え
      const toggledMode = toggleViewMode(initialMode)
      expect(toggledMode).toBe('list-memo')

      // 切り替え後のビューモードを保存
      saveViewMode(toggledMode)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('viewMode', 'list-memo')
    })

    it('保存と取得のサイクルが正しく動作する', () => {
      // ビューモードを保存
      saveViewMode('list-memo')
      
      // 保存されたビューモードを再設定してから取得
      localStorageMock.getItem.mockReturnValue('list-memo')
      const retrieved = getStoredViewMode()
      
      expect(retrieved).toBe('list-memo')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('viewMode', 'list-memo')
      expect(localStorageMock.getItem).toHaveBeenCalledWith('viewMode')
    })
  })

  describe('エッジケース', () => {
    it('localStorageが利用できない環境でのエラーハンドリング', () => {
      // localStorageが存在しない場合
      Object.defineProperty(window, 'localStorage', { value: undefined })

      expect(() => getStoredViewMode()).toThrow()
      expect(() => saveViewMode('list-memo')).toThrow()
    })

    it('localStorageが読み取り専用の場合', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage is read-only')
      })

      expect(() => saveViewMode('list-memo')).toThrow('localStorage is read-only')
    })

    it('プライベートブラウジングモードでのlocalStorageエラー', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('Failed to execute \'setItem\' on \'Storage\'')
      })

      expect(() => saveViewMode('folder-list-memo')).toThrow()
    })

    it('localStorageから取得した値がnullの場合', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = getStoredViewMode()

      expect(result).toBe('folder-list-memo')
    })

    it('localStorageから取得した値がundefinedの場合', () => {
      localStorageMock.getItem.mockReturnValue(undefined)

      const result = getStoredViewMode()

      expect(result).toBe('folder-list-memo')
    })

    it('TypeScriptの型安全性を確認', () => {
      // 有効なビューモード値のみが受け入れられることを確認
      const folderListMode: ViewMode = 'folder-list-memo'
      const listMode: ViewMode = 'list-memo'
      
      expect(toggleViewMode(folderListMode)).toBe('list-memo')
      expect(toggleViewMode(listMode)).toBe('folder-list-memo')
      
      saveViewMode(folderListMode)
      saveViewMode(listMode)
      
      // 関数が正しい型で動作することを確認
      expect(typeof folderListMode).toBe('string')
      expect(typeof listMode).toBe('string')
    })

    it('文字列の比較が正確に行われる', () => {
      // 大文字小文字の違いが考慮されることを確認
      const result1 = toggleViewMode('FOLDER-LIST-MEMO' as ViewMode)
      const result2 = toggleViewMode('folder-list-memo')
      
      // 大文字の場合は一致しないため、folder-list-memoを返す
      expect(result1).toBe('folder-list-memo')
      expect(result2).toBe('list-memo')
    })

    it('スペースが含まれた値の処理', () => {
      const result = toggleViewMode(' folder-list-memo ' as ViewMode)
      
      // スペースが含まれているので一致せず、folder-list-memoを返す
      expect(result).toBe('folder-list-memo')
    })
  })
})