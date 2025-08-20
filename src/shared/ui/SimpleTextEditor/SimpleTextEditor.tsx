import React, { useRef, useEffect, useCallback, useState } from 'react'
import './SimpleTextEditor.css'

interface SimpleTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const SimpleTextEditor: React.FC<SimpleTextEditorProps> = ({
  value,
  onChange,
  placeholder = '',
  className = ''
}) => {
  const editableRef = useRef<HTMLDivElement>(null)
  const [isComposing, setIsComposing] = useState(false)

  // HTMLからプレーンテキストを抽出（簡素化版）
  const extractTextFromHTML = useCallback((element: HTMLElement): string => {
    // innerTextはより正確に改行を保持する
    let text = element.innerText || ''
    // テスト環境でのedge caseを処理
    if (!text && element.textContent) {
      text = element.textContent.replace(/<br\s*\/?>/gi, '\n')
    }
    return text
  }, [])

  // コンテンツを更新
  const updateContent = useCallback(() => {
    if (!editableRef.current || isComposing) return

    const currentText = extractTextFromHTML(editableRef.current)
    onChange(currentText)
  }, [extractTextFromHTML, onChange, isComposing])

  // 入力イベントハンドラー
  const handleInput = useCallback(() => {
    if (!isComposing) {
      updateContent()
    }
  }, [updateContent, isComposing])

  // IME対応
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true)
  }, [])

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false)
    setTimeout(updateContent, 0)
  }, [updateContent])

  // 外部からの値の変更を反映
  useEffect(() => {
    if (!editableRef.current) return
    
    // 現在の内容と異なる場合のみ更新
    const currentContent = extractTextFromHTML(editableRef.current)
    if (value !== currentContent) {
      // プレーンテキストをHTMLに変換（改行のみ）
      const html = value.replace(/\n/g, '<br>')
      editableRef.current.innerHTML = html
    }
  }, [value, extractTextFromHTML])

  return (
    <div
      ref={editableRef}
      className={`simple-text-editor ${className}`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      onInput={handleInput}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      data-placeholder={placeholder}
      spellCheck={false}
    />
  )
}