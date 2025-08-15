import { StatisticalEngine, VariationData } from '../services/statisticalEngine';

describe('StatisticalEngine', () => {
  const controlVariation: VariationData = {
    id: 'control',
    name: 'Control',
    visitors: 1000,
    conversions: 50,
    conversionRate: 0.05
  };

  const treatmentVariation: VariationData = {
    id: 'treatment',
    name: 'Treatment',
    visitors: 1000,
    conversions: 65,
    conversionRate: 0.065
  };

  describe('analyzeFrequentistTest', () => {
    it('should calculate statistical significance correctly', () => {
      const result = StatisticalEngine.analyzeFrequentistTest(
        controlVariation,
        treatmentVariation
      );

      expect(result).toBeDefined();
      expect(result.pValue).toBeLessThan(1);
      expect(result.pValue).toBeGreaterThan(0);
      expect(result.zScore).toBeDefined();
      expect(result.effectSize).toBeDefined();
      expect(result.liftPercentage).toBeCloseTo(30, 0); // 65/50 - 1 = 30%
      expect(result.confidenceInterval).toHaveLength(2);
    });

    it('should detect significant results', () => {
      // Create a test case with high significance
      const highConversionTreatment: VariationData = {
        id: 'treatment',
        name: 'Treatment',
        visitors: 1000,
        conversions: 100,
        conversionRate: 0.1
      };

      const result = StatisticalEngine.analyzeFrequentistTest(
        controlVariation,
        highConversionTreatment
      );

      expect(result.isSignificant).toBe(true);
      expect(result.pValue).toBeLessThan(0.05);
      expect(result.winningVariation).toBe('treatment');
    });

    it('should not detect significance with insufficient data', () => {
      const smallSampleControl: VariationData = {
        id: 'control',
        name: 'Control',
        visitors: 10,
        conversions: 1,
        conversionRate: 0.1
      };

      const smallSampleTreatment: VariationData = {
        id: 'treatment',
        name: 'Treatment',
        visitors: 10,
        conversions: 2,
        conversionRate: 0.2
      };

      const result = StatisticalEngine.analyzeFrequentistTest(
        smallSampleControl,
        smallSampleTreatment
      );

      expect(result.isSignificant).toBe(false);
      expect(result.pValue).toBeGreaterThan(0.05);
    });

    it('should handle edge cases', () => {
      const zeroConversionsControl: VariationData = {
        id: 'control',
        name: 'Control',
        visitors: 100,
        conversions: 0,
        conversionRate: 0
      };

      const result = StatisticalEngine.analyzeFrequentistTest(
        zeroConversionsControl,
        treatmentVariation
      );

      expect(result).toBeDefined();
      expect(result.pValue).toBeDefined();
      expect(isNaN(result.pValue)).toBe(false);
    });
  });

  describe('analyzeBayesianTest', () => {
    it('should calculate Bayesian probabilities correctly', () => {
      const result = StatisticalEngine.analyzeBayesianTest(
        controlVariation,
        treatmentVariation
      );

      expect(result).toBeDefined();
      expect(result.control.probability).toBeLessThan(1);
      expect(result.control.probability).toBeGreaterThan(0);
      expect(result.treatment.probability).toBeLessThan(1);
      expect(result.treatment.probability).toBeGreaterThan(0);
      expect(Math.abs(result.control.probability + result.treatment.probability - 1)).toBeLessThan(0.01);
      
      expect(result.control.credibleInterval).toHaveLength(2);
      expect(result.treatment.credibleInterval).toHaveLength(2);
      expect(result.control.posteriorMean).toBeGreaterThan(0);
      expect(result.treatment.posteriorMean).toBeGreaterThan(0);
    });

    it('should favor treatment when it has higher conversion rate', () => {
      const result = StatisticalEngine.analyzeBayesianTest(
        controlVariation,
        treatmentVariation
      );

      expect(result.treatment.probability).toBeGreaterThan(result.control.probability);
      expect(result.treatment.probability).toBeGreaterThan(0.5);
    });

    it('should handle custom priors', () => {
      const result = StatisticalEngine.analyzeBayesianTest(
        controlVariation,
        treatmentVariation,
        10, // strong prior alpha
        90  // strong prior beta (low conversion rate prior)
      );

      expect(result).toBeDefined();
      expect(result.control.posteriorMean).toBeDefined();
      expect(result.treatment.posteriorMean).toBeDefined();
    });
  });

  describe('analyzeSequentialTest', () => {
    it('should recommend stopping when significance is reached', () => {
      const highSignificanceTreatment: VariationData = {
        id: 'treatment',
        name: 'Treatment',
        visitors: 1000,
        conversions: 120,
        conversionRate: 0.12
      };

      const result = StatisticalEngine.analyzeSequentialTest(
        controlVariation,
        highSignificanceTreatment,
        2000 // max sample size
      );

      expect(result.shouldStop).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.isSignificant).toBe(true);
    });

    it('should continue testing when not significant', () => {
      const slightlyBetterTreatment: VariationData = {
        id: 'treatment',
        name: 'Treatment',
        visitors: 100,
        conversions: 6,
        conversionRate: 0.06
      };

      const result = StatisticalEngine.analyzeSequentialTest(
        { ...controlVariation, visitors: 100, conversions: 5 },
        slightlyBetterTreatment,
        2000
      );

      expect(result.shouldStop).toBe(false);
      expect(result.nextSampleSize).toBeDefined();
      expect(result.nextSampleSize).toBeGreaterThan(200);
    });
  });

  describe('analyzeMultiArmedBandit', () => {
    const variations: VariationData[] = [
      controlVariation,
      treatmentVariation,
      {
        id: 'variation2',
        name: 'Variation 2',
        visitors: 1000,
        conversions: 45,
        conversionRate: 0.045
      }
    ];

    it('should work with Thompson Sampling', () => {
      const result = StatisticalEngine.analyzeMultiArmedBandit(
        variations,
        'thompson-sampling'
      );

      expect(result).toBeDefined();
      expect(result.allocation).toBeDefined();
      expect(result.recommendation).toBeDefined();
      
      // Check that allocations sum to 1
      const totalAllocation = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(Math.abs(totalAllocation - 1)).toBeLessThan(0.01);
      
      // Best performing variation should get highest allocation
      expect(result.recommendation).toBe('treatment');
    });

    it('should work with Epsilon Greedy', () => {
      const result = StatisticalEngine.analyzeMultiArmedBandit(
        variations,
        'epsilon-greedy'
      );

      expect(result).toBeDefined();
      expect(result.allocation).toBeDefined();
      expect(result.recommendation).toBe('treatment');
      
      // Best variation should get most allocation in epsilon-greedy
      expect(result.allocation['treatment']).toBeGreaterThan(result.allocation['control']);
    });

    it('should work with UCB', () => {
      const result = StatisticalEngine.analyzeMultiArmedBandit(
        variations,
        'ucb'
      );

      expect(result).toBeDefined();
      expect(result.allocation).toBeDefined();
      expect(result.recommendation).toBeDefined();
    });
  });

  describe('calculateSampleSize', () => {
    it('should calculate reasonable sample sizes', () => {
      const sampleSize = StatisticalEngine.calculateSampleSize(
        0.05,  // 5% baseline rate
        0.20,  // 20% minimum detectable effect
        0.05,  // 5% alpha
        0.8    // 80% power
      );

      expect(sampleSize).toBeGreaterThan(0);
      expect(sampleSize).toBeLessThan(100000); // Should be reasonable
      expect(Number.isInteger(sampleSize)).toBe(true);
    });

    it('should require larger samples for smaller effects', () => {
      const smallEffectSize = StatisticalEngine.calculateSampleSize(0.05, 0.10, 0.05, 0.8);
      const largeEffectSize = StatisticalEngine.calculateSampleSize(0.05, 0.50, 0.05, 0.8);

      expect(smallEffectSize).toBeGreaterThan(largeEffectSize);
    });

    it('should require larger samples for higher power', () => {
      const lowPower = StatisticalEngine.calculateSampleSize(0.05, 0.20, 0.05, 0.7);
      const highPower = StatisticalEngine.calculateSampleSize(0.05, 0.20, 0.05, 0.9);

      expect(highPower).toBeGreaterThan(lowPower);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero visitors gracefully', () => {
      const zeroVisitors: VariationData = {
        id: 'zero',
        name: 'Zero',
        visitors: 0,
        conversions: 0,
        conversionRate: 0
      };

      expect(() => {
        StatisticalEngine.analyzeFrequentistTest(controlVariation, zeroVisitors);
      }).not.toThrow();
    });

    it('should handle perfect conversion rates', () => {
      const perfectConversion: VariationData = {
        id: 'perfect',
        name: 'Perfect',
        visitors: 100,
        conversions: 100,
        conversionRate: 1.0
      };

      const result = StatisticalEngine.analyzeFrequentistTest(
        controlVariation,
        perfectConversion
      );

      expect(result).toBeDefined();
      expect(result.liftPercentage).toBeGreaterThan(1000); // Should be a huge lift
    });

    it('should handle very small conversion rates', () => {
      const tinyConversion: VariationData = {
        id: 'tiny',
        name: 'Tiny',
        visitors: 100000,
        conversions: 1,
        conversionRate: 0.00001
      };

      const result = StatisticalEngine.analyzeFrequentistTest(
        { ...controlVariation, visitors: 100000, conversions: 1, conversionRate: 0.00001 },
        { ...tinyConversion, conversions: 2, conversionRate: 0.00002 }
      );

      expect(result).toBeDefined();
      expect(isFinite(result.pValue)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large sample sizes efficiently', () => {
      const largeControl: VariationData = {
        id: 'control',
        name: 'Control',
        visitors: 1000000,
        conversions: 50000,
        conversionRate: 0.05
      };

      const largeTreatment: VariationData = {
        id: 'treatment',
        name: 'Treatment',
        visitors: 1000000,
        conversions: 52000,
        conversionRate: 0.052
      };

      const startTime = Date.now();
      const result = StatisticalEngine.analyzeFrequentistTest(largeControl, largeTreatment);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle many variations efficiently', () => {
      const manyVariations: VariationData[] = Array.from({ length: 10 }, (_, i) => ({
        id: `variation_${i}`,
        name: `Variation ${i}`,
        visitors: 1000,
        conversions: 45 + i,
        conversionRate: (45 + i) / 1000
      }));

      const startTime = Date.now();
      const result = StatisticalEngine.analyzeMultiArmedBandit(manyVariations, 'thompson-sampling');
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(Object.keys(result.allocation)).toHaveLength(10);
    });
  });
});