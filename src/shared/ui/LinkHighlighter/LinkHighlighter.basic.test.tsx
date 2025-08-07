import React from 'react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { LinkHighlighter } from './LinkHighlighter'

// Mock window.electronAPI
const mockOpenExternal = vi.fn()
Object.defineProperty(window, 'electronAPI', {
  value: {
    openExternal: mockOpenExternal
  },
  writable: true
})

describe('LinkHighlighter Basic Tests', () => {
  let textareaRef: React.RefObject<HTMLTextAreaElement | null>

  beforeEach(() => {
    textareaRef = React.createRef()
    mockOpenExternal.mockClear()
  })

  const renderWithTextarea = (content: string) => {
    return render(
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={content}
          readOnly
          data-testid="textarea"
        />
        <LinkHighlighter
          content={content}
          textareaRef={textareaRef}
        />
      </div>
    )
  }

  it('should render LinkHighlighter component without crashing', () => {
    const { container } = renderWithTextarea('Plain text without links')
    
    const overlay = container.querySelector('.link-highlighter-overlay')
    expect(overlay).toBeInTheDocument()
  })

  it('should render empty content without issues', () => {
    const { container } = renderWithTextarea('')
    
    const overlay = container.querySelector('.link-highlighter-overlay')
    expect(overlay).toBeInTheDocument()
  })

  it('should render content with markdown links', () => {
    const content = 'Check out [Google](https://google.com) for search.'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.link-highlighter-overlay')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveTextContent('Google')
    expect(overlay).toHaveTextContent('Check out')
    expect(overlay).toHaveTextContent('for search.')
  })

  it('should render content with plain URLs', () => {
    const content = 'Visit https://example.com for more info.'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.link-highlighter-overlay')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveTextContent('https://example.com')
  })

  it('should handle mixed content with both link types', () => {
    const content = 'Check [Google](https://google.com) and https://github.com'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.link-highlighter-overlay')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveTextContent('Google')
    expect(overlay).toHaveTextContent('https://github.com')
  })

  it('should handle multiline content', () => {
    const content = 'Line 1 with https://example.com\nLine 2 with [Link](https://test.com)'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.link-highlighter-overlay')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveTextContent('https://example.com')
    expect(overlay).toHaveTextContent('Link')
  })

  it('should preserve all text content including non-link text', () => {
    const content = 'Before [link](https://example.com) middle text and after'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.link-highlighter-overlay')
    expect(overlay).toBeInTheDocument()
    
    // All text should be preserved
    expect(overlay).toHaveTextContent('Before')
    expect(overlay).toHaveTextContent('link')
    expect(overlay).toHaveTextContent('middle text and after')
  })

  it('should not crash with complex URLs', () => {
    const content = 'API: https://api.example.com/v1/users?filter=active&sort=name#section'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.link-highlighter-overlay')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveTextContent('API:')
  })
})
