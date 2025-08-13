import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  getHealthScoreColor,
  getHealthScoreLabel,
  formatRelativeTime,
  calculatePercentageChange,
  generateHealthScore,
  truncateText,
  isValidEmail,
} from '@/lib/utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00')
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('handles different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00')
    })
  })

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(0)).toBe('0')
    })
  })

  describe('formatPercentage', () => {
    it('formats percentage correctly', () => {
      expect(formatPercentage(0.1234)).toBe('12.3%')
      expect(formatPercentage(0.1234, 2)).toBe('12.34%')
      expect(formatPercentage(1)).toBe('100.0%')
    })
  })

  describe('getHealthScoreColor', () => {
    it('returns correct colors for different scores', () => {
      expect(getHealthScoreColor(95)).toBe('text-health-excellent')
      expect(getHealthScoreColor(80)).toBe('text-green-600')
      expect(getHealthScoreColor(60)).toBe('text-health-warning')
      expect(getHealthScoreColor(30)).toBe('text-health-critical')
    })
  })

  describe('getHealthScoreLabel', () => {
    it('returns correct labels for different scores', () => {
      expect(getHealthScoreLabel(95)).toBe('Excellent')
      expect(getHealthScoreLabel(80)).toBe('Good')
      expect(getHealthScoreLabel(60)).toBe('Warning')
      expect(getHealthScoreLabel(30)).toBe('Critical')
    })
  })

  describe('formatRelativeTime', () => {
    it('formats recent times correctly', () => {
      const now = new Date()
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000)
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

      expect(formatRelativeTime(thirtySecondsAgo)).toBe('Just now')
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago')
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago')
    })
  })

  describe('calculatePercentageChange', () => {
    it('calculates percentage change correctly', () => {
      expect(calculatePercentageChange(120, 100)).toBe(20)
      expect(calculatePercentageChange(80, 100)).toBe(-20)
      expect(calculatePercentageChange(100, 0)).toBe(100)
      expect(calculatePercentageChange(0, 0)).toBe(0)
    })
  })

  describe('generateHealthScore', () => {
    it('generates weighted health score', () => {
      const metrics = {
        revenue: 80,
        cashFlow: 70,
        customerSatisfaction: 90,
        marketingROI: 60,
        operationalEfficiency: 75,
        growth: 85
      }

      const score = generateHealthScore(metrics)
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('handles missing metrics', () => {
      const metrics = {
        revenue: 80,
        cashFlow: 70
      }

      const score = generateHealthScore(metrics)
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('truncateText', () => {
    it('truncates text correctly', () => {
      expect(truncateText('Hello World', 10)).toBe('Hello Worl...')
      expect(truncateText('Hello', 10)).toBe('Hello')
      expect(truncateText('', 10)).toBe('')
    })
  })

  describe('isValidEmail', () => {
    it('validates email addresses correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })
  })
})