import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  slugify,
  generateId,
  truncate,
  debounce,
  throttle,
  calculatePercentageChange,
  getRandomColor,
  validateEmail,
  validateUrl,
  hashString
} from '../utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0)).toBe('$0.00')
      expect(formatCurrency(-100)).toBe('-$100.00')
    })

    it('should handle different currencies', () => {
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
      expect(formatPercentage(0.5)).toBe('50.0%')
      expect(formatPercentage(1)).toBe('100.0%')
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Jan 15, 2024/)
    })

    it('should handle string dates', () => {
      const formatted = formatDate('2024-01-15T10:30:00Z')
      expect(formatted).toMatch(/Jan 15, 2024/)
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDateTime(date)
      expect(formatted).toMatch(/Jan 15, 2024/)
      expect(formatted).toMatch(/AM|PM/)
    })
  })

  describe('formatRelativeTime', () => {
    it('should return "Today" for today', () => {
      const today = new Date()
      expect(formatRelativeTime(today)).toBe('Today')
    })

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(yesterday)).toBe('Yesterday')
    })

    it('should return days ago for recent dates', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago')
    })
  })

  describe('slugify', () => {
    it('should create slugs correctly', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('Special Characters!@#$%')).toBe('special-characters')
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
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

  describe('truncate', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated'
      expect(truncate(longText, 20)).toBe('This is a very long ...')
    })

    it('should not truncate short text', () => {
      const shortText = 'Short text'
      expect(truncate(shortText, 20)).toBe('Short text')
    })
  })

  describe('debounce', () => {
    jest.useFakeTimers()

    it('should debounce function calls', () => {
      const fn = jest.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(fn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
    })

    afterEach(() => {
      jest.clearAllTimers()
    })
  })

  describe('throttle', () => {
    jest.useFakeTimers()

    it('should throttle function calls', () => {
      const fn = jest.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(fn).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(100)
      
      throttledFn()
      expect(fn).toHaveBeenCalledTimes(2)
    })

    afterEach(() => {
      jest.clearAllTimers()
    })
  })

  describe('calculatePercentageChange', () => {
    it('should calculate percentage change correctly', () => {
      expect(calculatePercentageChange(120, 100)).toBe(20)
      expect(calculatePercentageChange(80, 100)).toBe(-20)
      expect(calculatePercentageChange(100, 0)).toBe(100)
      expect(calculatePercentageChange(0, 100)).toBe(-100)
    })
  })

  describe('getRandomColor', () => {
    it('should return a valid hex color', () => {
      const color = getRandomColor()
      expect(color).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should return different colors on multiple calls', () => {
      const colors = Array.from({ length: 10 }, () => getRandomColor())
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBeGreaterThan(1)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
    })
  })

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true)
      expect(validateUrl('http://localhost:3000')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false)
      expect(validateUrl('example.com')).toBe(false)
    })
  })

  describe('hashString', () => {
    it('should generate consistent hashes', () => {
      const hash1 = hashString('test string')
      const hash2 = hashString('test string')
      expect(hash1).toBe(hash2)
    })

    it('should generate different hashes for different strings', () => {
      const hash1 = hashString('string1')
      const hash2 = hashString('string2')
      expect(hash1).not.toBe(hash2)
    })

    it('should return a string', () => {
      const hash = hashString('test')
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })
  })
})