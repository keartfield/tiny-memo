import React, { useState, useEffect } from 'react'

export interface ImageMatch {
  alt: string
  filename: string
  startIndex: number
  endIndex: number
}

export class ImageParser {
  static parseInline(text: string): ImageMatch[] {
    const matches: ImageMatch[] = []
    const regex = /!\[([^\]]*)\]\(image:\/\/([^)]+)\)/g
    let match

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        alt: match[1],
        filename: match[2],
        startIndex: match.index,
        endIndex: match.index + match[0].length - 1
      })
    }

    return matches
  }

  static render(
    match: ImageMatch, 
    key: number,
    imageCache: Map<string, string>,
    getImageSrc: (filename: string) => Promise<string>
  ): React.ReactElement {
    return (
      <ImageComponent 
        key={key}
        filename={match.filename}
        alt={match.alt}
        imageCache={imageCache}
        getImageSrc={getImageSrc}
      />
    )
  }
}

// Image Component
interface ImageComponentProps {
  filename: string
  alt?: string
  imageCache: Map<string, string>
  getImageSrc: (filename: string) => Promise<string>
}

const ImageComponent: React.FC<ImageComponentProps> = React.memo(({ 
  filename, 
  alt, 
  imageCache, 
  getImageSrc 
}) => {
  const cachedSrc = imageCache.get(filename)
  const [imageSrc, setImageSrc] = useState<string>(cachedSrc || '')
  const [loading, setLoading] = useState(!cachedSrc)
  
  useEffect(() => {
    if (imageCache.has(filename)) {
      const cached = imageCache.get(filename)!
      setImageSrc(cached)
      setLoading(false)
      return
    }
    
    const loadImage = async () => {
      try {
        const dataUrl = await getImageSrc(filename)
        setImageSrc(dataUrl)
      } catch (error) {
        console.error('Error loading image:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadImage()
  }, [filename, imageCache, getImageSrc])
  
  if (loading) {
    return (
      <span style={{ padding: '10px', background: '#f0f0f0', borderRadius: '4px', display: 'inline-block' }}>
        Loading image: {alt}
      </span>
    )
  }
  
  return imageSrc ? (
    <img
      src={imageSrc}
      alt={alt}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  ) : (
    <div style={{ padding: '10px', background: '#ffcccc', borderRadius: '4px' }}>
      Failed to load image: {alt}
    </div>
  )
})

ImageComponent.displayName = 'ImageComponent'