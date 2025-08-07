import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import MemoEditor from './MemoEditor'
import { Memo } from '../../../entities/memo'
import { Folder } from '../../../entities/folder'

// Mock window.electronAPI
const mockOpenExternal = vi.fn()
Object.defineProperty(window, 'electronAPI', {
  value: {
    openExternal: mockOpenExternal
  },
  writable: true
})

// Mock DOM methods for LinkHighlighter
beforeAll(() => {
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
    x: 0,
    y: 0,
    toJSON: vi.fn()
  }))

  Object.defineProperty(window, 'getComputedStyle', {
    value: vi.fn(() => ({
      fontFamily: 'SF Mono, Monaco, Cascadia Code, monospace',
      fontSize: '14px',
      lineHeight: '1.6',
      padding: '20px',
      paddingLeft: '20px',
      paddingRight: '20px',
      paddingTop: '20px',
      paddingBottom: '20px',
      width: '800px',
      height: '600px',
      border: 'none',
      fontWeight: 'normal',
      letterSpacing: 'normal',
      wordSpacing: 'normal',
      textTransform: 'none',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
      boxSizing: 'border-box'
    })),
    writable: true
  })
})

describe('MemoEditor Link Integration', () => {
  const mockMemo: Memo = {
    id: 'test-memo',
    content: 'Check out [Google](https://google.com) and visit https://github.com for code.',
    createdAt: new Date(),
    updatedAt: new Date(),
    folderId: null
  }

  const mockFolders: Folder[] = []
  const mockOnMemoUpdate = vi.fn()
  const mockOnMemoFolderUpdate = vi.fn()

  beforeEach(() => {
    mockOpenExternal.mockClear()
    mockOnMemoUpdate.mockClear()
    mockOnMemoFolderUpdate.mockClear()
  })

  describe('Edit Mode', () => {
    it('should display links with highlighting in edit mode', () => {
      const { container } = render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Switch to edit mode
      const editButton = screen.getByTitle('Edit')
      fireEvent.click(editButton)

      // Check that LinkHighlighter is rendered
      const overlay = container.querySelector('.link-highlighter-overlay')
      expect(overlay).toBeInTheDocument()

      // Check that links are highlighted
      const linkElements = container.querySelectorAll('span[style*="cursor: pointer"]')
      expect(linkElements).toHaveLength(2)

      expect(linkElements[0]).toHaveTextContent('Google')
      expect(linkElements[1]).toHaveTextContent('https://github.com')
    })

    it('should open external links when clicked in edit mode', () => {
      const { container } = render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Switch to edit mode
      const editButton = screen.getByTitle('Edit')
      fireEvent.click(editButton)

      // Click on the first link (Google)
      const linkElements = container.querySelectorAll('span[style*="cursor: pointer"]')
      fireEvent.click(linkElements[0])

      expect(mockOpenExternal).toHaveBeenCalledWith('https://google.com')
    })

    it('should allow text input while links are highlighted', async () => {
      render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Switch to edit mode
      const editButton = screen.getByTitle('Edit')
      fireEvent.click(editButton)

      // Get the textarea
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()

      // Clear and type new content
      fireEvent.change(textarea, { 
        target: { value: 'New content with https://new-link.com here.' } 
      })

      // Verify the content changed
      expect(textarea).toHaveValue('New content with https://new-link.com here.')

      // Wait for auto-save debounce
      await waitFor(() => {
        expect(mockOnMemoUpdate).toHaveBeenCalledWith(
          'test-memo', 
          'New content with https://new-link.com here.'
        )
      }, { timeout: 1000 })
    })

    it('should update link highlighting when content changes', () => {
      const { container } = render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Switch to edit mode
      const editButton = screen.getByTitle('Edit')
      fireEvent.click(editButton)

      // Initial links
      let linkElements = container.querySelectorAll('span[style*="cursor: pointer"]')
      expect(linkElements).toHaveLength(2)

      // Change content
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { 
        target: { value: 'Only one link now: https://single-link.com' } 
      })

      // Links should update
      linkElements = container.querySelectorAll('span[style*="cursor: pointer"]')
      expect(linkElements).toHaveLength(1)
      expect(linkElements[0]).toHaveTextContent('https://single-link.com')
    })
  })

  describe('Edit-Preview Mode', () => {
    it('should display links with highlighting in edit-preview mode', () => {
      const { container } = render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Default mode is edit-preview, so LinkHighlighter should be present
      const overlay = container.querySelector('.link-highlighter-overlay')
      expect(overlay).toBeInTheDocument()

      // Check that links are highlighted in the editor pane
      const linkElements = container.querySelectorAll('span[style*="cursor: pointer"]')
      expect(linkElements).toHaveLength(2)

      // Check that preview pane also has links
      const previewLinks = container.querySelectorAll('.markdown-preview a')
      expect(previewLinks).toHaveLength(2)
    })

    it('should sync link highlighting between edit and preview panes', () => {
      const { container } = render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Change content in edit pane
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { 
        target: { value: 'New [link text](https://example.com) added.' } 
      })

      // Check editor highlighting
      const editorLinks = container.querySelectorAll('.memo-editor-input span[style*="cursor: pointer"]')
      expect(editorLinks).toHaveLength(1)
      expect(editorLinks[0]).toHaveTextContent('link text')

      // Check preview links
      const previewLinks = container.querySelectorAll('.markdown-preview a')
      expect(previewLinks).toHaveLength(1)
      expect(previewLinks[0]).toHaveTextContent('link text')
      expect(previewLinks[0]).toHaveAttribute('href', 'https://example.com')
    })
  })

  describe('Preview Mode', () => {
    it('should not show LinkHighlighter in preview-only mode', () => {
      const { container } = render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Switch to preview mode
      const previewButton = screen.getByTitle('Preview')
      fireEvent.click(previewButton)

      // LinkHighlighter should not be present
      const overlay = container.querySelector('.link-highlighter-overlay')
      expect(overlay).not.toBeInTheDocument()

      // But preview links should be present
      const previewLinks = container.querySelectorAll('.markdown-preview a')
      expect(previewLinks).toHaveLength(2)
    })

    it('should open external links when clicked in preview mode', () => {
      const { container } = render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Switch to preview mode
      const previewButton = screen.getByTitle('Preview')
      fireEvent.click(previewButton)

      // Click on a preview link
      const previewLinks = container.querySelectorAll('.markdown-preview a')
      fireEvent.click(previewLinks[0])

      expect(mockOpenExternal).toHaveBeenCalledWith('https://google.com')
    })
  })

  describe('Link Types', () => {
    it('should handle markdown links correctly', () => {
      const memoWithMarkdownLink: Memo = {
        ...mockMemo,
        content: 'Visit [OpenAI](https://openai.com) for AI info.'
      }

      const { container } = render(
        <MemoEditor
          memo={memoWithMarkdownLink}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Switch to edit mode
      const editButton = screen.getByTitle('Edit')
      fireEvent.click(editButton)

      const linkElements = container.querySelectorAll('span[style*="cursor: pointer"]')
      expect(linkElements).toHaveLength(1)
      expect(linkElements[0]).toHaveTextContent('OpenAI')

      // Click link
      fireEvent.click(linkElements[0])
      expect(mockOpenExternal).toHaveBeenCalledWith('https://openai.com')
    })

    it('should handle plain URLs correctly', () => {
      const memoWithPlainUrl: Memo = {
        ...mockMemo,
        content: 'Check out https://github.com/microsoft/vscode for code editor.'
      }

      const { container } = render(
        <MemoEditor
          memo={memoWithPlainUrl}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Switch to edit mode
      const editButton = screen.getByTitle('Edit')
      fireEvent.click(editButton)

      const linkElements = container.querySelectorAll('span[style*="cursor: pointer"]')
      expect(linkElements).toHaveLength(1)
      expect(linkElements[0]).toHaveTextContent('https://github.com/microsoft/vscode')

      // Click link
      fireEvent.click(linkElements[0])
      expect(mockOpenExternal).toHaveBeenCalledWith('https://github.com/microsoft/vscode')
    })

    it('should handle mixed link types correctly', () => {
      const memoWithMixedLinks: Memo = {
        ...mockMemo,
        content: 'Check [GitHub](https://github.com) and also https://stackoverflow.com'
      }

      const { container } = render(
        <MemoEditor
          memo={memoWithMixedLinks}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Switch to edit mode
      const editButton = screen.getByTitle('Edit')
      fireEvent.click(editButton)

      const linkElements = container.querySelectorAll('span[style*="cursor: pointer"]')
      expect(linkElements).toHaveLength(2)
      
      expect(linkElements[0]).toHaveTextContent('GitHub')
      expect(linkElements[1]).toHaveTextContent('https://stackoverflow.com')

      // Test both links
      fireEvent.click(linkElements[0])
      expect(mockOpenExternal).toHaveBeenCalledWith('https://github.com')

      fireEvent.click(linkElements[1])
      expect(mockOpenExternal).toHaveBeenCalledWith('https://stackoverflow.com')
    })
  })
})
