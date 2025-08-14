import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatFileSize,
  slugify,
  truncate,
  capitalize,
  generateId,
  isValidEmail,
  isValidUrl,
  getInitials,
  debounce,
  throttle,
  groupBy,
  sortBy,
  unique,
  chunk,
  omit,
  pick,
  isEmpty,
} from '@/lib/utils'

describe('Date formatting utilities', () => {
  const testDate = new Date('2024-01-15T10:30:00Z')

  test('formatDate should format date correctly', () => {
    expect(formatDate(testDate)).toBe('January 15, 2024')
  })

  test('formatDateTime should format date and time correctly', () => {
    expect(formatDateTime(testDate)).toContain('Jan 15, 2024')
  })

  test('formatRelativeTime should return relative time', () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago')
  })
})

describe('Number formatting utilities', () => {
  test('formatNumber should format numbers correctly', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  test('formatCurrency should format currency correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  test('formatPercentage should format percentage correctly', () => {
    expect(formatPercentage(0.1234)).toBe('12.3%')
    expect(formatPercentage(0.1234, 2)).toBe('12.34%')
  })

  test('formatFileSize should format file sizes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
  })
})

describe('String utilities', () => {
  test('slugify should create valid slugs', () => {
    expect(slugify('Hello World!')).toBe('hello-world')
    expect(slugify('Test   Multiple   Spaces')).toBe('test-multiple-spaces')
    expect(slugify('Special@#$Characters')).toBe('specialcharacters')
  })

  test('truncate should truncate strings correctly', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...')
    expect(truncate('Hi', 10)).toBe('Hi')
  })

  test('capitalize should capitalize strings correctly', () => {
    expect(capitalize('hello world')).toBe('Hello world')
    expect(capitalize('HELLO WORLD')).toBe('Hello world')
  })
})

describe('ID generation', () => {
  test('generateId should generate IDs of correct length', () => {
    expect(generateId()).toHaveLength(8)
    expect(generateId(12)).toHaveLength(12)
  })

  test('generateId should generate unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })
})

describe('Validation utilities', () => {
  test('isValidEmail should validate emails correctly', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('test@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
  })

  test('isValidUrl should validate URLs correctly', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://example.com')).toBe(true)
    expect(isValidUrl('invalid-url')).toBe(false)
    expect(isValidUrl('ftp://example.com')).toBe(true)
  })
})

describe('Name utilities', () => {
  test('getInitials should extract initials correctly', () => {
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('John')).toBe('J')
    expect(getInitials('John Michael Doe')).toBe('JM')
    expect(getInitials('john doe')).toBe('JD')
  })
})

describe('Function utilities', () => {
  test('debounce should delay function execution', async () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn('test1')
    debouncedFn('test2')
    debouncedFn('test3')

    expect(mockFn).not.toHaveBeenCalled()

    await new Promise(resolve => setTimeout(resolve, 150))
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('test3')
  })

  test('throttle should limit function calls', async () => {
    const mockFn = jest.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn('test1')
    throttledFn('test2')
    throttledFn('test3')

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('test1')
  })
})

describe('Array utilities', () => {
  const testData = [
    { id: 1, name: 'Alice', age: 30, category: 'A' },
    { id: 2, name: 'Bob', age: 25, category: 'B' },
    { id: 3, name: 'Charlie', age: 35, category: 'A' },
  ]

  test('groupBy should group array elements correctly', () => {
    const grouped = groupBy(testData, 'category')
    expect(grouped).toEqual({
      A: [
        { id: 1, name: 'Alice', age: 30, category: 'A' },
        { id: 3, name: 'Charlie', age: 35, category: 'A' },
      ],
      B: [{ id: 2, name: 'Bob', age: 25, category: 'B' }],
    })
  })

  test('sortBy should sort array correctly', () => {
    const sorted = sortBy(testData, 'age')
    expect(sorted.map(item => item.age)).toEqual([25, 30, 35])

    const sortedDesc = sortBy(testData, 'age', 'desc')
    expect(sortedDesc.map(item => item.age)).toEqual([35, 30, 25])
  })

  test('unique should remove duplicates', () => {
    expect(unique([1, 2, 2, 3, 3, 4])).toEqual([1, 2, 3, 4])
    expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c'])
  })

  test('chunk should split array into chunks', () => {
    expect(chunk([1, 2, 3, 4, 5, 6], 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ])
    expect(chunk([1, 2, 3, 4, 5], 3)).toEqual([
      [1, 2, 3],
      [4, 5],
    ])
  })
})

describe('Object utilities', () => {
  const testObj = { a: 1, b: 2, c: 3, d: 4 }

  test('omit should remove specified keys', () => {
    expect(omit(testObj, ['b', 'd'])).toEqual({ a: 1, c: 3 })
  })

  test('pick should select specified keys', () => {
    expect(pick(testObj, ['a', 'c'])).toEqual({ a: 1, c: 3 })
  })

  test('isEmpty should check if value is empty', () => {
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
    expect(isEmpty('')).toBe(true)
    expect(isEmpty([])).toBe(true)
    expect(isEmpty({})).toBe(true)
    expect(isEmpty(0)).toBe(false)
    expect(isEmpty('hello')).toBe(false)
    expect(isEmpty([1, 2])).toBe(false)
    expect(isEmpty({ a: 1 })).toBe(false)
  })
})