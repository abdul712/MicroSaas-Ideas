import {
  formatBytes,
  formatDuration,
  getCoreWebVitalScore,
  validateUrl,
  normalizeUrl,
  extractDomain,
  calculateHealthScore,
  getHealthScoreColor,
  debounce
} from '@/lib/utils';

describe('utils', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should handle decimals', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 3)).toBe('1.500 KB');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(1500)).toBe('1.5s');
      expect(formatDuration(65000)).toBe('1.1m');
    });
  });

  describe('getCoreWebVitalScore', () => {
    it('should score LCP correctly', () => {
      expect(getCoreWebVitalScore('lcp', 2000)).toEqual({
        score: 'good',
        class: 'status-good'
      });
      expect(getCoreWebVitalScore('lcp', 3000)).toEqual({
        score: 'needs-improvement',
        class: 'status-needs-improvement'
      });
      expect(getCoreWebVitalScore('lcp', 5000)).toEqual({
        score: 'poor',
        class: 'status-poor'
      });
    });

    it('should handle unknown metrics', () => {
      expect(getCoreWebVitalScore('unknown', 1000)).toEqual({
        score: 'unknown',
        class: ''
      });
    });
  });

  describe('validateUrl', () => {
    it('should validate URLs correctly', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('invalid-url')).toBe(false);
      expect(validateUrl('')).toBe(false);
    });
  });

  describe('normalizeUrl', () => {
    it('should normalize URLs', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(extractDomain('https://www.example.com/path')).toBe('www.example.com');
      expect(extractDomain('invalid-url')).toBe('invalid-url');
    });
  });

  describe('calculateHealthScore', () => {
    it('should calculate average score', () => {
      expect(calculateHealthScore({
        performance: 90,
        accessibility: 80,
        bestPractices: 70,
        seo: 60
      })).toBe(75);
    });

    it('should handle missing scores', () => {
      expect(calculateHealthScore({
        performance: 90,
        seo: 80
      })).toBe(85);

      expect(calculateHealthScore({})).toBe(0);
    });
  });

  describe('getHealthScoreColor', () => {
    it('should return correct colors', () => {
      expect(getHealthScoreColor(95)).toBe('text-green-500');
      expect(getHealthScoreColor(75)).toBe('text-yellow-500');
      expect(getHealthScoreColor(50)).toBe('text-red-500');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test1');
      debouncedFn('test2');
      debouncedFn('test3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });
});