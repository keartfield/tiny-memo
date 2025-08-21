import React from 'react'
import { CodeBlockParser, CodeBlockParserResult } from './parsers/CodeBlockParser'
import { TableParser, TableParserResult } from './parsers/TableParser'
import { HeadingParser, HeadingParserResult } from './parsers/HeadingParser'
import { ListParser, ListParserResult } from './parsers/ListParser'
import { BlockquoteParser, BlockquoteParserResult } from './parsers/BlockquoteParser'
import { HorizontalRuleParser, HorizontalRuleParserResult } from './parsers/HorizontalRuleParser'
import { ChecklistParser, ChecklistParserResult } from './parsers/ChecklistParser'
import { LinkParser } from './parsers/LinkParser'
import { ImageParser } from './parsers/ImageParser'
import { TextStyleParser } from './parsers/TextStyleParser'

type ParseResult = 
  | CodeBlockParserResult 
  | TableParserResult 
  | HeadingParserResult 
  | ListParserResult 
  | BlockquoteParserResult 
  | HorizontalRuleParserResult
  | ChecklistParserResult

interface MarkdownRendererProps {
  content: string
  imageCache?: Map<string, string>
  getImageSrc?: (filename: string) => Promise<string>
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  imageCache,
  getImageSrc
}) => {
  if (!content) return null

  const lines = content.split('\n')
  const elements: React.ReactElement[] = []
  let currentParagraph: string[] = []
  let i = 0

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join('\n')
      if (text.trim()) {
        elements.push(
          <p key={elements.length} style={{ whiteSpace: 'pre-wrap', margin: '1em 0' }}>
            {renderInlineElements(text)}
          </p>
        )
      }
      currentParagraph = []
    }
  }

  const renderInlineElements = (text: string): (string | React.ReactElement)[] => {
    const parts: (string | React.ReactElement)[] = []
    let remaining = text
    let keyCounter = 0
    
    // Parse all inline elements
    const imageMatches = ImageParser.parseInline(text)
    const linkMatches = LinkParser.parseInline(text)
    const styleMatches = TextStyleParser.parseInline(text)
    
    // Combine and sort all matches
    const allMatches = [
      ...imageMatches.map(m => ({ ...m, type: 'image' as const })),
      ...linkMatches.map(m => ({ ...m, type: 'link' as const })),
      ...styleMatches.map(m => ({ ...m, type: 'style' as const, styleType: m.type }))
    ].sort((a, b) => a.startIndex - b.startIndex)
    
    // Process matches and create placeholders
    allMatches.forEach((match) => {
      const placeholder = `__${match.type.toUpperCase()}_${keyCounter++}__`
      
      if (match.type === 'image') {
        const imageMatch = match as typeof match & { alt: string; filename: string }
        parts.push(ImageParser.render(imageMatch, keyCounter, imageCache, getImageSrc))
      } else if (match.type === 'link') {
        const linkMatch = match as typeof match & { text: string; url: string }
        parts.push(LinkParser.render(linkMatch, keyCounter))
      } else if (match.type === 'style') {
        const styleMatch = match as typeof match & { styleType: 'bold' | 'italic' | 'strikethrough' | 'code' }
        parts.push(TextStyleParser.render({ 
          type: styleMatch.styleType, 
          text: styleMatch.text,
          startIndex: styleMatch.startIndex,
          endIndex: styleMatch.endIndex
        }, keyCounter))
      }
      
      // Replace in remaining text
      const originalText = text.substring(match.startIndex, match.endIndex + 1)
      remaining = remaining.replace(originalText, placeholder)
    })
    
    // Split by placeholders and reconstruct
    const segments = remaining.split(/(__(?:IMAGE|LINK|STYLE)_\d+__)/)
    const result: (string | React.ReactElement)[] = []
    let partIndex = 0
    
    for (const segment of segments) {
      if (segment.startsWith('__') && segment.endsWith('__')) {
        if (partIndex < parts.length) {
          result.push(parts[partIndex++])
        }
      } else if (segment) {
        result.push(segment)
      }
    }
    
    return result.length > 0 ? result : [text]
  }

  // Parse lines using block parsers
  while (i < lines.length) {
    const line = lines[i]
    let parsed = false

    // Try each parser
    const parsers = [
      CodeBlockParser,
      TableParser,
      HeadingParser,
      ChecklistParser,
      ListParser,
      BlockquoteParser,
      HorizontalRuleParser
    ]

    for (const Parser of parsers) {
      const result = Parser.parse(lines, i)
      if (result) {
        flushParagraph() // Flush any pending paragraph
        
        // Render the parsed element
        if (result.type === 'codeblock') {
          elements.push(CodeBlockParser.render(result, elements.length))
        } else if (result.type === 'table') {
          elements.push(TableParser.render(result, elements.length, renderInlineElements))
        } else if (result.type === 'heading') {
          elements.push(HeadingParser.render(result, elements.length))
        } else if (result.type === 'checklist') {
          elements.push(ChecklistParser.render(result, elements.length, renderInlineElements))
        } else if (result.type === 'list') {
          elements.push(ListParser.render(result, elements.length, renderInlineElements))
        } else if (result.type === 'blockquote') {
          elements.push(BlockquoteParser.render(result, elements.length, renderInlineElements))
        } else if (result.type === 'horizontalrule') {
          elements.push(HorizontalRuleParser.render(result, elements.length))
        }
        
        i = result.endIndex + 1
        parsed = true
        break
      }
    }

    if (!parsed) {
      // Regular content or empty lines
      if (line.trim() === '') {
        currentParagraph.push('')
      } else {
        currentParagraph.push(line)
      }
      i++
    }
  }

  flushParagraph() // Flush any remaining paragraph

  return <div className="markdown-content">{elements}</div>
}