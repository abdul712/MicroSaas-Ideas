import {
  formatDurationFromSeconds,
  formatDetailedDuration,
  calculateDuration,
  formatCurrency,
  calculateBillableAmount,
  roundTimeToInterval,
  parseTimeInput,
  getUserInitials,
  generateSlug,
  isValidEmail,
} from '@/lib/utils'

describe('Utils', () => {
  describe('formatDurationFromSeconds', () => {
    test('formats seconds correctly', () => {
      expect(formatDurationFromSeconds(30)).toBe('< 1 min')
      expect(formatDurationFromSeconds(60)).toBe('1m')
      expect(formatDurationFromSeconds(3600)).toBe('1h 0m')
      expect(formatDurationFromSeconds(3660)).toBe('1h 1m')
      expect(formatDurationFromSeconds(7380)).toBe('2h 3m')
    })
  })

  describe('formatDetailedDuration', () => {
    test('formats duration in HH:MM:SS format', () => {
      expect(formatDetailedDuration(0)).toBe('00:00:00')
      expect(formatDetailedDuration(30)).toBe('00:00:30')
      expect(formatDetailedDuration(60)).toBe('00:01:00')
      expect(formatDetailedDuration(3661)).toBe('01:01:01')
      expect(formatDetailedDuration(36000)).toBe('10:00:00')
    })
  })

  describe('calculateDuration', () => {
    test('calculates duration between dates', () => {
      const start = new Date('2024-01-01T10:00:00Z')
      const end = new Date('2024-01-01T11:30:00Z')
      expect(calculateDuration(start, end)).toBe(5400) // 90 minutes
    })
  })

  describe('formatCurrency', () => {
    test('formats currency correctly', () => {
      expect(formatCurrency(100)).toBe('$100.00')
      expect(formatCurrency(99.99)).toBe('$99.99')
      expect(formatCurrency(1000.5, 'EUR')).toBe('€1,000.50')
    })
  })

  describe('calculateBillableAmount', () => {
    test('calculates billable amount correctly', () => {
      expect(calculateBillableAmount(3600, 100)).toBe(100) // 1 hour at $100/hr
      expect(calculateBillableAmount(1800, 50)).toBe(25) // 30 minutes at $50/hr
      expect(calculateBillableAmount(7200, 75)).toBe(150) // 2 hours at $75/hr
    })
  })

  describe('roundTimeToInterval', () => {
    test('rounds time to intervals correctly', () => {
      expect(roundTimeToInterval(300)).toBe(900) // 5 min rounded to 15 min
      expect(roundTimeToInterval(900)).toBe(900) // 15 min stays 15 min
      expect(roundTimeToInterval(1000)).toBe(1800) // 16:40 rounded to 30 min
      expect(roundTimeToInterval(500, 6)).toBe(720) // 8:20 rounded to 12 min (6-min intervals)
    })
  })

  describe('parseTimeInput', () => {
    test('parses various time input formats', () => {
      expect(parseTimeInput('2h')).toBe(7200)
      expect(parseTimeInput('30m')).toBe(1800)
      expect(parseTimeInput('2h 30m')).toBe(9000)
      expect(parseTimeInput('1.5')).toBe(5400)
      expect(parseTimeInput('90m')).toBe(5400)
      expect(parseTimeInput('invalid')).toBe(0)
    })
  })

  describe('getUserInitials', () => {
    test('generates initials correctly', () => {
      expect(getUserInitials('John Doe')).toBe('JD')
      expect(getUserInitials('Jane')).toBe('J')
      expect(getUserInitials('Mary Jane Watson')).toBe('MJ')
      expect(getUserInitials('')).toBe('U')
      expect(getUserInitials(null)).toBe('U')
    })
  })

  describe('generateSlug', () => {
    test('generates slugs correctly', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
      expect(generateSlug('My Cool Project!')).toBe('my-cool-project')
      expect(generateSlug('  Spaces   ')).toBe('spaces')
      expect(generateSlug('Special@#$Characters')).toBe('specialcharacters')
    })
  })

  describe('isValidEmail', () => {
    test('validates email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })
})