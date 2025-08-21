import { useEffect } from 'react'
import { Memo } from '../../../../entities/memo'

interface UseImagePasteProps {
  memo: Memo | null
  content: string
  onContentChange: (content: string) => void
  processImagePaste: (content: string) => Promise<string>
}

export const useImagePaste = ({ 
  memo, 
  content, 
  onContentChange, 
  processImagePaste 
}: UseImagePasteProps) => {
  useEffect(() => {
    const handleImagePaste = async (e: ClipboardEvent) => {
      if (!memo) return
      
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            const reader = new FileReader()
            reader.onload = async (event) => {
              const result = event.target?.result as string
              if (result) {
                // Create markdown with base64 image
                const imageMarkdown = `![image](${result})`
                const newContent = content + '\n' + imageMarkdown
                
                // Process the image paste to convert to cache
                const processedContent = await processImagePaste(newContent)
                onContentChange(processedContent)
              }
            }
            reader.readAsDataURL(file)
          }
          break
        }
      }
    }

    document.addEventListener('paste', handleImagePaste)
    
    return () => {
      document.removeEventListener('paste', handleImagePaste)
    }
  }, [memo, content, onContentChange, processImagePaste])
}