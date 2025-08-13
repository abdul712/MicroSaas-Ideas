import {
  formatDate,
  formatDateTime,
  formatTime,
  getInitials,
  truncateText,
  slugify,
  isValidUrl,
  capitalizeFirst,
  formatNumber,
  getPlatformColor,
  getStatusColor,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isToday,
  isPast,
  isFuture,
  getCalendarDays
} from '@/lib/utils'

describe('Date formatting utilities', () => {
  const testDate = new Date('2024-01-15T14:30:00Z')

  it('formats date correctly', () => {
    expect(formatDate(testDate)).toBe('January 15, 2024')
  })

  it('formats date time correctly', () => {
    const result = formatDateTime(testDate)
    expect(result).toContain('Jan 15, 2024')
    expect(result).toContain('2:30 PM')
  })

  it('formats time correctly', () => {
    const result = formatTime(testDate)
    expect(result).toContain('2:30 PM')
  })
})

describe('String utilities', () => {
  it('gets initials correctly', () => {
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('Sarah Johnson Smith')).toBe('SJ')
    expect(getInitials('Alice')).toBe('A')
  })

  it('truncates text correctly', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...')
    expect(truncateText('Short', 10)).toBe('Short')
  })

  it('creates slugs correctly', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('Special @#$ Characters!')).toBe('special-characters')
  })

  it('validates URLs correctly', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('not-a-url')).toBe(false)
  })

  it('capitalizes first letter', () => {
    expect(capitalizeFirst('hello')).toBe('Hello')
    expect(capitalizeFirst('WORLD')).toBe('WORLD')
  })
})

describe('Number formatting', () => {
  it('formats numbers with K and M suffixes', () => {
    expect(formatNumber(500)).toBe('500')
    expect(formatNumber(1500)).toBe('1.5K')
    expect(formatNumber(1500000)).toBe('1.5M')
  })
})

describe('Platform and status colors', () => {
  it('returns correct platform colors', () => {
    expect(getPlatformColor('facebook')).toBe('#1877F2')
    expect(getPlatformColor('instagram')).toBe('#E4405F')
    expect(getPlatformColor('unknown')).toBe('#6B7280')
  })

  it('returns correct status colors', () => {
    expect(getStatusColor('scheduled')).toBe('#3B82F6')
    expect(getStatusColor('published')).toBe('#059669')
    expect(getStatusColor('unknown')).toBe('#6B7280')
  })
})

describe('Date manipulation utilities', () => {
  const testDate = new Date('2024-01-15') // Monday

  it('adds days correctly', () => {
    const result = addDays(testDate, 5)
    expect(result.getDate()).toBe(20)
  })

  it('gets start of week correctly', () => {
    const result = startOfWeek(testDate)
    expect(result.getDay()).toBe(0) // Sunday
  })

  it('gets end of week correctly', () => {
    const result = endOfWeek(testDate)
    expect(result.getDay()).toBe(6) // Saturday
  })

  it('gets start of month correctly', () => {
    const result = startOfMonth(testDate)
    expect(result.getDate()).toBe(1)
  })

  it('gets end of month correctly', () => {
    const result = endOfMonth(testDate)
    expect(result.getDate()).toBe(31) // January has 31 days
  })

  it('checks if same day correctly', () => {
    const date1 = new Date('2024-01-15T10:00:00')
    const date2 = new Date('2024-01-15T16:00:00')
    const date3 = new Date('2024-01-16T10:00:00')
    
    expect(isSameDay(date1, date2)).toBe(true)
    expect(isSameDay(date1, date3)).toBe(false)
  })

  it('checks if date is past correctly', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    expect(isPast(yesterday)).toBe(true)
    expect(isPast(tomorrow)).toBe(false)
  })

  it('checks if date is future correctly', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    expect(isFuture(yesterday)).toBe(false)
    expect(isFuture(tomorrow)).toBe(true)
  })

  it('generates calendar days correctly', () => {
    const days = getCalendarDays(new Date('2024-01-15'))
    expect(days.length).toBeGreaterThanOrEqual(35) // Calendar grid is at least 5 weeks
    expect(days.length).toBeLessThanOrEqual(42) // Calendar grid is at most 6 weeks
  })
})