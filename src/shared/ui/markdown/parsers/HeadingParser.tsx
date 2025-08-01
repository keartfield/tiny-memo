import React from 'react'

export interface HeadingParserResult {
  type: 'heading'
  level: number
  text: string
  startIndex: number
  endIndex: number
}

export class HeadingParser {
  static parse(lines: string[], startIndex: number): HeadingParserResult | null {
    const line = lines[startIndex]
    
    if (!line.startsWith('#')) {
      return null
    }

    const level = line.match(/^#+/)?.[0].length || 1
    const text = line.replace(/^#+\s*/, '')

    return {
      type: 'heading',
      level,
      text,
      startIndex,
      endIndex: startIndex
    }
  }

  static render(result: HeadingParserResult, key: number): React.ReactElement {
    const { level, text } = result
    
    const fontSize = level === 1 ? '2em' : level === 2 ? '1.5em' : level === 3 ? '1.25em' : '1em'
    const borderBottom = level === 1 ? '1px solid var(--border-primary)' : 'none'
    
    const style = { 
      margin: '1.5em 0 0.5em 0', 
      fontWeight: 600, 
      fontSize,
      borderBottom,
      paddingBottom: level === 1 ? '0.3em' : '0'
    }

    const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements
    return React.createElement(HeadingTag, { key, style }, text)
  }
}