import React from 'react'

export interface BlockquoteParserResult {
  type: 'blockquote'
  content: string
  startIndex: number
  endIndex: number
}

export class BlockquoteParser {
  static parse(lines: string[], startIndex: number): BlockquoteParserResult | null {
    const line = lines[startIndex]
    
    if (!line.startsWith('> ')) {
      return null
    }

    const contentLines = [line.slice(2)]
    let currentIndex = startIndex + 1

    // Continue parsing blockquote lines
    while (currentIndex < lines.length) {
      const currentLine = lines[currentIndex]
      
      if (currentLine.startsWith('> ')) {
        contentLines.push(currentLine.slice(2))
      } else {
        break
      }
      
      currentIndex++
    }

    return {
      type: 'blockquote',
      content: contentLines.join('\n'),
      startIndex,
      endIndex: currentIndex - 1
    }
  }

  static render(result: BlockquoteParserResult, key: number, renderInline: (text: string) => (string | React.ReactElement)[]): React.ReactElement {
    const { content } = result
    
    return (
      <blockquote key={key} style={{ 
        borderLeft: '4px solid var(--code-border)', 
        paddingLeft: '1em', 
        margin: '1em 0', 
        color: 'var(--code-text)',
        whiteSpace: 'pre-line'
      }}>
        {renderInline(content)}
      </blockquote>
    )
  }
}