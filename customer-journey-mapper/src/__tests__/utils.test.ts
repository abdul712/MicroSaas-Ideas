import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatDate,
  formatDuration,
  slugify,
  calculateConversionRate,
  calculateDropOffRate,
  calculateGrowthRate,
  validateEmail,
  validateUrl,
  truncateText,
  capitalizeFirst,
  parseJsonSafely,
} from '@/lib/utils'

describe('Utils', () => {
  describe('formatNumber', () => {
    it('should format numbers correctly', () => {
      expect(formatNumber(1234)).toBe('1,234')
      expect(formatNumber(1234.567, 2)).toBe('1,234.57')
      expect(formatNumber(0)).toBe('0')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(0.1234)).toBe('12.3%')
      expect(formatPercentage(0.1, 0)).toBe('10%')
      expect(formatPercentage(1)).toBe('100.0%')
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      expect(formatDate(date)).toBe('Jan 15, 2024')
      expect(formatDate('2024-01-15')).toContain('Jan')
    })
  })

  describe('formatDuration', () => {
    it('should format durations correctly', () => {
      expect(formatDuration(45)).toBe('45s')
      expect(formatDuration(90)).toBe('1m 30s')
      expect(formatDuration(3600)).toBe('1h')
      expect(formatDuration(3660)).toBe('1h 1m')
    })
  })

  describe('slugify', () => {
    it('should create slugs correctly', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('Test & More!')).toBe('test-more')
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
    })
  })

  describe('calculateConversionRate', () => {
    it('should calculate conversion rates correctly', () => {
      expect(calculateConversionRate(50, 100)).toBe(0.5)
      expect(calculateConversionRate(0, 100)).toBe(0)
      expect(calculateConversionRate(10, 0)).toBe(0)
    })
  })

  describe('calculateDropOffRate', () => {
    it('should calculate drop-off rates correctly', () => {
      expect(calculateDropOffRate(100, 50)).toBe(0.5)
      expect(calculateDropOffRate(100, 100)).toBe(0)
      expect(calculateDropOffRate(0, 0)).toBe(0)
    })
  })

  describe('calculateGrowthRate', () => {
    it('should calculate growth rates correctly', () => {
      expect(calculateGrowthRate(150, 100)).toBe(0.5)
      expect(calculateGrowthRate(50, 100)).toBe(-0.5)
      expect(calculateGrowthRate(100, 0)).toBe(1)
      expect(calculateGrowthRate(0, 0)).toBe(0)
    })
  })

  describe('validateEmail', () => {
    it('should validate emails correctly', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true)
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })
  })

  describe('validateUrl', () => {
    it('should validate URLs correctly', () => {
      expect(validateUrl('https://example.com')).toBe(true)
      expect(validateUrl('http://localhost:3000')).toBe(true)
      expect(validateUrl('ftp://files.example.com')).toBe(true)
      expect(validateUrl('invalid-url')).toBe(false)
      expect(validateUrl('just-text')).toBe(false)
    })
  })

  describe('truncateText', () => {
    it('should truncate text correctly', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...')
      expect(truncateText('Short', 10)).toBe('Short')
      expect(truncateText('', 5)).toBe('')
    })
  })

  describe('capitalizeFirst', () => {
    it('should capitalize first letter correctly', () => {
      expect(capitalizeFirst('hello')).toBe('Hello')
      expect(capitalizeFirst('WORLD')).toBe('WORLD')
      expect(capitalizeFirst('')).toBe('')
      expect(capitalizeFirst('a')).toBe('A')
    })
  })

  describe('parseJsonSafely', () => {
    it('should parse JSON safely', () => {
      expect(parseJsonSafely('{"key": "value"}', {})).toEqual({ key: 'value' })
      expect(parseJsonSafely('invalid json', { fallback: true })).toEqual({ fallback: true })
      expect(parseJsonSafely('', null)).toBe(null)
    })
  })
})