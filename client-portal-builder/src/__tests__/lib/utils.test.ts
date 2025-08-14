import {
  formatFileSize,
  formatDate,
  formatDateTime,
  generateSlug,
  isValidEmail,
  generateRandomString,
  truncateText,
  getInitials,
  capitalize,
  toTitleCase,
  isEmpty,
  safeJsonParse,
  generateColorFromString,
  formatCurrency,
  getRelativeTime
} from '@/lib/utils'

describe('Utils', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('should handle decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(2621440)).toBe('2.5 MB')
    })
  })

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const date = '2024-01-15'
      const result = formatDate(date)
      expect(result).toMatch(/Jan 15, 2024/)
    })

    it('should format Date object correctly', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(result).toMatch(/Jan 15, 2024/)
    })
  })

  describe('formatDateTime', () => {
    it('should format date with time', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = formatDateTime(date)
      expect(result).toMatch(/Jan 15, 2024/)
      expect(result).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('generateSlug', () => {
    it('should generate slug from string', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
      expect(generateSlug('Client Portal #1')).toBe('client-portal-1')
      expect(generateSlug('  Multiple   Spaces  ')).toBe('multiple-spaces')
    })

    it('should handle special characters', () => {
      expect(generateSlug('Client @ Company!')).toBe('client-company')
      expect(generateSlug('Test & Development')).toBe('test-development')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('test.email+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
    })
  })

  describe('generateRandomString', () => {
    it('should generate string of correct length', () => {
      expect(generateRandomString(10)).toHaveLength(10)
      expect(generateRandomString(20)).toHaveLength(20)
    })

    it('should generate different strings', () => {
      const str1 = generateRandomString(10)
      const str2 = generateRandomString(10)
      expect(str1).not.toBe(str2)
    })
  })

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated'
      expect(truncateText(longText, 20)).toBe('This is a very long ...')
    })

    it('should not truncate short text', () => {
      const shortText = 'Short text'
      expect(truncateText(shortText, 20)).toBe('Short text')
    })
  })

  describe('getInitials', () => {
    it('should get initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Jane Smith Johnson')).toBe('JS')
      expect(getInitials('SingleName')).toBe('SI')
    })
  })

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('WORLD')).toBe('WORLD')
      expect(capitalize('')).toBe('')
    })
  })

  describe('toTitleCase', () => {
    it('should convert to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World')
      expect(toTitleCase('the QUICK brown FOX')).toBe('The Quick Brown Fox')
    })
  })

  describe('isEmpty', () => {
    it('should check if object is empty', () => {
      expect(isEmpty({})).toBe(true)
      expect(isEmpty({ key: 'value' })).toBe(false)
    })
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const obj = { test: 'value' }
      expect(safeJsonParse(JSON.stringify(obj), {})).toEqual(obj)
    })

    it('should return fallback for invalid JSON', () => {
      const fallback = { error: true }
      expect(safeJsonParse('invalid json', fallback)).toEqual(fallback)
    })
  })

  describe('generateColorFromString', () => {
    it('should generate consistent color for same string', () => {
      const color1 = generateColorFromString('test')
      const color2 = generateColorFromString('test')
      expect(color1).toBe(color2)
    })

    it('should generate different colors for different strings', () => {
      const color1 = generateColorFromString('test1')
      const color2 = generateColorFromString('test2')
      expect(color1).not.toBe(color2)
    })

    it('should return valid hex color', () => {
      const color = generateColorFromString('test')
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  describe('formatCurrency', () => {
    it('should format USD currency by default', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should format different currencies', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56')
    })
  })

  describe('getRelativeTime', () => {
    it('should return "just now" for very recent dates', () => {
      const now = new Date()
      expect(getRelativeTime(now)).toBe('just now')
    })

    it('should return minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      expect(getRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago')
    })

    it('should return hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      expect(getRelativeTime(twoHoursAgo)).toBe('2 hours ago')
    })
  })
})