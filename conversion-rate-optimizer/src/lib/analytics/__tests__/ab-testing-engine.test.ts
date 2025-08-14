import { ABTestingEngine } from '../ab-testing-engine';
import { prisma } from '@/lib/prisma';
import { redisService } from '@/lib/redis';

// Mock implementations
jest.mock('@/lib/prisma');
jest.mock('@/lib/redis');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRedisService = redisService as jest.Mocked<typeof redisService>;

describe('ABTestingEngine', () => {
  let abTestEngine: ABTestingEngine;

  beforeEach(() => {
    abTestEngine = ABTestingEngine.getInstance();
    jest.clearAllMocks();
  });

  describe('allocateVariant', () => {
    const mockExperiment = {
      id: 'exp-1',
      status: 'RUNNING',
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      endedAt: null,
      variants: [
        {
          id: 'variant-control',
          name: 'Control',
          isControl: true,
          trafficPercentage: 50,
          changes: [],
        },
        {
          id: 'variant-test',
          name: 'Test',
          isControl: false,
          trafficPercentage: 50,
          changes: [
            {
              selector: '.button',
              property: 'text',
              value: 'New Button',
              changeType: 'text',
            },
          ],
        },
      ],
      project: { id: 'project-1' },
    };

    it('should allocate user to a variant consistently', async () => {
      mockRedisService.getJson.mockResolvedValue(null);
      mockPrisma.experiment.findUnique.mockResolvedValue(mockExperiment as any);
      mockRedisService.setJson.mockResolvedValue(undefined);
      mockPrisma.variant.update.mockResolvedValue({} as any);

      const userId = 'user-123';
      const allocation1 = await abTestEngine.allocateVariant('exp-1', userId);
      const allocation2 = await abTestEngine.allocateVariant('exp-1', userId);

      expect(allocation1).toBeDefined();
      expect(allocation2).toBeDefined();
      expect(allocation1?.variantId).toBe(allocation2?.variantId);
    });

    it('should return cached allocation if exists', async () => {
      const cachedAllocation = {
        experimentId: 'exp-1',
        variantId: 'variant-control',
        variant: mockExperiment.variants[0],
        isNewAllocation: false,
      };

      mockRedisService.getJson.mockResolvedValue(cachedAllocation);

      const result = await abTestEngine.allocateVariant('exp-1', 'user-123');

      expect(result).toEqual({
        ...cachedAllocation,
        isNewAllocation: false,
      });
      expect(mockPrisma.experiment.findUnique).not.toHaveBeenCalled();
    });

    it('should return null for non-running experiment', async () => {
      const stoppedExperiment = {
        ...mockExperiment,
        status: 'COMPLETED',
      };

      mockRedisService.getJson.mockResolvedValue(null);
      mockPrisma.experiment.findUnique.mockResolvedValue(stoppedExperiment as any);

      const result = await abTestEngine.allocateVariant('exp-1', 'user-123');

      expect(result).toBeNull();
    });

    it('should return null for expired experiment', async () => {
      const expiredExperiment = {
        ...mockExperiment,
        endedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      };

      mockRedisService.getJson.mockResolvedValue(null);
      mockPrisma.experiment.findUnique.mockResolvedValue(expiredExperiment as any);

      const result = await abTestEngine.allocateVariant('exp-1', 'user-123');

      expect(result).toBeNull();
    });
  });

  describe('recordConversion', () => {
    it('should update variant conversion count', async () => {
      mockPrisma.variant.update.mockResolvedValue({} as any);
      mockPrisma.variant.findUnique.mockResolvedValue({
        id: 'variant-1',
        visitors: 100,
        conversions: 10,
      } as any);

      await abTestEngine.recordConversion('exp-1', 'variant-1', 'user-123', 50);

      expect(mockPrisma.variant.update).toHaveBeenCalledWith({
        where: { id: 'variant-1' },
        data: {
          conversions: { increment: 1 },
          revenue: { increment: 50 },
        },
      });
    });

    it('should update variant metrics after recording conversion', async () => {
      const mockVariant = {
        id: 'variant-1',
        visitors: 100,
        conversions: 11, // After increment
      };

      mockPrisma.variant.update
        .mockResolvedValueOnce({} as any) // First call for conversion increment
        .mockResolvedValueOnce({} as any); // Second call for metrics update

      mockPrisma.variant.findUnique.mockResolvedValue(mockVariant as any);

      await abTestEngine.recordConversion('exp-1', 'variant-1', 'user-123');

      expect(mockPrisma.variant.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.variant.update).toHaveBeenLastCalledWith({
        where: { id: 'variant-1' },
        data: { conversionRate: 11 },
      });
    });
  });

  describe('calculateStatisticalSignificance', () => {
    it('should calculate p-value for two variants', async () => {
      const controlVariant = {
        id: 'control',
        visitors: 1000,
        conversions: 50,
      };

      const testVariant = {
        id: 'test',
        visitors: 1000,
        conversions: 65,
      };

      const result = await abTestEngine.calculateStatisticalSignificance(
        controlVariant as any,
        testVariant as any
      );

      expect(result.pValue).toBeDefined();
      expect(result.isSignificant).toBeDefined();
      expect(result.lift).toBeDefined();
      expect(typeof result.pValue).toBe('number');
      expect(typeof result.isSignificant).toBe('boolean');
      expect(typeof result.lift).toBe('number');
    });

    it('should return non-significant result for small sample sizes', async () => {
      const controlVariant = {
        id: 'control',
        visitors: 10,
        conversions: 1,
      };

      const testVariant = {
        id: 'test',
        visitors: 10,
        conversions: 2,
      };

      const result = await abTestEngine.calculateStatisticalSignificance(
        controlVariant as any,
        testVariant as any
      );

      expect(result.isSignificant).toBe(false);
      expect(result.pValue).toBe(1);
    });

    it('should calculate correct lift percentage', async () => {
      const controlVariant = {
        id: 'control',
        visitors: 1000,
        conversions: 50, // 5% conversion rate
      };

      const testVariant = {
        id: 'test',
        visitors: 1000,
        conversions: 60, // 6% conversion rate
      };

      const result = await abTestEngine.calculateStatisticalSignificance(
        controlVariant as any,
        testVariant as any
      );

      // Expected lift: (6% - 5%) / 5% * 100 = 20%
      expect(result.lift).toBeCloseTo(20, 1);
    });
  });

  describe('calculateConfidenceInterval', () => {
    it('should calculate confidence interval for conversion rate', () => {
      const result = abTestEngine.calculateConfidenceInterval(50, 1000, 0.95);

      expect(result.lower).toBeDefined();
      expect(result.upper).toBeDefined();
      expect(result.lower).toBeLessThan(result.upper);
      expect(result.lower).toBeGreaterThanOrEqual(0);
      expect(result.upper).toBeLessThanOrEqual(100);
    });

    it('should return zero interval for no visitors', () => {
      const result = abTestEngine.calculateConfidenceInterval(0, 0, 0.95);

      expect(result.lower).toBe(0);
      expect(result.upper).toBe(0);
    });

    it('should handle edge cases correctly', () => {
      // 100% conversion rate
      const result1 = abTestEngine.calculateConfidenceInterval(100, 100, 0.95);
      expect(result1.upper).toBeLessThanOrEqual(100);

      // 0% conversion rate
      const result2 = abTestEngine.calculateConfidenceInterval(0, 100, 0.95);
      expect(result2.lower).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getExperimentResults', () => {
    const mockExperimentWithVariants = {
      id: 'exp-1',
      name: 'Test Experiment',
      confidenceLevel: 0.95,
      variants: [
        {
          id: 'control',
          name: 'Control',
          isControl: true,
          visitors: 1000,
          conversions: 50,
          trafficPercentage: 50,
        },
        {
          id: 'test',
          name: 'Test',
          isControl: false,
          visitors: 1000,
          conversions: 65,
          trafficPercentage: 50,
        },
      ],
    };

    it('should return experiment results with statistical analysis', async () => {
      mockPrisma.experiment.findUnique.mockResolvedValue(mockExperimentWithVariants as any);

      const results = await abTestEngine.getExperimentResults('exp-1');

      expect(results).toBeDefined();
      expect(results?.experiment).toBeDefined();
      expect(results?.results).toHaveLength(2);
      expect(results?.overallConversionRate).toBeDefined();
      expect(results?.recommendations).toBeDefined();
    });

    it('should identify the winning variant', async () => {
      mockPrisma.experiment.findUnique.mockResolvedValue(mockExperimentWithVariants as any);

      const results = await abTestEngine.getExperimentResults('exp-1');

      expect(results?.winner).toBeDefined();
      expect(results?.winner?.variant.name).toBe('Test');
    });

    it('should generate appropriate recommendations', async () => {
      mockPrisma.experiment.findUnique.mockResolvedValue(mockExperimentWithVariants as any);

      const results = await abTestEngine.getExperimentResults('exp-1');

      expect(results?.recommendations).toBeDefined();
      expect(Array.isArray(results?.recommendations)).toBe(true);
      expect(results?.recommendations.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent experiment', async () => {
      mockPrisma.experiment.findUnique.mockResolvedValue(null);

      const results = await abTestEngine.getExperimentResults('non-existent');

      expect(results).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully in allocateVariant', async () => {
      mockRedisService.getJson.mockResolvedValue(null);
      mockPrisma.experiment.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await abTestEngine.allocateVariant('exp-1', 'user-123');

      expect(result).toBeNull();
    });

    it('should handle redis errors gracefully', async () => {
      mockRedisService.getJson.mockRejectedValue(new Error('Redis error'));
      mockPrisma.experiment.findUnique.mockResolvedValue({
        id: 'exp-1',
        status: 'RUNNING',
        variants: [],
      } as any);

      const result = await abTestEngine.allocateVariant('exp-1', 'user-123');

      expect(result).toBeNull();
    });

    it('should handle conversion recording errors gracefully', async () => {
      mockPrisma.variant.update.mockRejectedValue(new Error('Database error'));

      // Should not throw an error
      await expect(
        abTestEngine.recordConversion('exp-1', 'variant-1', 'user-123')
      ).resolves.not.toThrow();
    });
  });

  describe('Consistent hashing', () => {
    it('should provide consistent variant allocation for same user', async () => {
      const mockExperiment = {
        id: 'exp-1',
        status: 'RUNNING',
        variants: [
          { id: 'v1', trafficPercentage: 50 },
          { id: 'v2', trafficPercentage: 50 },
        ],
      };

      mockRedisService.getJson.mockResolvedValue(null);
      mockPrisma.experiment.findUnique.mockResolvedValue(mockExperiment as any);
      mockRedisService.setJson.mockResolvedValue(undefined);
      mockPrisma.variant.update.mockResolvedValue({} as any);

      const userId = 'consistent-user';
      const results = [];

      // Test multiple allocations for the same user
      for (let i = 0; i < 5; i++) {
        const result = await abTestEngine.allocateVariant('exp-1', userId);
        results.push(result?.variantId);
      }

      // All allocations should be the same
      const uniqueVariants = new Set(results);
      expect(uniqueVariants.size).toBe(1);
    });

    it('should distribute users across variants', async () => {
      const mockExperiment = {
        id: 'exp-1',
        status: 'RUNNING',
        variants: [
          { id: 'v1', trafficPercentage: 50 },
          { id: 'v2', trafficPercentage: 50 },
        ],
      };

      mockRedisService.getJson.mockResolvedValue(null);
      mockPrisma.experiment.findUnique.mockResolvedValue(mockExperiment as any);
      mockRedisService.setJson.mockResolvedValue(undefined);
      mockPrisma.variant.update.mockResolvedValue({} as any);

      const allocations = new Map();

      // Test allocations for 100 different users
      for (let i = 0; i < 100; i++) {
        const result = await abTestEngine.allocateVariant('exp-1', `user-${i}`);
        const variantId = result?.variantId;
        allocations.set(variantId, (allocations.get(variantId) || 0) + 1);
      }

      // Both variants should have users allocated
      expect(allocations.size).toBe(2);
      expect(allocations.get('v1')).toBeGreaterThan(0);
      expect(allocations.get('v2')).toBeGreaterThan(0);
    });
  });
});