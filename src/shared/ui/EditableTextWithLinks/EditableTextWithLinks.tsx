import React, { useRef, useEffect, useCallback, useState } from 'react'
import { LinkParser } from '../markdown/parsers/LinkParser'
import './EditableTextWithLinks.css'

interface EditableTextWithLinksProps {
  value: string
  onChange: (value: string) => void
  onLinkClick?: (url: string) => void
  placeholder?: string
  className?: string
}

export const EditableTextWithLinks: React.FC<EditableTextWithLinksProps> = ({
  value,
  onChange,
  onLinkClick,
  placeholder = '',
  className = ''
}) => {
  const editableRef = useRef<HTMLDivElement>(null)
  const [isComposing, setIsComposing] = useState(false)
  const lastValueRef = useRef(value)

  // テキストからHTMLを生成（URLをリンクに変換）
  const createHTML = useCallback((text: string): string => {
    if (!text) return ''

    const linkMatches = LinkParser.parseInline(text)
    if (linkMatches.length === 0) {
      // URLがない場合はプレーンテキストを返す
      return text.replace(/\n/g, '<br>')
    }

    let html = ''
    let lastIndex = 0

    linkMatches.forEach((link) => {
      // URL前のテキスト
      if (link.startIndex > lastIndex) {
        const beforeText = text.substring(lastIndex, link.startIndex)
        html += beforeText.replace(/\n/g, '<br>')
      }

      // URLをリンクとして表示
      const linkText = text.substring(link.startIndex, link.endIndex + 1)
      html += `<a href="#" class="editable-link" data-url="${encodeURIComponent(link.url)}">${linkText}</a>`

      lastIndex = link.endIndex + 1
    })

    // 残りのテキスト
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex)
      html += remainingText.replace(/\n/g, '<br>')
    }

    return html
  }, [])

  // HTMLからプレーンテキストを抽出
  const extractTextFromHTML = useCallback((element: HTMLElement): string => {
    let text = ''
    
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || ''
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        if (el.tagName === 'BR') {
          text += '\n'
        } else if (el.tagName === 'A' && el.classList.contains('editable-link')) {
          text += el.textContent || ''
        } else {
          text += extractTextFromHTML(el)
        }
      }
    }
    
    return text
  }, [])

  // カーソル位置を保存
  const saveCursorPosition = useCallback(() => {
    if (!editableRef.current) return null

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null

    const range = selection.getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(editableRef.current)
    preCaretRange.setEnd(range.startContainer, range.startOffset)
    
    return preCaretRange.toString().length
  }, [])

  // カーソル位置を復元
  const restoreCursorPosition = useCallback((position: number) => {
    if (!editableRef.current) return

    const selection = window.getSelection()
    if (!selection) return

    let currentPos = 0
    const walker = document.createTreeWalker(
      editableRef.current,
      NodeFilter.SHOW_TEXT,
      null
    )

    let node = walker.nextNode()
    while (node) {
      const textLength = node.textContent?.length || 0
      if (currentPos + textLength >= position) {
        const range = document.createRange()
        range.setStart(node, position - currentPos)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
        return
      }
      currentPos += textLength
      node = walker.nextNode()
    }

    // フォールバック: 末尾にカーソルを設定
    const range = document.createRange()
    range.selectNodeContents(editableRef.current)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }, [])

  // コンテンツを更新
  const updateContent = useCallback(() => {
    if (!editableRef.current || isComposing) return

    const currentText = extractTextFromHTML(editableRef.current)
    
    if (currentText !== lastValueRef.current) {
      lastValueRef.current = currentText
      onChange(currentText)
    }
  }, [extractTextFromHTML, onChange, isComposing])

  // 入力イベントハンドラー
  const handleInput = useCallback(() => {
    if (isComposing) return
    updateContent()
  }, [updateContent, isComposing])

  // Composition events (IME対応)
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true)
  }, [])

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false)
    setTimeout(updateContent, 0)
  }, [updateContent])

  // リンククリックハンドラー
  const handleLinkClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    if (target.classList.contains('editable-link')) {
      const url = decodeURIComponent(target.getAttribute('data-url') || '')
      if (url && onLinkClick) {
        onLinkClick(url)
      } else if (url && window.electronAPI?.openExternal) {
        window.electronAPI.openExternal(url)
      }
    }
  }, [onLinkClick])

  // キーボードイベントハンドラー
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Enter key handling
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault()
      document.execCommand('insertLineBreak')
    }
  }, [])

  // 外部からの値の変更を反映
  useEffect(() => {
    if (!editableRef.current) return
    
    if (value !== lastValueRef.current) {
      const cursorPosition = saveCursorPosition()
      const html = createHTML(value)
      editableRef.current.innerHTML = html
      lastValueRef.current = value
      
      // カーソル位置を復元（少し遅延させる）
      if (cursorPosition !== null) {
        setTimeout(() => restoreCursorPosition(cursorPosition), 0)
      }
    }
  }, [value, createHTML, saveCursorPosition, restoreCursorPosition])

  // 初期化
  useEffect(() => {
    if (editableRef.current && !editableRef.current.innerHTML) {
      const html = createHTML(value)
      editableRef.current.innerHTML = html
      lastValueRef.current = value
    }
  }, [value, createHTML])

  return (
    <div
      ref={editableRef}
      className={`editable-text-with-links ${className}`}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onClick={handleLinkClick}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      spellCheck={false}
    />
  )
}