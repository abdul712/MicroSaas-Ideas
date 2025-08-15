import Redis from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL
  }
  
  if (process.env.NODE_ENV === 'development') {
    return 'redis://localhost:6379'
  }
  
  throw new Error('REDIS_URL environment variable is required')
}

export const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
})

// Cache helper functions
export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized)
      } else {
        await redis.set(key, serialized)
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  static async increment(key: string, increment: number = 1): Promise<number> {
    try {
      return await redis.incrby(key, increment)
    } catch (error) {
      console.error('Cache increment error:', error)
      return 0
    }
  }

  static async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await redis.expire(key, ttlSeconds)
    } catch (error) {
      console.error('Cache expire error:', error)
    }
  }

  // Pricing-specific cache methods
  static getPriceHistoryKey(productId: string, competitorId?: string): string {
    return competitorId 
      ? `price_history:${productId}:${competitorId}`
      : `price_history:${productId}`
  }

  static getRecommendationKey(productId: string): string {
    return `recommendation:${productId}`
  }

  static getCompetitorDataKey(competitorId: string): string {
    return `competitor_data:${competitorId}`
  }

  static async cachePriceHistory(
    productId: string, 
    data: any, 
    competitorId?: string,
    ttlSeconds: number = 3600
  ): Promise<void> {
    const key = this.getPriceHistoryKey(productId, competitorId)
    await this.set(key, data, ttlSeconds)
  }

  static async getCachedPriceHistory(
    productId: string, 
    competitorId?: string
  ): Promise<any> {
    const key = this.getPriceHistoryKey(productId, competitorId)
    return await this.get(key)
  }

  static async invalidatePricingCache(productId: string): Promise<void> {
    const keys = [
      this.getPriceHistoryKey(productId),
      this.getRecommendationKey(productId),
      `product_analytics:${productId}`,
      `pricing_insights:${productId}`
    ]
    
    await Promise.all(keys.map(key => this.del(key)))
  }
}

// Rate limiting for API scraping
export class RateLimiter {
  static async checkLimit(
    identifier: string, 
    limit: number, 
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`
    const now = Date.now()
    const windowStart = now - (windowSeconds * 1000)

    try {
      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart)
      
      // Count current requests
      const current = await redis.zcard(key)
      
      if (current >= limit) {
        const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES')
        const resetTime = oldest.length > 0 ? parseInt(oldest[1] as string) + (windowSeconds * 1000) : now + (windowSeconds * 1000)
        
        return {
          allowed: false,
          remaining: 0,
          resetTime
        }
      }

      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`)
      await redis.expire(key, windowSeconds)

      return {
        allowed: true,
        remaining: limit - current - 1,
        resetTime: now + (windowSeconds * 1000)
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      // Allow request on error
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + (windowSeconds * 1000)
      }
    }
  }
}

export default redis