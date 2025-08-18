import React from 'react'
import { render, fireEvent } from '@testing-library/react'
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

  const renderWithTextarea = (content: string, onLinkClick?: (url: string) => void) => {
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
          onLinkClick={onLinkClick}
        />
      </div>
    )
  }

  it('should render LinkHighlighter component without crashing', () => {
    const { container } = renderWithTextarea('Plain text without links')
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
  })

  it('should render empty content without issues', () => {
    const { container } = renderWithTextarea('')
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
  })

  it('should render content with markdown links', () => {
    const content = 'Check out [Google](https://google.com) for search.'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
    
    // Should contain URL text elements
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(1)
    expect(urlElements[0]).toHaveTextContent('Google')
  })

  it('should render content with plain URLs', () => {
    const content = 'Visit https://example.com for more info.'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
    
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(1)
    expect(urlElements[0]).toHaveTextContent('https://example.com')
  })

  it('should handle mixed content with both link types', () => {
    const content = 'Check [Google](https://google.com) and https://github.com'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
    
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(2)
    expect(urlElements[0]).toHaveTextContent('Google')
    expect(urlElements[1]).toHaveTextContent('https://github.com')
  })

  it('should handle multiline content', () => {
    const content = 'Line 1 with https://example.com\nLine 2 with [Link](https://test.com)'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
    
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(2)
  })

  it('should preserve all text content including non-link text', () => {
    const content = 'Before [link](https://example.com) middle text and after'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
    
    // Check for transparent text elements
    const transparentElements = container.querySelectorAll('.text-transparent')
    expect(transparentElements.length).toBeGreaterThan(0)
    
    // Check for URL element
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(1)
    expect(urlElements[0]).toHaveTextContent('link')
  })

  it('should call onLinkClick when URL is clicked', () => {
    const mockOnLinkClick = vi.fn()
    const content = 'Check out https://example.com'
    const { container } = renderWithTextarea(content, mockOnLinkClick)
    
    const urlElement = container.querySelector('.url-text')
    expect(urlElement).toBeInTheDocument()
    
    fireEvent.click(urlElement!)
    expect(mockOnLinkClick).toHaveBeenCalledWith('https://example.com')
  })

  it('should use electronAPI when onLinkClick is not provided', () => {
    const content = 'Visit https://example.com'
    const { container } = renderWithTextarea(content)
    
    const urlElement = container.querySelector('.url-text')
    expect(urlElement).toBeInTheDocument()
    
    fireEvent.click(urlElement!)
    expect(mockOpenExternal).toHaveBeenCalledWith('https://example.com')
  })

  it('should not crash with complex URLs', () => {
    const content = 'API: https://api.example.com/v1/users?filter=active&sort=name#section'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
    
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(1)
  })
})