import StatisticalEngine from '../statistics'

describe('StatisticalEngine', () => {
  describe('calculateTestStatistics', () => {
    it('should calculate basic A/B test statistics correctly', () => {
      const result = StatisticalEngine.calculateTestStatistics(
        100, // control conversions
        1000, // control visitors
        150, // variation conversions
        1000, // variation visitors
        95 // confidence level
      )

      expect(result.control.conversionRate).toBe(10)
      expect(result.variation.conversionRate).toBe(15)
      expect(result.comparison.lift).toBe(50)
      expect(result.comparison.significance).toBeGreaterThan(95)
      expect(result.comparison.isSignificant).toBe(true)
    })

    it('should handle edge cases with zero conversions', () => {
      const result = StatisticalEngine.calculateTestStatistics(
        0, // control conversions
        1000, // control visitors
        0, // variation conversions
        1000, // variation visitors
        95
      )

      expect(result.control.conversionRate).toBe(0)
      expect(result.variation.conversionRate).toBe(0)
      expect(result.comparison.lift).toBe(0)
      expect(result.comparison.isSignificant).toBe(false)
    })

    it('should calculate confidence intervals correctly', () => {
      const result = StatisticalEngine.calculateTestStatistics(
        100,
        1000,
        150,
        1000,
        95
      )

      expect(result.comparison.confidenceInterval).toHaveLength(2)
      expect(result.comparison.confidenceInterval[0]).toBeLessThan(
        result.comparison.confidenceInterval[1]
      )
    })
  })

  describe('calculateBayesianStatistics', () => {
    it('should calculate Bayesian probability correctly', () => {
      const result = StatisticalEngine.calculateBayesianStatistics(
        100, // control conversions
        1000, // control visitors
        150, // variation conversions
        1000 // variation visitors
      )

      expect(result.control.probability).toBeGreaterThan(0)
      expect(result.variation.probability).toBeGreaterThan(0)
      expect(result.control.probability + result.variation.probability).toBeCloseTo(1, 1)
      expect(result.variation.probability).toBeGreaterThan(result.control.probability)
    })

    it('should determine winner correctly', () => {
      const result = StatisticalEngine.calculateBayesianStatistics(
        50, // control conversions
        1000, // control visitors
        200, // variation conversions (much higher)
        1000 // variation visitors
      )

      expect(result.variation.isWinner).toBe(true)
      expect(result.control.isWinner).toBe(false)
    })
  })

  describe('calculateRequiredSampleSize', () => {
    it('should calculate reasonable sample sizes', () => {
      const sampleSize = StatisticalEngine.calculateRequiredSampleSize(
        0.05, // 5% baseline conversion rate
        20, // 20% minimum detectable effect
        0.8, // 80% power
        0.05 // 5% alpha
      )

      expect(sampleSize).toBeGreaterThan(0)
      expect(sampleSize).toBeLessThan(100000) // Reasonable upper bound
    })

    it('should require larger samples for smaller effects', () => {
      const smallEffect = StatisticalEngine.calculateRequiredSampleSize(
        0.05,
        10, // 10% effect
        0.8,
        0.05
      )

      const largeEffect = StatisticalEngine.calculateRequiredSampleSize(
        0.05,
        50, // 50% effect
        0.8,
        0.05
      )

      expect(smallEffect).toBeGreaterThan(largeEffect)
    })
  })

  describe('calculateSequentialBounds', () => {
    it('should calculate sequential testing bounds', () => {
      const bounds = StatisticalEngine.calculateSequentialBounds(
        10000, // max sample size
        5000, // current sample size
        0.05 // alpha
      )

      expect(bounds.upperBound).toBeGreaterThan(0)
      expect(bounds.lowerBound).toBeLessThan(0)
      expect(bounds.canStop).toBe(true) // 50% of planned sample
    })

    it('should not allow early stopping with insufficient data', () => {
      const bounds = StatisticalEngine.calculateSequentialBounds(
        10000,
        1000, // Only 10% of planned sample
        0.05
      )

      expect(bounds.canStop).toBe(false)
    })
  })

  describe('optimizeTestDuration', () => {
    it('should calculate test duration correctly', () => {
      const optimization = StatisticalEngine.optimizeTestDuration(
        1000, // daily visitors
        0.05, // baseline conversion rate
        20, // minimum detectable effect
        0.8, // power
        0.05 // alpha
      )

      expect(optimization.sampleSizePerVariation).toBeGreaterThan(0)
      expect(optimization.estimatedDays).toBeGreaterThan(0)
      expect(optimization.recommendedDuration).toBeGreaterThanOrEqual(7) // At least 1 week
    })

    it('should recommend longer duration for low traffic', () => {
      const lowTraffic = StatisticalEngine.optimizeTestDuration(
        100, // low daily visitors
        0.05,
        20,
        0.8,
        0.05
      )

      const highTraffic = StatisticalEngine.optimizeTestDuration(
        10000, // high daily visitors
        0.05,
        20,
        0.8,
        0.05
      )

      expect(lowTraffic.estimatedDays).toBeGreaterThan(highTraffic.estimatedDays)
    })
  })
})