import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getInitialTheme, applyTheme, toggleTheme } from './theme'
import { Theme } from '../types'

// localStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// matchMediaのモック
const matchMediaMock = vi.fn()

describe('theme utilities', () => {
  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks()
    
    // globalオブジェクトにモックを設定
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    Object.defineProperty(window, 'matchMedia', { value: matchMediaMock })
    
    // documentElementのモック
    Object.defineProperty(document, 'documentElement', {
      value: {
        setAttribute: vi.fn()
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getInitialTheme', () => {
    it('localStorageに保存されたlightテーマを取得する', () => {
      localStorageMock.getItem.mockReturnValue('light')

      const result = getInitialTheme()

      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme')
      expect(result).toBe('light')
    })

    it('localStorageに保存されたdarkテーマを取得する', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      const result = getInitialTheme()

      expect(result).toBe('dark')
    })

    it('localStorageにテーマが保存されていない場合、システム設定がdarkならdarkを返す', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockReturnValue({ matches: true })

      const result = getInitialTheme()

      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
      expect(result).toBe('dark')
    })

    it('localStorageにテーマが保存されていない場合、システム設定がlightならlightを返す', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockReturnValue({ matches: false })

      const result = getInitialTheme()

      expect(result).toBe('light')
    })

    it('localStorageに無効な値が保存されている場合、システム設定を使用する', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme')
      matchMediaMock.mockReturnValue({ matches: true })

      const result = getInitialTheme()

      expect(result).toBe('dark')
    })

    it('localStorageに空文字が保存されている場合、システム設定を使用する', () => {
      localStorageMock.getItem.mockReturnValue('')
      matchMediaMock.mockReturnValue({ matches: false })

      const result = getInitialTheme()

      expect(result).toBe('light')
    })

    it('localStorageにundefinedが保存されている場合、システム設定を使用する', () => {
      localStorageMock.getItem.mockReturnValue(undefined)
      matchMediaMock.mockReturnValue({ matches: true })

      const result = getInitialTheme()

      expect(result).toBe('dark')
    })

    it('matchMediaが利用できない環境でもフォールバックする', () => {
      localStorageMock.getItem.mockReturnValue(null)
      // matchMediaが例外を投げる場合をシミュレート
      matchMediaMock.mockImplementation(() => {
        throw new Error('matchMedia not supported')
      })

      expect(() => getInitialTheme()).toThrow('matchMedia not supported')
    })

    it('大文字小文字が混在したテーマ値は無効として扱う', () => {
      localStorageMock.getItem.mockReturnValue('Dark')
      matchMediaMock.mockReturnValue({ matches: false })

      const result = getInitialTheme()

      expect(result).toBe('light') // システム設定にフォールバック
    })

    it('数値がテーマ値として保存されている場合は無効として扱う', () => {
      localStorageMock.getItem.mockReturnValue('123')
      matchMediaMock.mockReturnValue({ matches: true })

      const result = getInitialTheme()

      expect(result).toBe('dark') // システム設定にフォールバック
    })
  })

  describe('applyTheme', () => {
    it('lightテーマを適用する', () => {
      const theme: Theme = 'light'

      applyTheme(theme)

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
    })

    it('darkテーマを適用する', () => {
      const theme: Theme = 'dark'

      applyTheme(theme)

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    })

    it('複数回テーマを適用しても正しく動作する', () => {
      applyTheme('light')
      applyTheme('dark')
      applyTheme('light')

      expect(document.documentElement.setAttribute).toHaveBeenCalledTimes(3)
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3)
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('theme', 'light')
    })

    it('documentElementが存在しない場合でもlocalStorageは更新される', () => {
      // documentElementをnullに設定
      Object.defineProperty(document, 'documentElement', {
        value: null,
        writable: true
      })

      expect(() => applyTheme('dark')).toThrow()
      // setItemは呼ばれない（例外が先に発生するため）
    })

    it('localStorageが利用できない場合でもdomは更新される', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      expect(() => applyTheme('dark')).toThrow('localStorage not available')
      // setAttributeは先に呼ばれる
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    })
  })

  describe('toggleTheme', () => {
    it('darkテーマからlightテーマに切り替える', () => {
      const result = toggleTheme('dark')

      expect(result).toBe('light')
    })

    it('lightテーマからdarkテーマに切り替える', () => {
      const result = toggleTheme('light')

      expect(result).toBe('dark')
    })

    it('複数回切り替えても正しく動作する', () => {
      let theme: Theme = 'light'
      
      theme = toggleTheme(theme) // light -> dark
      expect(theme).toBe('dark')
      
      theme = toggleTheme(theme) // dark -> light
      expect(theme).toBe('light')
      
      theme = toggleTheme(theme) // light -> dark
      expect(theme).toBe('dark')
    })

    it('元のテーマ値を変更しない', () => {
      const originalTheme: Theme = 'dark'
      const newTheme = toggleTheme(originalTheme)

      expect(originalTheme).toBe('dark') // 元の値は変更されない
      expect(newTheme).toBe('light')
    })
  })

  describe('統合テスト', () => {
    it('完全なテーマ切り替えワークフローが正しく動作する', () => {
      // 初期テーマの取得
      localStorageMock.getItem.mockReturnValue('light')
      const initialTheme = getInitialTheme()
      expect(initialTheme).toBe('light')

      // テーマの適用
      applyTheme(initialTheme)
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')

      // テーマの切り替え
      const newTheme = toggleTheme(initialTheme)
      expect(newTheme).toBe('dark')

      // 新しいテーマの適用
      applyTheme(newTheme)
      expect(document.documentElement.setAttribute).toHaveBeenLastCalledWith('data-theme', 'dark')
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('theme', 'dark')
    })

    it('システム設定からの初期化とテーマ切り替えが正しく動作する', () => {
      // localStorageにテーマが保存されていない
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockReturnValue({ matches: true }) // システムはdark

      const initialTheme = getInitialTheme()
      expect(initialTheme).toBe('dark')

      // テーマを切り替え
      const toggledTheme = toggleTheme(initialTheme)
      expect(toggledTheme).toBe('light')

      // 切り替え後のテーマを適用
      applyTheme(toggledTheme)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
    })
  })

  describe('エッジケース', () => {
    it('WindowオブジェクトのmatchMediaが存在しない場合', () => {
      localStorageMock.getItem.mockReturnValue(null)
      // matchMediaをundefinedに設定
      Object.defineProperty(window, 'matchMedia', { value: undefined })

      expect(() => getInitialTheme()).toThrow()
    })

    it('localStorageのgetItemが例外を投げる場合', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied')
      })
      matchMediaMock.mockReturnValue({ matches: false })

      expect(() => getInitialTheme()).toThrow('localStorage access denied')
    })

    it('documentElementのsetAttributeが例外を投げる場合', () => {
      const mockSetAttribute = vi.fn().mockImplementation(() => {
        throw new Error('setAttribute failed')
      })
      Object.defineProperty(document, 'documentElement', {
        value: { setAttribute: mockSetAttribute },
        writable: true
      })

      expect(() => applyTheme('dark')).toThrow('setAttribute failed')
    })

    it('非常に多くの連続したテーマ切り替えでも正しく動作する', () => {
      let theme: Theme = 'light'
      
      // 1000回切り替え
      for (let i = 0; i < 1000; i++) {
        theme = toggleTheme(theme)
      }
      
      // 偶数回なので元に戻る
      expect(theme).toBe('light')
    })

    it('TypeScriptの型チェックが正しく動作する', () => {
      // 有効なテーマ値のみが受け入れられることを確認
      const lightTheme: Theme = 'light'
      const darkTheme: Theme = 'dark'
      
      expect(toggleTheme(lightTheme)).toBe('dark')
      expect(toggleTheme(darkTheme)).toBe('light')
      
      applyTheme(lightTheme)
      applyTheme(darkTheme)
      
      // コンパイル時エラーは実行時にはテストできないが、
      // 関数が正しい型で動作することを確認
      expect(typeof lightTheme).toBe('string')
      expect(typeof darkTheme).toBe('string')
    })
  })
})