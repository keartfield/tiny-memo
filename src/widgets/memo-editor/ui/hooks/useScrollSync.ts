import { useEffect, useRef, RefObject } from 'react'

interface UseScrollSyncProps {
  editorRef: RefObject<HTMLDivElement | null>
  previewRef: RefObject<HTMLDivElement | null>
  markdownPreviewRef: RefObject<HTMLDivElement | null>
}

export const useScrollSync = ({ editorRef, previewRef, markdownPreviewRef }: UseScrollSyncProps) => {
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

    const editorElement = editorRef.current?.querySelector('.editor-textarea')
    const previewElement = previewRef.current
    const markdownElement = markdownPreviewRef.current

    if (editorElement) {
      const editorScrollHandler = () => handleScroll(editorElement)
      editorElement.addEventListener('scroll', editorScrollHandler)
      
      return () => {
        editorElement.removeEventListener('scroll', editorScrollHandler)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }

    if (previewElement) {
      const previewScrollHandler = () => handleScroll(previewElement)
      previewElement.addEventListener('scroll', previewScrollHandler)
      
      return () => {
        previewElement.removeEventListener('scroll', previewScrollHandler)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }

    if (markdownElement) {
      const markdownScrollHandler = () => handleScroll(markdownElement)
      markdownElement.addEventListener('scroll', markdownScrollHandler)
      
      return () => {
        markdownElement.removeEventListener('scroll', markdownScrollHandler)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }
  }, [editorRef, previewRef, markdownPreviewRef])

  return {
    scrollTimeoutRef
  }
}