import { timeUtils, validation, currency, slug } from '../utils'
import { addHours, addDays } from 'date-fns'

describe('timeUtils', () => {
  describe('generateTimeSlots', () => {
    it('should generate correct time slots', () => {
      const slots = timeUtils.generateTimeSlots('09:00', '17:00', 60, 0)
      expect(slots).toEqual([
        '09:00', '10:00', '11:00', '12:00', '13:00', 
        '14:00', '15:00', '16:00'
      ])
    })

    it('should include buffer time between slots', () => {
      const slots = timeUtils.generateTimeSlots('09:00', '12:00', 60, 15)
      expect(slots).toEqual(['09:00', '10:15', '11:30'])
    })

    it('should handle 30-minute slots', () => {
      const slots = timeUtils.generateTimeSlots('09:00', '11:00', 30, 0)
      expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30'])
    })
  })

  describe('hasConflict', () => {
    const existingBookings = [
      {
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z')
      },
      {
        startTime: new Date('2024-01-15T14:00:00Z'),
        endTime: new Date('2024-01-15T15:30:00Z')
      }
    ]

    it('should detect overlap at start', () => {
      const conflict = timeUtils.hasConflict(
        new Date('2024-01-15T09:30:00Z'),
        new Date('2024-01-15T10:30:00Z'),
        existingBookings
      )
      expect(conflict).toBe(true)
    })

    it('should detect overlap at end', () => {
      const conflict = timeUtils.hasConflict(
        new Date('2024-01-15T10:30:00Z'),
        new Date('2024-01-15T11:30:00Z'),
        existingBookings
      )
      expect(conflict).toBe(true)
    })

    it('should detect complete overlap', () => {
      const conflict = timeUtils.hasConflict(
        new Date('2024-01-15T10:15:00Z'),
        new Date('2024-01-15T10:45:00Z'),
        existingBookings
      )
      expect(conflict).toBe(true)
    })

    it('should not detect conflict for adjacent slots', () => {
      const conflict = timeUtils.hasConflict(
        new Date('2024-01-15T11:00:00Z'),
        new Date('2024-01-15T12:00:00Z'),
        existingBookings
      )
      expect(conflict).toBe(false)
    })

    it('should not detect conflict for non-overlapping slots', () => {
      const conflict = timeUtils.hasConflict(
        new Date('2024-01-15T12:00:00Z'),
        new Date('2024-01-15T13:00:00Z'),
        existingBookings
      )
      expect(conflict).toBe(false)
    })
  })

  describe('isWithinBusinessHours', () => {
    const availability = [
      {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        isActive: true
      },
      {
        dayOfWeek: 2, // Tuesday
        startTime: '10:00',
        endTime: '18:00',
        isActive: true
      }
    ]

    it('should return true for time within business hours', () => {
      const monday = new Date('2024-01-15T14:00:00Z') // Monday 2:00 PM
      const result = timeUtils.isWithinBusinessHours(monday, availability)
      expect(result).toBe(true)
    })

    it('should return false for time outside business hours', () => {
      const monday = new Date('2024-01-15T08:00:00Z') // Monday 8:00 AM
      const result = timeUtils.isWithinBusinessHours(monday, availability)
      expect(result).toBe(false)
    })

    it('should return false for day with no availability', () => {
      const sunday = new Date('2024-01-14T14:00:00Z') // Sunday
      const result = timeUtils.isWithinBusinessHours(sunday, availability)
      expect(result).toBe(false)
    })
  })
})

describe('validation', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validation.isValidEmail('test@example.com')).toBe(true)
      expect(validation.isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validation.isValidEmail('invalid-email')).toBe(false)
      expect(validation.isValidEmail('@example.com')).toBe(false)
      expect(validation.isValidEmail('test@')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('should validate phone numbers', () => {
      expect(validation.isValidPhone('+1234567890')).toBe(true)
      expect(validation.isValidPhone('1-234-567-8900')).toBe(true)
      expect(validation.isValidPhone('(123) 456-7890')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validation.isValidPhone('abc')).toBe(false)
      expect(validation.isValidPhone('123')).toBe(false)
    })
  })

  describe('validateBookingTime', () => {
    it('should allow booking within advance booking window', () => {
      const futureTime = addHours(new Date(), 25) // 25 hours from now
      const result = validation.validateBookingTime(futureTime, 'service_id', {
        advanceBookingMin: 24,
        advanceBookingMax: 30
      })
      expect(result.isValid).toBe(true)
    })

    it('should reject booking too soon', () => {
      const soonTime = addHours(new Date(), 1) // 1 hour from now
      const result = validation.validateBookingTime(soonTime, 'service_id', {
        advanceBookingMin: 24
      })
      expect(result.isValid).toBe(false)
      expect(result.message).toContain('24 hours in advance')
    })

    it('should reject booking too far in advance', () => {
      const farTime = addDays(new Date(), 40) // 40 days from now
      const result = validation.validateBookingTime(farTime, 'service_id', {
        advanceBookingMax: 30
      })
      expect(result.isValid).toBe(false)
      expect(result.message).toContain('30 days in advance')
    })
  })
})

describe('currency', () => {
  describe('format', () => {
    it('should format USD currency', () => {
      expect(currency.format(1234.56, 'USD')).toBe('$1,234.56')
      expect(currency.format(0, 'USD')).toBe('$0.00')
    })

    it('should format EUR currency', () => {
      expect(currency.format(1234.56, 'EUR', 'de-DE')).toBe('1.234,56 €')
    })
  })

  describe('parse', () => {
    it('should parse currency strings', () => {
      expect(currency.parse('$1,234.56')).toBe(1234.56)
      expect(currency.parse('€1.234,56')).toBe(1234.56)
      expect(currency.parse('1234.56')).toBe(1234.56)
    })
  })
})

describe('slug', () => {
  describe('create', () => {
    it('should create valid slugs', () => {
      expect(slug.create('Hello World')).toBe('hello-world')
      expect(slug.create('My Business Name!')).toBe('my-business-name')
      expect(slug.create('  Trim   Spaces  ')).toBe('trim-spaces')
    })

    it('should handle special characters', () => {
      expect(slug.create('Café & Restaurant')).toBe('caf-restaurant')
      expect(slug.create('100% Success')).toBe('100-success')
    })
  })

  describe('isValid', () => {
    it('should validate correct slugs', () => {
      expect(slug.isValid('hello-world')).toBe(true)
      expect(slug.isValid('my-business-123')).toBe(true)
    })

    it('should reject invalid slugs', () => {
      expect(slug.isValid('Hello World')).toBe(false)
      expect(slug.isValid('hello_world')).toBe(false)
      expect(slug.isValid('-hello-world-')).toBe(false)
    })
  })
})