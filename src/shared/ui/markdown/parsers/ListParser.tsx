import React from 'react'

export interface ListParserResult {
  type: 'list'
  listType: 'ul' | 'ol'
  items: string[]
  startIndex: number
  endIndex: number
}

export class ListParser {
  static parse(lines: string[], startIndex: number): ListParserResult | null {
    const line = lines[startIndex]
    
    let listType: 'ul' | 'ol' | null = null
    let itemText: string | null = null

    // Check for unordered list
    if (line.match(/^\s*-\s+/)) {
      listType = 'ul'
      itemText = line.replace(/^\s*-\s+/, '')
    }
    // Check for ordered list
    else if (line.match(/^\s*\d+\.\s+/)) {
      listType = 'ol'
      itemText = line.replace(/^\s*\d+\.\s+/, '')
    }

    if (!listType || !itemText) {
      return null
    }

    const items = [itemText]
    let currentIndex = startIndex + 1

    // Continue parsing list items
    while (currentIndex < lines.length) {
      const currentLine = lines[currentIndex]
      
      if (listType === 'ul' && currentLine.match(/^\s*-\s+/)) {
        items.push(currentLine.replace(/^\s*-\s+/, ''))
      } else if (listType === 'ol' && currentLine.match(/^\s*\d+\.\s+/)) {
        items.push(currentLine.replace(/^\s*\d+\.\s+/, ''))
      } else {
        break
      }
      
      currentIndex++
    }

    return {
      type: 'list',
      listType,
      items,
      startIndex,
      endIndex: currentIndex - 1
    }
  }

  static render(result: ListParserResult, key: number, renderInline: (text: string) => (string | React.ReactElement)[]): React.ReactElement {
    const { listType, items } = result
    const ListTag = listType === 'ul' ? 'ul' : 'ol'
    
    return (
      <ListTag key={key} style={{ margin: '1em 0', paddingLeft: '2em' }}>
        {items.map((item, index) => (
          <li key={index} style={{ margin: '0.25em 0' }}>
            {renderInline(item)}
          </li>
        ))}
      </ListTag>
    )
  }
}