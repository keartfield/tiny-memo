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

describe('LinkHighlighter', () => {
  let textareaRef: React.RefObject<HTMLTextAreaElement>

  beforeEach(() => {
    textareaRef = React.createRef() as React.RefObject<HTMLTextAreaElement>
    mockOpenExternal.mockClear()
    
    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))

    // Mock MutationObserver
    global.MutationObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    }))

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((callback) => callback())

    // Mock getBoundingClientRect for DOM measurements
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

    // Mock getComputedStyle
    Object.defineProperty(window, 'getComputedStyle', {
      value: vi.fn(() => ({
        fontFamily: 'monospace',
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

  const renderWithTextarea = (content: string, onLinkClick?: (url: string) => void) => {
    return render(
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={content}
          readOnly
          data-testid="textarea"
          style={{
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.6',
            padding: '20px'
          }}
        />
        <LinkHighlighter
          content={content}
          textareaRef={textareaRef}
          onLinkClick={onLinkClick}
        />
      </div>
    )
  }

  it('should render overlay when content has no links', () => {
    const { container } = renderWithTextarea('This is plain text without links.')
    
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
    
    // Should have transparent text but no URL elements
    const transparentElements = container.querySelectorAll('.text-transparent')
    expect(transparentElements.length).toBeGreaterThan(0)
    
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(0)
  })

  it('should render markdown links with proper styling', () => {
    const { container } = renderWithTextarea('Check out [Google](https://google.com) for search.')
    
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(1)
    
    const linkElement = urlElements[0]
    expect(linkElement).toHaveTextContent('Google')
    expect(linkElement).toHaveClass('url-text')
  })

  it('should render plain URLs with proper styling', () => {
    const { container } = renderWithTextarea('Visit https://example.com for more info.')
    
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(1)
    
    const linkElement = urlElements[0]
    expect(linkElement).toHaveTextContent('https://example.com')
    expect(linkElement).toHaveClass('url-text')
  })

  it('should handle empty content', () => {
    const { container } = renderWithTextarea('')
    
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
  })

  it('should handle mixed content with both markdown and plain URLs', () => {
    const content = 'Check [Google](https://google.com) and visit https://github.com'
    const { container } = renderWithTextarea(content)
    
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(2)
    
    expect(urlElements[0]).toHaveTextContent('Google')
    expect(urlElements[1]).toHaveTextContent('https://github.com')
  })

  it('should call onLinkClick when URL is clicked', () => {
    const mockOnLinkClick = vi.fn()
    const content = 'Visit https://example.com for more info'
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

  it('should handle complex URLs', () => {
    const content = 'API: https://api.example.com/v1/users?filter=active&sort=name#section'
    const { container } = renderWithTextarea(content)
    
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(1)
    expect(urlElements[0]).toHaveTextContent('https://api.example.com/v1/users?filter=active&sort=name#section')
  })

  it('should handle multiline content', () => {
    const content = 'Line 1: https://example.com\nLine 2: [Test](https://test.com)\nLine 3: normal text'
    const { container } = renderWithTextarea(content)
    
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(2)
  })

  it('should maintain text structure with transparent and colored elements', () => {
    const content = 'Before [link](https://example.com) after'
    const { container } = renderWithTextarea(content)
    
    // Should have both transparent text and URL elements
    const transparentElements = container.querySelectorAll('.text-transparent')
    const urlElements = container.querySelectorAll('.url-text')
    
    expect(transparentElements.length).toBeGreaterThan(0)
    expect(urlElements).toHaveLength(1)
    expect(urlElements[0]).toHaveTextContent('link')
  })
})