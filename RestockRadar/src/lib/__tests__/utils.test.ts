import {
  formatCurrency,
  formatNumber,
  formatDate,
  calculatePercentageChange,
  generateId,
  debounce,
  throttle,
  capitalize,
  truncateText,
  getInitials,
  isValidEmail,
  getStockStatus,
  calculateReorderQuantity,
  getPriorityColor,
} from '@/lib/utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(1234.56, 'EUR', 'en-GB')).toBe('€1,234.56')
    })

    it('should handle zero values', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(123)).toBe('123')
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toContain('January')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })
  })

  describe('calculatePercentageChange', () => {
    it('should calculate positive percentage change', () => {
      expect(calculatePercentageChange(110, 100)).toBe(10)
    })

    it('should calculate negative percentage change', () => {
      expect(calculatePercentageChange(90, 100)).toBe(-10)
    })

    it('should handle zero previous value', () => {
      expect(calculatePercentageChange(50, 0)).toBe(100)
      expect(calculatePercentageChange(0, 0)).toBe(0)
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('debounce', () => {
    jest.useFakeTimers()

    it('should debounce function calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1')
      debouncedFn('arg2')
      debouncedFn('arg3')

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg3')
    })
  })

  describe('throttle', () => {
    jest.useFakeTimers()

    it('should throttle function calls', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('arg1')
      throttledFn('arg2')
      throttledFn('arg3')

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg1')

      jest.advanceTimersByTime(100)
      throttledFn('arg4')
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenCalledWith('arg4')
    })
  })

  describe('capitalize', () => {
    it('should capitalize first letter and lowercase rest', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('HELLO')).toBe('Hello')
      expect(capitalize('hELLO')).toBe('Hello')
    })

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('')
    })
  })

  describe('truncateText', () => {
    it('should truncate long text', () => {
      expect(truncateText('This is a long text', 10)).toBe('This is a ...')
    })

    it('should not truncate short text', () => {
      expect(truncateText('Short', 10)).toBe('Short')
    })
  })

  describe('getInitials', () => {
    it('should get initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('John Middle Doe')).toBe('JM')
      expect(getInitials('John')).toBe('J')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('test.email+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
    })
  })

  describe('getStockStatus', () => {
    it('should return correct stock status', () => {
      expect(getStockStatus(0, 10, 100)).toBe('out')
      expect(getStockStatus(5, 10, 100)).toBe('low')
      expect(getStockStatus(50, 10, 100)).toBe('good')
      expect(getStockStatus(95, 10, 100)).toBe('high')
    })
  })

  describe('calculateReorderQuantity', () => {
    it('should calculate correct reorder quantity', () => {
      const result = calculateReorderQuantity(5, 20, 100, 10, 7)
      expect(result).toBeGreaterThan(0)
      expect(typeof result).toBe('number')
    })

    it('should handle zero current stock', () => {
      const result = calculateReorderQuantity(0, 20, 100, 10, 7)
      expect(result).toBeGreaterThan(0)
    })
  })

  describe('getPriorityColor', () => {
    it('should return correct colors for priorities', () => {
      expect(getPriorityColor('low')).toContain('green')
      expect(getPriorityColor('medium')).toContain('yellow')
      expect(getPriorityColor('high')).toContain('orange')
      expect(getPriorityColor('urgent')).toContain('red')
    })
  })
})