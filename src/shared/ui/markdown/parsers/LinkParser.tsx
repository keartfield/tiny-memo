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
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g
    let match

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        text: match[1],
        url: match[2],
        startIndex: match.index,
        endIndex: match.index + match[0].length - 1
      })
    }

    return matches
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
          color: 'var(--primary-accent)', 
          textDecoration: 'underline',
          cursor: 'pointer'
        }}
      >
        {text}
      </a>
    )
  }
}