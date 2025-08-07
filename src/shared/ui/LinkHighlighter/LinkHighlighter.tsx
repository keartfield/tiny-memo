import React, { useRef, useEffect, useState } from 'react'
import { LinkParser } from '../markdown/parsers/LinkParser'
import './LinkHighlighter.css'

interface LinkHighlighterProps {
  content: string
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onLinkClick?: (url: string) => void
}

export const LinkHighlighter: React.FC<LinkHighlighterProps> = ({
  content,
  textareaRef,
  onLinkClick
}) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [links, setLinks] = useState<Array<{
    text: string
    url: string
    startIndex: number
    endIndex: number
    top: number
    left: number
    width: number
    height: number
    lineIndex?: number
    lineText?: string
  }>>([])

  useEffect(() => {
    if (!textareaRef.current || !overlayRef.current) return

    const textarea = textareaRef.current
    const overlay = overlayRef.current

    const updateLinkPositions = () => {
      // For testing environment, skip complex DOM measurements
      if (typeof window === 'undefined' || !window.ResizeObserver || !document.createRange) {
        setLinks([])
        return
      }
      
      const linkMatches = LinkParser.parseInline(content)
      
      if (linkMatches.length === 0) {
        setLinks([])
        return
      }

      // Create a mirror div that exactly matches the textarea
      const mirrorDiv = document.createElement('div')
      const computedStyle = window.getComputedStyle(textarea)
      
      // Copy all textarea styles to mirror div
      mirrorDiv.style.position = 'absolute'
      mirrorDiv.style.visibility = 'hidden'
      mirrorDiv.style.left = '-9999px'
      mirrorDiv.style.top = '-9999px'
      mirrorDiv.style.width = computedStyle.width
      mirrorDiv.style.height = computedStyle.height
      mirrorDiv.style.padding = computedStyle.padding
      mirrorDiv.style.border = computedStyle.border
      mirrorDiv.style.fontFamily = computedStyle.fontFamily
      mirrorDiv.style.fontSize = computedStyle.fontSize
      mirrorDiv.style.fontWeight = computedStyle.fontWeight
      mirrorDiv.style.lineHeight = computedStyle.lineHeight
      mirrorDiv.style.letterSpacing = computedStyle.letterSpacing
      mirrorDiv.style.wordSpacing = computedStyle.wordSpacing
      mirrorDiv.style.textTransform = computedStyle.textTransform
      mirrorDiv.style.whiteSpace = 'pre-wrap'
      mirrorDiv.style.wordWrap = 'break-word'
      mirrorDiv.style.overflowWrap = 'break-word'
      mirrorDiv.style.boxSizing = computedStyle.boxSizing
      
      document.body.appendChild(mirrorDiv)

      const newLinks = linkMatches.flatMap(match => {
        // Split content into before, link, and after
        const beforeText = content.substring(0, match.startIndex)
        const linkText = content.substring(match.startIndex, match.endIndex + 1)
        
        // Create structure: beforeSpan + linkSpan + afterSpan
        mirrorDiv.innerHTML = ''
        
        if (beforeText) {
          const beforeSpan = document.createElement('span')
          beforeSpan.textContent = beforeText
          mirrorDiv.appendChild(beforeSpan)
        }
        
        const linkSpan = document.createElement('span')
        linkSpan.textContent = linkText
        mirrorDiv.appendChild(linkSpan)
        
        const afterText = content.substring(match.endIndex + 1)
        if (afterText) {
          const afterSpan = document.createElement('span')
          afterSpan.textContent = afterText
          mirrorDiv.appendChild(afterSpan)
        }
        
        // Get all client rects for the link span (handles multi-line)
        try {
          const range = document.createRange()
          const textNode = linkSpan.firstChild
          if (!textNode) return []
          
          range.selectNodeContents(linkSpan)
          const clientRects = range.getClientRects?.() || []
          const mirrorRect = mirrorDiv.getBoundingClientRect()
          
          // Create a highlight for each line of the link
          const highlights = []
          let charIndex = 0
          
          for (let i = 0; i < clientRects.length; i++) {
            const rect = clientRects[i]
            
            // Calculate the text for this line segment
            const tempDiv = document.createElement('div')
            tempDiv.style.cssText = mirrorDiv.style.cssText
            tempDiv.style.position = 'absolute'
            tempDiv.style.visibility = 'hidden'
            tempDiv.style.width = `${rect.width}px`
            tempDiv.style.height = `${rect.height}px`
            document.body.appendChild(tempDiv)
            
            // Find how much text fits in this rect
            let lineText = ''
            let testText = linkText.substring(charIndex)
            tempDiv.textContent = testText
            
            if (tempDiv.getBoundingClientRect().width <= rect.width + 1) {
              lineText = testText
            } else {
              // Binary search to find the right amount of text
              let left = 0
              let right = testText.length
              while (left < right) {
                const mid = Math.floor((left + right + 1) / 2)
                tempDiv.textContent = testText.substring(0, mid)
                if (tempDiv.getBoundingClientRect().width <= rect.width + 1) {
                  left = mid
                } else {
                  right = mid - 1
                }
              }
              lineText = testText.substring(0, left)
            }
            
            document.body.removeChild(tempDiv)
            
            highlights.push({
              ...match,
              top: rect.top - mirrorRect.top,
              left: rect.left - mirrorRect.left,
              width: rect.width,
              height: rect.height,
              lineIndex: i,
              lineText
            })
            
            charIndex += lineText.length
          }
          
          return highlights
        } catch (error) {
          // Fallback for test environment
          return []
        }
      })

      document.body.removeChild(mirrorDiv)
      setLinks(newLinks)
    }

    updateLinkPositions()

    // スクロール同期
    const handleScroll = () => {
      if (overlay) {
        overlay.scrollTop = textarea.scrollTop
        overlay.scrollLeft = textarea.scrollLeft
      }
    }

    // リサイズ対応
    const handleResize = () => {
      // リサイズ後に位置を再計算
      requestAnimationFrame(updateLinkPositions)
    }

    // MutationObserver for style changes (only in browser environment)
    let observer: MutationObserver | null = null
    if (typeof window !== 'undefined' && window.MutationObserver) {
      observer = new MutationObserver(() => {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(updateLinkPositions)
        } else {
          updateLinkPositions()
        }
      })

      observer.observe(textarea, {
        attributes: true,
        attributeFilter: ['style', 'class']
      })
    }

    // ResizeObserver for textarea size changes (only in browser environment)
    let resizeObserver: ResizeObserver | null = null
    if (typeof window !== 'undefined' && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(updateLinkPositions)
        } else {
          updateLinkPositions()
        }
      })

      resizeObserver.observe(textarea)
    }

    textarea.addEventListener('scroll', handleScroll)
    textarea.addEventListener('input', updateLinkPositions)
    window.addEventListener('resize', handleResize)

    // Also listen for parent container resize
    const parentElement = textarea.parentElement
    let parentResizeObserver: ResizeObserver | null = null
    if (parentElement && typeof window !== 'undefined' && window.ResizeObserver) {
      parentResizeObserver = new ResizeObserver(() => {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(updateLinkPositions)
        } else {
          updateLinkPositions()
        }
      })
      parentResizeObserver.observe(parentElement)
      
      return () => {
        textarea.removeEventListener('scroll', handleScroll)
        textarea.removeEventListener('input', updateLinkPositions)
        window.removeEventListener('resize', handleResize)
        observer?.disconnect()
        resizeObserver?.disconnect()
        parentResizeObserver?.disconnect()
      }
    }

    return () => {
      textarea.removeEventListener('scroll', handleScroll)
      textarea.removeEventListener('input', updateLinkPositions)
      window.removeEventListener('resize', handleResize)
      observer?.disconnect()
      resizeObserver?.disconnect()
    }
  }, [content, textareaRef])

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (onLinkClick) {
      onLinkClick(url)
    } else if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url)
    }
  }

  const renderContentWithLinks = () => {
    if (!content) return null

    const linkMatches = LinkParser.parseInline(content)
    if (linkMatches.length === 0) {
      return <span style={{ color: 'var(--text-primary)' }}>{content}</span>
    }

    const parts = []
    let lastIndex = 0

    linkMatches.forEach((link, index) => {
      // Add text before link
      if (link.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} style={{ color: 'var(--text-primary)' }}>
            {content.substring(lastIndex, link.startIndex)}
          </span>
        )
      }

      // Add link
      parts.push(
        <span
          key={`link-${index}`}
          style={{
            color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#4fc3f7' : '#007acc',
            textDecoration: 'underline',
            cursor: 'pointer',
            pointerEvents: 'auto'
          }}
          onClick={(e) => handleLinkClick(link.url, e)}
          onMouseEnter={(e) => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
            e.currentTarget.style.color = isDark ? '#81d4fa' : '#005a9b'
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 122, 204, 0.1)'
          }}
          onMouseLeave={(e) => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
            e.currentTarget.style.color = isDark ? '#4fc3f7' : '#007acc'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          title={link.url}
        >
          {content.substring(link.startIndex, link.endIndex + 1)}
        </span>
      )

      lastIndex = link.endIndex + 1
    })

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`} style={{ color: 'var(--text-primary)' }}>
          {content.substring(lastIndex)}
        </span>
      )
    }

    return parts
  }

  return (
    <div 
      ref={overlayRef}
      className="link-highlighter-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        fontFamily: textareaRef.current ? window.getComputedStyle(textareaRef.current).fontFamily : 'inherit',
        fontSize: textareaRef.current ? window.getComputedStyle(textareaRef.current).fontSize : 'inherit',
        lineHeight: textareaRef.current ? window.getComputedStyle(textareaRef.current).lineHeight : 'inherit',
        padding: textareaRef.current ? window.getComputedStyle(textareaRef.current).padding : '0',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        overflowWrap: 'break-word'
      }}
    >
      <div style={{ pointerEvents: 'none' }}>
        {renderContentWithLinks()}
      </div>
    </div>
  )
}