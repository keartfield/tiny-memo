import React, { useEffect, useRef, useCallback, useState } from 'react'
import { LinkParser } from '../markdown/parsers/LinkParser'
import './LinkHighlighter.css'

interface LinkHighlighterProps {
  content: string
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onLinkClick?: (url: string) => void
}

interface LinkPosition {
  url: string
  x: number
  y: number
  width: number
  height: number
  startIndex: number
  endIndex: number
}

export const LinkHighlighter: React.FC<LinkHighlighterProps> = ({
  content,
  textareaRef,
  onLinkClick
}) => {
  const [linkPositions, setLinkPositions] = useState<LinkPosition[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Range API を使った精密な位置計算（M2 Mac対応）
  const calculateLinkPositions = useCallback(() => {
    if (!textareaRef.current) return

    const linkMatches = LinkParser.parseInline(content)
    
    if (linkMatches.length === 0) {
      setLinkPositions([])
      return
    }

    const textarea = textareaRef.current
    const textareaRect = textarea.getBoundingClientRect()
    const scrollTop = textarea.scrollTop
    const scrollLeft = textarea.scrollLeft
    
    // 隠しdivを作成してテキストの正確な位置を測定
    const measureDiv = document.createElement('div')
    const computedStyle = window.getComputedStyle(textarea)
    
    // テキストエリアのスタイルを完全コピー
    measureDiv.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${textarea.clientWidth}px;
      height: ${textarea.clientHeight}px;
      font-family: ${computedStyle.fontFamily};
      font-size: ${computedStyle.fontSize};
      font-weight: ${computedStyle.fontWeight};
      line-height: ${computedStyle.lineHeight};
      letter-spacing: ${computedStyle.letterSpacing};
      word-spacing: ${computedStyle.wordSpacing};
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-all;
      padding: ${computedStyle.padding};
      border: ${computedStyle.border};
      box-sizing: ${computedStyle.boxSizing};
      tab-size: ${computedStyle.tabSize};
      text-indent: ${computedStyle.textIndent};
      overflow: hidden;
      pointer-events: none;
      visibility: hidden;
    `
    
    document.body.appendChild(measureDiv)
    measureDiv.textContent = content
    
    const newLinkPositions: LinkPosition[] = []
    
    try {
      linkMatches.forEach((link) => {
        // Range APIを使用して正確な位置を取得
        if (document.createRange && window.getSelection) {
          const range = document.createRange()
          const textNode = measureDiv.firstChild
          
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            // リンクの開始位置から終了位置までの範囲を設定
            range.setStart(textNode, link.startIndex)
            range.setEnd(textNode, link.endIndex + 1)
            
            // Range の境界矩形を取得
            const rangeBounds = range.getBoundingClientRect()
            const measureBounds = measureDiv.getBoundingClientRect()
            
            // textarea内での相対位置を計算
            const x = rangeBounds.left - measureBounds.left - scrollLeft
            const y = rangeBounds.top - measureBounds.top - scrollTop
            
            newLinkPositions.push({
              url: link.url,
              x: Math.max(0, x),
              y: Math.max(0, y),
              width: Math.max(10, rangeBounds.width), // 最小幅を保証
              height: Math.max(16, rangeBounds.height), // 最小高さを保証
              startIndex: link.startIndex,
              endIndex: link.endIndex
            })
          }
        }
      })
    } catch (error) {
      console.warn('Range API failed, using fallback positioning:', error)
      // フォールバック：シンプルな計算
      linkMatches.forEach((link) => {
        const beforeText = content.substring(0, link.startIndex)
        const linkText = content.substring(link.startIndex, link.endIndex + 1)
        const lines = beforeText.split('\n')
        const lineIndex = lines.length - 1
        const lineHeight = parseFloat(computedStyle.lineHeight) || 20
        const charWidth = 8.5
        
        newLinkPositions.push({
          url: link.url,
          x: Math.max(0, (lines[lineIndex]?.length || 0) * charWidth - scrollLeft),
          y: Math.max(0, lineIndex * lineHeight - scrollTop),
          width: linkText.length * charWidth,
          height: lineHeight,
          startIndex: link.startIndex,
          endIndex: link.endIndex
        })
      })
    } finally {
      // 測定用divを削除
      document.body.removeChild(measureDiv)
    }
    
    setLinkPositions(newLinkPositions)
  }, [content])

  // スクロールとリサイズの監視（高頻度更新対応）
  useEffect(() => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    let animationFrame: number | null = null
    let updateTimeout: NodeJS.Timeout | null = null

    const handleUpdate = () => {
      // 既存のアニメーションフレームをキャンセル
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
      
      // 新しいフレームで更新をスケジュール
      animationFrame = requestAnimationFrame(() => {
        calculateLinkPositions()
        animationFrame = null
      })
    }

    const handleScroll = () => {
      // スクロール時は即座に更新
      handleUpdate()
    }
    
    const handleInput = () => {
      // 入力時は少し遅延させて更新
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
      updateTimeout = setTimeout(() => {
        handleUpdate()
        updateTimeout = null
      }, 50)
    }

    // イベントリスナー
    textarea.addEventListener('scroll', handleScroll, { passive: true })
    textarea.addEventListener('input', handleInput)
    window.addEventListener('resize', handleUpdate)

    // 初期計算
    calculateLinkPositions()

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
      textarea.removeEventListener('scroll', handleScroll)
      textarea.removeEventListener('input', handleInput)
      window.removeEventListener('resize', handleUpdate)
    }
  }, [calculateLinkPositions])

  // コンテンツ変更時の再計算
  useEffect(() => {
    calculateLinkPositions()
  }, [content, calculateLinkPositions])

  // リンククリックハンドラー
  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (onLinkClick) {
      onLinkClick(url)
    } else if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url)
    }
  }

  return (
    <div ref={containerRef} className="link-highlighter-container">
      {/* リンクオーバーレイ */}
      {linkPositions.map((link, index) => (
        <div
          key={`${link.startIndex}-${index}`}
          className="link-highlight"
          style={{
            left: `${link.x}px`,
            top: `${link.y}px`,
            width: `${link.width}px`,
            height: `${link.height}px`,
          }}
          onClick={(e) => handleLinkClick(link.url, e)}
          title={link.url}
        />
      ))}
    </div>
  )
}