import {
  formatDate,
  formatRelativeDate,
  truncateText,
  ratingToNumber,
  numberToRating,
  getSentimentColor,
  getPlatformInfo,
  isValidEmail,
  isValidPhone,
  formatPhoneNumber,
  calculateAverageRating,
  calculatePercentageChange,
  generateAvatarColor,
  generateInitials,
  generateSlug,
  titleCase,
  extractDomain,
  isValidUrl,
  camelToTitle,
  safeJsonParse,
} from '../utils'

describe('utils', () => {
  describe('formatDate', () => {
    it('should format a valid date', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Jan 15, 2024/)
    })

    it('should handle null/undefined dates', () => {
      expect(formatDate(null)).toBe('N/A')
      expect(formatDate(undefined)).toBe('N/A')
    })

    it('should handle invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date')
    })
  })

  describe('formatRelativeDate', () => {
    it('should return "Just now" for recent dates', () => {
      const now = new Date()
      expect(formatRelativeDate(now)).toBe('Just now')
    })

    it('should return minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      expect(formatRelativeDate(fiveMinutesAgo)).toBe('5 minutes ago')
    })

    it('should return hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      expect(formatRelativeDate(twoHoursAgo)).toBe('2 hours ago')
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

  describe('rating conversion', () => {
    it('should convert rating enum to number', () => {
      expect(ratingToNumber('ONE')).toBe(1)
      expect(ratingToNumber('THREE')).toBe(3)
      expect(ratingToNumber('FIVE')).toBe(5)
      expect(ratingToNumber('INVALID')).toBe(0)
    })

    it('should convert number to rating enum', () => {
      expect(numberToRating(1)).toBe('ONE')
      expect(numberToRating(3)).toBe('THREE')
      expect(numberToRating(5)).toBe('FIVE')
      expect(numberToRating(0)).toBe('ONE')
    })
  })

  describe('getSentimentColor', () => {
    it('should return correct colors for sentiments', () => {
      expect(getSentimentColor('VERY_POSITIVE')).toBe('text-green-600')
      expect(getSentimentColor('NEGATIVE')).toBe('text-red-500')
      expect(getSentimentColor('NEUTRAL')).toBe('text-yellow-500')
      expect(getSentimentColor('UNKNOWN')).toBe('text-gray-500')
    })
  })

  describe('getPlatformInfo', () => {
    it('should return correct platform info', () => {
      const google = getPlatformInfo('GOOGLE')
      expect(google.name).toBe('Google')
      expect(google.color).toBe('text-blue-600')
      expect(google.icon).toBe('🌍')

      const unknown = getPlatformInfo('UNKNOWN')
      expect(unknown.name).toBe('Unknown')
      expect(unknown.icon).toBe('❓')
    })
  })

  describe('email validation', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })
  })

  describe('phone validation', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhone('+1234567890')).toBe(true)
      expect(isValidPhone('1234567890')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('abc')).toBe(false)
      expect(isValidPhone('123')).toBe(false)
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format 10-digit numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890')
    })

    it('should format 11-digit numbers starting with 1', () => {
      expect(formatPhoneNumber('11234567890')).toBe('+1 (123) 456-7890')
    })

    it('should return original for other formats', () => {
      expect(formatPhoneNumber('+44 123 456 7890')).toBe('+44 123 456 7890')
    })
  })

  describe('calculateAverageRating', () => {
    it('should calculate correct average', () => {
      expect(calculateAverageRating([1, 2, 3, 4, 5])).toBe(3)
      expect(calculateAverageRating([4, 4, 5, 5])).toBe(4.5)
    })

    it('should return 0 for empty array', () => {
      expect(calculateAverageRating([])).toBe(0)
    })
  })

  describe('calculatePercentageChange', () => {
    it('should calculate percentage change', () => {
      expect(calculatePercentageChange(100, 120)).toBe(20)
      expect(calculatePercentageChange(100, 80)).toBe(-20)
    })

    it('should handle zero old value', () => {
      expect(calculatePercentageChange(0, 100)).toBe(100)
      expect(calculatePercentageChange(0, 0)).toBe(0)
    })
  })

  describe('generateAvatarColor', () => {
    it('should generate consistent colors for same input', () => {
      const color1 = generateAvatarColor('test')
      const color2 = generateAvatarColor('test')
      expect(color1).toBe(color2)
    })

    it('should generate different colors for different inputs', () => {
      const color1 = generateAvatarColor('test1')
      const color2 = generateAvatarColor('test2')
      expect(color1).not.toBe(color2)
    })
  })

  describe('generateInitials', () => {
    it('should generate initials from name', () => {
      expect(generateInitials('John Doe')).toBe('JD')
      expect(generateInitials('Jane Mary Smith')).toBe('JM')
      expect(generateInitials('SingleName')).toBe('S')
    })
  })

  describe('generateSlug', () => {
    it('should generate valid slugs', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
      expect(generateSlug('Test! @# String')).toBe('test-string')
      expect(generateSlug('Multiple   Spaces')).toBe('multiple-spaces')
    })
  })

  describe('titleCase', () => {
    it('should convert to title case', () => {
      expect(titleCase('hello world')).toBe('Hello World')
      expect(titleCase('UPPERCASE TEXT')).toBe('Uppercase Text')
    })
  })

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(extractDomain('https://www.example.com/path')).toBe('example.com')
      expect(extractDomain('http://subdomain.example.com')).toBe('subdomain.example.com')
    })

    it('should return original string for invalid URLs', () => {
      expect(extractDomain('not-a-url')).toBe('not-a-url')
    })
  })

  describe('isValidUrl', () => {
    it('should validate URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
      expect(isValidUrl('not-a-url')).toBe(false)
    })
  })

  describe('camelToTitle', () => {
    it('should convert camelCase to title case', () => {
      expect(camelToTitle('firstName')).toBe('First Name')
      expect(camelToTitle('someVariableName')).toBe('Some Variable Name')
    })
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const data = { test: 'value' }
      expect(safeJsonParse(JSON.stringify(data))).toEqual(data)
    })

    it('should return fallback for invalid JSON', () => {
      expect(safeJsonParse('invalid json')).toBe(null)
      expect(safeJsonParse('invalid json', { default: true })).toEqual({ default: true })
    })
  })
})