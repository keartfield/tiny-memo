import React from 'react'

export interface ChecklistParserResult {
  type: 'checklist'
  items: ChecklistItem[]
  startIndex: number
  endIndex: number
}

interface ChecklistItem {
  text: string
  checked: boolean
}

export class ChecklistParser {
  static parse(lines: string[], startIndex: number): ChecklistParserResult | null {
    const line = lines[startIndex]
    
    // Check for checklist item: - [ ] or - [x]
    const match = line.match(/^\s*-\s+\[([ x])\]\s+(.*)$/)
    if (!match) {
      return null
    }

    const items: ChecklistItem[] = [{
      checked: match[1] === 'x',
      text: match[2]
    }]
    
    let currentIndex = startIndex + 1

    // Continue parsing checklist items
    while (currentIndex < lines.length) {
      const currentLine = lines[currentIndex]
      const currentMatch = currentLine.match(/^\s*-\s+\[([ x])\]\s+(.*)$/)
      
      if (currentMatch) {
        items.push({
          checked: currentMatch[1] === 'x',
          text: currentMatch[2]
        })
      } else {
        break
      }
      
      currentIndex++
    }

    return {
      type: 'checklist',
      items,
      startIndex,
      endIndex: currentIndex - 1
    }
  }

  static render(
    result: ChecklistParserResult, 
    key: number, 
    renderInline: (text: string) => (string | React.ReactElement)[]
  ): React.ReactElement {
    const { items } = result
    
    return (
      <ul key={key} style={{ 
        margin: '1em 0', 
        paddingLeft: '0',
        listStyle: 'none'
      }}>
        {items.map((item, index) => (
          <li key={index} style={{ 
            margin: '0.25em 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '1px solid var(--border-secondary)',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: item.checked ? 'var(--primary-accent)' : 'transparent',
                flexShrink: 0,
                marginTop: '2px'
              }}
            >
              {item.checked && (
                <svg
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  fill="none"
                  style={{ color: 'white' }}
                >
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span style={{
              textDecoration: item.checked ? 'line-through' : 'none',
              color: item.checked ? 'var(--text-muted)' : 'inherit'
            }}>
              {renderInline(item.text)}
            </span>
          </li>
        ))}
      </ul>
    )
  }
}
