import { SegmentationEngine } from '@/services/segmentation-engine';
import { prisma } from '@/lib/prisma';
import { SegmentOperator, RFMSegment } from '@/types';

// Mock Prisma
jest.mock('@/lib/prisma');
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('SegmentationEngine', () => {
  let segmentationEngine: SegmentationEngine;

  beforeEach(() => {
    segmentationEngine = new SegmentationEngine();
    jest.clearAllMocks();
  });

  describe('createSegment', () => {
    it('should create a new segment', async () => {
      const mockSegment = {
        id: 'segment-1',
        tenantId: 'tenant-1',
        name: 'High Value Customers',
        description: 'Customers with high lifetime value',
        rules: [],
        isDynamic: true,
        color: '#3B82F6',
        customerCount: 0,
      };

      mockPrisma.segment.create.mockResolvedValue(mockSegment as any);

      const result = await segmentationEngine.createSegment({
        tenantId: 'tenant-1',
        name: 'High Value Customers',
        description: 'Customers with high lifetime value',
        rules: [],
        isDynamic: true,
      });

      expect(mockPrisma.segment.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          name: 'High Value Customers',
          description: 'Customers with high lifetime value',
          rules: [],
          mlConfig: undefined,
          isDynamic: true,
          color: '#3B82F6',
          tags: [],
        },
      });

      expect(result).toEqual(mockSegment);
    });
  });

  describe('calculateRFMScores', () => {
    it('should calculate RFM scores for a customer', async () => {
      const mockCustomer = {
        id: 'customer-1',
        behaviorEvents: [
          {
            eventType: 'purchase',
            properties: { amount: 100 },
            occurredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          },
          {
            eventType: 'purchase',
            properties: { amount: 200 },
            occurredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          },
        ],
      };

      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer as any);
      mockPrisma.customer.update.mockResolvedValue(mockCustomer as any);

      const result = await segmentationEngine.calculateRFMScores('customer-1');

      expect(result).toMatchObject({
        recency: expect.any(Number),
        frequency: expect.any(Number),
        monetary: expect.any(Number),
        rfmScore: expect.any(String),
        rfmSegment: expect.any(String),
      });

      expect(result.frequency).toBe(2); // 2 purchases
      expect(result.monetary).toBe(5); // High monetary score for $300 total
    });

    it('should handle customers with no purchases', async () => {
      const mockCustomer = {
        id: 'customer-2',
        behaviorEvents: [],
      };

      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer as any);
      mockPrisma.customer.update.mockResolvedValue(mockCustomer as any);

      const result = await segmentationEngine.calculateRFMScores('customer-2');

      expect(result.frequency).toBe(1); // Minimum score
      expect(result.monetary).toBe(1); // Minimum score
      expect(result.recency).toBe(1); // Minimum score for no recent activity
    });
  });

  describe('predictChurn', () => {
    it('should predict low churn for active customers', async () => {
      const mockCustomer = {
        id: 'customer-1',
        behaviorEvents: [
          {
            eventType: 'page_view',
            occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          },
          {
            eventType: 'purchase',
            occurredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          },
          {
            eventType: 'email_open',
            occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          },
        ],
        segmentMemberships: [],
      };

      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer as any);

      const result = await segmentationEngine.predictChurn('customer-1');

      expect(result.customerId).toBe('customer-1');
      expect(result.churnProbability).toBeLessThan(0.5);
      expect(result.riskLevel).toBe('low');
    });

    it('should predict high churn for inactive customers', async () => {
      const mockCustomer = {
        id: 'customer-2',
        behaviorEvents: [
          {
            eventType: 'page_view',
            occurredAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
          },
        ],
        segmentMemberships: [],
      };

      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer as any);

      const result = await segmentationEngine.predictChurn('customer-2');

      expect(result.customerId).toBe('customer-2');
      expect(result.churnProbability).toBeGreaterThan(0.5);
      expect(result.riskLevel).toMatch(/medium|high|critical/);
      expect(result.reasons).toContain('No activity in the last 90 days');
    });
  });

  describe('predictCLV', () => {
    it('should calculate CLV for customers with purchase history', async () => {
      const mockCustomer = {
        id: 'customer-1',
        behaviorEvents: [
          {
            eventType: 'purchase',
            properties: { amount: 100 },
            occurredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          },
          {
            eventType: 'purchase',
            properties: { amount: 150 },
            occurredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          },
        ],
      };

      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer as any);

      const result = await segmentationEngine.predictCLV('customer-1', 12);

      expect(result.customerId).toBe('customer-1');
      expect(result.predictedCLV).toBeGreaterThan(0);
      expect(result.timeHorizon).toBe(12);
      expect(result.confidenceInterval).toHaveLength(2);
      expect(result.factors).toHaveLength(3);
    });

    it('should return zero CLV for customers with no purchases', async () => {
      const mockCustomer = {
        id: 'customer-2',
        behaviorEvents: [],
      };

      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer as any);

      const result = await segmentationEngine.predictCLV('customer-2');

      expect(result.predictedCLV).toBe(0);
      expect(result.confidenceInterval).toEqual([0, 0]);
      expect(result.factors).toHaveLength(0);
    });
  });

  describe('runMLClustering', () => {
    it('should create ML-based segments', async () => {
      const mockCustomers = Array.from({ length: 20 }, (_, i) => ({
        id: `customer-${i}`,
        behaviorEvents: [],
      }));

      const mockSegments = [
        { id: 'segment-1', name: 'High-Value Frequent Buyers' },
        { id: 'segment-2', name: 'Occasional Big Spenders' },
        { id: 'segment-3', name: 'Regular Small Buyers' },
        { id: 'segment-4', name: 'At-Risk Customers' },
      ];

      mockPrisma.customer.findMany.mockResolvedValue(mockCustomers as any);
      mockPrisma.segment.create
        .mockResolvedValueOnce(mockSegments[0] as any)
        .mockResolvedValueOnce(mockSegments[1] as any)
        .mockResolvedValueOnce(mockSegments[2] as any)
        .mockResolvedValueOnce(mockSegments[3] as any);
      mockPrisma.segmentMembership.createMany.mockResolvedValue({ count: 5 } as any);

      const result = await segmentationEngine.runMLClustering('tenant-1');

      expect(result).toHaveLength(4);
      expect(mockPrisma.segment.create).toHaveBeenCalledTimes(4);
      expect(mockPrisma.segmentMembership.createMany).toHaveBeenCalledTimes(4);
    });

    it('should throw error for insufficient data', async () => {
      const mockCustomers = Array.from({ length: 5 }, (_, i) => ({
        id: `customer-${i}`,
        behaviorEvents: [],
      }));

      mockPrisma.customer.findMany.mockResolvedValue(mockCustomers as any);

      await expect(
        segmentationEngine.runMLClustering('tenant-1')
      ).rejects.toThrow('Not enough customers for clustering analysis');
    });
  });

  describe('updateSegmentMembership', () => {
    it('should update dynamic segment membership', async () => {
      const mockSegment = {
        id: 'segment-1',
        tenantId: 'tenant-1',
        isDynamic: true,
        rules: [
          {
            id: 'rule-1',
            field: 'attributes.totalSpent',
            operator: SegmentOperator.GREATER_THAN,
            value: 1000,
            type: 'transactional',
          },
        ],
      };

      const mockCustomers = [
        {
          id: 'customer-1',
          attributes: { totalSpent: 1500 },
          behaviorEvents: [],
          segmentMemberships: [],
        },
        {
          id: 'customer-2',
          attributes: { totalSpent: 500 },
          behaviorEvents: [],
          segmentMemberships: [],
        },
      ];

      mockPrisma.segment.findUnique.mockResolvedValue(mockSegment as any);
      mockPrisma.segmentMembership.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.customer.findMany.mockResolvedValue(mockCustomers as any);
      mockPrisma.segmentMembership.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.segment.update.mockResolvedValue(mockSegment as any);

      const result = await segmentationEngine.updateSegmentMembership('segment-1');

      expect(result).toBe(1); // Only customer-1 should qualify
      expect(mockPrisma.segmentMembership.createMany).toHaveBeenCalledWith({
        data: [
          {
            segmentId: 'segment-1',
            customerId: 'customer-1',
            score: 1.0,
          },
        ],
      });
    });
  });

  describe('updateAllDynamicSegments', () => {
    it('should update all dynamic segments for a tenant', async () => {
      const mockSegments = [
        { id: 'segment-1', name: 'Segment 1', isDynamic: true, isActive: true },
        { id: 'segment-2', name: 'Segment 2', isDynamic: true, isActive: true },
      ];

      mockPrisma.segment.findMany.mockResolvedValue(mockSegments as any);
      
      // Mock the updateSegmentMembership method
      jest.spyOn(segmentationEngine, 'updateSegmentMembership')
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(8);

      const result = await segmentationEngine.updateAllDynamicSegments('tenant-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        segmentId: 'segment-1',
        segmentName: 'Segment 1',
        memberCount: 5,
        success: true,
      });
      expect(result[1]).toMatchObject({
        segmentId: 'segment-2',
        segmentName: 'Segment 2',
        memberCount: 8,
        success: true,
      });
    });
  });
});