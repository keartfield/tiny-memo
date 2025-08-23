import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MemoEditor from './MemoEditor'
import { Memo } from '../../../entities/memo'
import { Folder } from '../../../entities/folder'

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

// ClipboardEventのモック
global.ClipboardEvent = class ClipboardEvent extends Event {
  clipboardData: any
  constructor(type: string, eventInitDict?: any) {
    super(type, eventInitDict)
    this.clipboardData = eventInitDict?.clipboardData || null
  }
}

// FileオブジェクトにarrayBufferメソッドを追加
Object.defineProperty(File.prototype, 'arrayBuffer', {
  value: vi.fn().mockImplementation(function(this: File) {
    return Promise.resolve(new ArrayBuffer(8))
  }),
  writable: true
})

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
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'フォルダー2',
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const mockProps = {
  memo: mockMemo,
  folders: mockFolders,
  onMemoUpdate: vi.fn()
}

describe('MemoEditor - 追加機能テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockElectronAPI.images.save.mockClear()
    mockElectronAPI.images.get.mockClear()
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('editモードでは編集エリアのみ表示される', async () => {
    render(<MemoEditor {...mockProps} />)
    
    // Editモードに切り替え
    fireEvent.click(screen.getByTitle('Edit'))
    
    // 編集エリアが表示され、プレビューエリアが非表示になることを確認
    const editArea = document.querySelector('.memo-editor-input.full-width')
    const previewArea = document.querySelector('.memo-editor-preview')
    
    expect(editArea).toBeInTheDocument()
    expect(previewArea).not.toBeInTheDocument()
  })

  it('previewモードではプレビューエリアのみ表示される', async () => {
    render(<MemoEditor {...mockProps} />)
    
    // Previewモードに切り替え
    fireEvent.click(screen.getByTitle('Preview'))
    
    // プレビューエリアが表示され、編集エリアが非表示になることを確認
    const editArea = document.querySelector('.memo-editor-input')
    const previewArea = document.querySelector('.memo-editor-preview.full-width')
    
    expect(editArea).not.toBeInTheDocument()
    expect(previewArea).toBeInTheDocument()
  })

  it('ドロップイベントでdrag-overが削除される', () => {
    render(<MemoEditor {...mockProps} />)
    
    const editor = document.querySelector('.memo-editor')!
    
    // ドラッグエンターでクラスを追加
    fireEvent.dragEnter(editor)
    expect(editor).toHaveClass('drag-over')
    
    // ドロップイベントでクラスが削除される
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    fireEvent.drop(editor, {
      dataTransfer: { files: [file] }
    })
    
    expect(editor).not.toHaveClass('drag-over')
  })

  it('複数行のblockquoteが正しくレンダリングされる', () => {
    const memoWithMultilineQuote: Memo = {
      ...mockMemo,
      content: '> 最初の引用行\n> 二番目の引用行\n> 三番目の引用行'
    }
    
    render(<MemoEditor {...mockProps} memo={memoWithMultilineQuote} />)
    
    const blockquote = document.querySelector('blockquote')
    expect(blockquote).toBeInTheDocument()
    expect(blockquote?.textContent).toContain('最初の引用行')
    expect(blockquote?.textContent).toContain('二番目の引用行')
    expect(blockquote?.textContent).toContain('三番目の引用行')
  })

  it('コードブロックの言語指定なしが正しく処理される', () => {
    const memoWithPlainCodeBlock: Memo = {
      ...mockMemo,
      content: '```\nconst hello = "world";\nconsole.log(hello);\n```'
    }
    
    render(<MemoEditor {...mockProps} memo={memoWithPlainCodeBlock} />)
    
    const preElement = document.querySelector('pre')
    const codeElement = document.querySelector('code')
    
    expect(preElement).toBeInTheDocument()
    expect(codeElement).toBeInTheDocument()
    expect(preElement?.className).toBe('')
    expect(codeElement?.className).toBe('')
  })

  it('空のコンテンツでもプレビューが正常に動作する', () => {
    const emptyMemo: Memo = {
      ...mockMemo,
      content: ''
    }
    
    render(<MemoEditor {...mockProps} memo={emptyMemo} />)
    
    const preview = document.querySelector('.markdown-preview')
    expect(preview).toBeInTheDocument()
    expect(preview?.children).toHaveLength(0)
  })

  it('メモなしの状態では画像処理は実行されない', () => {
    render(<MemoEditor {...mockProps} memo={null} />)
    
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const clipboardData = {
      items: [{
        type: 'image/png',
        getAsFile: () => file
      }]
    }
    
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: clipboardData as any
    })
    
    document.dispatchEvent(pasteEvent)
    
    // 画像保存が呼ばれないことを確認
    expect(mockElectronAPI.images.save).not.toHaveBeenCalled()
  })

  it('非画像ファイルのドロップは処理されない', () => {
    render(<MemoEditor {...mockProps} />)
    
    const editor = document.querySelector('.memo-editor')
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    fireEvent.drop(editor!, {
      dataTransfer: {
        files: [file]
      }
    })
    
    // 画像保存が呼ばれないことを確認
    expect(mockElectronAPI.images.save).not.toHaveBeenCalled()
  })
})
