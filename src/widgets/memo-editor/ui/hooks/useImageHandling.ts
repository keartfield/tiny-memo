import { useState, useCallback } from 'react'

interface UseImageHandlingReturn {
  imageCache: Map<string, string>
  processImagePaste: (content: string) => Promise<string>
  processImageDrop: (files: FileList, content: string, cursorPosition: number) => Promise<{ content: string; newCursorPosition: number }>
}

export const useImageHandling = (): UseImageHandlingReturn => {
  const [imageCache, setImageCache] = useState<Map<string, string>>(new Map())

  const processImagePaste = useCallback(async (content: string): Promise<string> => {
    // 画像のbase64データを検出する正規表現
    const base64ImageRegex = /!\[([^\]]*)\]\(data:image\/[^;]+;base64,([^)]+)\)/g
    
    let processedContent = content
    let match

    while ((match = base64ImageRegex.exec(content)) !== null) {
      const [fullMatch, altText, base64Data] = match
      const imageKey = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // キャッシュに保存（プロトコル部分なしのキーを使用）
      setImageCache(prev => new Map(prev.set(imageKey, `data:image/png;base64,${base64Data}`)))
      
      // マークダウンを置き換え
      const replacement = `![${altText || 'image'}](cache://${imageKey})`
      processedContent = processedContent.replace(fullMatch, replacement)
    }

    return processedContent
  }, [])

  const processImageDrop = useCallback(async (
    files: FileList, 
    content: string, 
    cursorPosition: number
  ): Promise<{ content: string; newCursorPosition: number }> => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      return { content, newCursorPosition: cursorPosition }
    }

    let insertText = ''
    
    for (const file of imageFiles) {
      const reader = new FileReader()
      
      await new Promise<void>((resolve) => {
        reader.onload = async (e) => {
          const result = e.target?.result as string
          if (result) {
            try {
              // Base64データをUint8Arrayに変換
              const base64Data = result.split(',')[1]
              const binaryString = atob(base64Data)
              const bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
              
              // Electron APIで永続保存
              const savedFilename = await window.electronAPI?.images?.save(bytes, file.name)
              if (savedFilename) {
                // キャッシュにも保存（即座に表示用）
                setImageCache(prev => new Map(prev.set(savedFilename, result)))
                
                // image://プロトコルを使用してマークダウンに追加
                insertText += `![${file.name}](image://${savedFilename})\n`
              } else {
                console.error('Failed to save image via Electron API')
                // フォールバック: キャッシュのみ使用
                const imageKey = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                setImageCache(prev => new Map(prev.set(imageKey, result)))
                insertText += `![${file.name}](cache://${imageKey})\n`
              }
            } catch (error) {
              console.error('Error saving image:', error)
              // フォールバック: キャッシュのみ使用
              const imageKey = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              setImageCache(prev => new Map(prev.set(imageKey, result)))
              insertText += `![${file.name}](cache://${imageKey})\n`
            }
          }
          resolve()
        }
        reader.readAsDataURL(file)
      })
    }

    const newContent = content.slice(0, cursorPosition) + insertText + content.slice(cursorPosition)
    const newCursorPosition = cursorPosition + insertText.length

    return { content: newContent, newCursorPosition }
  }, [])

  return {
    imageCache,
    processImagePaste,
    processImageDrop
  }
}
