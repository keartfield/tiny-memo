import React from 'react'
import hljs from 'highlight.js'

export interface CodeBlockParserResult {
  type: 'codeblock'
  language?: string
  content: string
  startIndex: number
  endIndex: number
}

export class CodeBlockParser {
  static parse(lines: string[], startIndex: number): CodeBlockParserResult | null {
    const line = lines[startIndex]
    
    if (!line.startsWith('```')) {
      return null
    }

    const language = line.slice(3).trim()
    const codeLines: string[] = []
    let endIndex = startIndex + 1

    // Find the closing ```
    while (endIndex < lines.length) {
      const currentLine = lines[endIndex]
      if (currentLine.startsWith('```')) {
        break
      }
      codeLines.push(currentLine)
      endIndex++
    }

    if (endIndex >= lines.length) {
      // No closing ```, treat as incomplete
      return null
    }

    return {
      type: 'codeblock',
      language: language || undefined,
      content: codeLines.join('\n'),
      startIndex,
      endIndex
    }
  }

  static render(result: CodeBlockParserResult, key: number): React.ReactElement {
    const { language, content } = result
    
    const highlightedCode = language && hljs.getLanguage(language)
      ? hljs.highlight(content, { language }).value
      : hljs.highlightAuto(content).value

    return (
      <pre key={key} className={language ? `language-${language}` : ''}>
        <code 
          className={language ? `language-${language}` : ''}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    )
  }
}