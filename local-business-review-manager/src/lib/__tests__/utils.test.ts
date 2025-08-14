import {
  cn,
  formatDate,
  formatDateTime,
  timeAgo,
  getRatingColor,
  getRatingBgColor,
  getStarIcons,
  getPlatformColor,
  getPlatformBgColor,
  getPlatformName,
  getSentimentColor,
  getSentimentBgColor,
  getSentimentIcon,
  truncateText,
  capitalize,
  slugify,
  formatNumber,
  formatPercentage,
  calculatePercentageChange,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  sanitizeHtml,
  generateSecureToken,
} from '../utils';
import { Platform, Sentiment } from '@prisma/client';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
    });
  });

  describe('Date utilities', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');

    it('should format date correctly', () => {
      const formatted = formatDate(testDate);
      expect(formatted).toMatch(/Jan 15, 2024/);
    });

    it('should format datetime correctly', () => {
      const formatted = formatDateTime(testDate);
      expect(formatted).toMatch(/Jan 15, 2024/);
    });

    it('should calculate time ago correctly', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(timeAgo(oneHourAgo)).toBe('1 hour ago');
      expect(timeAgo(oneDayAgo)).toBe('1 day ago');
    });
  });

  describe('Rating utilities', () => {
    it('should return correct rating color', () => {
      expect(getRatingColor(5)).toBe('text-green-500');
      expect(getRatingColor(4)).toBe('text-lime-500');
      expect(getRatingColor(3)).toBe('text-yellow-500');
      expect(getRatingColor(2)).toBe('text-orange-500');
      expect(getRatingColor(1)).toBe('text-red-500');
    });

    it('should return correct rating background color', () => {
      expect(getRatingBgColor(5)).toBe('bg-green-100 text-green-800');
      expect(getRatingBgColor(4)).toBe('bg-lime-100 text-lime-800');
      expect(getRatingBgColor(3)).toBe('bg-yellow-100 text-yellow-800');
      expect(getRatingBgColor(2)).toBe('bg-orange-100 text-orange-800');
      expect(getRatingBgColor(1)).toBe('bg-red-100 text-red-800');
    });

    it('should generate star icons correctly', () => {
      expect(getStarIcons(5)).toBe('★★★★★');
      expect(getStarIcons(4)).toBe('★★★★☆');
      expect(getStarIcons(3.5)).toBe('★★★☆☆');
      expect(getStarIcons(0)).toBe('☆☆☆☆☆');
    });
  });

  describe('Platform utilities', () => {
    it('should return correct platform color', () => {
      expect(getPlatformColor(Platform.GOOGLE_MY_BUSINESS)).toBe('text-google');
      expect(getPlatformColor(Platform.FACEBOOK)).toBe('text-facebook');
      expect(getPlatformColor(Platform.YELP)).toBe('text-yelp');
      expect(getPlatformColor(Platform.TRIPADVISOR)).toBe('text-tripadvisor');
    });

    it('should return correct platform background color', () => {
      expect(getPlatformBgColor(Platform.GOOGLE_MY_BUSINESS)).toBe('bg-google text-google-foreground');
      expect(getPlatformBgColor(Platform.FACEBOOK)).toBe('bg-facebook text-facebook-foreground');
    });

    it('should return correct platform name', () => {
      expect(getPlatformName(Platform.GOOGLE_MY_BUSINESS)).toBe('Google My Business');
      expect(getPlatformName(Platform.FACEBOOK)).toBe('Facebook');
      expect(getPlatformName(Platform.YELP)).toBe('Yelp');
      expect(getPlatformName(Platform.TRIPADVISOR)).toBe('TripAdvisor');
      expect(getPlatformName(Platform.TRUSTPILOT)).toBe('Trustpilot');
    });
  });

  describe('Sentiment utilities', () => {
    it('should return correct sentiment color', () => {
      expect(getSentimentColor(Sentiment.POSITIVE)).toBe('text-sentiment-positive');
      expect(getSentimentColor(Sentiment.NEGATIVE)).toBe('text-sentiment-negative');
      expect(getSentimentColor(Sentiment.NEUTRAL)).toBe('text-sentiment-neutral');
    });

    it('should return correct sentiment background color', () => {
      expect(getSentimentBgColor(Sentiment.POSITIVE)).toBe('bg-green-100 text-green-800');
      expect(getSentimentBgColor(Sentiment.NEGATIVE)).toBe('bg-red-100 text-red-800');
      expect(getSentimentBgColor(Sentiment.NEUTRAL)).toBe('bg-gray-100 text-gray-800');
    });

    it('should return correct sentiment icon', () => {
      expect(getSentimentIcon(Sentiment.POSITIVE)).toBe('😊');
      expect(getSentimentIcon(Sentiment.NEGATIVE)).toBe('😞');
      expect(getSentimentIcon(Sentiment.NEUTRAL)).toBe('😐');
    });
  });

  describe('Text utilities', () => {
    it('should truncate text correctly', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long ...');
      expect(truncateText('Short text', 20)).toBe('Short text');
    });

    it('should capitalize text correctly', () => {
      expect(capitalize('hello world')).toBe('Hello world');
      expect(capitalize('HELLO WORLD')).toBe('Hello world');
    });

    it('should slugify text correctly', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Hello, World! 123')).toBe('hello-world-123');
    });
  });

  describe('Number utilities', () => {
    it('should format numbers correctly', () => {
      expect(formatNumber(1000)).toBe('1.0K');
      expect(formatNumber(1000000)).toBe('1.0M');
      expect(formatNumber(500)).toBe('500');
    });

    it('should format percentage correctly', () => {
      expect(formatPercentage(0.75)).toBe('75.0%');
      expect(formatPercentage(0.5)).toBe('50.0%');
    });

    it('should calculate percentage change correctly', () => {
      expect(calculatePercentageChange(110, 100)).toBe(10);
      expect(calculatePercentageChange(90, 100)).toBe(-10);
      expect(calculatePercentageChange(100, 0)).toBe(100);
    });
  });

  describe('Validation utilities', () => {
    it('should validate email correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });

    it('should validate phone correctly', () => {
      expect(isValidPhone('+1234567890')).toBe(true);
      expect(isValidPhone('(123) 456-7890')).toBe(true);
      expect(isValidPhone('123')).toBe(false);
    });

    it('should validate URL correctly', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('invalid-url')).toBe(false);
    });
  });

  describe('Security utilities', () => {
    it('should sanitize HTML correctly', () => {
      const dirtyHtml = '<script>alert("xss")</script><p>Clean content</p>';
      const sanitized = sanitizeHtml(dirtyHtml);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>Clean content</p>');
    });

    it('should generate secure token', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      
      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(10);
    });
  });
});