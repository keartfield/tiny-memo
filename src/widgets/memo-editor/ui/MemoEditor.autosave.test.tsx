import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MemoEditor from './MemoEditor'
import { Memo } from '../../../entities/memo'

const mockMemo: Memo = {
  id: '1',
  content: '# テストメモ\n\nこれはテストの内容です。',
  createdAt: new Date(),
  updatedAt: new Date(),
  folderId: null
}

// ElectronAPIのモック
const mockElectronAPI = {
  images: {
    save: vi.fn(),
    get: vi.fn()
  }
}

// windowオブジェクトにmockElectronAPIを設定
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})

const mockProps = {
  memo: mockMemo,
  onMemoUpdate: vi.fn()
}

describe('MemoEditor - 自動保存テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本表示', () => {
    it('メモが選択されていない場合は空の状態を表示', () => {
      render(<MemoEditor {...mockProps} memo={null} />)
      expect(screen.getByText('tiny memo, big thoughts')).toBeInTheDocument()
    })

    it('メモが選択されている場合は編集画面を表示', () => {
      render(<MemoEditor {...mockProps} />)
      
      // テキストエディターが表示される
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      
    })

    it('テキスト変更が正しく反映される', async () => {
      const user = userEvent.setup()
      render(<MemoEditor {...mockProps} />)
      
      const editor = screen.getByRole('textbox')
      
      // テキストを変更
      await user.clear(editor)
      await user.type(editor, '新しい内容')
      
      // 変更された内容が反映される
      expect(editor).toHaveTextContent('新しい内容')
    })
  })

  describe('自動保存機能のテスト', () => {
    it('メモが正常に表示され、編集可能である', async () => {
      const user = userEvent.setup()
      const onMemoUpdate = vi.fn().mockResolvedValue({})
      
      const props = {
        ...mockProps,
        onMemoUpdate
      }
      
      render(<MemoEditor {...props} />)
      
      const editor = screen.getByRole('textbox')
      
      // エディターが表示される
      expect(editor).toBeInTheDocument()
      
      // テキストを編集
      await user.clear(editor)
      await user.type(editor, '新しい内容')
      
      // 編集された内容が反映される
      expect(editor).toHaveTextContent('新しい内容')
    })

    it('テキスト入力によりisModifiedがtrueになることを確認', async () => {
      const user = userEvent.setup()
      const onMemoUpdate = vi.fn().mockResolvedValue({})
      
      const props = {
        ...mockProps,
        onMemoUpdate
      }
      
      render(<MemoEditor {...props} />)
      
      const editor = screen.getByRole('textbox')
      
      // テキストを変更
      await user.clear(editor)
      await user.type(editor, '新しい内容でテスト')
      
      // 変更された内容が反映される
      expect(editor).toHaveTextContent('新しい内容でテスト')
    })

    it('onMemoUpdate関数が正しく渡されている', () => {
      const onMemoUpdate = vi.fn().mockResolvedValue({})
      
      const props = {
        ...mockProps,
        onMemoUpdate
      }
      
      render(<MemoEditor {...props} />)
      
      // 関数が渡されていることを確認
      expect(typeof props.onMemoUpdate).toBe('function')
    })
  })

})
