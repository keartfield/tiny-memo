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

  // HTMLからプレーンテキストを抽出（改行保持版）
  const extractTextFromHTML = useCallback((element: HTMLElement): string => {
    // innerHTMLからbrとdivを改行に変換
    let html = element.innerHTML

    // より正確な変換：divの内容を改行で区切る
    html = html.replace(/<div><br><\/div>/gi, '\n')  // 空のdivはそのまま改行
    html = html.replace(/<div>/gi, '\n')             // divの開始で改行
    html = html.replace(/<\/div>/gi, '')             // divの終了は削除
    html = html.replace(/<br\s*\/?>/gi, '\n')        // brタグは改行

    // HTMLタグを除去
    html = html.replace(/<[^>]*>/g, '')

    // HTMLエンティティをデコード
    html = html.replace(/&nbsp;/g, ' ')
    html = html.replace(/&lt;/g, '<')
    html = html.replace(/&gt;/g, '>')
    html = html.replace(/&amp;/g, '&')

    // 先頭の余分な改行のみを除去
    html = html.replace(/^\n/, '')               // 先頭の1つの改行のみを除去

    return html
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

  // ペーストイベントハンドラー（プレーンテキストのみ受け入れ）
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    
    // クリップボードからプレーンテキストを取得
    const plainText = e.clipboardData.getData('text/plain')
    
    // 現在の選択範囲に挿入
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      
      // CSSのwhite-space: pre-wrapにより改行が自動的に保持される
      const textNode = document.createTextNode(plainText)
      range.insertNode(textNode)
      range.setStartAfter(textNode)
      range.setEndAfter(textNode)
      
      selection.removeAllRanges()
      selection.addRange(range)
      
      // コンテンツ更新をトリガー
      setTimeout(updateContent, 0)
    }
  }, [updateContent])

  // 外部からの値の変更を反映
  useEffect(() => {
    if (!editableRef.current) return

    // 現在の内容と異なる場合のみ更新
    const currentContent = extractTextFromHTML(editableRef.current)

    // より厳密な比較: 空白文字の正規化後に比較
    const normalizedValue = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const normalizedCurrent = currentContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    if (normalizedValue !== normalizedCurrent) {
      const html = normalizedValue
        .split('\n')
        .map(line => line === '' ? '<div><br></div>' : `<div>${line}</div>`)
        .join('')
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
      onPaste={handlePaste}
      data-placeholder={placeholder}
      spellCheck={false}
    />
  )
}
