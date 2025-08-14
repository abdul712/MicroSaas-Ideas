import Redis from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL
  }

  throw new Error('REDIS_URL is not defined')
}

class RedisClient {
  private static instance: Redis | null = null

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(getRedisUrl(), {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      })

      RedisClient.instance.on('error', (error) => {
        console.error('Redis connection error:', error)
      })

      RedisClient.instance.on('connect', () => {
        console.log('Connected to Redis')
      })
    }

    return RedisClient.instance
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit()
      RedisClient.instance = null
    }
  }
}

export const redis = RedisClient.getInstance()

// Cache utilities
export class CacheService {
  private static TTL = {
    SHORT: 60 * 5, // 5 minutes
    MEDIUM: 60 * 30, // 30 minutes
    LONG: 60 * 60 * 24, // 24 hours
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async set(key: string, value: any, ttl: number = CacheService.TTL.MEDIUM): Promise<boolean> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
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

  // Increment counter for analytics
  static async increment(key: string, ttl?: number): Promise<number> {
    try {
      const pipeline = redis.pipeline()
      pipeline.incr(key)
      if (ttl) {
        pipeline.expire(key, ttl)
      }
      const results = await pipeline.exec()
      return results?.[0]?.[1] as number || 0
    } catch (error) {
      console.error('Cache increment error:', error)
      return 0
    }
  }

  // Session management
  static async setSession(sessionId: string, data: any, ttl: number = CacheService.TTL.LONG): Promise<boolean> {
    return this.set(`session:${sessionId}`, data, ttl)
  }

  static async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`)
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`)
  }

  // Analytics caching
  static async setAnalytics(projectId: string, period: string, data: any): Promise<boolean> {
    return this.set(`analytics:${projectId}:${period}`, data, CacheService.TTL.SHORT)
  }

  static async getAnalytics<T>(projectId: string, period: string): Promise<T | null> {
    return this.get<T>(`analytics:${projectId}:${period}`)
  }

  // Test result caching
  static async setTestResults(testId: string, data: any): Promise<boolean> {
    return this.set(`test:${testId}:results`, data, CacheService.TTL.SHORT)
  }

  static async getTestResults<T>(testId: string): Promise<T | null> {
    return this.get<T>(`test:${testId}:results`)
  }
}

export default redis