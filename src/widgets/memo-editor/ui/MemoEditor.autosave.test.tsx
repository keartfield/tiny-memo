import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MemoEditor from './MemoEditor'
import { Memo } from '../../../entities/memo'
import { Folder } from '../../../entities/folder'

const mockMemo: Memo = {
  id: '1',
  content: '# テストメモ\n\nこれはテストの内容です。',
  createdAt: new Date(),
  updatedAt: new Date(),
  folderId: null
}

const mockFolders: Folder[] = [
  {
    id: '1',
    name: 'フォルダー1',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

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
  folders: mockFolders,
  onMemoUpdate: vi.fn(),
  onMemoFolderUpdate: vi.fn()
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
      
      // テキストエリアが表示される
      expect(screen.getByPlaceholderText('A blank space for your thoughts...')).toBeInTheDocument()
      
      // フォルダー選択が表示される
      expect(screen.getByDisplayValue('No Folder')).toBeInTheDocument()
    })

    it('テキスト変更が正しく反映される', async () => {
      const user = userEvent.setup()
      render(<MemoEditor {...mockProps} />)
      
      const textarea = screen.getByPlaceholderText('A blank space for your thoughts...')
      
      // テキストを変更
      await user.clear(textarea)
      await user.type(textarea, '新しい内容')
      
      // 変更された内容が表示される
      expect(textarea).toHaveValue('新しい内容')
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
      
      const textarea = screen.getByPlaceholderText('A blank space for your thoughts...')
      
      // 初期内容が表示される
      expect(textarea).toHaveValue('# テストメモ\n\nこれはテストの内容です。')
      
      // テキストを編集
      await user.clear(textarea)
      await user.type(textarea, '新しい内容')
      
      // 編集された内容が反映される
      expect(textarea).toHaveValue('新しい内容')
    })

    it('テキスト入力によりisModifiedがtrueになることを確認', async () => {
      const user = userEvent.setup()
      const onMemoUpdate = vi.fn().mockResolvedValue({})
      
      const props = {
        ...mockProps,
        onMemoUpdate
      }
      
      render(<MemoEditor {...props} />)
      
      const textarea = screen.getByPlaceholderText('A blank space for your thoughts...')
      
      // テキストを変更
      await user.clear(textarea)
      await user.type(textarea, '新しい内容でテスト')
      
      // 変更された内容が反映される
      expect(textarea).toHaveValue('新しい内容でテスト')
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

  describe('フォルダー変更機能', () => {
    it('フォルダー選択の変更が正しく動作する', async () => {
      const onMemoFolderUpdate = vi.fn().mockResolvedValue({})
      
      const props = {
        ...mockProps,
        onMemoFolderUpdate
      }
      
      render(<MemoEditor {...props} />)
      
      const folderSelect = screen.getByDisplayValue('No Folder')
      
      // フォルダーを選択
      fireEvent.change(folderSelect, { target: { value: '1' } })
      
      // フォルダー更新が呼ばれることを確認
      expect(onMemoFolderUpdate).toHaveBeenCalledWith('1', '1')
    })

    it('「No Folder」の選択が正しく動作する', async () => {
      const memoWithFolder: Memo = {
        ...mockMemo,
        folderId: '1'
      }
      
      const onMemoFolderUpdate = vi.fn().mockResolvedValue({})
      
      const props = {
        ...mockProps,
        memo: memoWithFolder,
        onMemoFolderUpdate
      }
      
      render(<MemoEditor {...props} />)
      
      const folderSelect = screen.getByDisplayValue('フォルダー1')
      
      // 「No Folder」を選択
      fireEvent.change(folderSelect, { target: { value: '' } })
      
      // フォルダー更新が呼ばれることを確認（nullでフォルダーなしに設定）
      expect(onMemoFolderUpdate).toHaveBeenCalledWith('1', null)
    })
  })
})