import React from 'react'

export interface TableParserResult {
  type: 'table'
  headers: string[]
  rows: string[][]
  startIndex: number
  endIndex: number
}

export class TableParser {
  static parse(lines: string[], startIndex: number): TableParserResult | null {
    const line = lines[startIndex]
    
    // Check if this looks like a table row
    if (!line.includes('|') || !line.trim().startsWith('|') || !line.trim().endsWith('|')) {
      return null
    }

    // Check if next line is table separator
    const nextLine = startIndex + 1 < lines.length ? lines[startIndex + 1] : ''
    const isTableSeparator = nextLine.match(/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/)
    
    if (!isTableSeparator) {
      return null
    }

    // Parse header
    const headers = line.trim().slice(1, -1).split('|').map(h => h.trim())
    const rows: string[][] = []
    
    let currentIndex = startIndex + 2 // Skip header and separator

    // Parse rows
    while (currentIndex < lines.length) {
      const currentLine = lines[currentIndex]
      
      if (!currentLine.includes('|') || !currentLine.trim().startsWith('|') || !currentLine.trim().endsWith('|')) {
        break
      }
      
      const cells = currentLine.trim().slice(1, -1).split('|').map(c => c.trim())
      rows.push(cells)
      currentIndex++
    }

    return {
      type: 'table',
      headers,
      rows,
      startIndex,
      endIndex: currentIndex - 1
    }
  }

  static render(result: TableParserResult, key: number, renderInline: (text: string) => (string | React.ReactElement)[]): React.ReactElement {
    const { headers, rows } = result
    
    return (
      <table key={key} style={{ 
        borderCollapse: 'collapse', 
        width: '100%', 
        margin: '1em 0',
        border: '1px solid var(--border-primary)'
      }}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} style={{ 
                border: '1px solid var(--border-primary)', 
                padding: '8px 12px', 
                backgroundColor: 'var(--bg-secondary)',
                textAlign: 'left',
                fontWeight: 600
              }}>
                {renderInline(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={{ 
                  border: '1px solid var(--border-primary)', 
                  padding: '8px 12px' 
                }}>
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
}