import React from 'react'

export interface TextStyleMatch {
  type: 'bold' | 'italic' | 'strikethrough' | 'code'
  text: string
  startIndex: number
  endIndex: number
}

export class TextStyleParser {
  static parseInline(text: string): TextStyleMatch[] {
    const matches: TextStyleMatch[] = []
    
    // Bold text (**text**)
    const boldRegex = /\*\*([^*]+)\*\*/g
    let match
    while ((match = boldRegex.exec(text)) !== null) {
      matches.push({
        type: 'bold',
        text: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length - 1
      })
    }
    
    // Italic text (*text*)
    const italicRegex = /\*([^*]+)\*/g
    while ((match = italicRegex.exec(text)) !== null) {
      // Skip if this is part of a bold match
      const isBoldPart = matches.some(m => 
        m.type === 'bold' && 
        match.index >= m.startIndex && 
        match.index + match[0].length <= m.endIndex + 1
      )
      
      if (!isBoldPart) {
        matches.push({
          type: 'italic',
          text: match[1],
          startIndex: match.index,
          endIndex: match.index + match[0].length - 1
        })
      }
    }
    
    // Strikethrough text (~~text~~)
    const strikeRegex = /~~([^~]+)~~/g
    while ((match = strikeRegex.exec(text)) !== null) {
      matches.push({
        type: 'strikethrough',
        text: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length - 1
      })
    }
    
    // Inline code (`text`)
    const codeRegex = /`([^`]+)`/g
    while ((match = codeRegex.exec(text)) !== null) {
      matches.push({
        type: 'code',
        text: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length - 1
      })
    }
    
    // Sort by start index
    return matches.sort((a, b) => a.startIndex - b.startIndex)
  }

  static render(match: TextStyleMatch, key: number): React.ReactElement {
    const { type, text } = match
    
    switch (type) {
      case 'bold':
        return <strong key={key}>{text}</strong>
      case 'italic':
        return <em key={key}>{text}</em>
      case 'strikethrough':
        return <del key={key}>{text}</del>
      case 'code':
        return <code key={key}>{text}</code>
      default:
        return <span key={key}>{text}</span>
    }
  }
}