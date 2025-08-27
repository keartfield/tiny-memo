import React, { useRef, useCallback, useMemo } from 'react'
import { Memo } from '../../../entities/memo'
import { MarkdownRenderer } from '../../../shared/ui/markdown'
import { SimpleTextEditor } from '../../../shared/ui/SimpleTextEditor'
import Resizer from '../../../shared/ui/Resizer'
import { 
  useAutoSave, 
  useImageHandling, 
  useImagePaste,
  useDragAndDrop, 
  useScrollSync, 
  useEditorMode 
} from './hooks'
import 'highlight.js/styles/github.css'
import './MemoEditor.css'

interface MemoEditorProps {
  memo: Memo | null
  onMemoUpdate: (id: string, content: string) => Promise<void>
}

const MemoEditor: React.FC<MemoEditorProps> = ({ memo, onMemoUpdate }) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const markdownPreviewRef = useRef<HTMLDivElement>(null)

  // カスタムフックを使用
  const { 
    content, 
    isModified, 
    isSaving, 
    handleContentChange 
  } = useAutoSave({ memo, onMemoUpdate })

  const { 
    imageCache, 
    processImagePaste, 
    processImageDrop 
  } = useImageHandling()

  const { 
    editorMode, 
    setEditorMode, 
    editorWidth, 
    setEditorWidth 
  } = useEditorMode('edit-preview')

  const { 
    isDragOver, 
    handleDragOver, 
    handleDragEnter,
    handleDragLeave, 
    handleDrop 
  } = useDragAndDrop({ 
    onImageDrop: processImageDrop, 
    content, 
    onContentChange: handleContentChange 
  })

  useScrollSync({ editorRef, previewRef, markdownPreviewRef })

  useImagePaste({ 
    memo, 
    content, 
    onContentChange: handleContentChange, 
    processImagePaste 
  })

  // リサイズハンドラー
  const handleResize = useCallback((delta: number) => {
    setEditorWidth(prevWidth => {
      // コンテナの実際の幅を取得
      const container = document.querySelector('.memo-editor-content')
      const containerWidth = container?.clientWidth || 800
      
      // デルタ値をパーセンテージに変換
      const deltaPercent = (delta / containerWidth) * 100
      const newWidth = prevWidth + deltaPercent
      
      // 20%〜80%の範囲に制限
      const maxWidth = 80
      const minWidth = 20
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      
      return clampedWidth
    })
  }, [])

  // 画像ソース取得関数
  const getImageSrc = useCallback(async (filename: string): Promise<string> => {
    // cache://プロトコルの場合は、プロトコル部分を除いてキャッシュから取得
    const cleanFilename = filename.replace(/^cache:\/\//, '')
    const cachedImage = imageCache.get(cleanFilename)
    if (cachedImage) {
      return cachedImage
    }
    
    // image://プロトコルの場合は、Electron APIを使用して画像を取得
    if (filename.startsWith('image://')) {
      try {
        const imageFilename = filename.replace(/^image:\/\//, '')
        const imageData = await window.electronAPI?.images?.get(imageFilename)
        if (imageData) {
          return `data:image/jpeg;base64,${imageData}`
        }
      } catch (error) {
        console.error('Failed to load image from Electron API:', error)
      }
    }
    
    // フォールバック用のデフォルト画像
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPg=='
  }, [imageCache])

  // マークダウンレンダリング（メモ化）
  const renderedMarkdown = useMemo(() => {
    if (!content) return null
    return (
      <MarkdownRenderer 
        content={content} 
        imageCache={imageCache}
        getImageSrc={getImageSrc}
      />
    )
  }, [content, imageCache, getImageSrc])

  if (!memo) {
    return (
      <div className="memo-editor">
        <div className="memo-editor-empty">
          tiny memo, big thoughts
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`memo-editor ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      ref={editorRef}
    >
      <div className="memo-editor-header">
        <div className="editor-mode-toggle">
          <button
            className={`mode-toggle-btn ${editorMode === 'edit' ? 'active' : ''}`}
            onClick={() => setEditorMode('edit')}
            title="Edit"
          >
            〰
          </button>
          <button
            className={`mode-toggle-btn ${editorMode === 'edit-preview' ? 'active' : ''}`}
            onClick={() => setEditorMode('edit-preview')}
            title="Edit & Preview"
          >
            ╌
          </button>
          <button
            className={`mode-toggle-btn ${editorMode === 'preview' ? 'active' : ''}`}
            onClick={() => setEditorMode('preview')}
            title="Preview"
          >
            −
          </button>
        </div>

        {(isSaving || isModified) && (
          <div className="memo-status">
            {isSaving ? 'Saving...' : 'Modified'}
          </div>
        )}
      </div>
      
      <div className="memo-editor-content">
        {editorMode === 'edit' && (
          <div className="memo-editor-input full-width">
            <SimpleTextEditor
              value={content}
              onChange={handleContentChange}
              placeholder="A blank space for your thoughts..."
              className="memo-content-input"
            />
          </div>
        )}
        
        {editorMode === 'edit-preview' && (
          <>
            <div 
              className="memo-editor-input resizable"
              style={{ width: `${editorWidth}%` }}
            >
              <SimpleTextEditor
                value={content}
                onChange={handleContentChange}
                placeholder="A blank space for your thoughts..."
                className="memo-content-input"
              />
              <Resizer
                direction="horizontal"
                onResize={handleResize}
              />
            </div>
            
            <div 
              className="memo-editor-preview" 
              ref={previewRef}
              style={{ width: `${100 - editorWidth}%` }}
            >
              <div className="markdown-preview" ref={markdownPreviewRef}>
                {renderedMarkdown}
              </div>
            </div>
          </>
        )}
        
        {editorMode === 'preview' && (
          <div className="memo-editor-preview full-width" ref={previewRef}>
            <div className="markdown-preview" ref={markdownPreviewRef}>
              {renderedMarkdown}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MemoEditor
