import React, { useEffect, useRef, useCallback } from 'react'
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

  // スクロール同期関数（M2 Mac対応）
  const syncScrollPosition = useCallback(() => {
    if (!textareaRef.current || !overlayRef.current) return
    
    const textarea = textareaRef.current
    const overlay = overlayRef.current
    
    // M2 Macでの高精度同期のため、直接値を設定
    const scrollTop = textarea.scrollTop
    const scrollLeft = textarea.scrollLeft
    
    if (overlay.scrollTop !== scrollTop) {
      overlay.scrollTop = scrollTop
    }
    if (overlay.scrollLeft !== scrollLeft) {
      overlay.scrollLeft = scrollLeft
    }
  }, [])

  // M2 Mac向けの高頻度更新関数
  const immediateUpdate = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    // M2 Macでは即座に同期
    syncScrollPosition()
    
    // 追加の安定化のため8ms後にも再同期
    updateTimeoutRef.current = setTimeout(() => {
      syncScrollPosition()
    }, 8)
  }, [syncScrollPosition])

  useEffect(() => {
    if (!textareaRef.current || !overlayRef.current) return

    const textarea = textareaRef.current
    const overlay = overlayRef.current

    // M2 Mac対応スクロールハンドラー
    const handleScroll = () => {
      // 即座に同期（M2 Macの高DPI対応）
      if (overlayRef.current && textareaRef.current) {
        const scrollTop = textareaRef.current.scrollTop
        const scrollLeft = textareaRef.current.scrollLeft
        
        overlayRef.current.scrollTop = scrollTop
        overlayRef.current.scrollLeft = scrollLeft
      }
      
      // 追加の安定化フレーム
      requestAnimationFrame(() => {
        if (overlayRef.current && textareaRef.current) {
          overlayRef.current.scrollTop = textareaRef.current.scrollTop
          overlayRef.current.scrollLeft = textareaRef.current.scrollLeft
        }
      })
    }

    // リサイズハンドラー
    const handleResize = () => {
      immediateUpdate()
    }

    // テキスト変更ハンドラー
    const handleInput = () => {
      immediateUpdate()
    }

    // イベントリスナーを追加
    textarea.addEventListener('scroll', handleScroll, { passive: true })
    textarea.addEventListener('input', handleInput)
    window.addEventListener('resize', handleResize)

    // 初期同期
    syncScrollPosition()

    return () => {
      textarea.removeEventListener('scroll', handleScroll)
      textarea.removeEventListener('input', handleInput)
      window.removeEventListener('resize', handleResize)
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [syncScrollPosition, immediateUpdate])

  // コンテンツ変更時の同期
  useEffect(() => {
    syncScrollPosition()
  }, [content, syncScrollPosition])

  // リンククリックハンドラー
  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (onLinkClick) {
      onLinkClick(url)
    } else if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url)
    }
  }

  // URLを含むコンテンツをレンダリング
  const renderContentWithUrls = () => {
    if (!content) return null

    const linkMatches = LinkParser.parseInline(content)
    if (linkMatches.length === 0) {
      // URLがない場合は透明テキストを表示
      return (
        <span className="text-transparent">
          {content}
        </span>
      )
    }

    const parts = []
    let lastIndex = 0

    linkMatches.forEach((link, index) => {
      // URL前のテキスト（透明）
      if (link.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="text-transparent">
            {content.substring(lastIndex, link.startIndex)}
          </span>
        )
      }

      // URLテキスト（色付き、クリッカブル）
      parts.push(
        <span
          key={`link-${index}`}
          className="url-text"
          onClick={(e) => handleLinkClick(link.url, e)}
          title={link.url}
        >
          {content.substring(link.startIndex, link.endIndex + 1)}
        </span>
      )

      lastIndex = link.endIndex + 1
    })

    // 残りのテキスト（透明）
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="text-transparent">
          {content.substring(lastIndex)}
        </span>
      )
    }

    return parts
  }

  // textareaのスタイルを取得
  const computedStyle = textareaRef.current ? window.getComputedStyle(textareaRef.current) : null

  return (
    <div 
      ref={overlayRef}
      className="url-highlight-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        fontFamily: computedStyle?.fontFamily || 'inherit',
        fontSize: computedStyle?.fontSize || 'inherit',
        fontWeight: computedStyle?.fontWeight || 'inherit',
        lineHeight: computedStyle?.lineHeight || 'inherit',
        letterSpacing: computedStyle?.letterSpacing || 'inherit',
        wordSpacing: computedStyle?.wordSpacing || 'inherit',
        padding: computedStyle?.padding || '0',
        borderWidth: computedStyle?.borderWidth || '0',
        borderStyle: 'solid',
        borderColor: 'transparent',
        boxSizing: computedStyle?.boxSizing || 'border-box',
        margin: computedStyle?.margin || '0',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        wordBreak: 'break-all',
        background: 'transparent',
        // コンテナの幅を超えないように制限
        maxWidth: '100%',
        minWidth: 0
      }}
    >
      {renderContentWithUrls()}
    </div>
  )
}