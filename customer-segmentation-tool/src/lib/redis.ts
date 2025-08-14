import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Cache keys
export const CACHE_KEYS = {
  SEGMENT_CUSTOMERS: (segmentId: string) => `segment:${segmentId}:customers`,
  CUSTOMER_SEGMENTS: (customerId: string) => `customer:${customerId}:segments`,
  ORGANIZATION_STATS: (orgId: string) => `org:${orgId}:stats`,
  RFM_SCORES: (orgId: string) => `org:${orgId}:rfm`,
  ML_PREDICTIONS: (customerId: string) => `predictions:${customerId}`,
}

// Cache utilities
export const cacheUtils = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  },

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const data = JSON.stringify(value)
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, data)
      } else {
        await redis.set(key, data)
      }
    } catch (error) {
      console.error('Redis set error:', error)
    }
  },

  async del(key: string | string[]): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Redis del error:', error)
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      return (await redis.exists(key)) === 1
    } catch (error) {
      console.error('Redis exists error:', error)
      return false
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Redis invalidatePattern error:', error)
    }
  }
}