import {
  calculateSeoScore,
  getSeoScoreColor,
  getSeoScoreLabel,
  isValidUrl,
  extractDomain,
  calculateReadabilityScore,
  parseTitle,
  parseMetaDescription,
  formatCompactNumber,
  truncateText
} from '../utils'

describe('Utils', () => {
  describe('calculateSeoScore', () => {
    it('should calculate weighted SEO score correctly', () => {
      const scores = {
        technical: 80,
        content: 70,
        keywords: 60,
        performance: 90,
        meta: 85
      }
      
      const result = calculateSeoScore(scores)
      expect(result).toBeCloseTo(77, 0) // Should be around 77
    })

    it('should handle missing categories', () => {
      const scores = {
        technical: 80,
        content: 70
      }
      
      const result = calculateSeoScore(scores)
      expect(result).toBe(75) // Average of 80 and 70
    })

    it('should return 0 for empty scores', () => {
      const result = calculateSeoScore({})
      expect(result).toBe(0)
    })
  })

  describe('getSeoScoreColor', () => {
    it('should return correct colors for different scores', () => {
      expect(getSeoScoreColor(95)).toBe('text-seo-excellent')
      expect(getSeoScoreColor(80)).toBe('text-seo-good')
      expect(getSeoScoreColor(65)).toBe('text-seo-fair')
      expect(getSeoScoreColor(45)).toBe('text-seo-poor')
      expect(getSeoScoreColor(25)).toBe('text-seo-critical')
    })
  })

  describe('getSeoScoreLabel', () => {
    it('should return correct labels for different scores', () => {
      expect(getSeoScoreLabel(95)).toBe('Excellent')
      expect(getSeoScoreLabel(80)).toBe('Good')
      expect(getSeoScoreLabel(65)).toBe('Fair')
      expect(getSeoScoreLabel(45)).toBe('Poor')
      expect(getSeoScoreLabel(25)).toBe('Critical')
    })
  })

  describe('isValidUrl', () => {
    it('should validate URLs correctly', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://example.com')).toBe(true)
      expect(isValidUrl('https://example.com/path')).toBe(true)
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('ftp://example.com')).toBe(true)
    })
  })

  describe('extractDomain', () => {
    it('should extract domain correctly', () => {
      expect(extractDomain('https://www.example.com/path')).toBe('example.com')
      expect(extractDomain('http://example.com')).toBe('example.com')
      expect(extractDomain('https://subdomain.example.com')).toBe('subdomain.example.com')
      expect(extractDomain('invalid-url')).toBe('invalid-url')
    })
  })

  describe('calculateReadabilityScore', () => {
    it('should calculate readability score', () => {
      const simpleText = 'This is a simple text. It has short sentences. Easy to read.'
      const score = calculateReadabilityScore(simpleText)
      expect(score).toBeGreaterThan(80)
    })

    it('should handle empty text', () => {
      const score = calculateReadabilityScore('')
      expect(score).toBe(0)
    })

    it('should handle complex text', () => {
      const complexText = 'The implementation of sophisticated algorithmic methodologies necessitates comprehensive understanding of multidimensional computational paradigms and their inherent complexities.'
      const score = calculateReadabilityScore(complexText)
      expect(score).toBeLessThan(50)
    })
  })

  describe('parseTitle', () => {
    it('should parse title from HTML', () => {
      const html = '<html><head><title>Test Title</title></head><body></body></html>'
      expect(parseTitle(html)).toBe('Test Title')
    })

    it('should return null for missing title', () => {
      const html = '<html><head></head><body></body></html>'
      expect(parseTitle(html)).toBeNull()
    })

    it('should handle title with extra whitespace', () => {
      const html = '<html><head><title>  Test Title  </title></head><body></body></html>'
      expect(parseTitle(html)).toBe('Test Title')
    })
  })

  describe('parseMetaDescription', () => {
    it('should parse meta description from HTML', () => {
      const html = '<html><head><meta name="description" content="Test description"></head><body></body></html>'
      expect(parseMetaDescription(html)).toBe('Test description')
    })

    it('should return null for missing meta description', () => {
      const html = '<html><head></head><body></body></html>'
      expect(parseMetaDescription(html)).toBeNull()
    })

    it('should handle different quote styles', () => {
      const html = '<html><head><meta name=\'description\' content=\'Test description\'></head><body></body></html>'
      expect(parseMetaDescription(html)).toBe('Test description')
    })
  })

  describe('formatCompactNumber', () => {
    it('should format numbers compactly', () => {
      expect(formatCompactNumber(1000)).toBe('1K')
      expect(formatCompactNumber(1500)).toBe('1.5K')
      expect(formatCompactNumber(1000000)).toBe('1M')
      expect(formatCompactNumber(2500000)).toBe('2.5M')
      expect(formatCompactNumber(500)).toBe('500')
    })
  })

  describe('truncateText', () => {
    it('should truncate text correctly', () => {
      const text = 'This is a long text that should be truncated'
      expect(truncateText(text, 20)).toBe('This is a long text...')
    })

    it('should return original text if shorter than limit', () => {
      const text = 'Short text'
      expect(truncateText(text, 20)).toBe('Short text')
    })

    it('should handle exact length', () => {
      const text = 'Exactly twenty chars'
      expect(truncateText(text, 20)).toBe('Exactly twenty chars')
    })
  })
})