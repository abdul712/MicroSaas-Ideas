import {
  formatCurrency,
  formatDate,
  formatFileSize,
  truncateText,
  isValidEmail,
  sanitizeFilename,
  calculatePercentage,
  getCategoryColor,
  calculateTaxSavings,
  formatConfidenceScore,
  createSlug,
  debounce,
} from '../utils';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(formatCurrency(25.99)).toBe('$25.99');
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(0.5)).toBe('$0.50');
    });

    it('should handle different currencies', () => {
      expect(formatCurrency(25.99, 'EUR', 'de-DE')).toContain('25,99');
      expect(formatCurrency(25.99, 'GBP', 'en-GB')).toContain('£25.99');
    });

    it('should handle string inputs', () => {
      expect(formatCurrency('25.99')).toBe('$25.99');
      expect(formatCurrency('invalid')).toBe('$0.00');
    });

    it('should handle edge cases', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(-25.99)).toBe('-$25.99');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');

    it('should format dates in different formats', () => {
      expect(formatDate(testDate, 'short')).toContain('Jan 15');
      expect(formatDate(testDate, 'medium')).toContain('Jan 15, 2024');
      expect(formatDate(testDate, 'long')).toContain('Monday, January 15, 2024');
    });

    it('should handle string dates', () => {
      expect(formatDate('2024-01-15', 'short')).toContain('Jan 15');
    });

    it('should format relative dates', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      expect(formatDate(today, 'relative')).toBe('Today');
      expect(formatDate(yesterday, 'relative')).toBe('Yesterday');
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid date');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long ...');
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });

    it('should handle edge cases', () => {
      expect(truncateText('', 10)).toBe('');
      expect(truncateText('Test', 4)).toBe('Test');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('test123@test-domain.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test..test@example.com')).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize problematic characters', () => {
      expect(sanitizeFilename('my file.txt')).toBe('my_file.txt');
      expect(sanitizeFilename('file/with\\path.jpg')).toBe('file_with_path.jpg');
      expect(sanitizeFilename('special!@#$%^&*()chars.pdf')).toBe('special__________chars.pdf');
    });

    it('should handle edge cases', () => {
      expect(sanitizeFilename('___file___.txt')).toBe('file.txt');
      expect(sanitizeFilename('...')).toBe('');
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentages correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 3)).toBe(33);
      expect(calculatePercentage(0, 100)).toBe(0);
    });

    it('should handle division by zero', () => {
      expect(calculatePercentage(25, 0)).toBe(0);
    });
  });

  describe('getCategoryColor', () => {
    it('should return consistent colors for same category', () => {
      const color1 = getCategoryColor('Food');
      const color2 = getCategoryColor('Food');
      expect(color1).toBe(color2);
    });

    it('should return different colors for different categories', () => {
      const color1 = getCategoryColor('Food');
      const color2 = getCategoryColor('Transportation');
      expect(color1).not.toBe(color2);
    });

    it('should return valid hex colors', () => {
      const color = getCategoryColor('Test Category');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('calculateTaxSavings', () => {
    it('should calculate tax savings correctly', () => {
      expect(calculateTaxSavings(100, 0.25)).toBe(25);
      expect(calculateTaxSavings(200, 0.30)).toBe(60);
      expect(calculateTaxSavings(50)).toBe(12.5); // Default 25% rate
    });

    it('should handle edge cases', () => {
      expect(calculateTaxSavings(0, 0.25)).toBe(0);
      expect(calculateTaxSavings(100, 0)).toBe(0);
    });
  });

  describe('formatConfidenceScore', () => {
    it('should format confidence scores correctly', () => {
      expect(formatConfidenceScore(0.96)).toBe('Excellent');
      expect(formatConfidenceScore(0.90)).toBe('Good');
      expect(formatConfidenceScore(0.75)).toBe('Fair');
      expect(formatConfidenceScore(0.50)).toBe('Poor');
    });
  });

  describe('createSlug', () => {
    it('should create valid slugs', () => {
      expect(createSlug('My Business Expense')).toBe('my-business-expense');
      expect(createSlug('Special Characters!@#$%')).toBe('special-characters');
      expect(createSlug('  Extra   Spaces  ')).toBe('extra-spaces');
    });

    it('should handle edge cases', () => {
      expect(createSlug('')).toBe('');
      expect(createSlug('---')).toBe('');
      expect(createSlug('123 Numbers')).toBe('123-numbers');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      jest.advanceTimersByTime(50);
      
      debouncedFn('arg2');
      jest.advanceTimersByTime(50);
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(50);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg2');
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });
});