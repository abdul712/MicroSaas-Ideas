import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000
})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Cache keys constants
export const CACHE_KEYS = {
  USER_SESSION: (userId: string) => `session:${userId}`,
  ORGANIZATION: (orgId: string) => `org:${orgId}`,
  LEAD_MAGNET: (id: string) => `lead_magnet:${id}`,
  TEMPLATES: (orgId?: string) => `templates:${orgId || 'public'}`,
  ANALYTICS: (orgId: string, period: string) => `analytics:${orgId}:${period}`,
  AI_QUOTA: (orgId: string) => `ai_quota:${orgId}`,
  RATE_LIMIT: (key: string) => `rate_limit:${key}`,
  AB_TEST: (id: string) => `ab_test:${id}`,
  CONVERSION_COUNT: (leadMagnetId: string) => `conversions:${leadMagnetId}`,
  VISITOR_SESSION: (visitorId: string) => `visitor:${visitorId}`
} as const

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 3600,    // 1 hour
  LONG: 86400,     // 24 hours
  WEEK: 604800     // 7 days
} as const

// Caching utilities
export class CacheManager {
  // Generic cache operations
  static async set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache pattern invalidation error:', error)
    }
  }

  // Specialized cache operations
  static async cacheUser(userId: string, userData: any, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
    await this.set(CACHE_KEYS.USER_SESSION(userId), userData, ttl)
  }

  static async getUser(userId: string): Promise<any | null> {
    return await this.get(CACHE_KEYS.USER_SESSION(userId))
  }

  static async invalidateUser(userId: string): Promise<void> {
    await this.del(CACHE_KEYS.USER_SESSION(userId))
  }

  static async cacheOrganization(orgId: string, orgData: any): Promise<void> {
    await this.set(CACHE_KEYS.ORGANIZATION(orgId), orgData, CACHE_TTL.LONG)
  }

  static async getOrganization(orgId: string): Promise<any | null> {
    return await this.get(CACHE_KEYS.ORGANIZATION(orgId))
  }

  static async invalidateOrganization(orgId: string): Promise<void> {
    await this.del(CACHE_KEYS.ORGANIZATION(orgId))
    // Also invalidate related caches
    await this.invalidatePattern(`templates:${orgId}*`)
    await this.invalidatePattern(`analytics:${orgId}*`)
  }

  static async cacheLeadMagnet(id: string, data: any): Promise<void> {
    await this.set(CACHE_KEYS.LEAD_MAGNET(id), data, CACHE_TTL.MEDIUM)
  }

  static async getLeadMagnet(id: string): Promise<any | null> {
    return await this.get(CACHE_KEYS.LEAD_MAGNET(id))
  }

  static async invalidateLeadMagnet(id: string): Promise<void> {
    await this.del(CACHE_KEYS.LEAD_MAGNET(id))
  }
}

// Rate limiting utilities
export class RateLimiter {
  static async checkLimit(
    key: string,
    limit: number,
    window: number = 3600 // 1 hour in seconds
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const multi = redis.multi()
      const now = Date.now()
      const windowStart = now - (window * 1000)

      // Remove old entries
      multi.zremrangebyscore(key, 0, windowStart)
      // Add current request
      multi.zadd(key, now, now)
      // Get count
      multi.zcard(key)
      // Set expiry
      multi.expire(key, window)

      const results = await multi.exec()
      const count = results?.[2]?.[1] as number || 0

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetTime: Math.ceil((windowStart + (window * 1000)) / 1000)
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      // Fail open in case of Redis errors
      return { allowed: true, remaining: limit, resetTime: 0 }
    }
  }

  static async incrementUsage(key: string): Promise<void> {
    try {
      await redis.incr(key)
    } catch (error) {
      console.error('Usage increment error:', error)
    }
  }
}

// Real-time features
export class RealtimeManager {
  // Pub/Sub for real-time collaboration
  static async publishCollaboration(leadMagnetId: string, operation: any): Promise<void> {
    try {
      await redis.publish(`collab:${leadMagnetId}`, JSON.stringify(operation))
    } catch (error) {
      console.error('Collaboration publish error:', error)
    }
  }

  static async subscribeToCollaboration(leadMagnetId: string, callback: (operation: any) => void): Promise<void> {
    try {
      const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
      await subscriber.subscribe(`collab:${leadMagnetId}`)
      subscriber.on('message', (channel, message) => {
        if (channel === `collab:${leadMagnetId}`) {
          callback(JSON.parse(message))
        }
      })
    } catch (error) {
      console.error('Collaboration subscription error:', error)
    }
  }

  // Live analytics updates
  static async publishAnalyticsUpdate(orgId: string, data: any): Promise<void> {
    try {
      await redis.publish(`analytics:${orgId}`, JSON.stringify(data))
    } catch (error) {
      console.error('Analytics publish error:', error)
    }
  }
}

// Session management
export class SessionManager {
  static async createSession(userId: string, sessionData: any): Promise<string> {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await redis.setex(`session:${sessionId}`, CACHE_TTL.LONG, JSON.stringify({
      userId,
      ...sessionData,
      createdAt: new Date().toISOString()
    }))
    return sessionId
  }

  static async getSession(sessionId: string): Promise<any | null> {
    try {
      const session = await redis.get(`session:${sessionId}`)
      return session ? JSON.parse(session) : null
    } catch (error) {
      console.error('Session get error:', error)
      return null
    }
  }

  static async destroySession(sessionId: string): Promise<void> {
    await redis.del(`session:${sessionId}`)
  }

  static async extendSession(sessionId: string, ttl: number = CACHE_TTL.LONG): Promise<void> {
    await redis.expire(`session:${sessionId}`, ttl)
  }
}

// Health check
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error('Redis health check failed:', error)
    return false
  }
}

// Cleanup
export const cleanup = async () => {
  await redis.quit()
}