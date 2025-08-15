import { AnalyticsEngine, FunnelStep } from '../services/analyticsEngine';
import { prisma } from '../utils/prisma';
import { cache } from '../utils/redis';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    funnel: {
      findUnique: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    conversion: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    segment: {
      findMany: jest.fn(),
    },
  },
}));

// Mock Redis
jest.mock('../utils/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

describe('AnalyticsEngine', () => {
  const projectId = 'test-project-id';
  const funnelId = 'test-funnel-id';
  const dateRange = {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeFunnel', () => {
    const mockFunnel = {
      id: funnelId,
      projectId,
      name: 'Test Funnel',
      steps: [
        {
          id: 'step1',
          name: 'Landing Page',
          pageUrl: '/landing',
        },
        {
          id: 'step2',
          name: 'Product Page',
          pageUrl: '/product',
        },
        {
          id: 'step3',
          name: 'Checkout',
          eventType: 'click',
          elementSelector: '#checkout-button',
        },
      ] as FunnelStep[],
      goalValue: 100,
      project: { id: projectId },
    };

    it('should analyze funnel with proper conversion rates', async () => {
      // Mock cache miss
      (cache.get as jest.Mock).mockResolvedValue(null);
      
      // Mock funnel data
      (prisma.funnel.findUnique as jest.Mock).mockResolvedValue(mockFunnel);
      
      // Mock event data for each step
      (prisma.event.groupBy as jest.Mock)
        .mockResolvedValueOnce([{ sessionId: '1' }, { sessionId: '2' }, { sessionId: '3' }]) // Step 1: 3 visitors
        .mockResolvedValueOnce([{ sessionId: '1' }, { sessionId: '2' }]) // Step 2: 2 visitors
        .mockResolvedValueOnce([{ sessionId: '1' }]); // Step 3: 1 visitor

      const result = await AnalyticsEngine.analyzeFunnel(projectId, funnelId, dateRange);

      expect(result).toBeDefined();
      expect(result.funnelId).toBe(funnelId);
      expect(result.steps).toHaveLength(3);
      expect(result.totalVisitors).toBe(3);
      expect(result.totalConversions).toBe(1);
      expect(result.overallConversionRate).toBeCloseTo(0.333, 2);
      
      // Check drop-off points
      expect(result.dropOffPoints).toBeDefined();
      expect(result.dropOffPoints.length).toBeGreaterThan(0);
      
      // Verify cache was set
      expect(cache.set).toHaveBeenCalled();
    });

    it('should return cached result when available', async () => {
      const cachedResult = {
        funnelId,
        steps: [],
        overallConversionRate: 0.25,
        totalVisitors: 100,
        totalConversions: 25,
        dropOffPoints: [],
      };
      
      (cache.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedResult));

      const result = await AnalyticsEngine.analyzeFunnel(projectId, funnelId, dateRange);

      expect(result).toEqual(cachedResult);
      expect(prisma.funnel.findUnique).not.toHaveBeenCalled();
    });

    it('should handle funnel not found', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);
      (prisma.funnel.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        AnalyticsEngine.analyzeFunnel(projectId, funnelId, dateRange)
      ).rejects.toThrow('Funnel not found or access denied');
    });

    it('should handle empty funnel steps', async () => {
      const emptyFunnel = { ...mockFunnel, steps: [] };
      (cache.get as jest.Mock).mockResolvedValue(null);
      (prisma.funnel.findUnique as jest.Mock).mockResolvedValue(emptyFunnel);

      const result = await AnalyticsEngine.analyzeFunnel(projectId, funnelId, dateRange);

      expect(result.steps).toHaveLength(0);
      expect(result.totalVisitors).toBe(0);
      expect(result.totalConversions).toBe(0);
      expect(result.overallConversionRate).toBe(0);
    });
  });

  describe('generateHeatmap', () => {
    const pageUrl = '/test-page';
    const mockEvents = [
      {
        eventType: 'click',
        elementSelector: '#button1',
        properties: { x: 100, y: 200, timeSpent: 1000 },
      },
      {
        eventType: 'hover',
        elementSelector: '#button1',
        properties: { x: 100, y: 200 },
      },
      {
        eventType: 'click',
        elementSelector: '#button2',
        properties: { x: 300, y: 400, timeSpent: 500 },
      },
    ];

    it('should generate heatmap data correctly', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await AnalyticsEngine.generateHeatmap(projectId, pageUrl, dateRange);

      expect(result).toBeDefined();
      expect(result.length).toBe(2); // Two unique elements
      
      const button1Data = result.find(item => item.elementSelector === '#button1');
      expect(button1Data).toBeDefined();
      expect(button1Data!.clicks).toBe(1);
      expect(button1Data!.hovers).toBe(1);
      expect(button1Data!.timeSpent).toBe(1000);
      
      const button2Data = result.find(item => item.elementSelector === '#button2');
      expect(button2Data).toBeDefined();
      expect(button2Data!.clicks).toBe(1);
      expect(button2Data!.hovers).toBe(0);
    });

    it('should handle empty events', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

      const result = await AnalyticsEngine.generateHeatmap(projectId, pageUrl, dateRange);

      expect(result).toEqual([]);
    });
  });

  describe('getRealTimeMetrics', () => {
    it('should calculate real-time metrics correctly', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);
      
      // Mock active visitors (last 15 minutes)
      (prisma.event.groupBy as jest.Mock).mockResolvedValueOnce([
        { sessionId: '1' },
        { sessionId: '2' },
        { sessionId: '3' },
      ]);
      
      // Mock conversions last 24h
      (prisma.conversion.count as jest.Mock).mockResolvedValue(25);
      
      // Mock top pages
      (prisma.event.groupBy as jest.Mock).mockResolvedValueOnce([
        { pageUrl: '/product/1', _count: { sessionId: 100 } },
        { pageUrl: '/product/2', _count: { sessionId: 80 } },
      ]);
      
      // Mock total visitors for conversion rate
      (prisma.event.groupBy as jest.Mock).mockResolvedValueOnce(
        Array.from({ length: 500 }, (_, i) => ({ sessionId: `session_${i}` }))
      );

      const result = await AnalyticsEngine.getRealTimeMetrics(projectId);

      expect(result).toBeDefined();
      expect(result.activeVisitors).toBe(3);
      expect(result.conversionsLast24h).toBe(25);
      expect(result.topPages).toHaveLength(2);
      expect(result.conversionRate24h).toBe(0.05); // 25/500
      
      // Verify cache was set
      expect(cache.set).toHaveBeenCalled();
    });

    it('should handle zero visitors gracefully', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);
      (prisma.event.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.conversion.count as jest.Mock).mockResolvedValue(0);

      const result = await AnalyticsEngine.getRealTimeMetrics(projectId);

      expect(result.activeVisitors).toBe(0);
      expect(result.conversionsLast24h).toBe(0);
      expect(result.conversionRate24h).toBe(0);
    });
  });

  describe('analyzeUserSegments', () => {
    const mockSegments = [
      {
        id: 'segment1',
        projectId,
        name: 'Mobile Users',
        conditions: [
          { field: 'deviceType', operator: 'equals', value: 'mobile' },
        ],
        isActive: true,
      },
      {
        id: 'segment2',
        projectId,
        name: 'Returning Customers',
        conditions: [
          { field: 'sessionCount', operator: 'greater_than', value: 1 },
        ],
        isActive: true,
      },
    ];

    it('should analyze user segments correctly', async () => {
      (prisma.segment.findMany as jest.Mock).mockResolvedValue(mockSegments);
      
      // Mock user count for segments
      (prisma.event.groupBy as jest.Mock).mockResolvedValue([
        { sessionId: '1' },
        { sessionId: '2' },
        { sessionId: '3' },
      ]);

      const result = await AnalyticsEngine.analyzeUserSegments(projectId, dateRange);

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      
      const mobileSegment = result.find(s => s.id === 'segment1');
      expect(mobileSegment).toBeDefined();
      expect(mobileSegment!.name).toBe('Mobile Users');
      expect(mobileSegment!.conditions).toHaveLength(1);
    });

    it('should only return active segments', async () => {
      const segmentsWithInactive = [
        ...mockSegments,
        {
          id: 'segment3',
          projectId,
          name: 'Inactive Segment',
          conditions: [],
          isActive: false,
        },
      ];

      (prisma.segment.findMany as jest.Mock).mockResolvedValue(mockSegments); // findMany should only return active segments

      const result = await AnalyticsEngine.analyzeUserSegments(projectId, dateRange);

      expect(result.length).toBe(2);
      expect(result.find(s => s.name === 'Inactive Segment')).toBeUndefined();
    });
  });

  describe('getSessionRecordings', () => {
    const filters = {
      converted: true,
      deviceType: 'mobile',
      minDuration: 30000, // 30 seconds
      dateRange,
    };

    const mockEvents = [
      {
        sessionId: 'session1',
        eventType: 'click',
        elementSelector: '#button',
        pageUrl: '/page1',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        properties: { x: 100, y: 200 },
        deviceType: 'mobile',
        browserName: 'Chrome',
      },
      {
        sessionId: 'session1',
        eventType: 'navigation',
        elementSelector: null,
        pageUrl: '/page2',
        timestamp: new Date('2024-01-01T10:01:00Z'),
        properties: {},
        deviceType: 'mobile',
        browserName: 'Chrome',
      },
    ];

    it('should return session recordings with correct format', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      (prisma.event.findFirst as jest.Mock).mockResolvedValue(mockEvents[0]);
      (prisma.conversion.findFirst as jest.Mock).mockResolvedValue({ id: 'conv1' });

      const result = await AnalyticsEngine.getSessionRecordings(projectId, filters, 10);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      
      const recording = result[0];
      expect(recording.sessionId).toBe('session1');
      expect(recording.events).toHaveLength(2);
      expect(recording.duration).toBe(60000); // 1 minute
      expect(recording.pageViews).toBe(2);
      expect(recording.convertedToGoal).toBe(true);
      expect(recording.deviceType).toBe('mobile');
    });

    it('should filter by minimum duration', async () => {
      const shortSessionEvents = [
        {
          ...mockEvents[0],
          sessionId: 'short_session',
          timestamp: new Date('2024-01-01T10:00:00Z'),
        },
        {
          ...mockEvents[1],
          sessionId: 'short_session',
          timestamp: new Date('2024-01-01T10:00:05Z'), // Only 5 seconds
        },
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValue(shortSessionEvents);
      (prisma.event.findFirst as jest.Mock).mockResolvedValue(shortSessionEvents[0]);
      (prisma.conversion.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await AnalyticsEngine.getSessionRecordings(
        projectId,
        { ...filters, minDuration: 30000 }, // 30 seconds minimum
        10
      );

      expect(result).toHaveLength(0); // Should be filtered out due to short duration
    });
  });

  describe('analyzeCohorts', () => {
    it('should analyze cohorts correctly', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);
      
      // Mock cohort users
      (prisma.event.groupBy as jest.Mock).mockResolvedValue([
        { sessionId: '1', _min: { timestamp: new Date('2024-01-01') } },
        { sessionId: '2', _min: { timestamp: new Date('2024-01-01') } },
        { sessionId: '3', _min: { timestamp: new Date('2024-01-01') } },
      ]);

      const result = await AnalyticsEngine.analyzeCohorts(projectId, 'weekly', 4);

      expect(result).toBeDefined();
      expect(result.length).toBe(4);
      
      result.forEach(cohort => {
        expect(cohort.cohortDate).toBeDefined();
        expect(cohort.size).toBeGreaterThanOrEqual(0);
        expect(cohort.retentionRates).toHaveLength(12);
        expect(cohort.conversionRates).toHaveLength(12);
        expect(cohort.revenuePerUser).toBeGreaterThanOrEqual(0);
      });
    });

    it('should return cached cohort data when available', async () => {
      const cachedCohorts = [
        {
          cohortDate: '2024-01-01',
          size: 100,
          retentionRates: [1, 0.8, 0.6],
          conversionRates: [0.1, 0.15, 0.2],
          revenuePerUser: 50,
        },
      ];

      (cache.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedCohorts));

      const result = await AnalyticsEngine.analyzeCohorts(projectId, 'monthly', 1);

      expect(result).toEqual(cachedCohorts);
      expect(prisma.event.groupBy).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully in funnel analysis', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);
      (prisma.funnel.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        AnalyticsEngine.analyzeFunnel(projectId, funnelId, dateRange)
      ).rejects.toThrow('Database error');
    });

    it('should handle Redis errors gracefully', async () => {
      (cache.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      (prisma.event.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.conversion.count as jest.Mock).mockResolvedValue(0);

      // Should still work without cache
      const result = await AnalyticsEngine.getRealTimeMetrics(projectId);
      expect(result).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const largeEventSet = Array.from({ length: 10000 }, (_, i) => ({
        sessionId: `session_${i}`,
        eventType: 'click',
        elementSelector: `#button_${i % 100}`,
        pageUrl: '/test',
        timestamp: new Date(),
        properties: { x: i, y: i * 2 },
      }));

      (cache.get as jest.Mock).mockResolvedValue(null);
      (prisma.event.findMany as jest.Mock).mockResolvedValue(largeEventSet);

      const startTime = Date.now();
      const result = await AnalyticsEngine.generateHeatmap(projectId, '/test', dateRange);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});