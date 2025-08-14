import {
  formatDate,
  formatRelativeTime,
  formatRating,
  getRatingStars,
  getSentimentColor,
  getPlatformColor,
  getPriorityColor,
  getStatusColor,
  truncateText,
  generateAvatarUrl,
  validateEmail,
  validateUrl,
  formatPhoneNumber,
  debounce,
  throttle,
  calculateSentimentScore,
  getSentimentLabel,
  formatCurrency,
  formatNumber,
  formatPercentage,
  getInitials,
  generateSlug,
  isValidBusinessHours,
  isWithinBusinessHours
} from '@/lib/utils'

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Jan 15, 2024/)
    })

    it('should handle null dates', () => {
      expect(formatDate(null)).toBe('')
    })

    it('should handle invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('')
    })
  })

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should show "just now" for recent dates', () => {
      const date = new Date('2024-01-15T11:59:30Z')
      expect(formatRelativeTime(date)).toBe('just now')
    })

    it('should show minutes ago', () => {
      const date = new Date('2024-01-15T11:45:00Z')
      expect(formatRelativeTime(date)).toBe('15m ago')
    })

    it('should show hours ago', () => {
      const date = new Date('2024-01-15T10:00:00Z')
      expect(formatRelativeTime(date)).toBe('2h ago')
    })

    it('should show days ago', () => {
      const date = new Date('2024-01-13T12:00:00Z')
      expect(formatRelativeTime(date)).toBe('2d ago')
    })
  })

  describe('formatRating', () => {
    it('should format rating to one decimal place', () => {
      expect(formatRating(4.567)).toBe('4.6')
      expect(formatRating(3)).toBe('3.0')
    })
  })

  describe('getRatingStars', () => {
    it('should calculate stars correctly', () => {
      expect(getRatingStars(4.7)).toEqual({ full: 4, half: true, empty: 0 })
      expect(getRatingStars(3.2)).toEqual({ full: 3, half: false, empty: 2 })
      expect(getRatingStars(5)).toEqual({ full: 5, half: false, empty: 0 })
    })
  })

  describe('getSentimentColor', () => {
    it('should return correct colors for sentiment', () => {
      expect(getSentimentColor('positive')).toBe('text-green-600')
      expect(getSentimentColor('negative')).toBe('text-red-600')
      expect(getSentimentColor('neutral')).toBe('text-yellow-600')
      expect(getSentimentColor(null)).toBe('text-gray-500')
    })
  })

  describe('getPlatformColor', () => {
    it('should return platform-specific colors', () => {
      expect(getPlatformColor('google')).toBe('platform-google')
      expect(getPlatformColor('yelp')).toBe('platform-yelp')
      expect(getPlatformColor('unknown')).toBe('bg-gray-500 text-white')
    })
  })

  describe('getPriorityColor', () => {
    it('should return priority-specific colors', () => {
      expect(getPriorityColor('urgent')).toBe('priority-urgent')
      expect(getPriorityColor('high')).toBe('priority-high')
      expect(getPriorityColor('medium')).toBe('priority-medium')
      expect(getPriorityColor('low')).toBe('priority-low')
    })
  })

  describe('getStatusColor', () => {
    it('should return status-specific colors', () => {
      expect(getStatusColor('new')).toContain('bg-blue-100')
      expect(getStatusColor('responded')).toContain('bg-green-100')
      expect(getStatusColor('unknown')).toContain('bg-gray-100')
    })
  })

  describe('truncateText', () => {
    it('should truncate text correctly', () => {
      const longText = 'This is a very long text that should be truncated'
      expect(truncateText(longText, 20)).toBe('This is a very long ...')
    })

    it('should not truncate short text', () => {
      const shortText = 'Short text'
      expect(truncateText(shortText, 20)).toBe(shortText)
    })
  })

  describe('generateAvatarUrl', () => {
    it('should generate avatar URL correctly', () => {
      const url = generateAvatarUrl('John Doe')
      expect(url).toContain('ui-avatars.com')
      expect(url).toContain('John%20Doe')
    })
  })

  describe('validateEmail', () => {
    it('should validate emails correctly', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
    })
  })

  describe('validateUrl', () => {
    it('should validate URLs correctly', () => {
      expect(validateUrl('https://example.com')).toBe(true)
      expect(validateUrl('http://example.com')).toBe(true)
      expect(validateUrl('not-a-url')).toBe(false)
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format US phone numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890')
      expect(formatPhoneNumber('11234567890')).toBe('+1 (123) 456-7890')
    })

    it('should return original for invalid formats', () => {
      expect(formatPhoneNumber('123')).toBe('123')
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', () => {
      jest.useFakeTimers()
      const fn = jest.fn()
      const debouncedFn = debounce(fn, 100)
      
      debouncedFn()
      debouncedFn()
      debouncedFn()
      
      expect(fn).not.toHaveBeenCalled()
      
      jest.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      
      jest.useRealTimers()
    })
  })

  describe('throttle', () => {
    it('should throttle function calls', () => {
      jest.useFakeTimers()
      const fn = jest.fn()
      const throttledFn = throttle(fn, 100)
      
      throttledFn()
      throttledFn()
      throttledFn()
      
      expect(fn).toHaveBeenCalledTimes(1)
      
      jest.advanceTimersByTime(100)
      throttledFn()
      expect(fn).toHaveBeenCalledTimes(2)
      
      jest.useRealTimers()
    })
  })

  describe('calculateSentimentScore', () => {
    it('should calculate positive sentiment', () => {
      const score = calculateSentimentScore('This is a great and excellent service')
      expect(score).toBeGreaterThan(0)
    })

    it('should calculate negative sentiment', () => {
      const score = calculateSentimentScore('This is terrible and awful')
      expect(score).toBeLessThan(0)
    })

    it('should calculate neutral sentiment', () => {
      const score = calculateSentimentScore('This is a normal service')
      expect(Math.abs(score)).toBeLessThanOrEqual(0.1)
    })
  })

  describe('getSentimentLabel', () => {
    it('should return correct sentiment labels', () => {
      expect(getSentimentLabel(0.5)).toBe('positive')
      expect(getSentimentLabel(-0.5)).toBe('negative')
      expect(getSentimentLabel(0.05)).toBe('neutral')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(123.45)).toBe('$123.45')
      expect(formatCurrency(1000)).toBe('$1,000.00')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(123)).toBe('123')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages', () => {
      expect(formatPercentage(0.1234)).toBe('12.3%')
      expect(formatPercentage(0.5, 0)).toBe('50%')
    })
  })

  describe('getInitials', () => {
    it('should get initials from names', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Jane Mary Smith')).toBe('JM')
      expect(getInitials('Single')).toBe('SI')
    })
  })

  describe('generateSlug', () => {
    it('should generate slugs correctly', () => {
      expect(generateSlug('Hello World!')).toBe('hello-world')
      expect(generateSlug('Test@#$ Multiple   Spaces')).toBe('test-multiple-spaces')
    })
  })

  describe('isValidBusinessHours', () => {
    it('should validate business hours format', () => {
      expect(isValidBusinessHours('09:00-17:00')).toBe(true)
      expect(isValidBusinessHours('9:00 - 17:00')).toBe(true)
      expect(isValidBusinessHours('invalid')).toBe(false)
      expect(isValidBusinessHours('25:00-17:00')).toBe(false)
    })
  })

  describe('isWithinBusinessHours', () => {
    it('should check if time is within business hours', () => {
      const date = new Date('2024-01-15T14:00:00') // 2 PM
      expect(isWithinBusinessHours('09:00-17:00', date)).toBe(true)
      
      const earlyDate = new Date('2024-01-15T06:00:00') // 6 AM
      expect(isWithinBusinessHours('09:00-17:00', earlyDate)).toBe(false)
    })
  })
})