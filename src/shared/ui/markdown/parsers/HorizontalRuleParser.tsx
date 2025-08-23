import React from 'react'

export interface HorizontalRuleParserResult {
  type: 'horizontalrule'
  startIndex: number
  endIndex: number
}

export class HorizontalRuleParser {
  static parse(lines: string[], startIndex: number): HorizontalRuleParserResult | null {
    const line = lines[startIndex]
    
    if (!line.match(/^---+$/) && !line.match(/^\*\*\*+$/) && !line.match(/^___+$/)) {
      return null
    }

    return {
      type: 'horizontalrule',
      startIndex,
      endIndex: startIndex
    }
  }

  static render(_result: HorizontalRuleParserResult, key: number): React.ReactElement {
    return (
      <hr key={key} style={{ 
        border: 'none', 
        borderTop: '1px solid var(--border-primary)', 
        margin: '2em 0' 
      }} />
    )
  }
}