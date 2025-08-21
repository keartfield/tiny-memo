import { useState, useCallback, DragEvent } from 'react'

interface UseDragAndDropProps {
  onImageDrop: (files: FileList, content: string, cursorPosition: number) => Promise<{ content: string; newCursorPosition: number }>
  content: string
  onContentChange: (content: string) => void
}

interface UseDragAndDropReturn {
  isDragOver: boolean
  handleDragOver: (e: DragEvent<HTMLDivElement>) => void
  handleDragEnter: (e: DragEvent<HTMLDivElement>) => void
  handleDragLeave: (e: DragEvent<HTMLDivElement>) => void
  handleDrop: (e: DragEvent<HTMLDivElement>) => void
}

export const useDragAndDrop = ({ 
  onImageDrop, 
  content, 
  onContentChange 
}: UseDragAndDropProps): UseDragAndDropReturn => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // ドラッグがコンポーネントから完全に出た場合のみリセット
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return

    // カーソル位置を取得（簡易版 - 実際の実装ではもっと精密に行う）
    const cursorPosition = content.length

    const result = await onImageDrop(files, content, cursorPosition)
    onContentChange(result.content)
  }, [content, onContentChange, onImageDrop])

  return {
    isDragOver,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  }
}