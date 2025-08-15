import {
  validateEmail,
  calculateEngagementScore,
  formatDate,
  formatDateTime,
  formatPercentage,
  truncateText,
  getInitials,
  calculateDeliveryTime,
  isBusinessHours,
  parseCustomFields,
  slugify,
} from '@/lib/utils';

describe('Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('calculateEngagementScore', () => {
    it('should calculate engagement score correctly', () => {
      expect(calculateEngagementScore(5, 3, 1, 10)).toBe(40);
      expect(calculateEngagementScore(0, 0, 0, 10)).toBe(0);
      expect(calculateEngagementScore(10, 5, 2, 10)).toBe(70);
    });

    it('should handle zero total emails', () => {
      expect(calculateEngagementScore(5, 3, 1, 0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(calculateEngagementScore(1, 1, 1, 3)).toBe(33);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-12-25');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/December 25, 2023/);
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const date = new Date('2023-12-25T15:30:00');
      const formatted = formatDateTime(date);
      expect(formatted).toMatch(/Dec 25, 2023/);
      expect(formatted).toMatch(/3:30/);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      expect(formatPercentage(0.1234)).toBe('12.3%');
      expect(formatPercentage(0.5)).toBe('50.0%');
      expect(formatPercentage(1)).toBe('100.0%');
    });

    it('should format percentage with custom decimals', () => {
      expect(formatPercentage(0.1234, 2)).toBe('12.34%');
      expect(formatPercentage(0.1234, 0)).toBe('12%');
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

    it('should handle exact length', () => {
      const text = 'Exactly twenty chars';
      expect(truncateText(text, 20)).toBe('Exactly twenty chars');
    });
  });

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Jane Mary Smith')).toBe('JM');
      expect(getInitials('SingleName')).toBe('SI');
    });

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('');
    });

    it('should limit to 2 characters', () => {
      expect(getInitials('John Mary Jane Doe')).toBe('JM');
    });
  });

  describe('calculateDeliveryTime', () => {
    it('should calculate delivery time correctly', () => {
      const baseDate = new Date('2023-12-25T10:00:00');
      const result = calculateDeliveryTime(1, 2, baseDate);
      
      expect(result.getDate()).toBe(26); // Next day
      expect(result.getHours()).toBe(12); // 2 hours later
    });

    it('should use current date when no base date provided', () => {
      const result = calculateDeliveryTime(0, 1);
      const now = new Date();
      
      expect(result.getHours()).toBe((now.getHours() + 1) % 24);
    });
  });

  describe('isBusinessHours', () => {
    it('should detect business hours correctly', () => {
      // Monday 10 AM
      const businessHour = new Date('2023-12-25T10:00:00'); // Note: This might be adjusted based on actual day of week
      
      // We'll test with a known Monday
      const monday10AM = new Date('2023-12-18T10:00:00');
      expect(isBusinessHours(monday10AM, 'UTC')).toBe(true);
      
      const monday6PM = new Date('2023-12-18T18:00:00');
      expect(isBusinessHours(monday6PM, 'UTC')).toBe(false);
      
      // Saturday
      const saturday10AM = new Date('2023-12-16T10:00:00');
      expect(isBusinessHours(saturday10AM, 'UTC')).toBe(false);
    });
  });

  describe('parseCustomFields', () => {
    it('should parse JSON string', () => {
      const jsonString = '{"field1": "value1", "field2": "value2"}';
      const result = parseCustomFields(jsonString);
      expect(result).toEqual({ field1: 'value1', field2: 'value2' });
    });

    it('should return object as-is', () => {
      const obj = { field1: 'value1', field2: 'value2' };
      const result = parseCustomFields(obj);
      expect(result).toEqual(obj);
    });

    it('should handle invalid JSON', () => {
      const invalidJson = 'invalid json';
      const result = parseCustomFields(invalidJson);
      expect(result).toEqual({});
    });

    it('should handle null/undefined', () => {
      expect(parseCustomFields(null)).toEqual({});
      expect(parseCustomFields(undefined)).toEqual({});
    });
  });

  describe('slugify', () => {
    it('should create URL-friendly slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Special Characters!')).toBe('special-characters');
      expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
      expect(slugify('UPPERCASE')).toBe('uppercase');
    });

    it('should handle special characters', () => {
      expect(slugify('Hello & World')).toBe('hello-world');
      expect(slugify('Test@Email.com')).toBe('testemailcom');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });
  });
});