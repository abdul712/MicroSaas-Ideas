import {
  formatNumber,
  formatPercentage,
  normalizeHashtag,
  validateHashtag,
  calculateDifficultyScore,
  calculateTrendScore,
  debounce,
  throttle,
} from '@/lib/utils'

// Mock timers for debounce and throttle tests
jest.useFakeTimers()

describe('Utils Functions', () => {
  describe('formatNumber', () => {
    it('should format large numbers correctly', () => {
      expect(formatNumber(1000)).toBe('1.0K')
      expect(formatNumber(1500)).toBe('1.5K')
      expect(formatNumber(1000000)).toBe('1.0M')
      expect(formatNumber(1500000)).toBe('1.5M')
      expect(formatNumber(1000000000)).toBe('1.0B')
    })

    it('should handle small numbers', () => {
      expect(formatNumber(999)).toBe('999')
      expect(formatNumber(0)).toBe('0')
    })

    it('should handle bigint values', () => {
      expect(formatNumber(BigInt(1000))).toBe('1.0K')
      expect(formatNumber(BigInt(1000000))).toBe('1.0M')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(0.123)).toBe('12.3%')
      expect(formatPercentage(0.5)).toBe('50.0%')
      expect(formatPercentage(1)).toBe('100.0%')
    })
  })

  describe('normalizeHashtag', () => {
    it('should normalize hashtags correctly', () => {
      expect(normalizeHashtag('#hashtag')).toBe('hashtag')
      expect(normalizeHashtag('HASHTAG')).toBe('hashtag')
      expect(normalizeHashtag('Hash-Tag!')).toBe('hashtag')
      expect(normalizeHashtag('hash123tag')).toBe('hash123tag')
    })
  })

  describe('validateHashtag', () => {
    it('should validate hashtags correctly', () => {
      expect(validateHashtag('hashtag')).toBe(true)
      expect(validateHashtag('hash123')).toBe(true)
      expect(validateHashtag('')).toBe(false)
      expect(validateHashtag('a'.repeat(101))).toBe(false)
    })
  })

  describe('calculateDifficultyScore', () => {
    it('should calculate difficulty score correctly', () => {
      const score1 = calculateDifficultyScore(BigInt(1000), 0.05)
      const score2 = calculateDifficultyScore(BigInt(10000000), 0.02)
      
      expect(score1).toBeGreaterThan(0)
      expect(score1).toBeLessThanOrEqual(100)
      expect(score2).toBeGreaterThan(score1) // Higher post count should increase difficulty
    })
  })

  describe('calculateTrendScore', () => {
    it('should calculate trend score correctly', () => {
      const score1 = calculateTrendScore(50, 0.5, 0.2)
      const score2 = calculateTrendScore(100, 0.8, 0.1)
      
      expect(score1).toBeGreaterThan(0)
      expect(score1).toBeLessThanOrEqual(100)
      expect(score2).toBeGreaterThan(score1) // Higher growth should increase trend score
    })
  })

  describe('debounce', () => {
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
})

afterEach(() => {
  jest.clearAllTimers()
})