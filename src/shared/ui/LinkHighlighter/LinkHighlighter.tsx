import React, { useRef, useEffect, useState, useCallback } from 'react'
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
  
  // カーソル位置関連のrefを削除
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateLinkPositions = useCallback(() => {
    if (!textareaRef.current || !overlayRef.current) return

    const textarea = textareaRef.current
    
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

    // Set the full content in the mirror div once
    mirrorDiv.textContent = content
    
    const newLinks = linkMatches.map(match => {
      // Create a range for the link text
      const range = document.createRange()
      const textNode = mirrorDiv.firstChild
      
      if (!textNode) return null
      
      try {
        range.setStart(textNode, match.startIndex)
        range.setEnd(textNode, match.endIndex)
        
        const rect = range.getBoundingClientRect()
        
        if (rect.width === 0 || rect.height === 0) return null
        
        return {
          text: content.substring(match.startIndex, match.endIndex),
          url: match.url,
          startIndex: match.startIndex,
          endIndex: match.endIndex,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      } catch (error) {
        console.warn('Error creating range for link:', error)
        return null
      }
    }).filter(link => link !== null)
    
    // Clean up mirror div once after all calculations
    try {
      document.body.removeChild(mirrorDiv)
    } catch (error) {
      console.warn('Error removing mirror div:', error)
    }
    
    setLinks(newLinks)
    
  }, [content])

  // デバウンスされたリンク位置更新関数
  const debouncedUpdateLinks = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      updateLinkPositions()
    }, 100) // 100msのデバウンス
  }, [updateLinkPositions])

  useEffect(() => {
    if (!textareaRef.current || !overlayRef.current) return

    const textarea = textareaRef.current
    const overlay = overlayRef.current

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

    // テキスト入力時のリンク位置更新
    const handleInput = () => {
      // デバウンスされたリンク位置更新
      debouncedUpdateLinks()
    }

    // MutationObserver for style changes (only in browser environment) - 無効化
    // let observer: MutationObserver | null = null
    // if (typeof window !== 'undefined' && window.MutationObserver) {
    //   observer = new MutationObserver(() => {
    //     if (typeof requestAnimationFrame !== 'undefined') {
    //       requestAnimationFrame(updateLinkPositions)
    //     } else {
    //       updateLinkPositions()
    //     }
    //   })

    //   observer.observe(textarea, {
    //     attributes: true,
    //     attributeFilter: ['style', 'class']
    //   })
    // }

    // ResizeObserver for textarea size changes (only in browser environment) - 無効化
    // let resizeObserver: ResizeObserver | null = null
    // if (typeof window !== 'undefined' && window.ResizeObserver) {
    //   resizeObserver = new ResizeObserver(() => {
    //     if (typeof requestAnimationFrame !== 'undefined') {
    //       requestAnimationFrame(updateLinkPositions)
    //     } else {
    //       updateLinkPositions()
    //     }
    //   })

    //   resizeObserver.observe(textarea)
    // }

    textarea.addEventListener('scroll', handleScroll)
    textarea.addEventListener('input', handleInput)
    window.addEventListener('resize', handleResize)

    // Also listen for parent container resize - 無効化
    // const parentElement = textarea.parentElement
    // let parentResizeObserver: ResizeObserver | null = null
    // if (parentElement && typeof window !== 'undefined' && window.ResizeObserver) {
    //   parentResizeObserver = new ResizeObserver(() => {
    //     if (typeof requestAnimationFrame !== 'undefined') {
    //       requestAnimationFrame(updateLinkPositions)
    //     } else {
    //       updateLinkPositions()
    //     }
    //   })
    //   parentResizeObserver.observe(parentElement)
      
    //   return () => {
    //     textarea.removeEventListener('scroll', handleScroll)
    //     // textarea.removeEventListener('input', handleInput) // テキスト入力時のリンク位置更新を無効化
    //     window.removeEventListener('resize', handleResize)
    //     // observer?.disconnect() // 無効化
    //     // resizeObserver?.disconnect() // 無効化
    //     parentResizeObserver?.disconnect()
    //     if (updateTimeoutRef.current) {
    //       clearTimeout(updateTimeoutRef.current)
    //     }
    //   }
    // }

    return () => {
      textarea.removeEventListener('scroll', handleScroll)
      textarea.removeEventListener('input', handleInput)
      window.removeEventListener('resize', handleResize)
      // observer?.disconnect() // 無効化
      // resizeObserver?.disconnect() // 無効化
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [debouncedUpdateLinks])

  // contentが変更されたときにリンク位置を更新
  useEffect(() => {
    debouncedUpdateLinks()
  }, [content, debouncedUpdateLinks])

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
      return <span style={{ color: 'transparent', userSelect: 'none' }}>{content}</span>
    }

    const parts = []
    let lastIndex = 0

    linkMatches.forEach((link, index) => {
      // Add invisible text before link to maintain layout
      if (link.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} style={{ color: 'transparent', userSelect: 'none' }}>
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

    // Add remaining invisible text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`} style={{ color: 'transparent', userSelect: 'none' }}>
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
        border: textareaRef.current ? window.getComputedStyle(textareaRef.current).border : 'none',
        boxSizing: textareaRef.current ? window.getComputedStyle(textareaRef.current).boxSizing : 'border-box',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        color: 'transparent' // Hide original text, only show links
      }}
    >
      <div style={{ 
        pointerEvents: 'none',
        position: 'relative',
        height: '100%',
        width: '100%'
      }}>
        {renderContentWithLinks()}
      </div>
    </div>
  )
}
