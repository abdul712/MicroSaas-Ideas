import {
  formatNumber,
  formatPercentage,
  formatCurrency,
  normalizeHashtag,
  addHashtagSymbol,
  removeHashtagSymbol,
  validateEmail,
  validatePassword,
  calculateEngagementRate,
  getDifficultyLabel,
  generateHashtagSuggestions,
} from '@/lib/utils';

describe('Utils', () => {
  describe('formatNumber', () => {
    it('should format numbers correctly', () => {
      expect(formatNumber(500)).toBe('500');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(2500000)).toBe('2.5M');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(0.1)).toBe('10.0%');
      expect(formatPercentage(0.05)).toBe('5.0%');
      expect(formatPercentage(0.123, 2)).toBe('12.30%');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(29)).toBe('$29.00');
      expect(formatCurrency(99.5)).toBe('$99.50');
      expect(formatCurrency(1250)).toBe('$1,250.00');
    });
  });

  describe('hashtag utilities', () => {
    it('should normalize hashtags', () => {
      expect(normalizeHashtag('#fitness')).toBe('fitness');
      expect(normalizeHashtag('fitness')).toBe('fitness');
      expect(normalizeHashtag('#FitNess')).toBe('fitness');
    });

    it('should add hashtag symbol', () => {
      expect(addHashtagSymbol('fitness')).toBe('#fitness');
      expect(addHashtagSymbol('#fitness')).toBe('#fitness');
    });

    it('should remove hashtag symbol', () => {
      expect(removeHashtagSymbol('#fitness')).toBe('fitness');
      expect(removeHashtagSymbol('fitness')).toBe('fitness');
    });
  });

  describe('validation', () => {
    it('should validate emails correctly', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('invalid.email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });

    it('should validate passwords correctly', () => {
      expect(validatePassword('StrongPass1')).toBe(true);
      expect(validatePassword('Test123!')).toBe(true);
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('NoNumbers')).toBe(false);
      expect(validatePassword('nocaps123')).toBe(false);
    });
  });

  describe('social media utilities', () => {
    it('should calculate engagement rate', () => {
      expect(calculateEngagementRate(1000, 10000)).toBe(10);
      expect(calculateEngagementRate(500, 2000)).toBe(25);
      expect(calculateEngagementRate(100, 0)).toBe(0);
    });

    it('should get difficulty labels', () => {
      expect(getDifficultyLabel(0.2)).toBe('Easy');
      expect(getDifficultyLabel(0.5)).toBe('Medium');
      expect(getDifficultyLabel(0.8)).toBe('Hard');
    });

    it('should generate hashtag suggestions', () => {
      const content = 'This is a fitness journey motivation post';
      const suggestions = generateHashtagSuggestions(content);
      
      expect(suggestions).toContain('#fitness');
      expect(suggestions).toContain('#journey');
      expect(suggestions).toContain('#motivation');
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });
  });
});