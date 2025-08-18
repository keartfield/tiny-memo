import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Memo } from '../../../entities/memo'
import { Folder } from '../../../entities/folder'
import { MarkdownRenderer } from '../../../shared/ui/markdown'
import { EditableTextWithLinks } from '../../../shared/ui/EditableTextWithLinks'
import Resizer from '../../../shared/ui/Resizer'
import 'highlight.js/styles/github.css'
import './MemoEditor.css'

interface MemoEditorProps {
  memo: Memo | null
  folders: Folder[]
  onMemoUpdate: (id: string, content: string) => Promise<void>
  onMemoFolderUpdate: (id: string, folderId: string | null) => void
}

type EditorMode = 'edit' | 'edit-preview' | 'preview'

const MemoEditor: React.FC<MemoEditorProps> = ({ memo, folders, onMemoUpdate, onMemoFolderUpdate }) => {
  const [content, setContent] = useState('')
  const [isModified, setIsModified] = useState(false)
  const [_, setIsSaving] = useState(false)
  const [lastSavedContent, setLastSavedContent] = useState('')
  const [editorMode, setEditorMode] = useState<EditorMode>('edit-preview')
  const [isDragOver, setIsDragOver] = useState(false)
  const [imageCache, setImageCache] = useState<Map<string, string>>(new Map())
  const [editorWidth, setEditorWidth] = useState(50) // Percentage width of editor
  const editorRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const markdownPreviewRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const onMemoUpdateRef = useRef<(id: string, content: string) => Promise<void>>(onMemoUpdate)
  
  // Update ref when onMemoUpdate changes
  useEffect(() => {
    onMemoUpdateRef.current = onMemoUpdate
  }, [onMemoUpdate])

  // スクロールイベント監視のuseEffect
  useEffect(() => {
    const handleScroll = (element: Element) => {
      // スクロール開始時にスクロールバーを表示
      element.classList.add('scrolling')

      // 既存のタイマーをクリア
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // 1秒後にスクロールバーを非表示
      scrollTimeoutRef.current = setTimeout(() => {
        element.classList.remove('scrolling')
      }, 1000)
    }

    const textareaElement = textareaRef.current
    const previewElement = previewRef.current
    const markdownPreviewElement = markdownPreviewRef.current

    const textareaScrollHandler = () => handleScroll(textareaElement!)
    const previewScrollHandler = () => handleScroll(previewElement!)
    const markdownPreviewScrollHandler = () => handleScroll(markdownPreviewElement!)

    if (textareaElement) {
      textareaElement.addEventListener('scroll', textareaScrollHandler, { passive: true })
    }
    if (previewElement) {
      previewElement.addEventListener('scroll', previewScrollHandler, { passive: true })
    }
    if (markdownPreviewElement) {
      markdownPreviewElement.addEventListener('scroll', markdownPreviewScrollHandler, { passive: true })
    }

    return () => {
      if (textareaElement) {
        textareaElement.removeEventListener('scroll', textareaScrollHandler)
      }
      if (previewElement) {
        previewElement.removeEventListener('scroll', previewScrollHandler)
      }
      if (markdownPreviewElement) {
        markdownPreviewElement.removeEventListener('scroll', markdownPreviewScrollHandler)
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [editorMode]) // editorModeが変わったときに再設定

  // Track the current memo ID to detect memo changes
  const [currentMemoId, setCurrentMemoId] = useState<string | null>(null)

  useEffect(() => {
    if (memo) {
      // If this is a different memo, update the content
      if (memo.id !== currentMemoId) {
        setContent(memo.content)
        setLastSavedContent(memo.content)
        setIsModified(false)
        setIsSaving(false)
        setCurrentMemoId(memo.id)
      }
      // Keep existing cache to prevent re-loading images
    } else {
      // Clear all state when memo is removed/deleted
      setContent('')
      setLastSavedContent('')
      setIsModified(false)
      setIsSaving(false)
      setImageCache(new Map())
      setCurrentMemoId(null)
    }
  }, [memo, currentMemoId])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => handleImagePaste(e)
    document.addEventListener('paste', handlePaste)
    
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [memo, content])

  // Force save before memo change
  useEffect(() => {
    const savedMemoId = currentMemoId
    const savedIsModified = isModified
    const savedContent = content
    const savedLastSavedContent = lastSavedContent
    
    return () => {
      // Save current content if there are unsaved changes
      if (savedMemoId && savedIsModified && savedContent !== savedLastSavedContent && savedContent.trim()) {
        // Use the ref to avoid dependency loops
        onMemoUpdateRef.current(savedMemoId, savedContent).catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : String(error)
          if (!errorMessage.includes('No record was found') && !errorMessage.includes('Record to update not found')) {
            console.error('Failed to save memo on unmount:', error)
          }
        })
      }
    }
  }, [currentMemoId]) // Only depend on memo ID changes

  // Auto-save effect with debouncing
  useEffect(() => {
    if (currentMemoId && isModified && content !== lastSavedContent) {
      const timeoutId = setTimeout(async () => {
        // Double-check that we still have the same memo
        if (!currentMemoId || !memo || memo.id !== currentMemoId) {
          return
        }
        
        setIsSaving(true)
        try {
          await onMemoUpdateRef.current(currentMemoId, content)
          setLastSavedContent(content)
          setIsModified(false)
        } catch (error: unknown) {
          // Check if the error is because the memo was deleted
          const errorMessage = error instanceof Error ? error.message : String(error)
          if (errorMessage.includes('No record was found') || errorMessage.includes('Record to update not found')) {
            setIsModified(false) // Reset modified state
          } else {
            console.error('Failed to save memo:', error)
          }
        } finally {
          setIsSaving(false)
        }
      }, 500)
      
      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [currentMemoId, content, isModified, lastSavedContent]) // Stable dependencies only

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setIsModified(true)
  }


  const handleImagePaste = async (e: ClipboardEvent) => {
    if (!memo) return
    
    const items = Array.from(e.clipboardData?.items || [])
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await handleImageUpload(file)
        }
      }
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const filename = await (window as any).electronAPI.images.save(uint8Array, file.name)
      
      
      // Use a simple file reference that we'll handle in the img component
      const imageMarkdown = `![${file.name}](image://${filename})`
      
      const textarea = document.querySelector('.memo-content-input') as HTMLTextAreaElement
      
      if (textarea) {
        const cursorPos = textarea.selectionStart
        const newContent = content.slice(0, cursorPos) + '\n' + imageMarkdown + '\n' + content.slice(cursorPos)
        setContent(newContent)
        setIsModified(true)
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (!memo) return
    
    const files = Array.from(e.dataTransfer.files)
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await handleImageUpload(file)
      }
    }
  }


  const getImageSrc = useCallback(async (filename: string) => {
    if (imageCache.has(filename)) {
      return imageCache.get(filename)!
    }
    
    try {
      const base64 = await (window as any).electronAPI.images.get(filename)
      
      if (!base64) {
        console.error('No base64 data received for filename:', filename)
        return ''
      }
      
      const mimeType = filename.endsWith('.png') ? 'image/png' : 
                     filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' :
                     filename.endsWith('.gif') ? 'image/gif' : 'image/png'
      const dataUrl = `data:${mimeType};base64,${base64}`
      
      setImageCache(prev => new Map(prev.set(filename, dataUrl)))
      return dataUrl
    } catch (error) {
      console.error('Failed to load image:', error)
      return ''
    }
  }, [imageCache])

  // Memoized markdown renderer
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

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (memo) {
      const folderId = e.target.value === '' ? null : e.target.value
      onMemoFolderUpdate(memo.id, folderId)
    }
  }

  const handleResize = useCallback((delta: number) => {
    if (!editorRef.current) return
    
    const containerWidth = editorRef.current.querySelector('.memo-editor-content')?.clientWidth || 800
    const deltaPercentage = (delta / containerWidth) * 100
    
    setEditorWidth(prevWidth => {
      const newWidth = Math.max(20, Math.min(80, prevWidth + deltaPercentage))
      return newWidth
    })
  }, [])

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
        
        <select
          className="memo-folder-select"
          value={memo.folderId || ''}
          onChange={handleFolderChange}
        >
          <option value="">No Folder</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="memo-editor-content">
        {editorMode === 'edit' && (
          <div className="memo-editor-input full-width">
            <EditableTextWithLinks
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
              <EditableTextWithLinks
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
