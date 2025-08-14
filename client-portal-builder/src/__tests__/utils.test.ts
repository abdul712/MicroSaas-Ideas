import { 
  formatBytes, 
  formatDate, 
  generateSlug, 
  truncateText, 
  isValidEmail,
  capitalizeFirst
} from '@/lib/utils'

describe('Utility Functions', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(1073741824)).toBe('1 GB')
    })

    it('should handle decimals', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB')
      expect(formatBytes(1536, 0)).toBe('2 KB')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toBe('Jan 15, 2024')
    })

    it('should handle string dates', () => {
      const formatted = formatDate('2024-01-15')
      expect(formatted).toBe('Jan 15, 2024')
    })
  })

  describe('generateSlug', () => {
    it('should generate valid slugs', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
      expect(generateSlug('Client Portal Builder')).toBe('client-portal-builder')
      expect(generateSlug('Test!@#$%^&*()')).toBe('test')
    })

    it('should handle edge cases', () => {
      expect(generateSlug('')).toBe('')
      expect(generateSlug('   ')).toBe('')
      expect(generateSlug('---test---')).toBe('test')
    })
  })

  describe('truncateText', () => {
    it('should truncate text correctly', () => {
      const text = 'This is a long text that needs to be truncated'
      expect(truncateText(text, 10)).toBe('This is a ...')
      expect(truncateText(text, 100)).toBe(text)
    })

    it('should handle empty text', () => {
      expect(truncateText('', 10)).toBe('')
    })
  })

  describe('isValidEmail', () => {
    it('should validate emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })
  })

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello')
      expect(capitalizeFirst('WORLD')).toBe('World')
      expect(capitalizeFirst('tEST')).toBe('Test')
    })

    it('should handle edge cases', () => {
      expect(capitalizeFirst('')).toBe('')
      expect(capitalizeFirst('a')).toBe('A')
    })
  })
})