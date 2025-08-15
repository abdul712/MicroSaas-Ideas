import Redis from 'ioredis'
import { logger } from '@/utils/logger'

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  commandTimeout: 5000,
  family: 4, // IPv4
}

// Create Redis client with connection pooling
export const redis = new Redis(redisConfig)

// Redis Pub/Sub client (separate connection)
export const redisPub = new Redis(redisConfig)
export const redisSub = new Redis(redisConfig)

// Connection event handlers
redis.on('connect', () => {
  logger.info('Redis connected successfully')
})

redis.on('ready', () => {
  logger.info('Redis is ready to accept commands')
})

redis.on('error', (error) => {
  logger.error('Redis connection error', { error })
})

redis.on('close', () => {
  logger.warn('Redis connection closed')
})

redis.on('reconnecting', (ms) => {
  logger.info('Redis reconnecting', { delayMs: ms })
})

// Cache key patterns
export const CacheKeys = {
  // User sessions
  SESSION: (sessionId: string) => `session:${sessionId}`,
  USER: (userId: string) => `user:${userId}`,
  USER_PERMISSIONS: (userId: string) => `permissions:${userId}`,
  
  // Tenant data
  TENANT: (tenantId: string) => `tenant:${tenantId}`,
  TENANT_SETTINGS: (tenantId: string) => `tenant:${tenantId}:settings`,
  
  // Metrics and analytics
  METRICS: (tenantId: string, type: string, period: string) => 
    `metrics:${tenantId}:${type}:${period}`,
  DASHBOARD: (tenantId: string, dashboardId: string) => 
    `dashboard:${tenantId}:${dashboardId}`,
  
  // Real-time data
  LIVE_METRICS: (tenantId: string) => `live:metrics:${tenantId}`,
  ALERTS: (tenantId: string) => `alerts:${tenantId}`,
  
  // API rate limiting
  RATE_LIMIT: (identifier: string) => `rate_limit:${identifier}`,
  
  // Integrations
  INTEGRATION_STATUS: (tenantId: string, integration: string) => 
    `integration:${tenantId}:${integration}:status`,
}

// Cache TTL (Time To Live) in seconds
export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
}

// Cache service class
export class CacheService {
  private redis: Redis

  constructor(redisClient: Redis = redis) {
    this.redis = redisClient
  }

  // Get cached value with JSON parsing
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key)
      if (!value) return null
      
      return JSON.parse(value) as T
    } catch (error) {
      logger.error('Cache get error', { key, error })
      return null
    }
  }

  // Set cached value with JSON serialization
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value)
      
      if (ttl) {
        await this.redis.setex(key, ttl, serialized)
      } else {
        await this.redis.set(key, serialized)
      }
      
      return true
    } catch (error) {
      logger.error('Cache set error', { key, error })
      return false
    }
  }

  // Delete cached value
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key)
      return result > 0
    } catch (error) {
      logger.error('Cache delete error', { key, error })
      return false
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Cache exists error', { key, error })
      return false
    }
  }

  // Get multiple keys
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys)
      return values.map(value => {
        if (!value) return null
        try {
          return JSON.parse(value) as T
        } catch {
          return null
        }
      })
    } catch (error) {
      logger.error('Cache mget error', { keys, error })
      return keys.map(() => null)
    }
  }

  // Set multiple keys
  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      const serializedPairs: string[] = []
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        serializedPairs.push(key, JSON.stringify(value))
      })
      
      await this.redis.mset(...serializedPairs)
      
      if (ttl) {
        const expirePromises = Object.keys(keyValuePairs).map(key =>
          this.redis.expire(key, ttl)
        )
        await Promise.all(expirePromises)
      }
      
      return true
    } catch (error) {
      logger.error('Cache mset error', { error })
      return false
    }
  }

  // Increment counter
  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const result = await this.redis.incr(key)
      
      if (ttl && result === 1) {
        await this.redis.expire(key, ttl)
      }
      
      return result
    } catch (error) {
      logger.error('Cache increment error', { key, error })
      return 0
    }
  }

  // Get keys by pattern
  async getKeys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern)
    } catch (error) {
      logger.error('Cache get keys error', { pattern, error })
      return []
    }
  }

  // Delete keys by pattern
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length === 0) return 0
      
      return await this.redis.del(...keys)
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error })
      return 0
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<any> {
    try {
      const value = await this.redis.hget(key, field)
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error('Cache hget error', { key, field, error })
      return null
    }
  }

  async hset(key: string, field: string, value: any, ttl?: number): Promise<boolean> {
    try {
      await this.redis.hset(key, field, JSON.stringify(value))
      
      if (ttl) {
        await this.redis.expire(key, ttl)
      }
      
      return true
    } catch (error) {
      logger.error('Cache hset error', { key, field, error })
      return false
    }
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    try {
      const hash = await this.redis.hgetall(key)
      const result: Record<string, any> = {}
      
      Object.entries(hash).forEach(([field, value]) => {
        try {
          result[field] = JSON.parse(value)
        } catch {
          result[field] = value
        }
      })
      
      return result
    } catch (error) {
      logger.error('Cache hgetall error', { key, error })
      return {}
    }
  }

  // List operations
  async lpush(key: string, value: any): Promise<number> {
    try {
      return await this.redis.lpush(key, JSON.stringify(value))
    } catch (error) {
      logger.error('Cache lpush error', { key, error })
      return 0
    }
  }

  async lrange<T = any>(key: string, start: number, end: number): Promise<T[]> {
    try {
      const values = await this.redis.lrange(key, start, end)
      return values.map(value => {
        try {
          return JSON.parse(value) as T
        } catch {
          return value as T
        }
      })
    } catch (error) {
      logger.error('Cache lrange error', { key, start, end, error })
      return []
    }
  }

  // Set operations
  async sadd(key: string, member: any): Promise<number> {
    try {
      return await this.redis.sadd(key, JSON.stringify(member))
    } catch (error) {
      logger.error('Cache sadd error', { key, error })
      return 0
    }
  }

  async smembers<T = any>(key: string): Promise<T[]> {
    try {
      const members = await this.redis.smembers(key)
      return members.map(member => {
        try {
          return JSON.parse(member) as T
        } catch {
          return member as T
        }
      })
    } catch (error) {
      logger.error('Cache smembers error', { key, error })
      return []
    }
  }
}

// Pub/Sub service
export class PubSubService {
  private publisher: Redis
  private subscriber: Redis

  constructor(pub: Redis = redisPub, sub: Redis = redisSub) {
    this.publisher = pub
    this.subscriber = sub
  }

  async publish(channel: string, message: any): Promise<boolean> {
    try {
      const serialized = JSON.stringify(message)
      await this.publisher.publish(channel, serialized)
      return true
    } catch (error) {
      logger.error('Pub/Sub publish error', { channel, error })
      return false
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel)
      
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsed = JSON.parse(message)
            callback(parsed)
          } catch {
            callback(message)
          }
        }
      })
    } catch (error) {
      logger.error('Pub/Sub subscribe error', { channel, error })
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel)
    } catch (error) {
      logger.error('Pub/Sub unsubscribe error', { channel, error })
    }
  }
}

// Health check for Redis
export const checkRedisConnection = async (): Promise<boolean> => {
  try {
    await redis.ping()
    logger.info('Redis connection is healthy')
    return true
  } catch (error) {
    logger.error('Redis connection failed', { error })
    return false
  }
}

// Graceful disconnect
export const disconnectRedis = async (): Promise<void> => {
  try {
    await Promise.all([
      redis.disconnect(),
      redisPub.disconnect(),
      redisSub.disconnect()
    ])
    logger.info('Redis disconnected successfully')
  } catch (error) {
    logger.error('Error disconnecting from Redis', { error })
  }
}

// Create cache service instance
export const cache = new CacheService()
export const pubsub = new PubSubService()

export default redis