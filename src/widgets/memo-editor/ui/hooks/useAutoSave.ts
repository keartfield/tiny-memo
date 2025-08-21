import { useState, useEffect, useRef, useCallback } from 'react'
import { Memo } from '../../../../entities/memo'

interface UseAutoSaveProps {
  memo: Memo | null
  onMemoUpdate: (id: string, content: string) => Promise<void>
}

interface UseAutoSaveReturn {
  content: string
  setContent: (content: string) => void
  isModified: boolean
  isSaving: boolean
  lastSavedContent: string
  handleContentChange: (newContent: string) => void
}

export const useAutoSave = ({ memo, onMemoUpdate }: UseAutoSaveProps): UseAutoSaveReturn => {
  const [content, setContent] = useState('')
  const [isModified, setIsModified] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedContent, setLastSavedContent] = useState('')
  const [currentMemoId, setCurrentMemoId] = useState<string | null>(null)
  const onMemoUpdateRef = useRef<(id: string, content: string) => Promise<void>>(onMemoUpdate)
  
  // Update ref when onMemoUpdate changes
  useEffect(() => {
    onMemoUpdateRef.current = onMemoUpdate
  }, [onMemoUpdate])

  // メモ変更時のコンテンツ設定
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
    } else {
      // Clear all state when memo is removed/deleted
      setContent('')
      setLastSavedContent('')
      setIsModified(false)
      setIsSaving(false)
      setCurrentMemoId(null)
    }
  }, [memo, currentMemoId])

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

  // 自動保存処理
  useEffect(() => {
    if (!memo || !isModified || isSaving) return

    const autoSaveTimer = setTimeout(async () => {
      if (content !== lastSavedContent && content.trim()) {
        try {
          setIsSaving(true)
          await onMemoUpdateRef.current(memo.id, content)
          setLastSavedContent(content)
          setIsModified(false)
        } catch (error) {
          console.error('Failed to save memo:', error)
        } finally {
          setIsSaving(false)
        }
      }
    }, 1000)

    return () => clearTimeout(autoSaveTimer)
  }, [memo, content, isModified, isSaving, lastSavedContent])

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    setIsModified(true) // Always mark as modified when content changes
  }, [])

  return {
    content,
    setContent,
    isModified,
    isSaving,
    lastSavedContent,
    handleContentChange
  }
}