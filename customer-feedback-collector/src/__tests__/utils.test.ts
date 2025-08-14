import { 
  cn, 
  formatDate, 
  formatDateTime, 
  generateId, 
  capitalize, 
  truncate, 
  slugify, 
  validateEmail, 
  getRelativeTime, 
  getSentimentColor, 
  calculateNPS, 
  calculateCSAT 
} from '@/lib/utils'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toBe('January 15, 2024')
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const date = new Date('2024-01-15T10:30:00')
      const formatted = formatDateTime(date)
      expect(formatted).toContain('Jan 15, 2024')
      expect(formatted).toContain('10:30')
    })
  })

  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(id1).toHaveLength(9)
    })
  })

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('HELLO')).toBe('HELLO')
      expect(capitalize('')).toBe('')
    })
  })

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('hello world', 5)).toBe('hello...')
      expect(truncate('hello', 10)).toBe('hello')
    })
  })

  describe('slugify', () => {
    it('should convert string to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('Test & Example')).toBe('test-example')
      expect(slugify('  Spaced  Out  ')).toBe('spaced-out')
    })
  })

  describe('validateEmail', () => {
    it('should validate email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })
  })

  describe('getRelativeTime', () => {
    const now = new Date()
    
    it('should return "just now" for recent timestamps', () => {
      const recent = new Date(now.getTime() - 30000) // 30 seconds ago
      expect(getRelativeTime(recent)).toBe('just now')
    })

    it('should return minutes for recent timestamps', () => {
      const minutes = new Date(now.getTime() - 300000) // 5 minutes ago
      expect(getRelativeTime(minutes)).toBe('5 minutes ago')
    })
  })

  describe('getSentimentColor', () => {
    it('should return correct colors for sentiments', () => {
      expect(getSentimentColor('positive')).toContain('text-green-600')
      expect(getSentimentColor('negative')).toContain('text-red-600')
      expect(getSentimentColor('neutral')).toContain('text-gray-600')
      expect(getSentimentColor('unknown')).toContain('text-gray-600')
    })
  })

  describe('calculateNPS', () => {
    it('should calculate NPS correctly', () => {
      const ratings = [9, 10, 8, 7, 6, 9, 10, 5, 8, 9]
      const nps = calculateNPS(ratings)
      // Promoters (9,10): 5, Detractors (0-6): 3, Passives (7,8): 2
      // NPS = ((5-3)/10) * 100 = 20
      expect(nps).toBe(20)
    })

    it('should return 0 for empty array', () => {
      expect(calculateNPS([])).toBe(0)
    })
  })

  describe('calculateCSAT', () => {
    it('should calculate CSAT correctly', () => {
      const ratings = [5, 4, 3, 4, 5, 2, 4, 5, 3, 4]
      const csat = calculateCSAT(ratings)
      // Satisfied (4,5): 6, Total: 10
      // CSAT = (6/10) * 100 = 60
      expect(csat).toBe(60)
    })

    it('should return 0 for empty array', () => {
      expect(calculateCSAT([])).toBe(0)
    })
  })
})