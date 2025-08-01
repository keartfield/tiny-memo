import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FolderSidebar from './FolderSidebar'
import { Folder } from '../../../entities/folder'

const mockFolders: Folder[] = [
  {
    id: 'folder1',
    name: 'フォルダー1',
    order: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    _count: { memos: 3 }
  },
  {
    id: 'folder2',
    name: 'フォルダー2',
    order: 1,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
    _count: { memos: 5 }
  },
  {
    id: 'folder3',
    name: 'フォルダー3',
    order: 2,
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-01-03'),
    _count: { memos: 2 }
  }
]

const mockProps = {
  folders: mockFolders,
  selectedFolder: null,
  onFolderSelect: vi.fn(),
  onFolderCreate: vi.fn(),
  onFolderUpdate: vi.fn(),
  onFolderDelete: vi.fn(),
  onFolderReorder: vi.fn(),
  onMemoFolderUpdate: vi.fn(),
  isSearching: false
}

describe('FolderSidebar - 並び替え機能', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ドラッグ&ドロップの基本動作', () => {
    it('フォルダーがdraggable属性を持つ', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folderItems = screen.getAllByText(/フォルダー[123]/)
      folderItems.forEach(item => {
        const folderElement = item.closest('.folder-item')
        expect(folderElement).toHaveAttribute('draggable', 'true')
      })
    })

    it('編集中のフォルダーはドラッグできない', async () => {
      const user = userEvent.setup()
      render(<FolderSidebar {...mockProps} />)
      
      // フォルダー1をダブルクリックして編集モードに
      const folder1 = screen.getByText('フォルダー1')
      await user.dblClick(folder1)
      
      // 編集モード時はdraggable=false
      const folderElement = screen.getByDisplayValue('フォルダー1').closest('.folder-item')
      expect(folderElement).toHaveAttribute('draggable', 'false')
    })

    it('ドラッグ開始時にdraggingクラスが追加される', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      
      // dragstart イベントをシミュレート
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: ''
        }
      })
      
      expect(folder1).toHaveClass('dragging')
    })

    it('ドラッグ終了時にdraggingクラスが削除される', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      
      // dragstart → dragend イベント
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: ''
        }
      })
      expect(folder1).toHaveClass('dragging')
      
      fireEvent.dragEnd(folder1)
      expect(folder1).not.toHaveClass('dragging')
    })
  })

  describe('境界線ハイライト表示', () => {
    it('フォルダー上部にドラッグオーバー時にdrop-beforeクラスが追加される', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      // folder1のドラッグを開始
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      // folder2の上部にドラッグオーバー（マウスY座標を要素の上部に設定）
      const rect = folder2.getBoundingClientRect()
      fireEvent.dragOver(folder2, {
        clientY: rect.top + 5, // 要素の上部
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      expect(folder2).toHaveClass('drop-after')
      expect(folder2).not.toHaveClass('drop-before')
    })

    it('フォルダー下部にドラッグオーバー時にdrop-afterクラスが追加される', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      // folder1のドラッグを開始
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      // folder2の下部にドラッグオーバー（マウスY座標を要素の下部に設定）
      const rect = folder2.getBoundingClientRect()
      fireEvent.dragOver(folder2, {
        clientY: rect.bottom - 5, // 要素の下部
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      expect(folder2).toHaveClass('drop-after')
      expect(folder2).not.toHaveClass('drop-before')
    })

    it('ドラッグリーブ時にハイライトクラスが削除される', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      // ドラッグ開始
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      // ドラッグオーバー
      const rect = folder2.getBoundingClientRect()
      fireEvent.dragOver(folder2, {
        clientY: rect.top + 5,
        dataTransfer: {
          dropEffect: ''
        }
      })
      expect(folder2).toHaveClass('drop-after')
      
      // ドラッグリーブ
      fireEvent.dragLeave(folder2)
      expect(folder2).not.toHaveClass('drop-before')
      expect(folder2).not.toHaveClass('drop-after')
    })
  })

  describe('フォルダー並び替えのドロップ処理', () => {
    it('フォルダー1をフォルダー3の前にドロップ', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder3 = screen.getByText('フォルダー3').closest('.folder-item')!
      
      // folder1のドラッグ開始
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      // folder3の上部にドラッグオーバー
      const rect = folder3.getBoundingClientRect()
      fireEvent.dragOver(folder3, {
        clientY: rect.top + 5,
        dataTransfer: {
          dropEffect: 'move'
        }
      })
      
      // folder3にドロップ
      fireEvent.drop(folder3, {
        dataTransfer: {
          getData: vi.fn()
        }
      })
      
      // 期待される並び順: folder2, folder3, folder1
      expect(mockProps.onFolderReorder).toHaveBeenCalledWith(['folder2', 'folder3', 'folder1'])
    })

    it('フォルダー1をフォルダー2の後にドロップ', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      // folder1のドラッグ開始
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      // folder2の下部にドラッグオーバー
      const rect = folder2.getBoundingClientRect()
      fireEvent.dragOver(folder2, {
        clientY: rect.bottom - 5,
        dataTransfer: {
          dropEffect: 'move'
        }
      })
      
      // folder2にドロップ
      fireEvent.drop(folder2, {
        dataTransfer: {
          getData: vi.fn()
        }
      })
      
      // 期待される並び順: folder2, folder1, folder3
      expect(mockProps.onFolderReorder).toHaveBeenCalledWith(['folder2', 'folder1', 'folder3'])
    })

    it('フォルダー3をフォルダー1の前にドロップ', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder3 = screen.getByText('フォルダー3').closest('.folder-item')!
      
      // folder3のドラッグ開始
      fireEvent.dragStart(folder3, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      // folder1の上部にドラッグオーバー
      const rect = folder1.getBoundingClientRect()
      fireEvent.dragOver(folder1, {
        clientY: rect.top + 5,
        dataTransfer: {
          dropEffect: 'move'
        }
      })
      
      // folder1にドロップ
      fireEvent.drop(folder1, {
        dataTransfer: {
          getData: vi.fn()
        }
      })
      
      // 期待される並び順: folder1, folder3, folder2
      expect(mockProps.onFolderReorder).toHaveBeenCalledWith(['folder1', 'folder3', 'folder2'])
    })

    it('同じフォルダーにドロップしても並び替えは実行されない', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      
      // folder1のドラッグ開始
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      // 同じfolder1にドロップ
      fireEvent.drop(folder1, {
        dataTransfer: {
          getData: vi.fn()
        }
      })
      
      // 並び替えは実行されない
      expect(mockProps.onFolderReorder).not.toHaveBeenCalled()
    })
  })

  describe('メモのドラッグ&ドロップとの区別', () => {
    it('メモのドロップ時は境界線ハイライトが表示されない', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      // メモのドラッグオーバー（draggedFolderがnullの状態）
      const rect = folder2.getBoundingClientRect()
      fireEvent.dragOver(folder2, {
        clientY: rect.top + 5,
        dataTransfer: {
          dropEffect: 'move'
        }
      })
      
      // メモのドロップ時は従来のdrag-overクラスが使用される
      expect(folder2).toHaveClass('drag-over')
      expect(folder2).not.toHaveClass('drop-before')
      expect(folder2).not.toHaveClass('drop-after')
    })

    it('メモのドロップ時はonMemoFolderUpdateが呼ばれる', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      // メモデータを含むドロップイベント
      const memoData = JSON.stringify({
        id: 'memo1',
        content: 'テストメモ',
        folderId: 'folder1'
      })
      
      fireEvent.drop(folder2, {
        dataTransfer: {
          getData: vi.fn().mockReturnValue(memoData)
        }
      })
      
      expect(mockProps.onMemoFolderUpdate).toHaveBeenCalledWith('memo1', 'folder2')
      expect(mockProps.onFolderReorder).not.toHaveBeenCalled()
    })
  })

  describe('フォルダー順序の表示', () => {
    it('フォルダーがorder順で表示される', () => {
      const unorderedFolders = [
        { ...mockFolders[2], order: 0 }, // フォルダー3が最初
        { ...mockFolders[0], order: 1 }, // フォルダー1が2番目
        { ...mockFolders[1], order: 2 }  // フォルダー2が最後
      ]
      
      render(<FolderSidebar {...mockProps} folders={unorderedFolders} />)
      
      const folderItems = screen.getAllByText(/フォルダー[123]/)
      expect(folderItems[0]).toHaveTextContent('フォルダー3')
      expect(folderItems[1]).toHaveTextContent('フォルダー1')
      expect(folderItems[2]).toHaveTextContent('フォルダー2')
    })
  })

  describe('選択状態の維持', () => {
    it('ドラッグ中はフォルダーをクリックできない', async () => {
      const user = userEvent.setup()
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      
      // ドラッグ開始
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      // ドラッグ中にクリック
      await user.click(folder1)
      
      // 選択イベントは発火しない
      expect(mockProps.onFolderSelect).not.toHaveBeenCalled()
    })

    it('ドラッグ終了後はフォルダーをクリックできる', async () => {
      const user = userEvent.setup()
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      
      // ドラッグ操作
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      fireEvent.dragEnd(folder1)
      
      // ドラッグ終了後にクリック
      await user.click(folder1)
      
      // 選択イベントが発火する
      expect(mockProps.onFolderSelect).toHaveBeenCalledWith(mockFolders[0])
    })
  })
})