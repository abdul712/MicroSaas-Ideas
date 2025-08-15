import {
  cn,
  formatDate,
  formatBytes,
  slugify,
  truncate,
  capitalize,
  formatCurrency,
  formatNumber,
  formatPercent,
  isValidEmail,
  isValidUrl,
  generateId,
  randomBetween,
  clamp,
  round,
  getInitials,
  timeAgo,
} from '@/lib/utils'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toContain('text-red-500')
      expect(cn('text-red-500', 'bg-blue-500')).toContain('bg-blue-500')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional')).toContain('conditional')
      expect(cn('base', false && 'conditional')).not.toContain('conditional')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toBe('January 15, 2024')
    })

    it('should handle string dates', () => {
      const formatted = formatDate('2024-01-15')
      expect(formatted).toBe('January 15, 2024')
    })
  })

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Byte')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(1073741824)).toBe('1 GB')
    })

    it('should handle decimals', () => {
      expect(formatBytes(1536, { decimals: 1 })).toBe('1.5 KB')
    })

    it('should handle accurate sizes', () => {
      expect(formatBytes(1024, { sizeType: 'accurate' })).toBe('1 KiB')
    })
  })

  describe('slugify', () => {
    it('should create valid slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('Hello, World!')).toBe('hello-world')
      expect(slugify('  Hello   World  ')).toBe('hello-world')
      expect(slugify('Special@Characters#')).toBe('specialcharacters')
    })
  })

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...')
      expect(truncate('Hi', 5)).toBe('Hi')
    })
  })

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('HELLO')).toBe('HELLO')
      expect(capitalize('')).toBe('')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(99.99)).toBe('$99.99')
      expect(formatCurrency('99.99')).toBe('$99.99')
    })

    it('should handle different currencies', () => {
      expect(formatCurrency(99.99, { currency: 'EUR' })).toBe('€99.99')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers correctly', () => {
      expect(formatNumber(1234.56)).toBe('1,235')
      expect(formatNumber(1234.56, { decimals: 2 })).toBe('1,234.56')
    })
  })

  describe('formatPercent', () => {
    it('should format percentages correctly', () => {
      expect(formatPercent(25)).toBe('25.0%')
      expect(formatPercent(25, 0)).toBe('25%')
    })
  })

  describe('isValidEmail', () => {
    it('should validate emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })
  })

  describe('isValidUrl', () => {
    it('should validate URLs correctly', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://example.com')).toBe(true)
      expect(isValidUrl('invalid-url')).toBe(false)
      expect(isValidUrl('ftp://example.com')).toBe(true)
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('randomBetween', () => {
    it('should generate numbers in range', () => {
      const random = randomBetween(1, 10)
      expect(random).toBeGreaterThanOrEqual(1)
      expect(random).toBeLessThanOrEqual(10)
    })
  })

  describe('clamp', () => {
    it('should clamp numbers correctly', () => {
      expect(clamp(5, 1, 10)).toBe(5)
      expect(clamp(-5, 1, 10)).toBe(1)
      expect(clamp(15, 1, 10)).toBe(10)
    })
  })

  describe('round', () => {
    it('should round numbers correctly', () => {
      expect(round(1.2345)).toBe(1)
      expect(round(1.2345, 2)).toBe(1.23)
      expect(round(1.2375, 2)).toBe(1.24)
    })
  })

  describe('getInitials', () => {
    it('should get initials correctly', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('John Michael Doe')).toBe('JM')
      expect(getInitials('John')).toBe('J')
      expect(getInitials('')).toBe('')
    })
  })

  describe('timeAgo', () => {
    it('should format time ago correctly', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      expect(timeAgo(oneHourAgo)).toBe('1 hour ago')
      expect(timeAgo(oneDayAgo)).toBe('1 day ago')
    })

    it('should handle just now', () => {
      const now = new Date()
      expect(timeAgo(now)).toBe('just now')
    })
  })
})