import { LinkParser } from './LinkParser'

describe('LinkParser', () => {
  describe('parseInline', () => {
    it('should parse markdown links correctly', () => {
      const text = 'Check out [Google](https://google.com) for search.'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        text: 'Google',
        url: 'https://google.com',
        startIndex: 10,
        endIndex: 37
      })
    })

    it('should parse plain URLs correctly', () => {
      const text = 'Visit https://example.com for more info.'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        text: 'https://example.com',
        url: 'https://example.com',
        startIndex: 6,
        endIndex: 24
      })
    })

    it('should parse multiple links correctly', () => {
      const text = 'Check [Google](https://google.com) and also visit https://github.com'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        text: 'Google',
        url: 'https://google.com',
        startIndex: 6,
        endIndex: 33
      })
      expect(result[1]).toEqual({
        text: 'https://github.com',
        url: 'https://github.com',
        startIndex: 50,
        endIndex: 67
      })
    })

    it('should not parse URLs that are part of markdown links', () => {
      const text = 'Check out [Visit Site](https://example.com) here.'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        text: 'Visit Site',
        url: 'https://example.com',
        startIndex: 10,
        endIndex: 42
      })
    })

    it('should parse both http and https URLs', () => {
      const text = 'Visit http://example.com and https://secure.com'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        text: 'http://example.com',
        url: 'http://example.com',
        startIndex: 6,
        endIndex: 23
      })
      expect(result[1]).toEqual({
        text: 'https://secure.com',
        url: 'https://secure.com',
        startIndex: 29,
        endIndex: 46
      })
    })

    it('should handle complex URLs with query parameters', () => {
      const text = 'Search: https://google.com/search?q=test&lang=en'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        text: 'https://google.com/search?q=test&lang=en',
        url: 'https://google.com/search?q=test&lang=en',
        startIndex: 8,
        endIndex: 47
      })
    })

    it('should return empty array for text without links', () => {
      const text = 'This is just plain text without any links.'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(0)
    })

    it('should handle text with brackets but no valid links', () => {
      const text = 'This has [brackets] but no (valid) links.'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(0)
    })

    it('should parse links with special characters in URL', () => {
      const text = 'Check [API Docs](https://api.example.com/v1/users?filter=active&sort=name)'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        text: 'API Docs',
        url: 'https://api.example.com/v1/users?filter=active&sort=name',
        startIndex: 6,
        endIndex: 73
      })
    })

    it('should maintain correct order when multiple links are present', () => {
      const text = 'First https://first.com then [Second](https://second.com) and https://third.com'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(3)
      expect(result[0].startIndex).toBeLessThan(result[1].startIndex)
      expect(result[1].startIndex).toBeLessThan(result[2].startIndex)
    })

    it('should handle multiline content', () => {
      const text = 'Line 1 with https://example.com\nLine 2 with [Link](https://test.com)'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        text: 'https://example.com',
        url: 'https://example.com',
        startIndex: 12,
        endIndex: 30
      })
      expect(result[1]).toEqual({
        text: 'Link',
        url: 'https://test.com',
        startIndex: 44,
        endIndex: 67
      })
    })

    it('should not parse markdown images as links', () => {
      const text = 'Here is an image: ![Alt text](https://example.com/image.png)'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(0)
    })

    it('should parse regular links but ignore images in same text', () => {
      const text = 'Check this [link](https://example.com) and this image ![Alt](https://example.com/img.png)'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        text: 'link',
        url: 'https://example.com',
        startIndex: 11,
        endIndex: 37
      })
    })

    it('should handle mixed content with images, links, and plain URLs', () => {
      const text = 'Visit https://site.com, see ![image](https://img.com/pic.jpg), and check [docs](https://docs.com)'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        text: 'https://site.com',
        url: 'https://site.com',
        startIndex: 6,
        endIndex: 21
      })
      expect(result[1]).toEqual({
        text: 'docs',
        url: 'https://docs.com',
        startIndex: 73,
        endIndex: 96
      })
    })

    it('should not parse image with exclamation mark at beginning of line', () => {
      const text = '![This is an image](https://example.com/image.png)\n[This is a link](https://example.com)'
      const result = LinkParser.parseInline(text)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        text: 'This is a link',
        url: 'https://example.com',
        startIndex: 51,
        endIndex: 87
      })
    })
  })
})