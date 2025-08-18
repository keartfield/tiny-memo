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

// Mock DOM APIs
beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  global.MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
  }))

  global.requestAnimationFrame = vi.fn((callback) => callback())

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
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.6',
      padding: '20px',
      paddingLeft: '20px',
      paddingRight: '20px',
      paddingTop: '20px',
      paddingBottom: '20px',
      width: '800px',
      height: '600px'
    })),
    writable: true
  })
})

describe('LinkHighlighter Simple Tests', () => {
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

  it('should render LinkHighlighter component', () => {
    const { container } = renderWithTextarea('Plain text without links')
    
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
  })

  it('should render content with links highlighted', () => {
    const content = 'Check out [Google](https://google.com) for search.'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
    
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(1)
    expect(urlElements[0]).toHaveTextContent('Google')
  })

  it('should render plain URLs', () => {
    const content = 'Visit https://example.com for more info.'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
    
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(1)
    expect(urlElements[0]).toHaveTextContent('https://example.com')
  })

  it('should handle empty content', () => {
    const { container } = renderWithTextarea('')
    
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
  })

  it('should handle multiline content', () => {
    const content = 'Line 1 with https://example.com\nLine 2 with [Link](https://test.com)'
    const { container } = renderWithTextarea(content)
    
    const overlay = container.querySelector('.url-highlight-overlay')
    expect(overlay).toBeInTheDocument()
    
    const urlElements = container.querySelectorAll('.url-text')
    expect(urlElements).toHaveLength(2)
  })

  it('should call onLinkClick when clicking on URL', () => {
    const mockOnLinkClick = vi.fn()
    const content = 'Visit https://example.com today'
    const { container } = renderWithTextarea(content, mockOnLinkClick)
    
    const urlElement = container.querySelector('.url-text')
    expect(urlElement).toBeInTheDocument()
    
    fireEvent.click(urlElement!)
    expect(mockOnLinkClick).toHaveBeenCalledWith('https://example.com')
  })
})