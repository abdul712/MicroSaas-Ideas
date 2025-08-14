import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatFileSize,
  generateSlug,
  truncate,
  capitalize,
  getInitials,
  isValidEmail,
  isValidUrl,
  buildSearchParams,
  getErrorMessage,
  startOfDay,
  endOfDay,
  isToday,
  daysBetween,
  calculateTaxDeduction,
  getExpenseStatusColor,
  getReceiptStatusColor,
} from '../utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('formats USD currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0)).toBe('$0.00')
      expect(formatCurrency(1000000)).toBe('$1,000,000.00')
    })

    it('formats different currencies correctly', () => {
      expect(formatCurrency(1234.56, 'EUR', 'en-US')).toBe('€1,234.56')
      expect(formatCurrency(1234.56, 'GBP', 'en-US')).toBe('£1,234.56')
    })
  })

  describe('formatDate', () => {
    it('formats dates correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date)).toBe('Jan 15, 2024')
    })

    it('handles string dates', () => {
      expect(formatDate('2024-01-15')).toBe('Jan 15, 2024')
    })
  })

  describe('formatFileSize', () => {
    it('formats file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })
  })

  describe('generateSlug', () => {
    it('generates slugs correctly', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
      expect(generateSlug('Test & Special Characters!')).toBe('test-special-characters')
      expect(generateSlug('Multiple   Spaces')).toBe('multiple-spaces')
    })
  })

  describe('truncate', () => {
    it('truncates long strings', () => {
      const longString = 'This is a very long string that should be truncated'
      expect(truncate(longString, 20)).toBe('This is a very long...')
    })

    it('leaves short strings unchanged', () => {
      const shortString = 'Short'
      expect(truncate(shortString, 20)).toBe('Short')
    })
  })

  describe('capitalize', () => {
    it('capitalizes strings correctly', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('HELLO')).toBe('Hello')
      expect(capitalize('hELLO')).toBe('Hello')
    })
  })

  describe('getInitials', () => {
    it('gets initials from names', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('John Michael Doe')).toBe('JM')
      expect(getInitials('John')).toBe('J')
    })
  })

  describe('isValidEmail', () => {
    it('validates emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true)
      expect(isValidEmail('invalid.email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
    })
  })

  describe('isValidUrl', () => {
    it('validates URLs correctly', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://example.com')).toBe(true)
      expect(isValidUrl('ftp://example.com')).toBe(true)
      expect(isValidUrl('invalid-url')).toBe(false)
      expect(isValidUrl('example.com')).toBe(false)
    })
  })

  describe('buildSearchParams', () => {
    it('builds search params correctly', () => {
      const params = {
        page: 1,
        limit: 20,
        search: 'test query',
        active: true,
        empty: undefined,
      }
      expect(buildSearchParams(params)).toBe('?page=1&limit=20&search=test+query&active=true')
    })

    it('returns empty string for no params', () => {
      expect(buildSearchParams({})).toBe('')
    })
  })

  describe('getErrorMessage', () => {
    it('extracts error messages correctly', () => {
      expect(getErrorMessage(new Error('Test error'))).toBe('Test error')
      expect(getErrorMessage('String error')).toBe('String error')
      expect(getErrorMessage({ unknown: 'object' })).toBe('An unknown error occurred')
    })
  })

  describe('date utilities', () => {
    const testDate = new Date('2024-01-15T14:30:00Z')

    it('gets start of day correctly', () => {
      const start = startOfDay(testDate)
      expect(start.getHours()).toBe(0)
      expect(start.getMinutes()).toBe(0)
      expect(start.getSeconds()).toBe(0)
      expect(start.getMilliseconds()).toBe(0)
    })

    it('gets end of day correctly', () => {
      const end = endOfDay(testDate)
      expect(end.getHours()).toBe(23)
      expect(end.getMinutes()).toBe(59)
      expect(end.getSeconds()).toBe(59)
      expect(end.getMilliseconds()).toBe(999)
    })

    it('calculates days between dates', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-15')
      expect(daysBetween(date1, date2)).toBe(14)
    })
  })

  describe('business utilities', () => {
    it('calculates tax deduction correctly', () => {
      expect(calculateTaxDeduction(1000)).toBe(250) // 25% default
      expect(calculateTaxDeduction(1000, 0.30)).toBe(300) // 30% custom
    })

    it('gets expense status colors correctly', () => {
      expect(getExpenseStatusColor('DRAFT')).toContain('gray')
      expect(getExpenseStatusColor('APPROVED')).toContain('green')
      expect(getExpenseStatusColor('REJECTED')).toContain('red')
    })

    it('gets receipt status colors correctly', () => {
      expect(getReceiptStatusColor('PROCESSING')).toContain('yellow')
      expect(getReceiptStatusColor('COMPLETED')).toContain('green')
      expect(getReceiptStatusColor('FAILED')).toContain('red')
    })
  })
})