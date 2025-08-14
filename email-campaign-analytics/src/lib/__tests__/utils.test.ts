import {
  calculateEmailMetrics,
  calculateEngagementScore,
  formatNumber,
  formatPercentage,
  formatCurrency,
  isValidEmail,
  getCampaignStatusColor
} from '../utils'

describe('Email Analytics Utils', () => {
  describe('calculateEmailMetrics', () => {
    it('should calculate correct email metrics', () => {
      const metrics = {
        totalSent: 1000,
        totalDelivered: 950,
        uniqueOpens: 285,
        uniqueClicks: 57,
        unsubscribes: 5,
        spamReports: 2,
        bounces: 50
      }

      const result = calculateEmailMetrics(metrics)

      expect(result.deliveryRate).toBe(95)
      expect(result.openRate).toBe(30)
      expect(result.clickRate).toBe(6)
      expect(result.clickToOpenRate).toBe(20)
      expect(result.unsubscribeRate).toBe(0.5263)
      expect(result.spamRate).toBe(0.2105)
      expect(result.bounceRate).toBe(5)
    })

    it('should handle zero values gracefully', () => {
      const metrics = {
        totalSent: 0,
        totalDelivered: 0,
        uniqueOpens: 0,
        uniqueClicks: 0,
        unsubscribes: 0,
        spamReports: 0,
        bounces: 0
      }

      const result = calculateEmailMetrics(metrics)

      expect(result.deliveryRate).toBe(0)
      expect(result.openRate).toBe(0)
      expect(result.clickRate).toBe(0)
      expect(result.clickToOpenRate).toBe(0)
      expect(result.unsubscribeRate).toBe(0)
      expect(result.spamRate).toBe(0)
      expect(result.bounceRate).toBe(0)
    })
  })

  describe('calculateEngagementScore', () => {
    it('should calculate engagement score correctly', () => {
      const metrics = {
        openRate: 25,
        clickRate: 5,
        unsubscribeRate: 0.5,
        spamRate: 0.1,
        bounceRate: 3,
        listGrowthRate: 2
      }

      const score = calculateEngagementScore(metrics)
      
      // Expected: 50 (opens) + 25 (clicks) + 6 (growth) - 5 (unsubs) - 2 (spam) - 6 (bounces) = 68
      expect(score).toBe(68)
    })

    it('should cap score between 0 and 100', () => {
      const highMetrics = {
        openRate: 50,
        clickRate: 20,
        unsubscribeRate: 0,
        spamRate: 0,
        bounceRate: 0,
        listGrowthRate: 10
      }

      const lowMetrics = {
        openRate: 5,
        clickRate: 1,
        unsubscribeRate: 5,
        spamRate: 2,
        bounceRate: 10
      }

      const highScore = calculateEngagementScore(highMetrics)
      const lowScore = calculateEngagementScore(lowMetrics)

      expect(highScore).toBe(100)
      expect(lowScore).toBe(0)
    })
  })

  describe('formatNumber', () => {
    it('should format numbers correctly', () => {
      expect(formatNumber(1234)).toBe('1,234')
      expect(formatNumber(1234567)).toBe('1.2M')
      expect(formatNumber(12345)).toBe('12.3K')
      expect(formatNumber(999)).toBe('999')
    })

    it('should respect decimal places', () => {
      expect(formatNumber(1234.56, 2)).toBe('1,234.56')
      expect(formatNumber(1234567, 1)).toBe('1.2M')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(25.678)).toBe('25.7%')
      expect(formatPercentage(0.1234, 2)).toBe('0.12%')
      expect(formatPercentage(100)).toBe('100.0%')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(1000000)).toBe('$1,000,000.00')
    })
  })

  describe('isValidEmail', () => {
    it('should validate email addresses correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
      expect(isValidEmail('invalid.email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('getCampaignStatusColor', () => {
    it('should return correct colors for campaign statuses', () => {
      expect(getCampaignStatusColor('sent')).toBe('success')
      expect(getCampaignStatusColor('sending')).toBe('info')
      expect(getCampaignStatusColor('scheduled')).toBe('warning')
      expect(getCampaignStatusColor('draft')).toBe('neutral')
      expect(getCampaignStatusColor('paused')).toBe('error')
      expect(getCampaignStatusColor('cancelled')).toBe('error')
      expect(getCampaignStatusColor('unknown')).toBe('neutral')
    })
  })
})