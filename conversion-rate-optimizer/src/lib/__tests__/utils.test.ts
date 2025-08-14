import {
  formatBytes,
  formatNumber,
  formatPercentage,
  formatCurrency,
  calculateStatisticalSignificance,
  calculateConversionLift,
  calculateSampleSize,
  isValidEmail,
  isValidUrl,
  extractDomain,
  sanitizeHtml,
  ColorUtils,
  DateUtils,
} from '../utils'

describe('Utils', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(1073741824)).toBe('1 GB')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with appropriate suffixes', () => {
      expect(formatNumber(500)).toBe('500')
      expect(formatNumber(1500)).toBe('1.5K')
      expect(formatNumber(1500000)).toBe('1.5M')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(12.345)).toBe('12.3%')
      expect(formatPercentage(12.345, 2)).toBe('12.35%')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(1234.56, 'EUR')).toContain('1,234.56')
    })
  })

  describe('calculateStatisticalSignificance', () => {
    it('should calculate significance correctly', () => {
      const significance = calculateStatisticalSignificance(
        100, // control conversions
        1000, // control visitors
        150, // variation conversions
        1000 // variation visitors
      )

      expect(significance).toBeGreaterThan(95)
    })

    it('should return 0 for identical results', () => {
      const significance = calculateStatisticalSignificance(
        100,
        1000,
        100,
        1000
      )

      expect(significance).toBe(0)
    })
  })

  describe('calculateConversionLift', () => {
    it('should calculate lift correctly', () => {
      expect(calculateConversionLift(10, 15)).toBe(50) // 50% increase
      expect(calculateConversionLift(10, 5)).toBe(-50) // 50% decrease
      expect(calculateConversionLift(0, 5)).toBe(0) // Handle zero baseline
    })
  })

  describe('calculateSampleSize', () => {
    it('should calculate reasonable sample sizes', () => {
      const sampleSize = calculateSampleSize(0.05, 20, 0.8, 0.05)
      expect(sampleSize).toBeGreaterThan(0)
      expect(sampleSize).toBeLessThan(100000)
    })
  })

  describe('isValidEmail', () => {
    it('should validate emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('invalid.email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })
  })

  describe('isValidUrl', () => {
    it('should validate URLs correctly', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('ftp://example.com')).toBe(true)
    })
  })

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(extractDomain('https://example.com/path')).toBe('example.com')
      expect(extractDomain('http://subdomain.example.com')).toBe('subdomain.example.com')
      expect(extractDomain('invalid-url')).toBe('invalid-url')
    })
  })

  describe('sanitizeHtml', () => {
    it('should remove dangerous HTML', () => {
      const dangerous = '<script>alert("xss")</script><p>Safe content</p>'
      const sanitized = sanitizeHtml(dangerous)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toContain('<p>Safe content</p>')
    })

    it('should remove iframe tags', () => {
      const iframe = '<iframe src="evil.com"></iframe><div>Safe</div>'
      const sanitized = sanitizeHtml(iframe)
      
      expect(sanitized).not.toContain('<iframe>')
      expect(sanitized).toContain('<div>Safe</div>')
    })

    it('should remove javascript: URLs', () => {
      const jsUrl = '<a href="javascript:alert(1)">Link</a>'
      const sanitized = sanitizeHtml(jsUrl)
      
      expect(sanitized).not.toContain('javascript:')
    })
  })

  describe('ColorUtils', () => {
    it('should return correct status colors', () => {
      expect(ColorUtils.getStatusColor('active')).toBe('green')
      expect(ColorUtils.getStatusColor('critical')).toBe('red')
      expect(ColorUtils.getStatusColor('unknown')).toBe('gray')
    })

    it('should return correct conversion colors', () => {
      expect(ColorUtils.getConversionColor(15)).toBe('green') // >10%
      expect(ColorUtils.getConversionColor(5)).toBe('blue') // >0%
      expect(ColorUtils.getConversionColor(-2)).toBe('yellow') // >-5%
      expect(ColorUtils.getConversionColor(-10)).toBe('red') // <=-5%
    })
  })

  describe('DateUtils', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed timestamp
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return correct date ranges', () => {
      const ranges = DateUtils.getDateRange('7days')
      const now = new Date()
      const expected = new Date()
      expected.setDate(now.getDate() - 7)

      expect(ranges.endDate).toEqual(now)
      expect(ranges.startDate.getDate()).toBe(expected.getDate())
    })

    it('should handle today range', () => {
      const ranges = DateUtils.getDateRange('today')
      
      expect(ranges.startDate.getHours()).toBe(0)
      expect(ranges.startDate.getMinutes()).toBe(0)
      expect(ranges.startDate.getSeconds()).toBe(0)
    })
  })
})