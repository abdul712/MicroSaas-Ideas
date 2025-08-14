import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDuration,
  generateSlug,
  generateApiKey,
  isValidEmail,
  truncateText,
  calculateConversionRate,
  calculateGrowthRate,
  validateJourneyData,
  sanitizeEventProperties
} from '../lib/utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0)).toBe('$0.00')
      expect(formatCurrency(999999.99)).toBe('$999,999.99')
    })

    it('should format other currencies correctly', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56')
      expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1234)).toBe('1,234')
      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(0)).toBe('0')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(0.1234)).toBe('12.3%')
      expect(formatPercentage(0.1234, 2)).toBe('12.34%')
      expect(formatPercentage(1)).toBe('100.0%')
      expect(formatPercentage(0)).toBe('0.0%')
    })
  })

  describe('formatDuration', () => {
    it('should format durations correctly', () => {
      expect(formatDuration(1000)).toBe('1s')
      expect(formatDuration(60000)).toBe('1m 0s')
      expect(formatDuration(3661000)).toBe('1h 1m')
      expect(formatDuration(90061000)).toBe('1d 1h')
    })
  })

  describe('generateSlug', () => {
    it('should generate valid slugs', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
      expect(generateSlug('Customer Journey Mapper')).toBe('customer-journey-mapper')
      expect(generateSlug('Test!@# String')).toBe('test-string')
      expect(generateSlug('  Multiple   Spaces  ')).toBe('multiple-spaces')
    })
  })

  describe('generateApiKey', () => {
    it('should generate valid API keys', () => {
      const apiKey = generateApiKey()
      expect(apiKey).toMatch(/^jm_[A-Za-z0-9]{32}$/)
      
      // Should generate different keys each time
      const apiKey2 = generateApiKey()
      expect(apiKey).not.toBe(apiKey2)
    })
  })

  describe('isValidEmail', () => {
    it('should validate emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user+tag@domain.co.uk')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('truncateText', () => {
    it('should truncate text correctly', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...')
      expect(truncateText('Short', 10)).toBe('Short')
      expect(truncateText('', 5)).toBe('')
    })
  })

  describe('calculateConversionRate', () => {
    it('should calculate conversion rates correctly', () => {
      expect(calculateConversionRate(50, 100)).toBe(0.5)
      expect(calculateConversionRate(0, 100)).toBe(0)
      expect(calculateConversionRate(100, 0)).toBe(0)
      expect(calculateConversionRate(75, 150)).toBe(0.5)
    })
  })

  describe('calculateGrowthRate', () => {
    it('should calculate growth rates correctly', () => {
      expect(calculateGrowthRate(150, 100)).toBe(0.5)
      expect(calculateGrowthRate(50, 100)).toBe(-0.5)
      expect(calculateGrowthRate(100, 0)).toBe(1)
      expect(calculateGrowthRate(0, 100)).toBe(-1)
      expect(calculateGrowthRate(0, 0)).toBe(0)
    })
  })

  describe('validateJourneyData', () => {
    it('should validate journey data correctly', () => {
      const validData = {
        stages: ['stage1', 'stage2'],
        touchpoints: ['touch1', 'touch2']
      }
      expect(validateJourneyData(validData)).toBe(true)

      expect(validateJourneyData(null)).toBe(false)
      expect(validateJourneyData({})).toBe(false)
      expect(validateJourneyData({ stages: [] })).toBe(false)
      expect(validateJourneyData({ stages: ['stage1'] })).toBe(false)
    })
  })

  describe('sanitizeEventProperties', () => {
    it('should sanitize sensitive properties', () => {
      const properties = {
        username: 'testuser',
        password: 'secret123',
        email: 'test@example.com',
        longText: 'a'.repeat(1500)
      }

      const sanitized = sanitizeEventProperties(properties)

      expect(sanitized.username).toBe('testuser')
      expect(sanitized.password).toBeUndefined()
      expect(sanitized.email).toBe('test@example.com')
      expect(sanitized.longText).toMatch(/^a+\.\.\.$/);
      expect(sanitized.longText.length).toBe(1003) // 1000 chars + '...'
    })

    it('should handle empty properties', () => {
      expect(sanitizeEventProperties({})).toEqual({})
    })
  })
})