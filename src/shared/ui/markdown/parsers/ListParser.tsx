import React from 'react'

export interface ListItem {
  text: string
  level: number
  children?: ListItem[]
}

export interface ListParserResult {
  type: 'list'
  listType: 'ul' | 'ol'
  items: ListItem[]
  startIndex: number
  endIndex: number
}

export class ListParser {
  static getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/)
    if (!match) return 0
    
    // Count spaces (assuming 2 spaces = 1 level) and tabs (1 tab = 1 level)
    const spaces = match[1]
    let level = 0
    for (let i = 0; i < spaces.length; i++) {
      if (spaces[i] === '\t') {
        level += 1
      } else if (spaces[i] === ' ') {
        level += 0.5
      }
    }
    return Math.floor(level)
  }

  static parseListItem(line: string, listType: 'ul' | 'ol'): { text: string; level: number } | null {
    let text: string | null = null
    const level = this.getIndentLevel(line)

    if (listType === 'ul' && line.match(/^\s*-\s+/)) {
      text = line.replace(/^\s*-\s+/, '')
    } else if (listType === 'ol' && line.match(/^\s*\d+\.\s+/)) {
      text = line.replace(/^\s*\d+\.\s+/, '')
    }

    if (text === null) return null

    return { text, level }
  }

  static buildNestedStructure(flatItems: Array<{ text: string; level: number }>): ListItem[] {
    const result: ListItem[] = []
    const stack: Array<{ item: ListItem; level: number }> = []

    for (const flatItem of flatItems) {
      const newItem: ListItem = {
        text: flatItem.text,
        level: flatItem.level,
        children: []
      }

      // Remove items from stack that are at the same or deeper level
      while (stack.length > 0 && stack[stack.length - 1].level >= flatItem.level) {
        stack.pop()
      }

      if (stack.length === 0) {
        // This is a root level item
        result.push(newItem)
      } else {
        // This is a nested item
        const parent = stack[stack.length - 1].item
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(newItem)
      }

      stack.push({ item: newItem, level: flatItem.level })
    }

    return result
  }

  static parse(lines: string[], startIndex: number): ListParserResult | null {
    const line = lines[startIndex]
    
    let listType: 'ul' | 'ol' | null = null

    // Check for unordered list
    if (line.match(/^\s*-\s+/)) {
      listType = 'ul'
    }
    // Check for ordered list
    else if (line.match(/^\s*\d+\.\s+/)) {
      listType = 'ol'
    }

    if (!listType) {
      return null
    }

    const flatItems: Array<{ text: string; level: number }> = []
    let currentIndex = startIndex

    // Parse all consecutive list items
    while (currentIndex < lines.length) {
      const currentLine = lines[currentIndex]
      
      // Check if this line is a list item of the same type
      const item = this.parseListItem(currentLine, listType)
      if (!item) {
        // If it's not a list item, check if it's an empty line followed by a list item
        if (currentLine.trim() === '' && currentIndex + 1 < lines.length) {
          const nextItem = this.parseListItem(lines[currentIndex + 1], listType)
          if (nextItem) {
            // Skip the empty line
            currentIndex++
            continue
          }
        }
        break
      }
      
      flatItems.push(item)
      currentIndex++
    }

    if (flatItems.length === 0) {
      return null
    }

    const items = this.buildNestedStructure(flatItems)

    return {
      type: 'list',
      listType,
      items,
      startIndex,
      endIndex: currentIndex - 1
    }
  }

  static renderNestedItems(items: ListItem[], listType: 'ul' | 'ol', renderInline: (text: string) => (string | React.ReactElement)[], keyPrefix: string = ''): React.ReactElement[] {
    return items.map((item, index) => {
      const itemKey = `${keyPrefix}-${index}`
      const hasChildren = item.children && item.children.length > 0
      const ListTag = listType === 'ul' ? 'ul' : 'ol'
      
      return (
        <li key={itemKey} style={{ margin: '0.25em 0' }}>
          {renderInline(item.text)}
          {hasChildren && (
            <ListTag style={{ margin: '0.5em 0 0 0', paddingLeft: '2em' }}>
              {this.renderNestedItems(item.children!, listType, renderInline, itemKey)}
            </ListTag>
          )}
        </li>
      )
    })
  }

  static render(result: ListParserResult, key: number, renderInline: (text: string) => (string | React.ReactElement)[]): React.ReactElement {
    const { listType, items } = result
    const ListTag = listType === 'ul' ? 'ul' : 'ol'
    
    return (
      <ListTag key={key} style={{ margin: '1em 0', paddingLeft: '2em' }}>
        {this.renderNestedItems(items, listType, renderInline, `list-${key}`)}
      </ListTag>
    )
  }
}