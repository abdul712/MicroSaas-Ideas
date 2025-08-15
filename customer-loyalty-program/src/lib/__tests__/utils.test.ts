import {
  formatCurrency,
  formatPoints,
  formatDate,
  formatDateTime,
  calculateTierFromPoints,
  getTierColor,
  calculatePointsToNextTier,
  generateMemberNumber,
  validateEmail,
  validatePhone,
  maskEmail,
  maskPhone,
  calculateRedemptionValue,
  isRewardExpired,
  isRewardAvailable,
  slugify
} from '../utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(100)).toBe('$100.00')
      expect(formatCurrency(99.99)).toBe('$99.99')
      expect(formatCurrency(1000.50)).toBe('$1,000.50')
    })
  })

  describe('formatPoints', () => {
    it('should format points with commas', () => {
      expect(formatPoints(1000)).toBe('1,000')
      expect(formatPoints(100)).toBe('100')
      expect(formatPoints(1234567)).toBe('1,234,567')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Jan 15, 2024/)
    })

    it('should handle string dates', () => {
      const formatted = formatDate('2024-01-15')
      expect(formatted).toMatch(/Jan 15, 2024/)
    })
  })

  describe('calculateTierFromPoints', () => {
    const tiers = [
      { name: 'Bronze', threshold: 0 },
      { name: 'Silver', threshold: 1000 },
      { name: 'Gold', threshold: 5000 },
      { name: 'Platinum', threshold: 10000 }
    ]

    it('should return correct tier for points', () => {
      expect(calculateTierFromPoints(500, tiers)).toBe('Bronze')
      expect(calculateTierFromPoints(2000, tiers)).toBe('Silver')
      expect(calculateTierFromPoints(7500, tiers)).toBe('Gold')
      expect(calculateTierFromPoints(15000, tiers)).toBe('Platinum')
    })

    it('should return null for empty tiers', () => {
      expect(calculateTierFromPoints(1000, [])).toBeNull()
    })
  })

  describe('getTierColor', () => {
    it('should return correct colors for tiers', () => {
      expect(getTierColor('Bronze')).toBe('#CD7F32')
      expect(getTierColor('Silver')).toBe('#C0C0C0')
      expect(getTierColor('Gold')).toBe('#FFD700')
      expect(getTierColor('Platinum')).toBe('#E5E4E2')
      expect(getTierColor('Diamond')).toBe('#B9F2FF')
      expect(getTierColor('Unknown')).toBe('#6B7280')
      expect(getTierColor(null)).toBe('#6B7280')
    })
  })

  describe('calculatePointsToNextTier', () => {
    const tiers = [
      { threshold: 0 },
      { threshold: 1000 },
      { threshold: 5000 }
    ]

    it('should calculate points to next tier', () => {
      expect(calculatePointsToNextTier(500, tiers)).toBe(500)
      expect(calculatePointsToNextTier(2000, tiers)).toBe(3000)
      expect(calculatePointsToNextTier(6000, tiers)).toBe(0)
    })
  })

  describe('generateMemberNumber', () => {
    it('should generate unique member numbers', () => {
      const num1 = generateMemberNumber()
      const num2 = generateMemberNumber()
      
      expect(num1).toMatch(/^LM[A-Z0-9]+$/)
      expect(num2).toMatch(/^LM[A-Z0-9]+$/)
      expect(num1).not.toBe(num2)
    })
  })

  describe('validateEmail', () => {
    it('should validate emails correctly', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('missing@domain')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('should validate phone numbers correctly', () => {
      expect(validatePhone('1234567890')).toBe(true)
      expect(validatePhone('+1 (555) 123-4567')).toBe(true)
      expect(validatePhone('555-123-4567')).toBe(true)
      expect(validatePhone('123')).toBe(false)
      expect(validatePhone('abc123def456')).toBe(false)
    })
  })

  describe('maskEmail', () => {
    it('should mask email addresses', () => {
      expect(maskEmail('test@example.com')).toBe('t**t@example.com')
      expect(maskEmail('john.doe@company.com')).toBe('j******e@company.com')
      expect(maskEmail('a@b.com')).toBe('a@b.com') // Too short to mask
    })
  })

  describe('maskPhone', () => {
    it('should mask phone numbers', () => {
      expect(maskPhone('1234567890')).toBe('******7890')
      expect(maskPhone('12345678901')).toBe('*******8901')
      expect(maskPhone('123')).toBe('123') // Invalid length
    })
  })

  describe('calculateRedemptionValue', () => {
    it('should calculate redemption value', () => {
      expect(calculateRedemptionValue(1000, 0.01)).toBe(10)
      expect(calculateRedemptionValue(500, 0.02)).toBe(10)
    })
  })

  describe('isRewardExpired', () => {
    it('should check if reward is expired', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 10)
      
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 10)
      
      expect(isRewardExpired(futureDate)).toBe(false)
      expect(isRewardExpired(pastDate)).toBe(true)
      expect(isRewardExpired(null)).toBe(false)
    })
  })

  describe('isRewardAvailable', () => {
    const activeReward = {
      isActive: true,
      validUntil: null,
      maxRedemptions: null,
      validFrom: null
    }

    it('should return true for available rewards', () => {
      expect(isRewardAvailable(activeReward)).toBe(true)
    })

    it('should return false for inactive rewards', () => {
      expect(isRewardAvailable({ ...activeReward, isActive: false })).toBe(false)
    })

    it('should handle redemption limits', () => {
      expect(isRewardAvailable({ 
        ...activeReward, 
        maxRedemptions: 10 
      }, 5)).toBe(true)
      
      expect(isRewardAvailable({ 
        ...activeReward, 
        maxRedemptions: 10 
      }, 10)).toBe(false)
    })
  })

  describe('slugify', () => {
    it('should create slugs from text', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('Test & Example!')).toBe('test-example')
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
      expect(slugify('Special-Characters_123')).toBe('special-characters-123')
    })
  })
})