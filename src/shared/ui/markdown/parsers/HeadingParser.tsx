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

    // ヘッダーレベルを1-6の範囲に制限
    const headingLevel = Math.min(Math.max(level, 1), 6)
    
    // 適切なヘッダータグを選択
    switch (headingLevel) {
      case 1:
        return <h1 key={key} style={style}>{text}</h1>
      case 2:
        return <h2 key={key} style={style}>{text}</h2>
      case 3:
        return <h3 key={key} style={style}>{text}</h3>
      case 4:
        return <h4 key={key} style={style}>{text}</h4>
      case 5:
        return <h5 key={key} style={style}>{text}</h5>
      case 6:
        return <h6 key={key} style={style}>{text}</h6>
      default:
        return <h1 key={key} style={style}>{text}</h1>
    }
  }
}
