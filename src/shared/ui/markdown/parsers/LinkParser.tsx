import React from 'react'

export interface LinkMatch {
  text: string
  url: string
  startIndex: number
  endIndex: number
}

export class LinkParser {
  static parseInline(text: string): LinkMatch[] {
    const matches: LinkMatch[] = []
    
    // Markdown links [text](url)
    const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let match
    while ((match = markdownRegex.exec(text)) !== null) {
      matches.push({
        text: match[1],
        url: match[2],
        startIndex: match.index,
        endIndex: match.index + match[0].length - 1
      })
    }

    // Plain URLs
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g
    while ((match = urlRegex.exec(text)) !== null) {
      // Check if this URL is already part of a markdown link
      const isPartOfMarkdownLink = matches.some(existing => 
        match.index >= existing.startIndex && match.index <= existing.endIndex
      )
      
      if (!isPartOfMarkdownLink) {
        matches.push({
          text: match[1],
          url: match[1],
          startIndex: match.index,
          endIndex: match.index + match[0].length - 1
        })
      }
    }

    // Sort by start index to maintain order
    return matches.sort((a, b) => a.startIndex - b.startIndex)
  }

  static render(match: LinkMatch, key: number): React.ReactElement {
    const { text, url } = match
    
    return (
      <a 
        key={key}
        href={url} 
        onClick={(e) => {
          e.preventDefault()
          if (window.electronAPI?.openExternal) {
            window.electronAPI.openExternal(url)
          }
        }}
        style={{ 
          color: '#007acc', 
          textDecoration: 'underline',
          cursor: 'pointer',
          fontSize: 'inherit',
          fontWeight: '500'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#005a9b'
          e.currentTarget.style.backgroundColor = 'rgba(0, 122, 204, 0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#007acc'
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        {text}
      </a>
    )
  }
}