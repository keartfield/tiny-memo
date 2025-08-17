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
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Simplified approach - no complex positioning needed
  const updateOverlay = useCallback(() => {
    if (!textareaRef.current || !overlayRef.current) return
    
    const textarea = textareaRef.current
    const overlay = overlayRef.current
    
    // Sync scroll position
    overlay.scrollTop = textarea.scrollTop
    overlay.scrollLeft = textarea.scrollLeft
  }, [])

  // デバウンスされたオーバーレイ更新関数
  const debouncedUpdateOverlay = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      updateOverlay()
    }, 50) // 50msのデバウンス
  }, [updateOverlay])

  useEffect(() => {
    if (!textareaRef.current || !overlayRef.current) return

    const textarea = textareaRef.current

    // スクロール同期（requestAnimationFrameで最適化）
    const handleScroll = () => {
      if (!overlayRef.current) return
      
      requestAnimationFrame(() => {
        if (!overlayRef.current) return
        const overlay = overlayRef.current
        // スクロール位置を完全に同期
        overlay.scrollTop = textarea.scrollTop
        overlay.scrollLeft = textarea.scrollLeft
      })
    }

    // リサイズ対応
    const handleResize = () => {
      debouncedUpdateOverlay()
    }

    // テキスト入力時のオーバーレイ更新
    const handleInput = () => {
      debouncedUpdateOverlay()
    }

    textarea.addEventListener('scroll', handleScroll, { passive: true })
    textarea.addEventListener('input', handleInput)
    window.addEventListener('resize', handleResize)

    // 初期スクロール位置を同期
    handleScroll()

    return () => {
      textarea.removeEventListener('scroll', handleScroll)
      textarea.removeEventListener('input', handleInput)
      window.removeEventListener('resize', handleResize)
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [debouncedUpdateOverlay, updateOverlay])

  // 初期化とcontent変更時にオーバーレイを更新
  useEffect(() => {
    updateOverlay()
  }, [content, updateOverlay])

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

  const computedStyle = textareaRef.current ? window.getComputedStyle(textareaRef.current) : null

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
        overflow: 'auto',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
        fontFamily: computedStyle?.fontFamily || 'inherit',
        fontSize: computedStyle?.fontSize || 'inherit',
        fontWeight: computedStyle?.fontWeight || 'inherit',
        lineHeight: computedStyle?.lineHeight || 'inherit',
        letterSpacing: computedStyle?.letterSpacing || 'inherit',
        wordSpacing: computedStyle?.wordSpacing || 'inherit',
        padding: computedStyle?.padding || '0',
        borderWidth: computedStyle?.borderWidth || '0',
        borderStyle: computedStyle?.borderStyle || 'none',
        borderColor: 'transparent',
        boxSizing: computedStyle?.boxSizing || 'border-box',
        margin: computedStyle?.margin || '0',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        color: 'transparent',
        background: 'transparent'
      }}
    >
      {renderContentWithLinks()}
    </div>
  )
}
