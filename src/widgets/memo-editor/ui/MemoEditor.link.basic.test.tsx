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

describe('MemoEditor Link Integration Basic Tests', () => {
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

  describe('Component Rendering', () => {
    it('should render MemoEditor with link content', () => {
      render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Check that the component renders
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByDisplayValue(/Check out/)).toBeInTheDocument()
    })

    it('should render LinkHighlighter in edit mode', () => {
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

      // Check that LinkHighlighter overlay exists
      const overlay = container.querySelector('.url-highlight-overlay')
      expect(overlay).toBeInTheDocument()
    })

    it('should render LinkHighlighter in edit-preview mode (default)', () => {
      const { container } = render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Default mode should have LinkHighlighter
      const overlay = container.querySelector('.url-highlight-overlay')
      expect(overlay).toBeInTheDocument()
    })

    it('should not render LinkHighlighter in preview-only mode', () => {
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
      const overlay = container.querySelector('.url-highlight-overlay')
      expect(overlay).not.toBeInTheDocument()

      // But preview links should be present
      const previewLinks = container.querySelectorAll('.markdown-preview a')
      expect(previewLinks.length).toBeGreaterThan(0)
    })
  })

  describe('Text Input Functionality', () => {
    it('should allow text input in edit mode', async () => {
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

      // Get the textarea and modify content
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { 
        target: { value: 'New content with https://new-link.com here.' } 
      })

      expect(textarea).toHaveValue('New content with https://new-link.com here.')
    })

    it('should allow text input in edit-preview mode', async () => {
      render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Default is edit-preview mode
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { 
        target: { value: 'Updated content with [link](https://example.com)' } 
      })

      expect(textarea).toHaveValue('Updated content with [link](https://example.com)')
    })
  })

  describe('Link Content Rendering', () => {
    it('should render link content in LinkHighlighter overlay', () => {
      const { container } = render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Check LinkHighlighter content
      const overlay = container.querySelector('.url-highlight-overlay')
      expect(overlay).toHaveTextContent('Google')
      expect(overlay).toHaveTextContent('https://github.com')
      expect(overlay).toHaveTextContent('Check out')
      expect(overlay).toHaveTextContent('and visit')
      expect(overlay).toHaveTextContent('for code.')
    })

    it('should update content when memo changes', async () => {
      const newMemo: Memo = {
        ...mockMemo,
        id: 'new-test-memo', // Different ID to trigger update
        content: 'Different content with [New Link](https://newsite.com)'
      }

      const { container, rerender } = render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Initial content
      let overlay = container.querySelector('.url-highlight-overlay')
      expect(overlay).toHaveTextContent('Google')

      // Update memo with different ID
      rerender(
        <MemoEditor
          memo={newMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Wait for content update
      await waitFor(() => {
        const textarea = screen.getByRole('textbox')
        expect(textarea).toHaveValue('Different content with [New Link](https://newsite.com)')
      })

      // Content should update in overlay
      overlay = container.querySelector('.url-highlight-overlay')
      expect(overlay).toHaveTextContent('New Link')
      expect(overlay).toHaveTextContent('Different content')
    })
  })

  describe('Mode Switching', () => {
    it('should maintain LinkHighlighter when switching between edit and edit-preview', () => {
      const { container } = render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Start in edit-preview mode
      expect(container.querySelector('.url-highlight-overlay')).toBeInTheDocument()

      // Switch to edit mode
      const editButton = screen.getByTitle('Edit')
      fireEvent.click(editButton)
      expect(container.querySelector('.url-highlight-overlay')).toBeInTheDocument()

      // Switch back to edit-preview mode
      const editPreviewButton = screen.getByTitle('Edit & Preview')
      fireEvent.click(editPreviewButton)
      expect(container.querySelector('.url-highlight-overlay')).toBeInTheDocument()
    })

    it('should remove LinkHighlighter in preview mode and restore when switching back', () => {
      const { container } = render(
        <MemoEditor
          memo={mockMemo}
          folders={mockFolders}
          onMemoUpdate={mockOnMemoUpdate}
          onMemoFolderUpdate={mockOnMemoFolderUpdate}
        />
      )

      // Start with LinkHighlighter present
      expect(container.querySelector('.url-highlight-overlay')).toBeInTheDocument()

      // Switch to preview mode
      const previewButton = screen.getByTitle('Preview')
      fireEvent.click(previewButton)
      expect(container.querySelector('.url-highlight-overlay')).not.toBeInTheDocument()

      // Switch back to edit-preview mode
      const editPreviewButton = screen.getByTitle('Edit & Preview')
      fireEvent.click(editPreviewButton)
      expect(container.querySelector('.url-highlight-overlay')).toBeInTheDocument()
    })
  })
})
