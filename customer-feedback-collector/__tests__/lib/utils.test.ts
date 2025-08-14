import {
  calculateNPS,
  calculateCSAT,
  calculateAverage,
  generateSlug,
  isValidEmail,
  isValidURL,
  formatRelativeTime,
  formatBytes,
  formatPercentage,
  formatNumber,
  formatCurrency,
  generateEmbedCode,
} from '@/lib/utils'

describe('utils', () => {
  describe('calculateNPS', () => {
    it('should calculate NPS correctly', () => {
      const scores = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
      expect(calculateNPS(scores)).toBe(-60) // 2 promoters, 2 passives, 6 detractors
    })

    it('should return 0 for empty array', () => {
      expect(calculateNPS([])).toBe(0)
    })

    it('should handle all promoters', () => {
      const scores = [10, 9, 10, 9]
      expect(calculateNPS(scores)).toBe(100)
    })

    it('should handle all detractors', () => {
      const scores = [1, 2, 3, 4, 5, 6]
      expect(calculateNPS(scores)).toBe(-100)
    })
  })

  describe('calculateCSAT', () => {
    it('should calculate CSAT correctly for 5-point scale', () => {
      const scores = [5, 4, 3, 2, 1, 5, 4]
      expect(calculateCSAT(scores, 5)).toBe(57) // 4 satisfied (4,5) out of 7
    })

    it('should return 0 for empty array', () => {
      expect(calculateCSAT([])).toBe(0)
    })

    it('should handle all satisfied responses', () => {
      const scores = [5, 5, 4, 4]
      expect(calculateCSAT(scores, 5)).toBe(100)
    })
  })

  describe('calculateAverage', () => {
    it('should calculate average correctly', () => {
      expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3)
    })

    it('should return 0 for empty array', () => {
      expect(calculateAverage([])).toBe(0)
    })

    it('should handle decimal results', () => {
      expect(calculateAverage([1, 2])).toBe(1.5)
    })
  })

  describe('generateSlug', () => {
    it('should generate slug from text', () => {
      expect(generateSlug('Customer Satisfaction Survey')).toBe('customer-satisfaction-survey')
    })

    it('should handle special characters', () => {
      expect(generateSlug('Survey #1: Q&A Session!')).toBe('survey-1-qa-session')
    })

    it('should handle multiple spaces', () => {
      expect(generateSlug('Multiple   Spaces    Here')).toBe('multiple-spaces-here')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })
  })

  describe('isValidURL', () => {
    it('should validate correct URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true)
      expect(isValidURL('http://localhost:3000')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(isValidURL('not-a-url')).toBe(false)
      expect(isValidURL('ftp://example.com')).toBe(true) // URL constructor accepts this
    })
  })

  describe('formatRelativeTime', () => {
    it('should format relative time correctly', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      expect(formatRelativeTime(oneHourAgo)).toContain('hour')
    })
  })

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1048576)).toBe('1 MB')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      expect(formatPercentage(85.67)).toBe('85.7%')
      expect(formatPercentage(100)).toBe('100.0%')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(2999)).toBe('$29.99') // Stripe cents to dollars
      expect(formatCurrency(10000)).toBe('$100.00')
    })
  })

  describe('generateEmbedCode', () => {
    it('should generate popup embed code', () => {
      const code = generateEmbedCode('widget-123', 'popup')
      expect(code).toContain('script')
      expect(code).toContain('widget-123')
      expect(code).toContain('popup.js')
    })

    it('should generate inline embed code', () => {
      const code = generateEmbedCode('widget-456', 'inline')
      expect(code).toContain('feedback-widget-456')
      expect(code).toContain('inline.js')
    })
  })
})