/**
 * Advanced Demand Forecasting Engine
 * Implements multiple ML algorithms for accurate inventory demand prediction
 */

interface HistoricalData {
  date: Date
  quantity: number
  price?: number
  seasonalFactors?: Record<string, number>
  promotions?: boolean
  weatherData?: any
}

interface ForecastResult {
  date: Date
  predictedDemand: number
  confidence: number
  factors: Record<string, any>
}

interface ModelParameters {
  alpha: number // Exponential smoothing parameter
  beta: number  // Trend smoothing parameter
  gamma: number // Seasonal smoothing parameter
  seasonalPeriod: number
}

export class DemandForecastingEngine {
  private modelVersion = 'v2.0-advanced'
  
  /**
   * Generate demand forecasts using multiple algorithms
   */
  async generateForecasts(
    productId: string,
    historicalData: HistoricalData[],
    forecastDays: number = 30,
    options: {
      includeSeasonality?: boolean
      includeTrends?: boolean
      includeExternalFactors?: boolean
    } = {}
  ): Promise<ForecastResult[]> {
    if (historicalData.length < 7) {
      throw new Error('Insufficient historical data for forecasting')
    }

    const {
      includeSeasonality = true,
      includeTrends = true,
      includeExternalFactors = false
    } = options

    // Prepare time series data
    const timeSeries = this.prepareTimeSeries(historicalData)
    
    // Apply multiple forecasting methods
    const methods = [
      this.exponentialSmoothing(timeSeries, forecastDays, includeSeasonality, includeTrends),
      this.movingAverageWithTrend(timeSeries, forecastDays),
      this.linearRegression(timeSeries, forecastDays),
    ]

    // Ensemble method: combine predictions from multiple models
    const forecasts = await this.ensembleForecasting(methods, forecastDays)
    
    // Enhance with external factors if requested
    if (includeExternalFactors) {
      return this.enhanceWithExternalFactors(forecasts, historicalData)
    }

    return forecasts
  }

  /**
   * Exponential Smoothing (Holt-Winters) Algorithm
   */
  private exponentialSmoothing(
    data: number[],
    forecastDays: number,
    includeSeasonality: boolean,
    includeTrends: boolean
  ): ForecastResult[] {
    const params: ModelParameters = {
      alpha: 0.3, // Level smoothing
      beta: 0.1,  // Trend smoothing
      gamma: 0.2, // Seasonal smoothing
      seasonalPeriod: 7 // Weekly seasonality
    }

    if (data.length < params.seasonalPeriod * 2) {
      // Fall back to simple exponential smoothing
      return this.simpleExponentialSmoothing(data, forecastDays, params.alpha)
    }

    const forecasts: ForecastResult[] = []
    let level = data[0]
    let trend = 0
    const seasonal: number[] = []

    // Initialize seasonal factors
    if (includeSeasonality) {
      for (let i = 0; i < params.seasonalPeriod; i++) {
        seasonal[i] = data[i] / this.calculateInitialLevel(data, params.seasonalPeriod)
      }
    }

    // Initialize trend
    if (includeTrends && data.length >= params.seasonalPeriod * 2) {
      const firstPeriodAvg = data.slice(0, params.seasonalPeriod).reduce((a, b) => a + b) / params.seasonalPeriod
      const secondPeriodAvg = data.slice(params.seasonalPeriod, params.seasonalPeriod * 2).reduce((a, b) => a + b) / params.seasonalPeriod
      trend = (secondPeriodAvg - firstPeriodAvg) / params.seasonalPeriod
    }

    // Update level, trend, and seasonal components
    for (let t = 1; t < data.length; t++) {
      const seasonalIndex = t % params.seasonalPeriod
      const observed = data[t]
      
      // Update level
      const prevLevel = level
      level = params.alpha * (observed / (includeSeasonality ? seasonal[seasonalIndex] : 1)) +
              (1 - params.alpha) * (prevLevel + trend)
      
      // Update trend
      if (includeTrends) {
        trend = params.beta * (level - prevLevel) + (1 - params.beta) * trend
      }
      
      // Update seasonal
      if (includeSeasonality) {
        seasonal[seasonalIndex] = params.gamma * (observed / level) +
                                 (1 - params.gamma) * seasonal[seasonalIndex]
      }
    }

    // Generate forecasts
    for (let h = 1; h <= forecastDays; h++) {
      const seasonalIndex = (data.length + h - 1) % params.seasonalPeriod
      const seasonalFactor = includeSeasonality ? seasonal[seasonalIndex] : 1
      const trendComponent = includeTrends ? trend * h : 0
      
      const prediction = Math.max(0, (level + trendComponent) * seasonalFactor)
      const confidence = this.calculateConfidence(data, h, prediction)

      forecasts.push({
        date: new Date(Date.now() + h * 24 * 60 * 60 * 1000),
        predictedDemand: Math.round(prediction),
        confidence,
        factors: {
          level,
          trend: trendComponent,
          seasonal: seasonalFactor,
          method: 'exponential_smoothing'
        }
      })
    }

    return forecasts
  }

  /**
   * Simple exponential smoothing fallback
   */
  private simpleExponentialSmoothing(data: number[], forecastDays: number, alpha: number): ForecastResult[] {
    let forecast = data[0]
    
    // Update forecast with historical data
    for (let i = 1; i < data.length; i++) {
      forecast = alpha * data[i] + (1 - alpha) * forecast
    }

    const forecasts: ForecastResult[] = []
    for (let h = 1; h <= forecastDays; h++) {
      const confidence = Math.max(50, 90 - h * 2) // Decreasing confidence over time
      
      forecasts.push({
        date: new Date(Date.now() + h * 24 * 60 * 60 * 1000),
        predictedDemand: Math.round(Math.max(0, forecast)),
        confidence,
        factors: {
          method: 'simple_exponential_smoothing',
          alpha
        }
      })
    }

    return forecasts
  }

  /**
   * Moving Average with Trend
   */
  private movingAverageWithTrend(data: number[], forecastDays: number): ForecastResult[] {
    const windowSize = Math.min(14, Math.floor(data.length / 2))
    const forecasts: ForecastResult[] = []
    
    // Calculate moving average
    const recentData = data.slice(-windowSize)
    const average = recentData.reduce((a, b) => a + b) / recentData.length
    
    // Calculate trend
    const firstHalf = recentData.slice(0, Math.floor(windowSize / 2))
    const secondHalf = recentData.slice(Math.floor(windowSize / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length
    const trend = (secondAvg - firstAvg) / (windowSize / 2)

    for (let h = 1; h <= forecastDays; h++) {
      const prediction = Math.max(0, average + trend * h)
      const confidence = Math.max(60, 85 - h * 1.5)

      forecasts.push({
        date: new Date(Date.now() + h * 24 * 60 * 60 * 1000),
        predictedDemand: Math.round(prediction),
        confidence,
        factors: {
          method: 'moving_average_trend',
          average,
          trend,
          windowSize
        }
      })
    }

    return forecasts
  }

  /**
   * Linear Regression Forecasting
   */
  private linearRegression(data: number[], forecastDays: number): ForecastResult[] {
    const n = data.length
    const x = Array.from({ length: n }, (_, i) => i + 1)
    const y = data

    // Calculate linear regression coefficients
    const sumX = x.reduce((a, b) => a + b)
    const sumY = y.reduce((a, b) => a + b)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    const forecasts: ForecastResult[] = []
    
    for (let h = 1; h <= forecastDays; h++) {
      const x_future = n + h
      const prediction = Math.max(0, slope * x_future + intercept)
      
      // Calculate R-squared for confidence
      const yMean = sumY / n
      const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
      const residualSumSquares = y.reduce((sum, yi, i) => {
        const predicted = slope * (i + 1) + intercept
        return sum + Math.pow(yi - predicted, 2)
      }, 0)
      const rSquared = 1 - (residualSumSquares / totalSumSquares)
      const confidence = Math.max(40, Math.min(95, rSquared * 100 - h))

      forecasts.push({
        date: new Date(Date.now() + h * 24 * 60 * 60 * 1000),
        predictedDemand: Math.round(prediction),
        confidence,
        factors: {
          method: 'linear_regression',
          slope,
          intercept,
          rSquared
        }
      })
    }

    return forecasts
  }

  /**
   * Ensemble forecasting - combines multiple methods
   */
  private async ensembleForecasting(
    methodResults: ForecastResult[][],
    forecastDays: number
  ): Promise<ForecastResult[]> {
    const forecasts: ForecastResult[] = []
    
    for (let day = 0; day < forecastDays; day++) {
      const dayForecasts = methodResults.map(method => method[day])
      
      // Weighted average based on confidence
      let totalWeight = 0
      let weightedSum = 0
      let weightedConfidence = 0
      const combinedFactors: Record<string, any> = { methods: [] }

      dayForecasts.forEach(forecast => {
        const weight = forecast.confidence / 100
        totalWeight += weight
        weightedSum += forecast.predictedDemand * weight
        weightedConfidence += forecast.confidence * weight
        combinedFactors.methods.push({
          method: forecast.factors.method,
          prediction: forecast.predictedDemand,
          confidence: forecast.confidence
        })
      })

      const ensemblePrediction = totalWeight > 0 ? weightedSum / totalWeight : 0
      const ensembleConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 50

      forecasts.push({
        date: dayForecasts[0].date,
        predictedDemand: Math.round(Math.max(0, ensemblePrediction)),
        confidence: Math.round(ensembleConfidence),
        factors: {
          ...combinedFactors,
          method: 'ensemble',
          modelVersion: this.modelVersion
        }
      })
    }

    return forecasts
  }

  /**
   * Enhance forecasts with external factors
   */
  private enhanceWithExternalFactors(
    forecasts: ForecastResult[],
    historicalData: HistoricalData[]
  ): ForecastResult[] {
    return forecasts.map(forecast => {
      const dayOfWeek = forecast.date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const isMonday = dayOfWeek === 1
      
      // Weekend/Monday adjustments based on historical patterns
      let adjustment = 1.0
      if (isWeekend) {
        adjustment *= 0.7 // Lower demand on weekends
      } else if (isMonday) {
        adjustment *= 1.2 // Higher demand on Mondays
      }

      // Seasonal adjustments (month-based)
      const month = forecast.date.getMonth()
      const seasonalAdjustments = [
        0.8,  // January (post-holiday low)
        0.9,  // February
        1.0,  // March
        1.1,  // April
        1.2,  // May
        1.1,  // June
        1.0,  // July
        1.0,  // August
        1.1,  // September (back-to-school)
        1.2,  // October
        1.4,  // November (holiday prep)
        1.5   // December (holidays)
      ]
      adjustment *= seasonalAdjustments[month]

      const adjustedDemand = Math.round(forecast.predictedDemand * adjustment)
      const confidenceAdjustment = Math.abs(adjustment - 1) < 0.1 ? 0 : -5 // Lower confidence for high adjustments

      return {
        ...forecast,
        predictedDemand: Math.max(0, adjustedDemand),
        confidence: Math.max(40, forecast.confidence + confidenceAdjustment),
        factors: {
          ...forecast.factors,
          externalFactors: {
            dayOfWeek,
            isWeekend,
            isMonday,
            monthlyAdjustment: seasonalAdjustments[month],
            totalAdjustment: adjustment
          }
        }
      }
    })
  }

  /**
   * Helper methods
   */
  private prepareTimeSeries(data: HistoricalData[]): number[] {
    return data.map(d => d.quantity).filter(q => q >= 0)
  }

  private calculateInitialLevel(data: number[], seasonalPeriod: number): number {
    return data.slice(0, seasonalPeriod).reduce((a, b) => a + b) / seasonalPeriod
  }

  private calculateConfidence(historicalData: number[], forecastHorizon: number, prediction: number): number {
    // Simple confidence calculation based on historical variance and forecast horizon
    const variance = this.calculateVariance(historicalData)
    const baseConfidence = Math.max(50, 95 - variance * 10)
    const horizonPenalty = forecastHorizon * 2
    
    return Math.max(40, Math.min(95, baseConfidence - horizonPenalty))
  }

  private calculateVariance(data: number[]): number {
    const mean = data.reduce((a, b) => a + b) / data.length
    const squaredDiffs = data.map(x => Math.pow(x - mean, 2))
    return squaredDiffs.reduce((a, b) => a + b) / data.length
  }
}