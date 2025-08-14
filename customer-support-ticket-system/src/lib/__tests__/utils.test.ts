import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  generateTicketNumber,
  capitalizeFirst,
  slugify,
  truncate,
  getInitials,
  validateEmail,
  getTicketStatusColor,
  getTicketPriorityColor,
  debounce,
  formatFileSize,
  isValidUrl,
} from '../utils'

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toBe('Jan 15, 2024')
    })

    it('should handle string input', () => {
      const formatted = formatDate('2024-01-15')
      expect(formatted).toBe('Jan 15, 2024')
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const date = new Date('2024-01-15T14:30:00')
      const formatted = formatDateTime(date)
      expect(formatted).toContain('Jan 15, 2024')
      expect(formatted).toContain('02:30 PM')
    })
  })

  describe('formatRelativeTime', () => {
    it('should return "just now" for recent times', () => {
      const now = new Date()
      const result = formatRelativeTime(now)
      expect(result).toBe('just now')
    })

    it('should return minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const result = formatRelativeTime(fiveMinutesAgo)
      expect(result).toBe('5m ago')
    })

    it('should return hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      const result = formatRelativeTime(twoHoursAgo)
      expect(result).toBe('2h ago')
    })

    it('should return days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      const result = formatRelativeTime(threeDaysAgo)
      expect(result).toBe('3d ago')
    })

    it('should return formatted date for older times', () => {
      const oneWeekAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      const result = formatRelativeTime(oneWeekAgo)
      expect(result).toContain('2024') // Assuming current year
    })
  })

  describe('generateTicketNumber', () => {
    it('should generate a ticket number with # prefix', () => {
      const ticketNumber = generateTicketNumber()
      expect(ticketNumber).toMatch(/^#[A-Z0-9]+$/)
    })

    it('should generate unique ticket numbers', () => {
      const ticket1 = generateTicketNumber()
      const ticket2 = generateTicketNumber()
      expect(ticket1).not.toBe(ticket2)
    })
  })

  describe('capitalizeFirst', () => {
    it('should capitalize first letter and lowercase the rest', () => {
      expect(capitalizeFirst('hello WORLD')).toBe('Hello world')
      expect(capitalizeFirst('HELLO')).toBe('Hello')
      expect(capitalizeFirst('h')).toBe('H')
    })
  })

  describe('slugify', () => {
    it('should convert string to slug format', () => {
      expect(slugify('Hello World!')).toBe('hello-world')
      expect(slugify('Test_String-123')).toBe('test-string-123')
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
    })
  })

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const longString = 'This is a very long string that should be truncated'
      const truncated = truncate(longString, 20)
      expect(truncated).toBe('This is a very long ...')
      expect(truncated.length).toBe(23) // 20 + '...'
    })

    it('should not truncate short strings', () => {
      const shortString = 'Short string'
      const result = truncate(shortString, 20)
      expect(result).toBe(shortString)
    })
  })

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('John William Doe')).toBe('JW')
      expect(getInitials('SingleName')).toBe('SI')
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.email@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
    })
  })

  describe('getTicketStatusColor', () => {
    it('should return correct colors for ticket statuses', () => {
      expect(getTicketStatusColor('open')).toContain('blue')
      expect(getTicketStatusColor('in_progress')).toContain('yellow')
      expect(getTicketStatusColor('resolved')).toContain('green')
      expect(getTicketStatusColor('closed')).toContain('gray')
    })
  })

  describe('getTicketPriorityColor', () => {
    it('should return correct colors for ticket priorities', () => {
      expect(getTicketPriorityColor('low')).toContain('gray')
      expect(getTicketPriorityColor('medium')).toContain('blue')
      expect(getTicketPriorityColor('high')).toContain('orange')
      expect(getTicketPriorityColor('urgent')).toContain('red')
    })
  })

  describe('debounce', () => {
    jest.useFakeTimers()

    it('should debounce function calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('test1')
      debouncedFn('test2')
      debouncedFn('test3')

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('test3')
    })

    afterEach(() => {
      jest.clearAllTimers()
    })
  })

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })
  })

  describe('isValidUrl', () => {
    it('should validate URLs correctly', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://test.org')).toBe(true)
      expect(isValidUrl('ftp://files.example.com')).toBe(true)
      expect(isValidUrl('invalid-url')).toBe(false)
      expect(isValidUrl('not a url')).toBe(false)
    })
  })
})