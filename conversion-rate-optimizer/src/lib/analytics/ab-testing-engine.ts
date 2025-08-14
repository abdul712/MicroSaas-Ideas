import { Experiment, Variant, Event } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { redisService } from '@/lib/redis';
import crypto from 'crypto';

export interface ExperimentAllocation {
  experimentId: string;
  variantId: string;
  variant: Variant;
  isNewAllocation: boolean;
}

export interface TestResult {
  variant: Variant;
  conversionRate: number;
  visitors: number;
  conversions: number;
  pValue?: number;
  confidenceInterval?: { lower: number; upper: number };
  isSignificant: boolean;
  lift?: number;
}

export interface ExperimentResults {
  experiment: Experiment;
  results: TestResult[];
  winner?: TestResult;
  isComplete: boolean;
  recommendations: string[];
}

export class ABTestingEngine {
  private static instance: ABTestingEngine;

  public static getInstance(): ABTestingEngine {
    if (!ABTestingEngine.instance) {
      ABTestingEngine.instance = new ABTestingEngine();
    }
    return ABTestingEngine.instance;
  }

  /**
   * Allocate a user to an experiment variant
   */
  async allocateVariant(
    experimentId: string,
    userId: string,
    userContext?: Record<string, any>
  ): Promise<ExperimentAllocation | null> {
    try {
      // Check if user is already allocated
      const cacheKey = `allocation:${experimentId}:${userId}`;
      const cachedAllocation = await redisService.getJson<ExperimentAllocation>(cacheKey);
      
      if (cachedAllocation) {
        return { ...cachedAllocation, isNewAllocation: false };
      }

      // Get experiment details
      const experiment = await prisma.experiment.findUnique({
        where: { id: experimentId },
        include: { variants: true, project: true }
      });

      if (!experiment || experiment.status !== 'RUNNING') {
        return null;
      }

      // Check if user is eligible for the experiment
      if (!this.isUserEligible(experiment, userId, userContext)) {
        return null;
      }

      // Allocate variant using consistent hashing
      const variant = this.selectVariant(experiment, userId);
      if (!variant) {
        return null;
      }

      const allocation: ExperimentAllocation = {
        experimentId,
        variantId: variant.id,
        variant,
        isNewAllocation: true
      };

      // Cache the allocation
      await redisService.setJson(cacheKey, allocation, 86400 * 30); // 30 days

      // Update variant visitor count
      await this.incrementVariantVisitors(variant.id);

      return allocation;
    } catch (error) {
      console.error('Error allocating variant:', error);
      return null;
    }
  }

  /**
   * Select variant using consistent hashing for stable allocation
   */
  private selectVariant(experiment: Experiment, userId: string): Variant | null {
    const { variants } = experiment;
    if (!variants || variants.length === 0) {
      return null;
    }

    // Create hash of userId + experimentId for consistent allocation
    const hash = crypto
      .createHash('md5')
      .update(`${userId}:${experiment.id}`)
      .digest('hex');
    
    const bucket = parseInt(hash.substring(0, 8), 16) % 10000;
    
    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.trafficPercentage * 100;
      if (bucket < cumulativeWeight) {
        return variant;
      }
    }

    return variants[0]; // Fallback to first variant
  }

  /**
   * Check if user is eligible for experiment
   */
  private isUserEligible(
    experiment: Experiment, 
    userId: string, 
    userContext?: Record<string, any>
  ): boolean {
    // Basic eligibility checks
    if (!experiment || experiment.status !== 'RUNNING') {
      return false;
    }

    // Check if experiment has ended
    if (experiment.endedAt && new Date() > experiment.endedAt) {
      return false;
    }

    // Check if experiment hasn't started
    if (experiment.startedAt && new Date() < experiment.startedAt) {
      return false;
    }

    // Additional targeting rules can be implemented here
    // e.g., geographic targeting, device type, user segments, etc.

    return true;
  }

  /**
   * Record a conversion for a variant
   */
  async recordConversion(
    experimentId: string,
    variantId: string,
    userId: string,
    conversionValue?: number
  ): Promise<void> {
    try {
      // Update variant conversion count
      await prisma.variant.update({
        where: { id: variantId },
        data: {
          conversions: { increment: 1 },
          revenue: conversionValue ? { increment: conversionValue } : undefined
        }
      });

      // Update cached conversion rate
      await this.updateVariantMetrics(variantId);

      // Check if experiment should be stopped due to significance
      await this.checkExperimentSignificance(experimentId);
    } catch (error) {
      console.error('Error recording conversion:', error);
    }
  }

  /**
   * Update variant metrics and conversion rate
   */
  private async updateVariantMetrics(variantId: string): Promise<void> {
    const variant = await prisma.variant.findUnique({
      where: { id: variantId }
    });

    if (!variant) return;

    const conversionRate = variant.visitors > 0 
      ? (variant.conversions / variant.visitors) * 100 
      : 0;

    await prisma.variant.update({
      where: { id: variantId },
      data: { conversionRate }
    });
  }

  /**
   * Increment variant visitor count
   */
  private async incrementVariantVisitors(variantId: string): Promise<void> {
    await prisma.variant.update({
      where: { id: variantId },
      data: { visitors: { increment: 1 } }
    });

    await this.updateVariantMetrics(variantId);
  }

  /**
   * Calculate statistical significance using t-test
   */
  async calculateStatisticalSignificance(
    controlVariant: Variant,
    testVariant: Variant
  ): Promise<{ pValue: number; isSignificant: boolean; lift: number }> {
    const n1 = controlVariant.visitors;
    const x1 = controlVariant.conversions;
    const p1 = n1 > 0 ? x1 / n1 : 0;

    const n2 = testVariant.visitors;
    const x2 = testVariant.conversions;
    const p2 = n2 > 0 ? x2 / n2 : 0;

    // Check if we have enough data
    if (n1 < 30 || n2 < 30) {
      return { pValue: 1, isSignificant: false, lift: 0 };
    }

    // Calculate pooled probability
    const pPooled = (x1 + x2) / (n1 + n2);
    const sePooled = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2));

    // Calculate z-score
    const zScore = Math.abs(p2 - p1) / sePooled;

    // Calculate p-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    // Calculate lift
    const lift = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;

    return {
      pValue,
      isSignificant: pValue < 0.05,
      lift
    };
  }

  /**
   * Calculate confidence interval for conversion rate
   */
  calculateConfidenceInterval(
    conversions: number,
    visitors: number,
    confidenceLevel: number = 0.95
  ): { lower: number; upper: number } {
    if (visitors === 0) {
      return { lower: 0, upper: 0 };
    }

    const p = conversions / visitors;
    const z = this.getZScore(confidenceLevel);
    const se = Math.sqrt((p * (1 - p)) / visitors);
    const margin = z * se;

    return {
      lower: Math.max(0, (p - margin) * 100),
      upper: Math.min(100, (p + margin) * 100)
    };
  }

  /**
   * Get experiment results with statistical analysis
   */
  async getExperimentResults(experimentId: string): Promise<ExperimentResults | null> {
    try {
      const experiment = await prisma.experiment.findUnique({
        where: { id: experimentId },
        include: { variants: true }
      });

      if (!experiment) return null;

      const results: TestResult[] = [];
      let controlVariant: Variant | null = null;

      // Calculate results for each variant
      for (const variant of experiment.variants) {
        const conversionRate = variant.visitors > 0 
          ? (variant.conversions / variant.visitors) * 100 
          : 0;

        const confidenceInterval = this.calculateConfidenceInterval(
          variant.conversions,
          variant.visitors,
          experiment.confidenceLevel
        );

        const result: TestResult = {
          variant,
          conversionRate,
          visitors: variant.visitors,
          conversions: variant.conversions,
          confidenceInterval,
          isSignificant: false
        };

        if (variant.isControl) {
          controlVariant = variant;
        }

        results.push(result);
      }

      // Calculate statistical significance against control
      if (controlVariant) {
        for (const result of results) {
          if (!result.variant.isControl) {
            const significance = await this.calculateStatisticalSignificance(
              controlVariant,
              result.variant
            );
            result.pValue = significance.pValue;
            result.isSignificant = significance.isSignificant;
            result.lift = significance.lift;
          }
        }
      }

      // Determine winner
      const winner = this.determineWinner(results);

      // Generate recommendations
      const recommendations = this.generateRecommendations(results, experiment);

      // Check if experiment is complete
      const isComplete = this.isExperimentComplete(experiment, results);

      return {
        experiment,
        results,
        winner,
        isComplete,
        recommendations
      };
    } catch (error) {
      console.error('Error getting experiment results:', error);
      return null;
    }
  }

  /**
   * Check if experiment has reached statistical significance
   */
  private async checkExperimentSignificance(experimentId: string): Promise<void> {
    const results = await this.getExperimentResults(experimentId);
    
    if (!results) return;

    const hasSignificantResult = results.results.some(r => r.isSignificant);
    
    if (hasSignificantResult && results.winner) {
      // Update experiment with winner
      await prisma.experiment.update({
        where: { id: experimentId },
        data: {
          isSignificant: true,
          winnerVariantId: results.winner.variant.id,
          pValue: results.winner.pValue
        }
      });

      // Mark winner variant
      await prisma.variant.update({
        where: { id: results.winner.variant.id },
        data: { isWinner: true }
      });
    }
  }

  /**
   * Determine the winning variant
   */
  private determineWinner(results: TestResult[]): TestResult | undefined {
    // Find the variant with highest conversion rate that is statistically significant
    const significantResults = results.filter(r => r.isSignificant);
    
    if (significantResults.length === 0) return undefined;

    return significantResults.reduce((winner, current) => 
      current.conversionRate > winner.conversionRate ? current : winner
    );
  }

  /**
   * Generate experiment recommendations
   */
  private generateRecommendations(
    results: TestResult[], 
    experiment: Experiment
  ): string[] {
    const recommendations: string[] = [];

    const hasSignificantResult = results.some(r => r.isSignificant);
    const totalVisitors = results.reduce((sum, r) => sum + r.visitors, 0);

    if (!hasSignificantResult) {
      if (totalVisitors < 1000) {
        recommendations.push('Continue running the experiment to gather more data for statistical significance.');
      } else {
        recommendations.push('No significant difference detected. Consider testing more dramatic changes.');
      }
    }

    if (hasSignificantResult) {
      const winner = this.determineWinner(results);
      if (winner) {
        recommendations.push(`Implement the winning variant "${winner.variant.name}" with ${winner.lift?.toFixed(1)}% improvement.`);
      }
    }

    // Sample size recommendations
    if (totalVisitors < 100) {
      recommendations.push('Experiment needs more traffic. Consider extending the test duration or increasing traffic allocation.');
    }

    return recommendations;
  }

  /**
   * Check if experiment is complete
   */
  private isExperimentComplete(experiment: Experiment, results: TestResult[]): boolean {
    // Check if manually ended
    if (experiment.status === 'COMPLETED') return true;
    
    // Check if scheduled end date passed
    if (experiment.scheduledEnd && new Date() > experiment.scheduledEnd) return true;
    
    // Check if statistical significance reached
    const hasSignificantResult = results.some(r => r.isSignificant);
    const totalVisitors = results.reduce((sum, r) => sum + r.visitors, 0);
    
    return hasSignificantResult && totalVisitors >= 1000;
  }

  /**
   * Normal cumulative distribution function
   */
  private normalCDF(x: number): number {
    return (1 + this.erf(x / Math.sqrt(2))) / 2;
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Get z-score for confidence level
   */
  private getZScore(confidenceLevel: number): number {
    const alpha = 1 - confidenceLevel;
    const zScores: { [key: number]: number } = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    return zScores[confidenceLevel] || 1.96;
  }
}

export const abTestingEngine = ABTestingEngine.getInstance();