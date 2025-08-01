import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FolderSidebar from './FolderSidebar'
import { Folder } from '../../../entities/folder'

const mockFolders: Folder[] = [
  {
    id: '1',
    name: 'フォルダー1',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { memos: 3 }
  },
  {
    id: '2',
    name: 'フォルダー2',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { memos: 1 }
  }
]

const mockProps = {
  folders: mockFolders,
  selectedFolder: null,
  onFolderSelect: vi.fn(),
  onFolderCreate: vi.fn(),
  onFolderDelete: vi.fn(),
  onMemoFolderUpdate: vi.fn(),
  isSearching: false
}

// window.confirmをモック
Object.defineProperty(window, 'confirm', {
  value: vi.fn(() => true),
  writable: true
})

describe('FolderSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('フォルダーサイドバーが正しくレンダリングされる', () => {
    render(<FolderSidebar {...mockProps} />)
    
    expect(screen.getByText('FOLDERS')).toBeInTheDocument()
    expect(screen.getByText('All Notes')).toBeInTheDocument()
    expect(screen.getByText('フォルダー1')).toBeInTheDocument()
    expect(screen.getByText('フォルダー2')).toBeInTheDocument()
  })

  it('フォルダー追加ボタンが表示される', () => {
    render(<FolderSidebar {...mockProps} />)
    
    const addButton = screen.getByTitle('New Folder')
    expect(addButton).toBeInTheDocument()
    expect(addButton).toHaveTextContent('+')
  })

  it('フォルダーのメモ数が表示される', () => {
    render(<FolderSidebar {...mockProps} />)
    
    expect(screen.getByText('3')).toBeInTheDocument() // フォルダー1のメモ数
    expect(screen.getByText('1')).toBeInTheDocument() // フォルダー2のメモ数
  })

  it('All NotesクリックでonFolderSelectが呼ばれる', async () => {
    const user = userEvent.setup()
    render(<FolderSidebar {...mockProps} />)
    
    await user.click(screen.getByText('All Notes'))
    
    expect(mockProps.onFolderSelect).toHaveBeenCalledWith(null)
  })

  it('フォルダークリックでonFolderSelectが呼ばれる', async () => {
    const user = userEvent.setup()
    render(<FolderSidebar {...mockProps} />)
    
    await user.click(screen.getByText('フォルダー1'))
    
    expect(mockProps.onFolderSelect).toHaveBeenCalledWith(mockFolders[0])
  })

  it('選択されたフォルダーにselectedクラスが適用される', () => {
    render(<FolderSidebar {...mockProps} selectedFolder={mockFolders[0]} />)
    
    const selectedFolder = screen.getByText('フォルダー1').closest('.folder-item')
    expect(selectedFolder).toHaveClass('selected')
  })

  it('検索中でない場合、All Notesが選択状態になる', () => {
    render(<FolderSidebar {...mockProps} selectedFolder={null} isSearching={false} />)
    
    const allNotesItem = screen.getByText('All Notes').closest('.folder-item')
    expect(allNotesItem).toHaveClass('selected')
  })

  it('検索中の場合、All Notesが選択状態にならない', () => {
    render(<FolderSidebar {...mockProps} selectedFolder={null} isSearching={true} />)
    
    const allNotesItem = screen.getByText('All Notes').closest('.folder-item')
    expect(allNotesItem).not.toHaveClass('selected')
  })

  it('フォルダー追加ボタンクリックで入力フィールドが表示される', async () => {
    const user = userEvent.setup()
    render(<FolderSidebar {...mockProps} />)
    
    await user.click(screen.getByTitle('New Folder'))
    
    expect(screen.getByPlaceholderText('Folder name')).toBeInTheDocument()
  })

  it('新しいフォルダー名入力でフォルダーが作成される', async () => {
    const user = userEvent.setup()
    render(<FolderSidebar {...mockProps} />)
    
    await user.click(screen.getByTitle('New Folder'))
    
    const input = screen.getByPlaceholderText('Folder name')
    await user.type(input, '新しいフォルダー')
    await user.keyboard('{Enter}')
    
    expect(mockProps.onFolderCreate).toHaveBeenCalledWith('新しいフォルダー')
  })

  it('空のフォルダー名では作成されない', async () => {
    const user = userEvent.setup()
    render(<FolderSidebar {...mockProps} />)
    
    await user.click(screen.getByTitle('New Folder'))
    
    const input = screen.getByPlaceholderText('Folder name')
    await user.type(input, '   ') // 空白のみ
    await user.keyboard('{Enter}')
    
    expect(mockProps.onFolderCreate).not.toHaveBeenCalled()
  })

  it('フォルダー名入力中にblurでキャンセルされる', async () => {
    const user = userEvent.setup()
    render(<FolderSidebar {...mockProps} />)
    
    await user.click(screen.getByTitle('New Folder'))
    
    const input = screen.getByPlaceholderText('Folder name')
    await user.type(input, '新しいフォルダー')
    await user.tab() // blur
    
    expect(screen.queryByPlaceholderText('Folder name')).not.toBeInTheDocument()
    expect(mockProps.onFolderCreate).not.toHaveBeenCalled()
  })

  it('フォルダー削除ボタンクリックで確認ダイアログが表示される', async () => {
    const user = userEvent.setup()
    render(<FolderSidebar {...mockProps} />)
    
    const deleteButtons = screen.getAllByTitle('Delete Folder')
    await user.click(deleteButtons[0])
    
    expect(window.confirm).toHaveBeenCalledWith('Delete folder "フォルダー1"?')
    expect(mockProps.onFolderDelete).toHaveBeenCalledWith('1')
  })

  it('フォルダー削除で確認をキャンセルすると削除されない', async () => {
    const user = userEvent.setup()
    vi.mocked(window.confirm).mockReturnValue(false)
    render(<FolderSidebar {...mockProps} />)
    
    const deleteButtons = screen.getAllByTitle('Delete Folder')
    await user.click(deleteButtons[0])
    
    expect(mockProps.onFolderDelete).not.toHaveBeenCalled()
  })

  it('フォルダー削除ボタンクリックで親要素のクリックイベントが発生しない', async () => {
    const user = userEvent.setup()
    render(<FolderSidebar {...mockProps} />)
    
    const deleteButtons = screen.getAllByTitle('Delete Folder')
    await user.click(deleteButtons[0])
    
    // フォルダー選択のイベントが発生しないことを確認
    expect(mockProps.onFolderSelect).not.toHaveBeenCalled()
  })

  it('ドラッグオーバーでdrag-overクラスが適用される', () => {
    render(<FolderSidebar {...mockProps} />)
    
    const folderItem = screen.getByText('フォルダー1').closest('.folder-item')
    
    // dataTransferをモック
    const mockDataTransfer = {
      dropEffect: '',
      getData: vi.fn(),
      setData: vi.fn()
    }
    
    fireEvent.dragOver(folderItem!, {
      dataTransfer: mockDataTransfer
    })
    
    expect(folderItem).toHaveClass('drag-over')
  })

  it('ドラッグリーブでdrag-overクラスが削除される', () => {
    render(<FolderSidebar {...mockProps} />)
    
    const folderItem = screen.getByText('フォルダー1').closest('.folder-item')
    
    // dataTransferをモック
    const mockDataTransfer = {
      dropEffect: '',
      getData: vi.fn(),
      setData: vi.fn()
    }
    
    fireEvent.dragOver(folderItem!, { dataTransfer: mockDataTransfer })
    fireEvent.dragLeave(folderItem!)
    
    expect(folderItem).not.toHaveClass('drag-over')
  })

  it('メモのドロップでonMemoFolderUpdateが呼ばれる', () => {
    render(<FolderSidebar {...mockProps} />)
    
    const folderItem = screen.getByText('フォルダー1').closest('.folder-item')
    const memoData = JSON.stringify({ id: 'memo1', folderId: null })
    
    fireEvent.drop(folderItem!, {
      dataTransfer: {
        getData: vi.fn().mockReturnValue(memoData)
      }
    })
    
    expect(mockProps.onMemoFolderUpdate).toHaveBeenCalledWith('memo1', '1')
  })

  it('同じフォルダーへのドロップでは何も起こらない', () => {
    render(<FolderSidebar {...mockProps} />)
    
    const folderItem = screen.getByText('フォルダー1').closest('.folder-item')
    const memoData = JSON.stringify({ id: 'memo1', folderId: '1' })
    
    fireEvent.drop(folderItem!, {
      dataTransfer: {
        getData: vi.fn().mockReturnValue(memoData)
      }
    })
    
    expect(mockProps.onMemoFolderUpdate).not.toHaveBeenCalled()
  })

  it('All Notesへのドロップが正しく処理される', () => {
    render(<FolderSidebar {...mockProps} />)
    
    const allNotesItem = screen.getByText('All Notes').closest('.folder-item')
    const memoData = JSON.stringify({ id: 'memo1', folderId: '1' })
    
    fireEvent.drop(allNotesItem!, {
      dataTransfer: {
        getData: vi.fn().mockReturnValue(memoData)
      }
    })
    
    expect(mockProps.onMemoFolderUpdate).toHaveBeenCalledWith('memo1', null)
  })

  it('無効なドロップデータでエラーが発生しない', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<FolderSidebar {...mockProps} />)
    
    const folderItem = screen.getByText('フォルダー1').closest('.folder-item')
    
    fireEvent.drop(folderItem!, {
      dataTransfer: {
        getData: vi.fn().mockReturnValue('invalid json')
      }
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Error handling drop:', expect.any(Error))
    expect(mockProps.onMemoFolderUpdate).not.toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })

  it('メモ数が0の場合も正しく表示される', () => {
    const foldersWithZeroMemos: Folder[] = [
      {
        id: '1',
        name: 'Empty Folder',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { memos: 0 }
      }
    ]
    
    render(<FolderSidebar {...mockProps} folders={foldersWithZeroMemos} />)
    
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('_countがないフォルダーでも正しく表示される', () => {
    const foldersWithoutCount: Folder[] = [
      {
        id: '1',
        name: 'Folder Without Count',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    render(<FolderSidebar {...mockProps} folders={foldersWithoutCount} />)
    
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})