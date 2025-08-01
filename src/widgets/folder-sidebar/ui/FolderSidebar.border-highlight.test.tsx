import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

describe('FolderSidebar - 境界線ハイライト表示', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('境界線位置の判定', () => {
    it('要素の上半分でdrop-afterクラスが設定される（実装による）', () => {
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
      
      // folder2の上部にドラッグオーバー（getBoundingClientRectをモック）
      const mockGetBoundingClientRect = vi.fn().mockReturnValue({
        top: 100,
        bottom: 150,
        height: 50,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({})
      } as DOMRect)
      
      folder2.getBoundingClientRect = mockGetBoundingClientRect
      
      fireEvent.dragOver(folder2, {
        clientY: 110, // 要素の上部（center:125より小さい値）
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      expect(folder2).toHaveClass('drop-after')
      expect(folder2).not.toHaveClass('drop-before')
    })

    it('要素の下半分でdrop-afterクラスが設定される', () => {
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
      
      // folder2の下部にドラッグオーバー
      vi.spyOn(folder2, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 150,
        height: 50,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({})
      } as DOMRect)
      
      fireEvent.dragOver(folder2, {
        clientY: 140, // 要素の下部（center:125より下）
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      expect(folder2).toHaveClass('drop-after')
      expect(folder2).not.toHaveClass('drop-before')
    })

    it('要素の中央ちょうどではdrop-afterクラスが設定される', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      vi.spyOn(folder2, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 150,
        height: 50,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({})
      } as DOMRect)
      
      fireEvent.dragOver(folder2, {
        clientY: 125, // 要素の中央（top:100 + height:50/2）
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      // 中央の場合はafter（境界値テスト：mouseY < centerY が false）
      expect(folder2).toHaveClass('drop-after')
      expect(folder2).not.toHaveClass('drop-before')
    })
  })

  describe('フォルダードラッグとメモドラッグの区別', () => {
    it('フォルダードラッグ時のみ境界線ハイライトが表示される', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      // フォルダードラッグ開始
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      vi.spyOn(folder2, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 150,
        height: 50,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({})
      } as DOMRect)
      
      fireEvent.dragOver(folder2, {
        clientY: 110,
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      // フォルダードラッグ時は境界線ハイライトが表示
      expect(folder2).toHaveClass('drop-after')
      expect(folder2).not.toHaveClass('drag-over')
    })

    it('メモドラッグ時は従来のdrag-overクラスが使用される', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      // メモドラッグ（draggedFolderがnullの状態）
      vi.spyOn(folder2, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 150,
        height: 50,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({})
      } as DOMRect)
      
      fireEvent.dragOver(folder2, {
        clientY: 110,
        dataTransfer: {
          dropEffect: 'move'
        }
      })
      
      // メモドラッグ時は従来のハイライト
      expect(folder2).toHaveClass('drag-over')
      expect(folder2).not.toHaveClass('drop-before')
      expect(folder2).not.toHaveClass('drop-after')
    })

    it('All Notesフォルダーでも境界線ハイライトが正しく動作する', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const allNotes = screen.getByText('All Notes').closest('.folder-item')!
      
      // フォルダードラッグ開始
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      vi.spyOn(allNotes, 'getBoundingClientRect').mockReturnValue({
        top: 50,
        bottom: 100,
        height: 50,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 50,
        toJSON: () => ({})
      } as DOMRect)
      
      fireEvent.dragOver(allNotes, {
        clientY: 60,
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      // All Notesフォルダーには境界線ハイライトが適用されない
      expect(allNotes).not.toHaveClass('drop-before')
      expect(allNotes).not.toHaveClass('drop-after')
    })
  })

  describe('境界線クラスのクリア処理', () => {
    it('dragLeave時に境界線クラスがクリアされる', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      // ドラッグ開始とオーバー
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      vi.spyOn(folder2, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 150,
        height: 50,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({})
      } as DOMRect)
      
      fireEvent.dragOver(folder2, {
        clientY: 110,
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

    it('ドロップ時に境界線クラスがクリアされる', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      // ドラッグ操作
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      vi.spyOn(folder2, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 150,
        height: 50,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({})
      } as DOMRect)
      
      fireEvent.dragOver(folder2, {
        clientY: 110,
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      expect(folder2).toHaveClass('drop-after')
      
      // ドロップ
      fireEvent.drop(folder2, {
        dataTransfer: {
          getData: vi.fn()
        }
      })
      
      expect(folder2).not.toHaveClass('drop-before')
      expect(folder2).not.toHaveClass('drop-after')
    })

    it('dragEnd時に境界線クラスがクリアされる', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      // ドラッグ操作
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      vi.spyOn(folder2, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 150,
        height: 50,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({})
      } as DOMRect)
      
      fireEvent.dragOver(folder2, {
        clientY: 110,
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      expect(folder2).toHaveClass('drop-after')
      
      // ドラッグ終了
      fireEvent.dragEnd(folder1)
      
      expect(folder2).not.toHaveClass('drop-before')
      expect(folder2).not.toHaveClass('drop-after')
    })
  })

  describe('同一フォルダーへのドラッグ処理', () => {
    it('同一フォルダーでは境界線ハイライトが表示されない', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      
      // 同じフォルダーでドラッグ開始
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      vi.spyOn(folder1, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 150,
        height: 50,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({})
      } as DOMRect)
      
      // 同じフォルダーにドラッグオーバー
      fireEvent.dragOver(folder1, {
        clientY: 110,
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      // 同一フォルダーでは境界線ハイライトは表示されない
      expect(folder1).not.toHaveClass('drop-before')
      expect(folder1).not.toHaveClass('drop-after')
    })
  })

  describe('複雑なドラッグシナリオ', () => {
    it('複数のフォルダーを経由するドラッグでハイライトが正しく切り替わる', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      const folder3 = screen.getByText('フォルダー3').closest('.folder-item')!
      
      // ドラッグ開始
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      // folder2にドラッグオーバー
      vi.spyOn(folder2, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 150,
        height: 50,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({})
      } as DOMRect)
      
      fireEvent.dragOver(folder2, {
        clientY: 110,
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      expect(folder2).toHaveClass('drop-after')
      expect(folder3).not.toHaveClass('drop-before')
      expect(folder3).not.toHaveClass('drop-after')
      
      // folder3に移動
      fireEvent.dragLeave(folder2)
      
      vi.spyOn(folder3, 'getBoundingClientRect').mockReturnValue({
        top: 150,
        bottom: 200,
        height: 50,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 150,
        toJSON: () => ({})
      } as DOMRect)
      
      fireEvent.dragOver(folder3, {
        clientY: 180,
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      expect(folder2).not.toHaveClass('drop-before')
      expect(folder2).not.toHaveClass('drop-after')
      expect(folder3).toHaveClass('drop-after')
    })
  })

  describe('エッジケース', () => {
    it('getBoundingClientRectが異常な値を返しても正常に動作する', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      // 異常なrectを返す
      vi.spyOn(folder2, 'getBoundingClientRect').mockReturnValue({
        top: NaN,
        bottom: NaN,
        height: 0,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: NaN,
        toJSON: () => ({})
      } as DOMRect)
      
      // エラーが発生しないことを確認
      expect(() => {
        fireEvent.dragOver(folder2, {
          clientY: 110,
          dataTransfer: {
            dropEffect: ''
          }
        })
      }).not.toThrow()
    })

    it('極端に小さい要素でも位置判定が動作する', () => {
      render(<FolderSidebar {...mockProps} />)
      
      const folder1 = screen.getByText('フォルダー1').closest('.folder-item')!
      const folder2 = screen.getByText('フォルダー2').closest('.folder-item')!
      
      fireEvent.dragStart(folder1, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move'
        }
      })
      
      // 高さ2pxの極小要素
      vi.spyOn(folder2, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 102,
        height: 2,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({})
      } as DOMRect)
      
      fireEvent.dragOver(folder2, {
        clientY: 100, // 上端
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      expect(folder2).toHaveClass('drop-after')
      
      fireEvent.dragOver(folder2, {
        clientY: 102, // 下端
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      expect(folder2).toHaveClass('drop-after')
    })
  })
})