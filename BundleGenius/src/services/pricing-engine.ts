import { prisma } from "@/lib/prisma"
import { cacheGet, cacheSet, CACHE_KEYS } from "@/lib/redis"

export interface PricingOptimizationResult {
  optimalPrice: number
  discountPercentage: number
  expectedRevenue: number
  expectedConversions: number
  confidence: number
  strategy: string
  factors: PricingFactor[]
}

export interface PricingFactor {
  name: string
  impact: number
  value: any
  weight: number
}

export interface PricingConstraints {
  minDiscount?: number
  maxDiscount?: number
  minMargin?: number
  targetConversion?: number
  competitorPrices?: number[]
  seasonalMultiplier?: number
}

/**
 * Advanced dynamic pricing optimization engine
 * Uses multiple algorithms and market data for optimal bundle pricing
 */
export class PricingOptimizationEngine {
  private storeId: string
  
  constructor(storeId: string) {
    this.storeId = storeId
  }

  /**
   * Optimize bundle pricing using ML and market analysis
   */
  async optimizeBundlePrice(
    bundleId: string,
    constraints: PricingConstraints = {}
  ): Promise<PricingOptimizationResult> {
    const cacheKey = CACHE_KEYS.PRICING_OPTIMIZATION(bundleId)
    
    // Check cache first
    const cached = await cacheGet<PricingOptimizationResult>(cacheKey)
    if (cached) {
      return cached
    }

    // Get bundle with historical performance data
    const bundle = await this.getBundleWithHistory(bundleId)
    if (!bundle) {
      throw new Error("Bundle not found")
    }

    // Calculate base price and costs
    const basePrice = bundle.items.reduce((sum, item) => 
      sum + (item.product.price * item.quantity), 0)
    const baseCost = bundle.items.reduce((sum, item) => 
      sum + ((item.product.costPrice || 0) * item.quantity), 0)

    // Run multiple pricing algorithms
    const algorithms = await Promise.all([
      this.priceElasticityOptimization(bundle, basePrice, constraints),
      this.competitorBasedPricing(bundle, basePrice, constraints),
      this.demandForecastPricing(bundle, basePrice, constraints),
      this.marginOptimizedPricing(bundle, basePrice, baseCost, constraints),
      this.conversionOptimizedPricing(bundle, basePrice, constraints)
    ])

    // Combine algorithms using ensemble method
    const optimizedResult = this.ensemblePricing(algorithms, basePrice, constraints)

    // Cache result for 1 hour
    await cacheSet(cacheKey, optimizedResult, 3600)

    // Update bundle with optimization metadata
    await prisma.bundle.update({
      where: { id: bundleId },
      data: {
        lastOptimized: new Date(),
        algorithmUsed: optimizedResult.strategy
      }
    })

    return optimizedResult
  }

  /**
   * Price elasticity optimization using historical conversion data
   */
  private async priceElasticityOptimization(
    bundle: any,
    basePrice: number,
    constraints: PricingConstraints
  ): Promise<PricingOptimizationResult> {
    const analytics = bundle.analytics || []
    
    if (analytics.length < 10) {
      // Not enough data, use default pricing
      return this.getDefaultPricing(basePrice, "elasticity_insufficient_data")
    }

    // Calculate price elasticity from historical data
    const pricePoints = this.extractPricePoints(analytics)
    const elasticity = this.calculatePriceElasticity(pricePoints)

    // Find optimal price using elasticity curve
    let optimalDiscount = 0.15 // Default 15% discount
    let maxRevenue = 0

    // Test different discount levels
    for (let discount = (constraints.minDiscount || 0.05); 
         discount <= (constraints.maxDiscount || 0.40); 
         discount += 0.01) {
      
      const price = basePrice * (1 - discount)
      const expectedDemand = this.calculateDemandAtPrice(price, basePrice, elasticity)
      const revenue = price * expectedDemand
      
      if (revenue > maxRevenue) {
        maxRevenue = revenue
        optimalDiscount = discount
      }
    }

    const optimalPrice = basePrice * (1 - optimalDiscount)
    const expectedConversions = this.calculateDemandAtPrice(optimalPrice, basePrice, elasticity)

    return {
      optimalPrice,
      discountPercentage: optimalDiscount * 100,
      expectedRevenue: maxRevenue,
      expectedConversions,
      confidence: Math.min(analytics.length / 30, 1), // More data = higher confidence
      strategy: "price_elasticity",
      factors: [
        {
          name: "Price Elasticity",
          impact: Math.abs(elasticity) * 100,
          value: elasticity,
          weight: 0.4
        },
        {
          name: "Historical Performance",
          impact: analytics.length,
          value: `${analytics.length} data points`,
          weight: 0.3
        }
      ]
    }
  }

  /**
   * Competitor-based pricing optimization
   */
  private async competitorBasedPricing(
    bundle: any,
    basePrice: number,
    constraints: PricingConstraints
  ): Promise<PricingOptimizationResult> {
    const competitorPrices = constraints.competitorPrices || []
    
    if (competitorPrices.length === 0) {
      return this.getDefaultPricing(basePrice, "competitor_no_data")
    }

    const avgCompetitorPrice = competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length
    const minCompetitorPrice = Math.min(...competitorPrices)
    const maxCompetitorPrice = Math.max(...competitorPrices)

    // Position 5-10% below average competitor price for competitive advantage
    const competitiveDiscount = Math.max(0.05, 1 - (avgCompetitorPrice * 0.95) / basePrice)
    const optimalDiscount = Math.min(competitiveDiscount, constraints.maxDiscount || 0.35)
    
    const optimalPrice = basePrice * (1 - optimalDiscount)
    
    // Estimate demand based on competitive positioning
    let demandMultiplier = 1.0
    if (optimalPrice < avgCompetitorPrice * 0.9) demandMultiplier = 1.3 // Significantly cheaper
    else if (optimalPrice < avgCompetitorPrice) demandMultiplier = 1.1 // Slightly cheaper
    else if (optimalPrice > avgCompetitorPrice * 1.1) demandMultiplier = 0.8 // More expensive

    const baseConversions = 100 // Assume base conversion estimate
    const expectedConversions = baseConversions * demandMultiplier

    return {
      optimalPrice,
      discountPercentage: optimalDiscount * 100,
      expectedRevenue: optimalPrice * expectedConversions,
      expectedConversions,
      confidence: 0.7,
      strategy: "competitor_based",
      factors: [
        {
          name: "Competitive Position",
          impact: ((avgCompetitorPrice - optimalPrice) / avgCompetitorPrice) * 100,
          value: `${competitorPrices.length} competitors`,
          weight: 0.5
        },
        {
          name: "Price Advantage",
          impact: demandMultiplier * 100 - 100,
          value: `${((avgCompetitorPrice - optimalPrice) / avgCompetitorPrice * 100).toFixed(1)}% below average`,
          weight: 0.3
        }
      ]
    }
  }

  /**
   * Demand forecasting based pricing
   */
  private async demandForecastPricing(
    bundle: any,
    basePrice: number,
    constraints: PricingConstraints
  ): Promise<PricingOptimizationResult> {
    // Get seasonal and trend data
    const seasonalMultiplier = constraints.seasonalMultiplier || this.calculateSeasonalMultiplier()
    const trendMultiplier = await this.calculateTrendMultiplier(bundle)
    
    // Base demand estimation
    const historicalConversions = bundle.analytics?.reduce((sum: number, a: any) => sum + a.purchases, 0) || 0
    const avgConversions = historicalConversions / Math.max(bundle.analytics?.length || 1, 1)
    
    // Forecast demand at different price points
    const forecastResults: Array<{price: number, demand: number, revenue: number}> = []
    
    for (let discount = 0.05; discount <= 0.35; discount += 0.05) {
      const price = basePrice * (1 - discount)
      const demandAdjustment = (1 + discount) * seasonalMultiplier * trendMultiplier
      const forecastDemand = avgConversions * demandAdjustment
      const forecastRevenue = price * forecastDemand
      
      forecastResults.push({
        price,
        demand: forecastDemand,
        revenue: forecastRevenue
      })
    }

    // Find optimal price from forecast
    const optimal = forecastResults.reduce((best, current) => 
      current.revenue > best.revenue ? current : best)

    const optimalDiscount = (basePrice - optimal.price) / basePrice

    return {
      optimalPrice: optimal.price,
      discountPercentage: optimalDiscount * 100,
      expectedRevenue: optimal.revenue,
      expectedConversions: optimal.demand,
      confidence: 0.6,
      strategy: "demand_forecast",
      factors: [
        {
          name: "Seasonal Factor",
          impact: (seasonalMultiplier - 1) * 100,
          value: seasonalMultiplier,
          weight: 0.3
        },
        {
          name: "Trend Factor", 
          impact: (trendMultiplier - 1) * 100,
          value: trendMultiplier,
          weight: 0.2
        },
        {
          name: "Historical Demand",
          impact: avgConversions,
          value: `${avgConversions.toFixed(1)} avg conversions`,
          weight: 0.3
        }
      ]
    }
  }

  /**
   * Margin-optimized pricing ensuring profitability
   */
  private async marginOptimizedPricing(
    bundle: any,
    basePrice: number,
    baseCost: number,
    constraints: PricingConstraints
  ): Promise<PricingOptimizationResult> {
    const minMargin = constraints.minMargin || 0.25 // 25% minimum margin
    const minPrice = baseCost / (1 - minMargin)
    
    // Calculate optimal discount while maintaining margin
    const maxDiscountForMargin = Math.max(0, 1 - minPrice / basePrice)
    const targetDiscount = Math.min(0.20, maxDiscountForMargin) // Target 20% or margin limit
    
    const optimalPrice = Math.max(minPrice, basePrice * (1 - targetDiscount))
    const actualDiscount = (basePrice - optimalPrice) / basePrice
    const actualMargin = (optimalPrice - baseCost) / optimalPrice
    
    // Estimate conversions based on margin attractiveness
    const marginScore = Math.min(actualMargin / 0.5, 1) // Normalize to 50% margin
    const conversionMultiplier = 0.8 + (0.4 * (1 - marginScore)) // Lower margin = higher conversions
    const expectedConversions = 100 * conversionMultiplier

    return {
      optimalPrice,
      discountPercentage: actualDiscount * 100,
      expectedRevenue: optimalPrice * expectedConversions,
      expectedConversions,
      confidence: 0.8,
      strategy: "margin_optimized",
      factors: [
        {
          name: "Profit Margin",
          impact: actualMargin * 100,
          value: `${(actualMargin * 100).toFixed(1)}%`,
          weight: 0.5
        },
        {
          name: "Margin Requirement",
          impact: minMargin * 100,
          value: `${(minMargin * 100).toFixed(1)}% minimum`,
          weight: 0.3
        },
        {
          name: "Cost Structure",
          impact: (baseCost / basePrice) * 100,
          value: `$${baseCost.toFixed(2)} cost`,
          weight: 0.2
        }
      ]
    }
  }

  /**
   * Conversion rate optimized pricing
   */
  private async conversionOptimizedPricing(
    bundle: any,
    basePrice: number,
    constraints: PricingConstraints
  ): Promise<PricingOptimizationResult> {
    const targetConversion = constraints.targetConversion || 0.05 // Target 5% conversion
    const analytics = bundle.analytics || []
    
    // Calculate current conversion rates at different price points
    const conversionData = analytics.map((a: any) => ({
      views: a.views,
      purchases: a.purchases,
      conversionRate: a.views > 0 ? a.purchases / a.views : 0,
      inferredPrice: this.inferPriceFromAnalytics(a, basePrice)
    })).filter(d => d.views > 10) // Filter low-volume data

    if (conversionData.length < 5) {
      return this.getDefaultPricing(basePrice, "conversion_insufficient_data")
    }

    // Find price point that achieves target conversion
    let optimalPrice = basePrice * 0.8 // Default 20% discount
    let bestScore = 0

    for (let discount = 0.05; discount <= 0.40; discount += 0.01) {
      const price = basePrice * (1 - discount)
      const predictedConversion = this.predictConversionAtPrice(price, conversionData)
      
      // Score based on proximity to target and absolute performance
      const targetProximity = 1 - Math.abs(predictedConversion - targetConversion) / targetConversion
      const absolutePerformance = Math.min(predictedConversion / 0.1, 1) // Cap at 10%
      const score = targetProximity * 0.6 + absolutePerformance * 0.4
      
      if (score > bestScore) {
        bestScore = score
        optimalPrice = price
      }
    }

    const optimalDiscount = (basePrice - optimalPrice) / basePrice
    const expectedConversion = this.predictConversionAtPrice(optimalPrice, conversionData)
    const expectedConversions = 1000 * expectedConversion // Assume 1000 views
    
    return {
      optimalPrice,
      discountPercentage: optimalDiscount * 100,
      expectedRevenue: optimalPrice * expectedConversions,
      expectedConversions,
      confidence: 0.7,
      strategy: "conversion_optimized",
      factors: [
        {
          name: "Target Conversion",
          impact: targetConversion * 100,
          value: `${(targetConversion * 100).toFixed(2)}%`,
          weight: 0.4
        },
        {
          name: "Predicted Conversion",
          impact: expectedConversion * 100,
          value: `${(expectedConversion * 100).toFixed(2)}%`,
          weight: 0.4
        },
        {
          name: "Historical Data Points",
          impact: conversionData.length,
          value: `${conversionData.length} periods`,
          weight: 0.2
        }
      ]
    }
  }

  /**
   * Combine multiple pricing algorithms using ensemble method
   */
  private ensemblePricing(
    algorithms: PricingOptimizationResult[],
    basePrice: number,
    constraints: PricingConstraints
  ): PricingOptimizationResult {
    // Weight algorithms by confidence and strategy type
    const weights = {
      price_elasticity: 0.25,
      competitor_based: 0.20,
      demand_forecast: 0.15,
      margin_optimized: 0.25,
      conversion_optimized: 0.15
    }

    let weightedPrice = 0
    let weightedRevenue = 0
    let weightedConversions = 0
    let totalWeight = 0
    let allFactors: PricingFactor[] = []

    algorithms.forEach(result => {
      const weight = (weights as any)[result.strategy] * result.confidence
      weightedPrice += result.optimalPrice * weight
      weightedRevenue += result.expectedRevenue * weight
      weightedConversions += result.expectedConversions * weight
      totalWeight += weight
      
      // Collect all factors
      allFactors.push(...result.factors.map(f => ({
        ...f,
        name: `${result.strategy}: ${f.name}`
      })))
    })

    const ensemblePrice = weightedPrice / totalWeight
    const ensembleRevenue = weightedRevenue / totalWeight
    const ensembleConversions = weightedConversions / totalWeight
    const ensembleDiscount = (basePrice - ensemblePrice) / basePrice

    // Calculate ensemble confidence
    const avgConfidence = algorithms.reduce((sum, a) => sum + a.confidence, 0) / algorithms.length
    const algorithmAgreement = this.calculateAlgorithmAgreement(algorithms)
    const ensembleConfidence = (avgConfidence + algorithmAgreement) / 2

    return {
      optimalPrice: ensemblePrice,
      discountPercentage: ensembleDiscount * 100,
      expectedRevenue: ensembleRevenue,
      expectedConversions: ensembleConversions,
      confidence: ensembleConfidence,
      strategy: "ensemble_optimization",
      factors: allFactors.slice(0, 10) // Top 10 factors
    }
  }

  // Helper methods

  private async getBundleWithHistory(bundleId: string) {
    return await prisma.bundle.findUnique({
      where: { id: bundleId },
      include: {
        items: {
          include: {
            product: {
              select: {
                price: true,
                costPrice: true
              }
            }
          }
        },
        analytics: {
          where: {
            date: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
            }
          },
          orderBy: { date: "desc" }
        }
      }
    })
  }

  private extractPricePoints(analytics: any[]): Array<{price: number, conversions: number}> {
    return analytics.map(a => ({
      price: this.inferPriceFromAnalytics(a, 100), // Placeholder base price
      conversions: a.views > 0 ? a.purchases / a.views : 0
    }))
  }

  private calculatePriceElasticity(pricePoints: Array<{price: number, conversions: number}>): number {
    if (pricePoints.length < 2) return -1.5 // Default elasticity
    
    // Simple linear regression to estimate elasticity
    const n = pricePoints.length
    const sumX = pricePoints.reduce((sum, p) => sum + p.price, 0)
    const sumY = pricePoints.reduce((sum, p) => sum + p.conversions, 0)
    const sumXY = pricePoints.reduce((sum, p) => sum + (p.price * p.conversions), 0)
    const sumXX = pricePoints.reduce((sum, p) => sum + (p.price * p.price), 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const avgPrice = sumX / n
    const avgConversions = sumY / n
    
    // Convert to elasticity: % change in quantity / % change in price
    return avgPrice > 0 && avgConversions > 0 ? (slope * avgPrice) / avgConversions : -1.5
  }

  private calculateDemandAtPrice(price: number, basePrice: number, elasticity: number): number {
    const priceChange = (price - basePrice) / basePrice
    const demandChange = elasticity * priceChange
    return Math.max(0, 100 * (1 + demandChange)) // Assume base demand of 100
  }

  private calculateSeasonalMultiplier(): number {
    const now = new Date()
    const month = now.getMonth()
    
    // Simple seasonal adjustments (can be enhanced with historical data)
    const seasonalFactors = {
      0: 0.9,   // January
      1: 0.85,  // February 
      2: 1.0,   // March
      3: 1.05,  // April
      4: 1.1,   // May
      5: 1.0,   // June
      6: 0.95,  // July
      7: 0.95,  // August
      8: 1.05,  // September
      9: 1.1,   // October
      10: 1.2,  // November (Black Friday)
      11: 1.3   // December (Holiday season)
    }
    
    return (seasonalFactors as any)[month] || 1.0
  }

  private async calculateTrendMultiplier(bundle: any): Promise<number> {
    const recentAnalytics = bundle.analytics?.slice(0, 7) || [] // Last 7 data points
    const olderAnalytics = bundle.analytics?.slice(7, 14) || [] // Previous 7 data points
    
    if (recentAnalytics.length === 0 || olderAnalytics.length === 0) {
      return 1.0
    }
    
    const recentAvg = recentAnalytics.reduce((sum: number, a: any) => sum + a.purchases, 0) / recentAnalytics.length
    const olderAvg = olderAnalytics.reduce((sum: number, a: any) => sum + a.purchases, 0) / olderAnalytics.length
    
    return olderAvg > 0 ? Math.max(0.5, Math.min(2.0, recentAvg / olderAvg)) : 1.0
  }

  private inferPriceFromAnalytics(analytics: any, basePrice: number): number {
    // This would typically use actual price data from the analytics
    // For now, we'll estimate based on conversion patterns
    const conversionRate = analytics.views > 0 ? analytics.purchases / analytics.views : 0
    
    // Higher conversion rates might indicate lower prices
    if (conversionRate > 0.08) return basePrice * 0.7  // High conversion = likely discounted
    if (conversionRate > 0.05) return basePrice * 0.8  // Medium conversion 
    if (conversionRate > 0.02) return basePrice * 0.9  // Low conversion
    return basePrice // Very low conversion = likely full price
  }

  private predictConversionAtPrice(price: number, conversionData: Array<{inferredPrice: number, conversionRate: number}>): number {
    if (conversionData.length === 0) return 0.03 // Default 3%
    
    // Find closest price points and interpolate
    const sortedData = conversionData.sort((a, b) => a.inferredPrice - b.inferredPrice)
    
    // Simple linear interpolation
    for (let i = 0; i < sortedData.length - 1; i++) {
      const lower = sortedData[i]
      const upper = sortedData[i + 1]
      
      if (price >= lower.inferredPrice && price <= upper.inferredPrice) {
        const ratio = (price - lower.inferredPrice) / (upper.inferredPrice - lower.inferredPrice)
        return lower.conversionRate + (upper.conversionRate - lower.conversionRate) * ratio
      }
    }
    
    // Extrapolate from closest point
    const closest = sortedData.reduce((prev, curr) => 
      Math.abs(curr.inferredPrice - price) < Math.abs(prev.inferredPrice - price) ? curr : prev)
    
    return closest.conversionRate
  }

  private calculateAlgorithmAgreement(algorithms: PricingOptimizationResult[]): number {
    const prices = algorithms.map(a => a.optimalPrice)
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = stdDev / avgPrice
    
    // Convert to agreement score (lower variation = higher agreement)
    return Math.max(0, 1 - coefficientOfVariation)
  }

  private getDefaultPricing(basePrice: number, reason: string): PricingOptimizationResult {
    const defaultDiscount = 0.15 // 15% default discount
    const optimalPrice = basePrice * (1 - defaultDiscount)
    
    return {
      optimalPrice,
      discountPercentage: defaultDiscount * 100,
      expectedRevenue: optimalPrice * 100, // Assume 100 conversions
      expectedConversions: 100,
      confidence: 0.3,
      strategy: `default_${reason}`,
      factors: [
        {
          name: "Default Strategy",
          impact: defaultDiscount * 100,
          value: reason,
          weight: 1.0
        }
      ]
    }
  }
}