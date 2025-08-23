import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from './SearchBar'

const mockProps = {
  onSearch: vi.fn(),
  value: ''
}

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('プレースホルダーが正しく表示される', () => {
    render(<SearchBar {...mockProps} />)
    
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('初期値が正しく表示される', () => {
    render(<SearchBar {...mockProps} value="テスト検索" />)
    
    const input = screen.getByPlaceholderText('Search...')
    expect(input).toHaveValue('テスト検索')
  })

  it('テキスト入力でローカル値が更新される', async () => {
    const user = userEvent.setup()
    render(<SearchBar {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Search...')
    await user.type(input, 'テスト')
    
    expect(input).toHaveValue('テスト')
  })

  it('テキスト入力後にデバウンスでonSearchが呼ばれる', async () => {
    const user = userEvent.setup()
    render(<SearchBar {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Search...')
    await user.type(input, 'テスト')
    
    // デバウンス時間の150msを待つ
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenLastCalledWith('テスト')
    }, { timeout: 200 })
  })

  it('EnterキーでonSearchが即座に呼ばれる', async () => {
    const user = userEvent.setup()
    render(<SearchBar {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Search...')
    await user.type(input, 'テスト検索')
    await user.keyboard('{Enter}')
    
    expect(mockProps.onSearch).toHaveBeenCalledWith('テスト検索')
  })

  it('Escapeキーで入力がクリアされる', async () => {
    const user = userEvent.setup()
    render(<SearchBar {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Search...')
    await user.type(input, 'テスト検索')
    await user.keyboard('{Escape}')
    
    expect(input).toHaveValue('')
    expect(mockProps.onSearch).toHaveBeenCalledWith('')
  })

  it('propsのvalueが変更されるとローカル値も更新される', () => {
    const { rerender } = render(<SearchBar {...mockProps} value="初期値" />)
    
    const input = screen.getByPlaceholderText('Search...')
    expect(input).toHaveValue('初期値')
    
    rerender(<SearchBar {...mockProps} value="更新された値" />)
    expect(input).toHaveValue('更新された値')
  })

  it('複数文字の入力でデバウンスが正しく動作する', async () => {
    const user = userEvent.setup()
    render(<SearchBar {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Search...')
    
    // 短時間で複数文字を入力
    await user.type(input, 'テスト検索クエリ')
    
    // デバウンス時間後に最後の値でonSearchが呼ばれることを確認
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenLastCalledWith('テスト検索クエリ')
    }, { timeout: 200 })
  })

  it('空文字列の検索が正しく処理される', async () => {
    const user = userEvent.setup()
    render(<SearchBar {...mockProps} value="テスト" />)
    
    const input = screen.getByPlaceholderText('Search...')
    await user.clear(input)
    
    // デバウンス時間後に空文字列でonSearchが呼ばれることを確認
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenLastCalledWith('')
    }, { timeout: 200 })
  })

  it('フォーカスとブラーが正しく動作する', async () => {
    const user = userEvent.setup()
    render(<SearchBar {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Search...')
    
    await user.click(input)
    expect(input).toHaveFocus()
    
    await user.tab()
    expect(input).not.toHaveFocus()
  })

  it('特殊文字の入力が正しく処理される', async () => {
    const user = userEvent.setup()
    render(<SearchBar {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Search...')
    const specialChars = '!@#$%^&*()_+-='
    
    await user.type(input, specialChars)
    
    expect(input).toHaveValue(specialChars)
    
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenLastCalledWith(specialChars)
    }, { timeout: 200 })
  })

  it('日本語入力が正しく処理される', async () => {
    const user = userEvent.setup()
    render(<SearchBar {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Search...')
    const japaneseText = 'こんにちは世界'
    
    await user.type(input, japaneseText)
    
    expect(input).toHaveValue(japaneseText)
    
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenLastCalledWith(japaneseText)
    }, { timeout: 200 })
  })

  it('長いテキストの入力が正しく処理される', async () => {
    const user = userEvent.setup()
    render(<SearchBar {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Search...')
    const longText = 'これは非常に長いテキストの検索クエリです。日本語と英語を混在させてtest testing'.repeat(3)
    
    await user.type(input, longText)
    
    expect(input).toHaveValue(longText)
    
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenLastCalledWith(longText)
    }, { timeout: 200 })
  })
})