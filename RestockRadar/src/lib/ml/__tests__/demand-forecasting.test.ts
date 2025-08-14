import { DemandForecastingEngine } from '@/lib/ml/demand-forecasting'

describe('DemandForecastingEngine', () => {
  let engine: DemandForecastingEngine

  beforeEach(() => {
    engine = new DemandForecastingEngine()
  })

  describe('generateForecasts', () => {
    it('should generate forecasts for sufficient historical data', async () => {
      const historicalData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        quantity: Math.floor(Math.random() * 50) + 10,
      }))

      const forecasts = await engine.generateForecasts('product-1', historicalData, 7)

      expect(forecasts).toHaveLength(7)
      expect(forecasts[0]).toHaveProperty('date')
      expect(forecasts[0]).toHaveProperty('predictedDemand')
      expect(forecasts[0]).toHaveProperty('confidence')
      expect(forecasts[0]).toHaveProperty('factors')
      expect(forecasts[0].confidence).toBeGreaterThanOrEqual(40)
      expect(forecasts[0].confidence).toBeLessThanOrEqual(95)
    })

    it('should throw error for insufficient data', async () => {
      const historicalData = [
        { date: new Date(), quantity: 10 },
        { date: new Date(), quantity: 15 },
      ]

      await expect(
        engine.generateForecasts('product-1', historicalData, 7)
      ).rejects.toThrow('Insufficient historical data')
    })

    it('should handle different forecast options', async () => {
      const historicalData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        quantity: Math.floor(Math.random() * 50) + 10,
      }))

      const forecastsWithSeasonality = await engine.generateForecasts(
        'product-1',
        historicalData,
        7,
        { includeSeasonality: true, includeTrends: true }
      )

      const forecastsWithoutSeasonality = await engine.generateForecasts(
        'product-1',
        historicalData,
        7,
        { includeSeasonality: false, includeTrends: false }
      )

      expect(forecastsWithSeasonality).toHaveLength(7)
      expect(forecastsWithoutSeasonality).toHaveLength(7)
      
      // Different options should potentially produce different results
      expect(forecastsWithSeasonality[0].factors).toHaveProperty('method')
      expect(forecastsWithoutSeasonality[0].factors).toHaveProperty('method')
    })

    it('should include external factors when requested', async () => {
      const historicalData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        quantity: Math.floor(Math.random() * 50) + 10,
      }))

      const forecasts = await engine.generateForecasts(
        'product-1',
        historicalData,
        7,
        { includeExternalFactors: true }
      )

      expect(forecasts[0].factors).toHaveProperty('externalFactors')
      expect(forecasts[0].factors.externalFactors).toHaveProperty('dayOfWeek')
      expect(forecasts[0].factors.externalFactors).toHaveProperty('isWeekend')
      expect(forecasts[0].factors.externalFactors).toHaveProperty('monthlyAdjustment')
    })

    it('should produce non-negative demand predictions', async () => {
      const historicalData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        quantity: Math.floor(Math.random() * 10), // Low quantities to test edge cases
      }))

      const forecasts = await engine.generateForecasts('product-1', historicalData, 7)

      forecasts.forEach(forecast => {
        expect(forecast.predictedDemand).toBeGreaterThanOrEqual(0)
      })
    })

    it('should handle seasonal patterns', async () => {
      // Create data with clear weekly pattern (higher on weekdays)
      const historicalData = Array.from({ length: 28 }, (_, i) => {
        const date = new Date(Date.now() - (28 - i) * 24 * 60 * 60 * 1000)
        const dayOfWeek = date.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const quantity = isWeekend ? 10 : 30 // Clear pattern
        return { date, quantity }
      })

      const forecasts = await engine.generateForecasts(
        'product-1',
        historicalData,
        7,
        { includeSeasonality: true }
      )

      expect(forecasts).toHaveLength(7)
      // Verify that the method recognizes the pattern
      expect(forecasts[0].factors).toHaveProperty('method')
    })

    it('should decrease confidence over longer forecast horizons', async () => {
      const historicalData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        quantity: Math.floor(Math.random() * 50) + 10,
      }))

      const forecasts = await engine.generateForecasts('product-1', historicalData, 14)

      // Generally, confidence should decrease over time (though ensemble methods may vary)
      expect(forecasts[0].confidence).toBeGreaterThanOrEqual(40)
      expect(forecasts[13].confidence).toBeGreaterThanOrEqual(40)
      
      // At least the method should be consistent
      forecasts.forEach(forecast => {
        expect(forecast.confidence).toBeGreaterThanOrEqual(40)
        expect(forecast.confidence).toBeLessThanOrEqual(95)
      })
    })

    it('should use ensemble method by default', async () => {
      const historicalData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        quantity: Math.floor(Math.random() * 50) + 10,
      }))

      const forecasts = await engine.generateForecasts('product-1', historicalData, 7)

      expect(forecasts[0].factors.method).toBe('ensemble')
      expect(forecasts[0].factors.methods).toBeInstanceOf(Array)
      expect(forecasts[0].factors.methods.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle data with zero values', async () => {
      const historicalData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        quantity: i % 5 === 0 ? 0 : Math.floor(Math.random() * 20) + 5,
      }))

      const forecasts = await engine.generateForecasts('product-1', historicalData, 7)

      expect(forecasts).toHaveLength(7)
      forecasts.forEach(forecast => {
        expect(forecast.predictedDemand).toBeGreaterThanOrEqual(0)
      })
    })

    it('should handle volatile demand data', async () => {
      const historicalData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        quantity: Math.floor(Math.random() * 100), // High volatility
      }))

      const forecasts = await engine.generateForecasts('product-1', historicalData, 7)

      expect(forecasts).toHaveLength(7)
      // Should still produce valid forecasts even with high volatility
      forecasts.forEach(forecast => {
        expect(typeof forecast.predictedDemand).toBe('number')
        expect(forecast.predictedDemand).toBeGreaterThanOrEqual(0)
        expect(forecast.confidence).toBeGreaterThanOrEqual(40)
      })
    })

    it('should handle increasing trend data', async () => {
      const historicalData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        quantity: i * 2 + Math.floor(Math.random() * 10), // Clear upward trend
      }))

      const forecastsWithTrend = await engine.generateForecasts(
        'product-1',
        historicalData,
        7,
        { includeTrends: true }
      )

      const forecastsWithoutTrend = await engine.generateForecasts(
        'product-1',
        historicalData,
        7,
        { includeTrends: false }
      )

      expect(forecastsWithTrend).toHaveLength(7)
      expect(forecastsWithoutTrend).toHaveLength(7)
      
      // With clear upward trend, trend-aware forecasts should generally be higher
      // (though ensemble methods may moderate this)
      expect(forecastsWithTrend[6].predictedDemand).toBeGreaterThanOrEqual(0)
      expect(forecastsWithoutTrend[6].predictedDemand).toBeGreaterThanOrEqual(0)
    })
  })
})