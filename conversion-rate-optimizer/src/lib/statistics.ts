// Advanced Statistical Analysis for A/B Testing
export interface TestStatistics {
  conversionRate: number
  confidence: number
  lift: number
  significance: number
  sampleSize: number
  conversions: number
  visitors: number
  standardError: number
  pValue: number
  isSignificant: boolean
}

export interface BayesianResults {
  probability: number
  credibleInterval: [number, number]
  expectedLoss: number
  isWinner: boolean
}

export class StatisticalEngine {
  private static readonly Z_SCORE_95 = 1.96
  private static readonly Z_SCORE_99 = 2.576

  /**
   * Calculate comprehensive A/B test statistics
   */
  static calculateTestStatistics(
    controlConversions: number,
    controlVisitors: number,
    variationConversions: number,
    variationVisitors: number,
    confidenceLevel: number = 95
  ): {
    control: TestStatistics
    variation: TestStatistics
    comparison: {
      lift: number
      significance: number
      pValue: number
      isSignificant: boolean
      confidenceInterval: [number, number]
    }
  } {
    const controlRate = controlConversions / controlVisitors
    const variationRate = variationConversions / variationVisitors

    // Control statistics
    const controlStats = this.calculateVariationStatistics(
      controlConversions,
      controlVisitors,
      confidenceLevel
    )

    // Variation statistics
    const variationStats = this.calculateVariationStatistics(
      variationConversions,
      variationVisitors,
      confidenceLevel
    )

    // Comparison statistics
    const lift = this.calculateLift(controlRate, variationRate)
    const { significance, pValue, confidenceInterval } = this.calculateSignificance(
      controlConversions,
      controlVisitors,
      variationConversions,
      variationVisitors,
      confidenceLevel
    )

    return {
      control: controlStats,
      variation: variationStats,
      comparison: {
        lift,
        significance,
        pValue,
        isSignificant: significance >= confidenceLevel,
        confidenceInterval,
      },
    }
  }

  /**
   * Calculate statistics for a single variation
   */
  private static calculateVariationStatistics(
    conversions: number,
    visitors: number,
    confidenceLevel: number
  ): TestStatistics {
    const conversionRate = conversions / visitors
    const standardError = Math.sqrt((conversionRate * (1 - conversionRate)) / visitors)
    
    const zScore = confidenceLevel === 99 ? this.Z_SCORE_99 : this.Z_SCORE_95
    const marginOfError = zScore * standardError
    
    return {
      conversionRate,
      confidence: confidenceLevel,
      lift: 0, // Calculated relative to control
      significance: 0, // Calculated in comparison
      sampleSize: visitors,
      conversions,
      visitors,
      standardError,
      pValue: 0, // Calculated in comparison
      isSignificant: false,
    }
  }

  /**
   * Calculate conversion lift between variations
   */
  private static calculateLift(controlRate: number, variationRate: number): number {
    if (controlRate === 0) return 0
    return ((variationRate - controlRate) / controlRate) * 100
  }

  /**
   * Calculate statistical significance using Z-test
   */
  private static calculateSignificance(
    controlConversions: number,
    controlVisitors: number,
    variationConversions: number,
    variationVisitors: number,
    confidenceLevel: number
  ) {
    const p1 = controlConversions / controlVisitors
    const p2 = variationConversions / variationVisitors
    
    // Pooled standard error
    const pooledRate = (controlConversions + variationConversions) / (controlVisitors + variationVisitors)
    const pooledSE = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlVisitors + 1/variationVisitors))
    
    if (pooledSE === 0) {
      return {
        significance: 0,
        pValue: 1,
        confidenceInterval: [0, 0] as [number, number],
      }
    }

    // Z-score calculation
    const zScore = Math.abs(p1 - p2) / pooledSE
    
    // P-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)))
    
    // Confidence level
    const significance = (1 - pValue) * 100
    
    // Confidence interval for the difference
    const zCritical = confidenceLevel === 99 ? this.Z_SCORE_99 : this.Z_SCORE_95
    const ciMargin = zCritical * pooledSE
    const difference = p2 - p1
    const confidenceInterval: [number, number] = [
      (difference - ciMargin) * 100,
      (difference + ciMargin) * 100,
    ]

    return {
      significance,
      pValue,
      confidenceInterval,
    }
  }

  /**
   * Bayesian analysis for A/B testing
   */
  static calculateBayesianStatistics(
    controlConversions: number,
    controlVisitors: number,
    variationConversions: number,
    variationVisitors: number,
    priorAlpha: number = 1,
    priorBeta: number = 1
  ): {
    control: BayesianResults
    variation: BayesianResults
  } {
    // Beta distribution parameters (conjugate prior)
    const controlAlpha = priorAlpha + controlConversions
    const controlBeta = priorBeta + controlVisitors - controlConversions
    const variationAlpha = priorAlpha + variationConversions
    const variationBeta = priorBeta + variationVisitors - variationConversions

    // Monte Carlo simulation for probability calculation
    const simulations = 10000
    let variationWins = 0

    for (let i = 0; i < simulations; i++) {
      const controlSample = this.betaRandom(controlAlpha, controlBeta)
      const variationSample = this.betaRandom(variationAlpha, variationBeta)
      
      if (variationSample > controlSample) {
        variationWins++
      }
    }

    const probabilityVariationWins = variationWins / simulations
    const probabilityControlWins = 1 - probabilityVariationWins

    return {
      control: {
        probability: probabilityControlWins,
        credibleInterval: this.betaCredibleInterval(controlAlpha, controlBeta),
        expectedLoss: this.calculateExpectedLoss(controlAlpha, controlBeta, variationAlpha, variationBeta, false),
        isWinner: probabilityControlWins > 0.95,
      },
      variation: {
        probability: probabilityVariationWins,
        credibleInterval: this.betaCredibleInterval(variationAlpha, variationBeta),
        expectedLoss: this.calculateExpectedLoss(controlAlpha, controlBeta, variationAlpha, variationBeta, true),
        isWinner: probabilityVariationWins > 0.95,
      },
    }
  }

  /**
   * Calculate minimum required sample size
   */
  static calculateRequiredSampleSize(
    baselineConversionRate: number,
    minimumDetectableEffect: number,
    power: number = 0.8,
    alpha: number = 0.05
  ): number {
    const zAlpha = this.getZScore(1 - alpha / 2)
    const zBeta = this.getZScore(power)
    
    const p1 = baselineConversionRate
    const p2 = baselineConversionRate * (1 + minimumDetectableEffect / 100)
    
    const pooledP = (p1 + p2) / 2
    const variance1 = p1 * (1 - p1)
    const variance2 = p2 * (1 - p2)
    const pooledVariance = pooledP * (1 - pooledP)
    
    const numerator = Math.pow(
      zAlpha * Math.sqrt(2 * pooledVariance) + zBeta * Math.sqrt(variance1 + variance2),
      2
    )
    const denominator = Math.pow(p2 - p1, 2)
    
    return Math.ceil(numerator / denominator)
  }

  /**
   * Sequential testing (peek at any time)
   */
  static calculateSequentialBounds(
    maxSampleSize: number,
    currentSampleSize: number,
    alpha: number = 0.05
  ): {
    upperBound: number
    lowerBound: number
    canStop: boolean
  } {
    // O'Brien-Fleming bounds
    const information = currentSampleSize / maxSampleSize
    const zAlpha = this.getZScore(1 - alpha / 2)
    
    const bound = zAlpha / Math.sqrt(information)
    
    return {
      upperBound: bound,
      lowerBound: -bound,
      canStop: information >= 0.5, // Can make decision after 50% of planned sample
    }
  }

  /**
   * Test duration and sample size optimization
   */
  static optimizeTestDuration(
    dailyVisitors: number,
    baselineConversionRate: number,
    minimumDetectableEffect: number,
    power: number = 0.8,
    alpha: number = 0.05
  ): {
    sampleSizePerVariation: number
    estimatedDays: number
    recommendedDuration: number
  } {
    const sampleSize = this.calculateRequiredSampleSize(
      baselineConversionRate,
      minimumDetectableEffect,
      power,
      alpha
    )
    
    const estimatedDays = Math.ceil(sampleSize / dailyVisitors)
    
    // Account for weekly seasonality
    const recommendedDuration = Math.max(estimatedDays, 7)
    
    return {
      sampleSizePerVariation: sampleSize,
      estimatedDays,
      recommendedDuration,
    }
  }

  // Helper methods
  private static normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    const t = 1 / (1 + 0.2316419 * Math.abs(x))
    const d = 0.3989423 * Math.exp(-x * x / 2)
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    return x > 0 ? 1 - prob : prob
  }

  private static getZScore(probability: number): number {
    // Inverse normal CDF approximation
    const c0 = 2.515517
    const c1 = 0.802853
    const c2 = 0.010328
    const d1 = 1.432788
    const d2 = 0.189269
    const d3 = 0.001308

    const p = probability > 0.5 ? 1 - probability : probability
    const t = Math.sqrt(-2 * Math.log(p))
    
    let z = t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t)
    
    return probability > 0.5 ? z : -z
  }

  private static betaRandom(alpha: number, beta: number): number {
    // Beta distribution random sampling using Gamma distributions
    const gamma1 = this.gammaRandom(alpha)
    const gamma2 = this.gammaRandom(beta)
    return gamma1 / (gamma1 + gamma2)
  }

  private static gammaRandom(shape: number): number {
    // Simple gamma distribution sampling (for shape >= 1)
    if (shape < 1) {
      return this.gammaRandom(shape + 1) * Math.pow(Math.random(), 1 / shape)
    }
    
    const d = shape - 1 / 3
    const c = 1 / Math.sqrt(9 * d)
    
    while (true) {
      let x, v
      do {
        x = this.normalRandom()
        v = 1 + c * x
      } while (v <= 0)
      
      v = v * v * v
      const u = Math.random()
      
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v
      }
      
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v
      }
    }
  }

  private static normalRandom(): number {
    // Box-Muller transform
    const u1 = Math.random()
    const u2 = Math.random()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }

  private static betaCredibleInterval(
    alpha: number,
    beta: number,
    credibility: number = 0.95
  ): [number, number] {
    // Approximation for Beta distribution credible interval
    const mean = alpha / (alpha + beta)
    const variance = (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1))
    const std = Math.sqrt(variance)
    
    const zScore = this.getZScore((1 + credibility) / 2)
    const margin = zScore * std
    
    return [
      Math.max(0, mean - margin),
      Math.min(1, mean + margin),
    ]
  }

  private static calculateExpectedLoss(
    controlAlpha: number,
    controlBeta: number,
    variationAlpha: number,
    variationBeta: number,
    isVariation: boolean
  ): number {
    // Monte Carlo estimation of expected loss
    const simulations = 1000
    let totalLoss = 0
    
    for (let i = 0; i < simulations; i++) {
      const controlSample = this.betaRandom(controlAlpha, controlBeta)
      const variationSample = this.betaRandom(variationAlpha, variationBeta)
      
      if (isVariation) {
        // Loss if we choose variation but control is better
        totalLoss += Math.max(0, controlSample - variationSample)
      } else {
        // Loss if we choose control but variation is better
        totalLoss += Math.max(0, variationSample - controlSample)
      }
    }
    
    return totalLoss / simulations
  }
}

export default StatisticalEngine