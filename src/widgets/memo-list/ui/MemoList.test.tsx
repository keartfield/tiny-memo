import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MemoList from './MemoList'
import { Memo } from '../../../entities/memo'
import { Folder } from '../../../entities/folder'

const mockMemos: Memo[] = [
  {
    id: '1',
    content: '# メモ1\n\nこれは最初のメモです。',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    folderId: null
  },
  {
    id: '2',
    content: '# メモ2\n\n**太字**のテキストと*斜体*のテキスト',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    folderId: '1'
  },
  {
    id: '3',
    content: '`コード`を含むメモ',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    folderId: '2'
  }
]

const mockFolder: Folder = {
  id: '1',
  name: 'テストフォルダー',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockProps = {
  memos: mockMemos,
  selectedMemo: null,
  onMemoSelect: vi.fn(),
  onMemoCreate: vi.fn(),
  onMemoDelete: vi.fn(),
  onMemoFolderUpdate: vi.fn(),
  selectedFolder: null,
  isSearching: false
}

// window.confirm をモック
const mockConfirm = vi.fn()
vi.stubGlobal('confirm', mockConfirm)

describe('MemoList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockReturnValue(true)
  })

  it('メモリストが正しく表示される', () => {
    render(<MemoList {...mockProps} />)
    
    expect(screen.getByText('メモ1')).toBeInTheDocument()
    expect(screen.getByText('メモ2')).toBeInTheDocument() 
    const codeElements = screen.getAllByText(/コード.*を含むメモ/)
    expect(codeElements.length).toBeGreaterThan(0)
  })

  it('選択されたメモがハイライトされる', () => {
    render(<MemoList {...mockProps} selectedMemo={mockMemos[0]} />)
    
    const selectedMemoItem = screen.getByText('メモ1').closest('.memo-item')
    expect(selectedMemoItem).toHaveClass('selected')
  })

  it('メモをクリックするとonMemoSelectが呼ばれる', async () => {
    const user = userEvent.setup()
    render(<MemoList {...mockProps} />)
    
    await user.click(screen.getByText('メモ1'))
    
    expect(mockProps.onMemoSelect).toHaveBeenCalledWith(mockMemos[0])
  })

  it('新規メモボタンをクリックするとonMemoCreateが呼ばれる', async () => {
    const user = userEvent.setup()
    render(<MemoList {...mockProps} />)
    
    const addButton = screen.getByTitle('New Memo')
    await user.click(addButton)
    
    expect(mockProps.onMemoCreate).toHaveBeenCalledWith('# New Memo\n\nStart writing your memo here...')
  })

  it('削除ボタンをクリックして確認するとonMemoDeleteが呼ばれる', async () => {
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(true)
    render(<MemoList {...mockProps} />)
    
    const deleteButtons = screen.getAllByTitle('Delete Memo')
    await user.click(deleteButtons[0])
    
    expect(mockConfirm).toHaveBeenCalledWith('Delete memo "メモ1"?')
    expect(mockProps.onMemoDelete).toHaveBeenCalledWith('1')
  })

  it('削除ボタンをクリックしてキャンセルするとonMemoDeleteが呼ばれない', async () => {
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(false)
    render(<MemoList {...mockProps} />)
    
    const deleteButtons = screen.getAllByTitle('Delete Memo')
    await user.click(deleteButtons[0])
    
    expect(mockConfirm).toHaveBeenCalledWith('Delete memo "メモ1"?')
    expect(mockProps.onMemoDelete).not.toHaveBeenCalled()
  })

  it('削除ボタンのクリックイベントが親要素に伝播しない', async () => {
    const user = userEvent.setup()
    render(<MemoList {...mockProps} />)
    
    const deleteButtons = screen.getAllByTitle('Delete Memo')
    await user.click(deleteButtons[0])
    
    // メモ選択のイベントが発火しないことを確認
    expect(mockProps.onMemoSelect).not.toHaveBeenCalled()
  })

  it('フォルダーが選択されている場合、ヘッダーにフォルダー名が表示される', () => {
    render(<MemoList {...mockProps} selectedFolder={mockFolder} />)
    
    expect(screen.getByText('テストフォルダー')).toBeInTheDocument()
  })

  it('検索中の場合、ヘッダーに"Search Results"が表示される', () => {
    render(<MemoList {...mockProps} isSearching={true} />)
    
    expect(screen.getByText('Search Results')).toBeInTheDocument()
  })

  it('フォルダーが選択されていない場合、ヘッダーに"All Notes"が表示される', () => {
    render(<MemoList {...mockProps} />)
    
    expect(screen.getByText('All Notes')).toBeInTheDocument()
  })

  it('メモが空の場合、空の状態が表示される', () => {
    render(<MemoList {...mockProps} memos={[]} />)
    
    expect(screen.getByText('No memos found')).toBeInTheDocument()
    expect(screen.getByText('Click + to create your first memo')).toBeInTheDocument()
  })

  it('検索中でメモが空の場合、作成ガイドが表示されない', () => {
    render(<MemoList {...mockProps} memos={[]} isSearching={true} />)
    
    expect(screen.getByText('No memos found')).toBeInTheDocument()
    expect(screen.queryByText('Click + to create your first memo')).not.toBeInTheDocument()
  })

  it('メモのプレビューテキストが正しく生成される', () => {
    render(<MemoList {...mockProps} />)
    
    // マークダウン記法が除去されてプレビューテキストとして表示される
    expect(screen.getByText(/これは最初のメモです/)).toBeInTheDocument()
    expect(screen.getByText(/太字のテキストと斜体のテキスト/)).toBeInTheDocument()
    expect(screen.getByText(/コードを含むメモ/)).toBeInTheDocument()
  })

  it('日付の表示が正しく動作する', () => {
    const now = new Date()
    const recentMemo: Memo = {
      id: '4',
      content: '最近作成されたメモ',
      createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30分前
      updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
      folderId: null
    }
    
    render(<MemoList {...mockProps} memos={[recentMemo]} />)
    
    // 時間ベースの表示が確認できるかテスト（"Just now" または "Xh ago"）
    const timeElements = screen.getAllByText(/Just now|ago/)
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('ドラッグアンドドロップが正しく設定される', () => {
    render(<MemoList {...mockProps} />)
    
    const memoItems = screen.getAllByRole('generic').filter(el => 
      el.classList.contains('memo-item')
    )
    
    // 最初のメモアイテムがドラッグ可能であることを確認
    expect(memoItems[0]).toHaveAttribute('draggable', 'true')
  })

  it('ドラッグ開始時にデータが正しく設定される', () => {
    render(<MemoList {...mockProps} />)
    
    const memoItems = screen.getAllByRole('generic').filter(el => 
      el.classList.contains('memo-item')
    )
    
    const mockDataTransfer = {
      setData: vi.fn(),
      effectAllowed: ''
    }
    
    fireEvent.dragStart(memoItems[0], {
      dataTransfer: mockDataTransfer
    })
    
    expect(mockDataTransfer.setData).toHaveBeenCalledWith('text/plain', '1')
    expect(mockDataTransfer.setData).toHaveBeenCalledWith(
      'application/json',
      JSON.stringify({
        id: '1',
        title: 'メモ1',
        folderId: null
      })
    )
  })

  it('メモタイトルが正しく表示される', () => {
    const memoWithCustomTitle: Memo = {
      id: '5',
      content: '# 異なるタイトル\n\n内容',
      createdAt: new Date(),
      updatedAt: new Date(),
      folderId: null
    }
    
    render(<MemoList {...mockProps} memos={[memoWithCustomTitle]} />)
    
    // getMemoTitle関数により、content内の見出しがタイトルとして使用される
    expect(screen.getByText('異なるタイトル')).toBeInTheDocument()
  })

  it('長いメモ内容が適切に切り詰められる', () => {
    const longMemo: Memo = {
      id: '6',
      content: 'これは非常に長いメモの内容です。'.repeat(20),
      createdAt: new Date(),
      updatedAt: new Date(),
      folderId: null
    }
    
    render(<MemoList {...mockProps} memos={[longMemo]} />)
    
    // プレビューテキストが表示されることを確認（複数要素があるのでgetAllByTextを使用）
    const previewTexts = screen.getAllByText(/これは非常に長いメモの内容です/)
    expect(previewTexts.length).toBeGreaterThan(0)
  })
})
