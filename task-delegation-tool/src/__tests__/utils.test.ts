import {
  cn,
  formatDate,
  formatRelativeTime,
  getTaskStatusColor,
  getPriorityColor,
  getUserInitials,
  getAvatarColor,
  calculateCompletionRate,
  formatPercentage,
  getHealthScore,
  getWorkloadLevel,
  getCognitiveLoadColor,
  getConfidenceLevel,
  getRiskLevel,
  isValidEmail,
  isStrongPassword,
  createSlug,
  truncate,
  formatNumber,
  debounce,
  getErrorMessage,
} from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (classname utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
      expect(cn('class1', { 'class2': true, 'class3': false })).toBe('class1 class2')
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500') // tailwind-merge behavior
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-01-15')
      expect(formatDate(date.toISOString(), 'MMM d, yyyy')).toBe('Jan 15, 2024')
    })
  })

  describe('formatRelativeTime', () => {
    it('should format relative time correctly', () => {
      const now = new Date()
      const today = new Date(now.getTime())
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      expect(formatRelativeTime(today)).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/)
      expect(formatRelativeTime(yesterday)).toBe('Yesterday')
      expect(formatRelativeTime(tomorrow)).toBe('Tomorrow')
    })
  })

  describe('getTaskStatusColor', () => {
    it('should return correct colors for task statuses', () => {
      expect(getTaskStatusColor('todo')).toContain('gray')
      expect(getTaskStatusColor('in_progress')).toContain('blue')
      expect(getTaskStatusColor('completed')).toContain('green')
      expect(getTaskStatusColor('blocked')).toContain('red')
    })
  })

  describe('getPriorityColor', () => {
    it('should return correct colors for priorities', () => {
      expect(getPriorityColor('urgent')).toContain('red')
      expect(getPriorityColor('high')).toContain('orange')
      expect(getPriorityColor('medium')).toContain('blue')
      expect(getPriorityColor('low')).toContain('gray')
    })
  })

  describe('getUserInitials', () => {
    it('should extract user initials correctly', () => {
      expect(getUserInitials('John Doe')).toBe('JD')
      expect(getUserInitials('Jane')).toBe('JA')
      expect(getUserInitials('Mary Jane Watson')).toBe('MJ')
      expect(getUserInitials('')).toBe('U')
      expect(getUserInitials(null)).toBe('U')
      expect(getUserInitials(undefined)).toBe('U')
    })
  })

  describe('getAvatarColor', () => {
    it('should return consistent colors for same user ID', () => {
      const userId = 'test-user-123'
      const color1 = getAvatarColor(userId)
      const color2 = getAvatarColor(userId)
      expect(color1).toBe(color2)
      expect(color1).toMatch(/^bg-\w+-500$/)
    })

    it('should return different colors for different user IDs', () => {
      const color1 = getAvatarColor('user1')
      const color2 = getAvatarColor('user2')
      // Note: This might occasionally fail due to hash collisions, but it's very unlikely
      expect(color1).not.toBe(color2)
    })
  })

  describe('calculateCompletionRate', () => {
    it('should calculate completion rate correctly', () => {
      expect(calculateCompletionRate(5, 10)).toBe(50)
      expect(calculateCompletionRate(3, 3)).toBe(100)
      expect(calculateCompletionRate(0, 10)).toBe(0)
      expect(calculateCompletionRate(0, 0)).toBe(0)
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(0.75)).toBe('75%')
      expect(formatPercentage(0.5)).toBe('50%')
      expect(formatPercentage(1)).toBe('100%')
      expect(formatPercentage(0)).toBe('0%')
    })
  })

  describe('getHealthScore', () => {
    it('should return correct health score labels', () => {
      expect(getHealthScore(0.95)).toEqual(expect.objectContaining({ label: 'Excellent' }))
      expect(getHealthScore(0.8)).toEqual(expect.objectContaining({ label: 'Good' }))
      expect(getHealthScore(0.6)).toEqual(expect.objectContaining({ label: 'Fair' }))
      expect(getHealthScore(0.3)).toEqual(expect.objectContaining({ label: 'Poor' }))
    })
  })

  describe('getWorkloadLevel', () => {
    it('should return correct workload levels', () => {
      expect(getWorkloadLevel(25, 100)).toEqual(expect.objectContaining({ level: 'low' }))
      expect(getWorkloadLevel(60, 100)).toEqual(expect.objectContaining({ level: 'optimal' }))
      expect(getWorkloadLevel(90, 100)).toEqual(expect.objectContaining({ level: 'high' }))
      expect(getWorkloadLevel(120, 100)).toEqual(expect.objectContaining({ level: 'critical' }))
    })
  })

  describe('getCognitiveLoadColor', () => {
    it('should return correct colors for cognitive load', () => {
      expect(getCognitiveLoadColor(0.2)).toContain('green')
      expect(getCognitiveLoadColor(0.5)).toContain('yellow')
      expect(getCognitiveLoadColor(0.7)).toContain('orange')
      expect(getCognitiveLoadColor(0.9)).toContain('red')
    })
  })

  describe('getConfidenceLevel', () => {
    it('should return correct confidence levels', () => {
      expect(getConfidenceLevel(0.95)).toEqual(expect.objectContaining({ label: 'Very High' }))
      expect(getConfidenceLevel(0.8)).toEqual(expect.objectContaining({ label: 'High' }))
      expect(getConfidenceLevel(0.6)).toEqual(expect.objectContaining({ label: 'Medium' }))
      expect(getConfidenceLevel(0.3)).toEqual(expect.objectContaining({ label: 'Low' }))
    })
  })

  describe('getRiskLevel', () => {
    it('should return correct risk levels', () => {
      expect(getRiskLevel(0.2)).toEqual(expect.objectContaining({ label: 'Low Risk' }))
      expect(getRiskLevel(0.5)).toEqual(expect.objectContaining({ label: 'Medium Risk' }))
      expect(getRiskLevel(0.7)).toEqual(expect.objectContaining({ label: 'High Risk' }))
      expect(getRiskLevel(0.9)).toEqual(expect.objectContaining({ label: 'Critical Risk' }))
    })
  })

  describe('isValidEmail', () => {
    it('should validate emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('missing@')).toBe(false)
      expect(isValidEmail('@missing.com')).toBe(false)
    })
  })

  describe('isStrongPassword', () => {
    it('should validate strong passwords correctly', () => {
      expect(isStrongPassword('Password123!')).toBe(true)
      expect(isStrongPassword('StrongP@ss1')).toBe(true)
      expect(isStrongPassword('weak')).toBe(false)
      expect(isStrongPassword('NoNumbers!')).toBe(false)
      expect(isStrongPassword('nonumbers123!')).toBe(false)
      expect(isStrongPassword('NOLOWERCASE123!')).toBe(false)
      expect(isStrongPassword('NoSpecialChar123')).toBe(false)
    })
  })

  describe('createSlug', () => {
    it('should create valid slugs', () => {
      expect(createSlug('Hello World')).toBe('hello-world')
      expect(createSlug('Task Management Tool')).toBe('task-management-tool')
      expect(createSlug('Special@#$Characters!')).toBe('specialcharacters')
      expect(createSlug('  Multiple   Spaces  ')).toBe('multiple-spaces')
    })
  })

  describe('truncate', () => {
    it('should truncate text correctly', () => {
      const longText = 'This is a very long text that should be truncated'
      expect(truncate(longText, 20)).toBe('This is a very long ...')
      expect(truncate('Short text', 20)).toBe('Short text')
      expect(truncate(longText)).toBe('This is a very long text that should be truncat...')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers correctly', () => {
      expect(formatNumber(1234)).toBe('1.2K')
      expect(formatNumber(1234567)).toBe('1.2M')
      expect(formatNumber(999)).toBe('999')
      expect(formatNumber(1500)).toBe('1.5K')
      expect(formatNumber(2500000)).toBe('2.5M')
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
      expect(mockFn).toHaveBeenLastCalledWith('arg3')
    })

    afterAll(() => {
      jest.useRealTimers()
    })
  })

  describe('getErrorMessage', () => {
    it('should extract error messages correctly', () => {
      expect(getErrorMessage(new Error('Test error'))).toBe('Test error')
      expect(getErrorMessage('String error')).toBe('String error')
      expect(getErrorMessage(123)).toBe('An unknown error occurred')
      expect(getErrorMessage(null)).toBe('An unknown error occurred')
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred')
    })
  })
})