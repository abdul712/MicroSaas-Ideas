import { logger } from '../utils/logger';

export interface StatisticalTestResult {
  significance: number;
  confidence: number;
  pValue: number;
  zScore: number;
  effectSize: number;
  power: number;
  sampleSize: number;
  isSignificant: boolean;
  winningVariation?: string;
  liftPercentage: number;
  confidenceInterval: [number, number];
}

export interface VariationData {
  id: string;
  name: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
}

export interface BayesianResult {
  probability: number;
  expectedLoss: number;
  credibleInterval: [number, number];
  posteriorMean: number;
  posteriorStd: number;
}

export class StatisticalEngine {
  // Frequentist A/B Test Analysis
  static analyzeFrequentistTest(
    control: VariationData,
    treatment: VariationData,
    alpha: number = 0.05
  ): StatisticalTestResult {
    const controlRate = control.conversions / control.visitors;
    const treatmentRate = treatment.conversions / treatment.visitors;
    
    // Calculate pooled proportion
    const pooledProportion = 
      (control.conversions + treatment.conversions) / 
      (control.visitors + treatment.visitors);
    
    // Calculate standard error
    const standardError = Math.sqrt(
      pooledProportion * (1 - pooledProportion) * 
      (1 / control.visitors + 1 / treatment.visitors)
    );
    
    // Calculate z-score
    const zScore = (treatmentRate - controlRate) / standardError;
    
    // Calculate p-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    // Calculate effect size (Cohen's h)
    const effectSize = 2 * (Math.asin(Math.sqrt(treatmentRate)) - Math.asin(Math.sqrt(controlRate)));
    
    // Calculate statistical power
    const power = this.calculatePower(control.visitors, treatment.visitors, effectSize, alpha);
    
    // Calculate lift percentage
    const liftPercentage = ((treatmentRate - controlRate) / controlRate) * 100;
    
    // Calculate confidence interval for the difference
    const criticalValue = this.normalInverse(1 - alpha / 2);
    const marginOfError = criticalValue * standardError;
    const confidenceInterval: [number, number] = [
      (treatmentRate - controlRate) - marginOfError,
      (treatmentRate - controlRate) + marginOfError
    ];
    
    const isSignificant = pValue < alpha;
    const confidence = (1 - alpha) * 100;
    
    return {
      significance: (1 - pValue) * 100,
      confidence,
      pValue,
      zScore,
      effectSize,
      power,
      sampleSize: control.visitors + treatment.visitors,
      isSignificant,
      winningVariation: isSignificant ? 
        (treatmentRate > controlRate ? treatment.id : control.id) : undefined,
      liftPercentage,
      confidenceInterval
    };
  }

  // Bayesian A/B Test Analysis
  static analyzeBayesianTest(
    control: VariationData,
    treatment: VariationData,
    priorAlpha: number = 1,
    priorBeta: number = 1
  ): { control: BayesianResult; treatment: BayesianResult; probability: number } {
    // Update posterior parameters
    const controlPosteriorAlpha = priorAlpha + control.conversions;
    const controlPosteriorBeta = priorBeta + control.visitors - control.conversions;
    
    const treatmentPosteriorAlpha = priorAlpha + treatment.conversions;
    const treatmentPosteriorBeta = priorBeta + treatment.visitors - treatment.conversions;
    
    // Calculate posterior means and standard deviations
    const controlMean = controlPosteriorAlpha / (controlPosteriorAlpha + controlPosteriorBeta);
    const controlVariance = (controlPosteriorAlpha * controlPosteriorBeta) / 
      (Math.pow(controlPosteriorAlpha + controlPosteriorBeta, 2) * 
       (controlPosteriorAlpha + controlPosteriorBeta + 1));
    const controlStd = Math.sqrt(controlVariance);
    
    const treatmentMean = treatmentPosteriorAlpha / (treatmentPosteriorAlpha + treatmentPosteriorBeta);
    const treatmentVariance = (treatmentPosteriorAlpha * treatmentPosteriorBeta) / 
      (Math.pow(treatmentPosteriorAlpha + treatmentPosteriorBeta, 2) * 
       (treatmentPosteriorAlpha + treatmentPosteriorBeta + 1));
    const treatmentStd = Math.sqrt(treatmentVariance);
    
    // Calculate credible intervals (95%)
    const controlCredibleInterval = this.betaCredibleInterval(
      controlPosteriorAlpha, controlPosteriorBeta, 0.95
    );
    const treatmentCredibleInterval = this.betaCredibleInterval(
      treatmentPosteriorAlpha, treatmentPosteriorBeta, 0.95
    );
    
    // Probability that treatment is better than control
    const probability = this.probabilityTreatmentBetter(
      controlPosteriorAlpha, controlPosteriorBeta,
      treatmentPosteriorAlpha, treatmentPosteriorBeta
    );
    
    // Expected loss calculations
    const controlExpectedLoss = this.calculateExpectedLoss(
      controlPosteriorAlpha, controlPosteriorBeta,
      treatmentPosteriorAlpha, treatmentPosteriorBeta
    );
    const treatmentExpectedLoss = this.calculateExpectedLoss(
      treatmentPosteriorAlpha, treatmentPosteriorBeta,
      controlPosteriorAlpha, controlPosteriorBeta
    );
    
    return {
      control: {
        probability: 1 - probability,
        expectedLoss: controlExpectedLoss,
        credibleInterval: controlCredibleInterval,
        posteriorMean: controlMean,
        posteriorStd: controlStd
      },
      treatment: {
        probability,
        expectedLoss: treatmentExpectedLoss,
        credibleInterval: treatmentCredibleInterval,
        posteriorMean: treatmentMean,
        posteriorStd: treatmentStd
      },
      probability
    };
  }

  // Sequential Testing with Alpha Spending Function
  static analyzeSequentialTest(
    control: VariationData,
    treatment: VariationData,
    maxSampleSize: number,
    alpha: number = 0.05,
    power: number = 0.8
  ): { shouldStop: boolean; result?: StatisticalTestResult; nextSampleSize?: number } {
    const currentSampleSize = control.visitors + treatment.visitors;
    const progress = currentSampleSize / maxSampleSize;
    
    // O'Brien-Fleming alpha spending function
    const alphaSpent = 2 * (1 - this.normalCDF(this.normalInverse(1 - alpha / 2) / Math.sqrt(progress)));
    
    const result = this.analyzeFrequentistTest(control, treatment, alphaSpent);
    
    if (result.isSignificant || progress >= 1) {
      return { shouldStop: true, result };
    }
    
    // Calculate recommended next sample size (interim analysis)
    const nextProgress = Math.min(progress + 0.1, 1); // 10% increments
    const nextSampleSize = Math.floor(maxSampleSize * nextProgress);
    
    return { shouldStop: false, nextSampleSize };
  }

  // Multi-Armed Bandit Analysis
  static analyzeMultiArmedBandit(
    variations: VariationData[],
    algorithm: 'epsilon-greedy' | 'thompson-sampling' | 'ucb' = 'thompson-sampling'
  ): { allocation: Record<string, number>; recommendation: string } {
    switch (algorithm) {
      case 'thompson-sampling':
        return this.thompsonSampling(variations);
      case 'epsilon-greedy':
        return this.epsilonGreedy(variations);
      case 'ucb':
        return this.upperConfidenceBound(variations);
      default:
        return this.thompsonSampling(variations);
    }
  }

  // Sample Size Calculator
  static calculateSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    alpha: number = 0.05,
    power: number = 0.8
  ): number {
    const zAlpha = this.normalInverse(1 - alpha / 2);
    const zBeta = this.normalInverse(power);
    
    const p1 = baselineRate;
    const p2 = baselineRate * (1 + minimumDetectableEffect);
    
    const numerator = Math.pow(zAlpha + zBeta, 2) * (p1 * (1 - p1) + p2 * (1 - p2));
    const denominator = Math.pow(p2 - p1, 2);
    
    return Math.ceil(numerator / denominator);
  }

  // Helper methods
  private static normalCDF(x: number): number {
    // Approximation of standard normal CDF
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1 + sign * y);
  }

  private static normalInverse(p: number): number {
    // Approximation of inverse normal CDF
    if (p === 0.5) return 0;
    
    const c = [2.515517, 0.802853, 0.010328];
    const d = [1.432788, 0.189269, 0.001308];
    
    let x: number;
    if (p > 0.5) {
      x = Math.sqrt(-2 * Math.log(1 - p));
    } else {
      x = Math.sqrt(-2 * Math.log(p));
    }
    
    const numerator = c[0] + c[1] * x + c[2] * x * x;
    const denominator = 1 + d[0] * x + d[1] * x * x + d[2] * x * x * x;
    
    const result = x - numerator / denominator;
    return p > 0.5 ? result : -result;
  }

  private static calculatePower(
    n1: number,
    n2: number,
    effectSize: number,
    alpha: number
  ): number {
    const criticalValue = this.normalInverse(1 - alpha / 2);
    const standardError = Math.sqrt(1 / n1 + 1 / n2);
    const delta = effectSize / standardError;
    
    return 1 - this.normalCDF(criticalValue - delta) + this.normalCDF(-criticalValue - delta);
  }

  private static betaCredibleInterval(
    alpha: number,
    beta: number,
    confidence: number
  ): [number, number] {
    const lower = (1 - confidence) / 2;
    const upper = 1 - lower;
    
    return [
      this.betaInverse(lower, alpha, beta),
      this.betaInverse(upper, alpha, beta)
    ];
  }

  private static betaInverse(p: number, alpha: number, beta: number): number {
    // Approximation of inverse beta CDF
    // Using Newton-Raphson method
    let x = alpha / (alpha + beta); // Initial guess
    
    for (let i = 0; i < 10; i++) {
      const fx = this.incompleteBeta(x, alpha, beta) - p;
      const dfx = this.betaPDF(x, alpha, beta);
      
      if (Math.abs(fx) < 1e-10) break;
      
      x = x - fx / dfx;
      x = Math.max(0.0001, Math.min(0.9999, x)); // Keep in bounds
    }
    
    return x;
  }

  private static incompleteBeta(x: number, a: number, b: number): number {
    // Approximation of incomplete beta function
    if (x === 0) return 0;
    if (x === 1) return 1;
    
    return this.betaIncomplete(x, a, b) / this.betaFunction(a, b);
  }

  private static betaIncomplete(x: number, a: number, b: number): number {
    // Continued fraction approximation
    const EPSILON = 1e-15;
    const MAXIT = 100;
    
    const lnBeta = this.logGamma(a) + this.logGamma(b) - this.logGamma(a + b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;
    
    let f = 1, c = 1, d = 0;
    
    for (let i = 0; i <= MAXIT; i++) {
      const m = i / 2;
      let numerator: number;
      
      if (i === 0) {
        numerator = 1;
      } else if (i % 2 === 0) {
        numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
      } else {
        numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
      }
      
      d = 1 + numerator * d;
      if (Math.abs(d) < EPSILON) d = EPSILON;
      d = 1 / d;
      
      c = 1 + numerator / c;
      if (Math.abs(c) < EPSILON) c = EPSILON;
      
      const cd = c * d;
      f *= cd;
      
      if (Math.abs(cd - 1) < EPSILON) break;
    }
    
    return front * f;
  }

  private static betaFunction(a: number, b: number): number {
    return Math.exp(this.logGamma(a) + this.logGamma(b) - this.logGamma(a + b));
  }

  private static betaPDF(x: number, alpha: number, beta: number): number {
    if (x <= 0 || x >= 1) return 0;
    return Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1) / this.betaFunction(alpha, beta);
  }

  private static logGamma(x: number): number {
    // Lanczos approximation
    const g = 7;
    const c = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    
    if (x < 0.5) {
      return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * x)) - this.logGamma(1 - x);
    }
    
    x -= 1;
    let a = c[0];
    for (let i = 1; i < g + 2; i++) {
      a += c[i] / (x + i);
    }
    
    const t = x + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  private static probabilityTreatmentBetter(
    controlAlpha: number,
    controlBeta: number,
    treatmentAlpha: number,
    treatmentBeta: number
  ): number {
    // Monte Carlo simulation
    const samples = 10000;
    let wins = 0;
    
    for (let i = 0; i < samples; i++) {
      const controlSample = this.betaRandom(controlAlpha, controlBeta);
      const treatmentSample = this.betaRandom(treatmentAlpha, treatmentBeta);
      
      if (treatmentSample > controlSample) {
        wins++;
      }
    }
    
    return wins / samples;
  }

  private static betaRandom(alpha: number, beta: number): number {
    const gamma1 = this.gammaRandom(alpha, 1);
    const gamma2 = this.gammaRandom(beta, 1);
    return gamma1 / (gamma1 + gamma2);
  }

  private static gammaRandom(shape: number, rate: number): number {
    // Marsaglia and Tsang method
    if (shape < 1) {
      return this.gammaRandom(shape + 1, rate) * Math.pow(Math.random(), 1 / shape);
    }
    
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      let x: number;
      let v: number;
      
      do {
        x = this.normalRandom(0, 1);
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      const u = Math.random();
      
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v / rate;
      }
      
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v / rate;
      }
    }
  }

  private static normalRandom(mean: number, std: number): number {
    // Box-Muller transform
    const u = 0.00001 + Math.random() * 0.99998; // Avoid 0 and 1
    const v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return z * std + mean;
  }

  private static calculateExpectedLoss(
    alpha1: number,
    beta1: number,
    alpha2: number,
    beta2: number
  ): number {
    // Monte Carlo simulation for expected loss
    const samples = 10000;
    let totalLoss = 0;
    
    for (let i = 0; i < samples; i++) {
      const rate1 = this.betaRandom(alpha1, beta1);
      const rate2 = this.betaRandom(alpha2, beta2);
      
      if (rate2 > rate1) {
        totalLoss += rate2 - rate1;
      }
    }
    
    return totalLoss / samples;
  }

  private static thompsonSampling(variations: VariationData[]): { allocation: Record<string, number>; recommendation: string } {
    const samples = 1000;
    const wins: Record<string, number> = {};
    
    variations.forEach(v => wins[v.id] = 0);
    
    for (let i = 0; i < samples; i++) {
      let bestId = '';
      let bestRate = -1;
      
      for (const variation of variations) {
        const alpha = variation.conversions + 1;
        const beta = variation.visitors - variation.conversions + 1;
        const sample = this.betaRandom(alpha, beta);
        
        if (sample > bestRate) {
          bestRate = sample;
          bestId = variation.id;
        }
      }
      
      wins[bestId]++;
    }
    
    const allocation: Record<string, number> = {};
    let recommendation = '';
    let maxWins = 0;
    
    for (const [id, winCount] of Object.entries(wins)) {
      allocation[id] = winCount / samples;
      if (winCount > maxWins) {
        maxWins = winCount;
        recommendation = id;
      }
    }
    
    return { allocation, recommendation };
  }

  private static epsilonGreedy(variations: VariationData[], epsilon: number = 0.1): { allocation: Record<string, number>; recommendation: string } {
    let bestId = '';
    let bestRate = -1;
    
    for (const variation of variations) {
      if (variation.conversionRate > bestRate) {
        bestRate = variation.conversionRate;
        bestId = variation.id;
      }
    }
    
    const allocation: Record<string, number> = {};
    const numVariations = variations.length;
    const exploitProbability = 1 - epsilon;
    const exploreProbability = epsilon / numVariations;
    
    for (const variation of variations) {
      if (variation.id === bestId) {
        allocation[variation.id] = exploitProbability + exploreProbability;
      } else {
        allocation[variation.id] = exploreProbability;
      }
    }
    
    return { allocation, recommendation: bestId };
  }

  private static upperConfidenceBound(variations: VariationData[]): { allocation: Record<string, number>; recommendation: string } {
    const totalVisitors = variations.reduce((sum, v) => sum + v.visitors, 0);
    
    let bestId = '';
    let bestUCB = -1;
    
    for (const variation of variations) {
      const ucb = variation.conversionRate + 
        Math.sqrt((2 * Math.log(totalVisitors)) / variation.visitors);
      
      if (ucb > bestUCB) {
        bestUCB = ucb;
        bestId = variation.id;
      }
    }
    
    // For UCB, we allocate all traffic to the best arm
    const allocation: Record<string, number> = {};
    for (const variation of variations) {
      allocation[variation.id] = variation.id === bestId ? 1 : 0;
    }
    
    return { allocation, recommendation: bestId };
  }
}

export default StatisticalEngine;