import { describe, it, expect } from 'vitest'
import { ListParser } from './ListParser'

describe('ListParser', () => {
  describe('getIndentLevel', () => {
    it('should return 0 for lines with no indentation', () => {
      expect(ListParser.getIndentLevel('- Item')).toBe(0)
      expect(ListParser.getIndentLevel('1. Item')).toBe(0)
    })

    it('should count spaces correctly (2 spaces = 1 level)', () => {
      expect(ListParser.getIndentLevel('  - Item')).toBe(1)
      expect(ListParser.getIndentLevel('    - Item')).toBe(2)
      expect(ListParser.getIndentLevel('      - Item')).toBe(3)
    })

    it('should count tabs correctly (1 tab = 1 level)', () => {
      expect(ListParser.getIndentLevel('\t- Item')).toBe(1)
      expect(ListParser.getIndentLevel('\t\t- Item')).toBe(2)
      expect(ListParser.getIndentLevel('\t\t\t- Item')).toBe(3)
    })

    it('should handle mixed spaces and tabs', () => {
      expect(ListParser.getIndentLevel('\t  - Item')).toBe(2) // 1 tab + 2 spaces
      expect(ListParser.getIndentLevel('  \t- Item')).toBe(2) // 2 spaces + 1 tab
    })
  })

  describe('parseListItem', () => {
    it('should parse unordered list items', () => {
      const result = ListParser.parseListItem('- Item 1', 'ul')
      expect(result).toEqual({ text: 'Item 1', level: 0 })
    })

    it('should parse ordered list items', () => {
      const result = ListParser.parseListItem('1. Item 1', 'ol')
      expect(result).toEqual({ text: 'Item 1', level: 0 })
    })

    it('should parse indented list items', () => {
      const result = ListParser.parseListItem('  - Nested item', 'ul')
      expect(result).toEqual({ text: 'Nested item', level: 1 })
    })

    it('should return null for non-matching items', () => {
      expect(ListParser.parseListItem('- Item', 'ol')).toBeNull()
      expect(ListParser.parseListItem('1. Item', 'ul')).toBeNull()
      expect(ListParser.parseListItem('Regular text', 'ul')).toBeNull()
    })
  })

  describe('buildNestedStructure', () => {
    it('should build flat list structure', () => {
      const flatItems = [
        { text: 'Item 1', level: 0 },
        { text: 'Item 2', level: 0 },
        { text: 'Item 3', level: 0 }
      ]
      
      const result = ListParser.buildNestedStructure(flatItems)
      
      expect(result).toHaveLength(3)
      expect(result[0].text).toBe('Item 1')
      expect(result[1].text).toBe('Item 2')
      expect(result[2].text).toBe('Item 3')
      expect(result[0].children).toHaveLength(0)
    })

    it('should build nested list structure', () => {
      const flatItems = [
        { text: 'Item 1', level: 0 },
        { text: 'Nested 1', level: 1 },
        { text: 'Nested 2', level: 1 },
        { text: 'Item 2', level: 0 }
      ]
      
      const result = ListParser.buildNestedStructure(flatItems)
      
      expect(result).toHaveLength(2)
      expect(result[0].text).toBe('Item 1')
      expect(result[0].children).toHaveLength(2)
      expect(result[0].children![0].text).toBe('Nested 1')
      expect(result[0].children![1].text).toBe('Nested 2')
      expect(result[1].text).toBe('Item 2')
      expect(result[1].children).toHaveLength(0)
    })

    it('should handle deeply nested structures', () => {
      const flatItems = [
        { text: 'Level 0', level: 0 },
        { text: 'Level 1', level: 1 },
        { text: 'Level 2', level: 2 },
        { text: 'Level 3', level: 3 },
        { text: 'Back to Level 1', level: 1 }
      ]
      
      const result = ListParser.buildNestedStructure(flatItems)
      
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('Level 0')
      expect(result[0].children).toHaveLength(2)
      expect(result[0].children![0].text).toBe('Level 1')
      expect(result[0].children![0].children).toHaveLength(1)
      expect(result[0].children![0].children![0].text).toBe('Level 2')
      expect(result[0].children![0].children![0].children).toHaveLength(1)
      expect(result[0].children![0].children![0].children![0].text).toBe('Level 3')
      expect(result[0].children![1].text).toBe('Back to Level 1')
    })
  })

  describe('parse', () => {
    it('should parse simple unordered list', () => {
      const lines = [
        '- Item 1',
        '- Item 2',
        '- Item 3'
      ]
      
      const result = ListParser.parse(lines, 0)
      
      expect(result).toBeTruthy()
      expect(result!.listType).toBe('ul')
      expect(result!.items).toHaveLength(3)
      expect(result!.items[0].text).toBe('Item 1')
      expect(result!.items[1].text).toBe('Item 2')
      expect(result!.items[2].text).toBe('Item 3')
    })

    it('should parse simple ordered list', () => {
      const lines = [
        '1. First item',
        '2. Second item',
        '3. Third item'
      ]
      
      const result = ListParser.parse(lines, 0)
      
      expect(result).toBeTruthy()
      expect(result!.listType).toBe('ol')
      expect(result!.items).toHaveLength(3)
      expect(result!.items[0].text).toBe('First item')
      expect(result!.items[1].text).toBe('Second item')
      expect(result!.items[2].text).toBe('Third item')
    })

    it('should parse nested unordered list', () => {
      const lines = [
        '- Item 1',
        '  - Nested 1.1',
        '  - Nested 1.2',
        '- Item 2',
        '  - Nested 2.1'
      ]
      
      const result = ListParser.parse(lines, 0)
      
      expect(result).toBeTruthy()
      expect(result!.listType).toBe('ul')
      expect(result!.items).toHaveLength(2)
      
      // Check first item
      expect(result!.items[0].text).toBe('Item 1')
      expect(result!.items[0].children).toHaveLength(2)
      expect(result!.items[0].children![0].text).toBe('Nested 1.1')
      expect(result!.items[0].children![1].text).toBe('Nested 1.2')
      
      // Check second item
      expect(result!.items[1].text).toBe('Item 2')
      expect(result!.items[1].children).toHaveLength(1)
      expect(result!.items[1].children![0].text).toBe('Nested 2.1')
    })

    it('should parse nested ordered list', () => {
      const lines = [
        '1. First item',
        '   1. Nested 1.1',
        '   2. Nested 1.2',
        '2. Second item'
      ]
      
      const result = ListParser.parse(lines, 0)
      
      expect(result).toBeTruthy()
      expect(result!.listType).toBe('ol')
      expect(result!.items).toHaveLength(2)
      
      // Check first item
      expect(result!.items[0].text).toBe('First item')
      expect(result!.items[0].children).toHaveLength(2)
      expect(result!.items[0].children![0].text).toBe('Nested 1.1')
      expect(result!.items[0].children![1].text).toBe('Nested 1.2')
      
      // Check second item
      expect(result!.items[1].text).toBe('Second item')
      expect(result!.items[1].children).toHaveLength(0)
    })

    it('should stop parsing at non-list content', () => {
      const lines = [
        '- Item 1',
        '- Item 2',
        'Regular paragraph',
        '- Item 3'
      ]
      
      const result = ListParser.parse(lines, 0)
      
      expect(result).toBeTruthy()
      expect(result!.items).toHaveLength(2)
      expect(result!.endIndex).toBe(1)
    })

    it('should return null for non-list content', () => {
      const lines = ['Regular paragraph', 'Another line']
      
      const result = ListParser.parse(lines, 0)
      
      expect(result).toBeNull()
    })

    it('should handle empty lines between list items', () => {
      const lines = [
        '- Item 1',
        '',
        '- Item 2',
        '- Item 3'
      ]
      
      const result = ListParser.parse(lines, 0)
      
      expect(result).toBeTruthy()
      expect(result!.items).toHaveLength(3)
      expect(result!.items[0].text).toBe('Item 1')
      expect(result!.items[1].text).toBe('Item 2')
      expect(result!.items[2].text).toBe('Item 3')
    })
  })
})