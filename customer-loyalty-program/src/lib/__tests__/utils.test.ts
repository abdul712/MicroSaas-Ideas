import { 
  formatPoints, 
  formatCurrency, 
  formatDate,
  calculatePercentage,
  getTierColor,
  getTierGradient,
  validateEmail,
  validatePassword,
  truncateText
} from '../utils'

describe('Utils', () => {
  describe('formatPoints', () => {
    it('formats large numbers correctly', () => {
      expect(formatPoints(1500000)).toBe('1.5M')
      expect(formatPoints(2500)).toBe('2.5K')
      expect(formatPoints(500)).toBe('500')
    })

    it('handles edge cases', () => {
      expect(formatPoints(0)).toBe('0')
      expect(formatPoints(1000000)).toBe('1.0M')
      expect(formatPoints(1000)).toBe('1.0K')
    })
  })

  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(10.99)).toBe('$10.99')
      expect(formatCurrency(1000)).toBe('$1,000.00')
    })

    it('handles different currencies', () => {
      expect(formatCurrency(10.99, 'EUR')).toContain('€')
    })
  })

  describe('formatDate', () => {
    it('formats dates correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Jan \d{1,2}, 2024/)
    })

    it('handles string dates', () => {
      const formatted = formatDate('2024-01-15')
      expect(formatted).toMatch(/Jan \d{1,2}, 2024/)
    })
  })

  describe('calculatePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25)
      expect(calculatePercentage(1, 3)).toBe(33)
    })

    it('handles zero total', () => {
      expect(calculatePercentage(10, 0)).toBe(0)
    })
  })

  describe('getTierColor', () => {
    it('returns correct colors for tiers', () => {
      expect(getTierColor('gold')).toBe('#FFD700')
      expect(getTierColor('silver')).toBe('#C0C0C0')
      expect(getTierColor('bronze')).toBe('#CD7F32')
    })

    it('returns default color for unknown tier', () => {
      expect(getTierColor('unknown')).toBe('#6B7280')
    })
  })

  describe('getTierGradient', () => {
    it('returns correct gradients for tiers', () => {
      expect(getTierGradient('gold')).toBe('from-yellow-400 to-yellow-600')
      expect(getTierGradient('silver')).toBe('from-gray-400 to-gray-600')
    })

    it('returns default gradient for unknown tier', () => {
      expect(getTierGradient('unknown')).toBe('from-gray-400 to-gray-600')
    })
  })

  describe('validateEmail', () => {
    it('validates correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('rejects invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      expect(validatePassword('Password123!')).toBe(true)
      expect(validatePassword('MySecure123')).toBe(true)
    })

    it('rejects weak passwords', () => {
      expect(validatePassword('weak')).toBe(false)
      expect(validatePassword('password')).toBe(false)
      expect(validatePassword('PASSWORD123')).toBe(false)
    })
  })

  describe('truncateText', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated'
      expect(truncateText(longText, 20)).toBe('This is a very long ...')
    })

    it('returns short text unchanged', () => {
      const shortText = 'Short text'
      expect(truncateText(shortText, 20)).toBe('Short text')
    })
  })
})