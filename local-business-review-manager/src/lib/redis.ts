import Redis, { RedisOptions } from 'ioredis'

const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
}

class RedisClient {
  private static instance: RedisClient
  private client: Redis
  private subscriber: Redis
  private publisher: Redis

  private constructor() {
    this.client = new Redis(redisConfig)
    this.subscriber = new Redis(redisConfig)
    this.publisher = new Redis(redisConfig)

    this.setupEventHandlers()
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient()
    }
    return RedisClient.instance
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('Redis client connected')
    })

    this.client.on('error', (error) => {
      console.error('Redis client error:', error)
    })

    this.client.on('ready', () => {
      console.log('Redis client ready')
    })

    this.client.on('close', () => {
      console.log('Redis client connection closed')
    })
  }

  // Basic operations
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key)
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value)
      } else {
        await this.client.set(key, value)
      }
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  }

  // JSON operations
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Redis GET JSON error:', error)
      return null
    }
  }

  async setJson(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value)
      return await this.set(key, jsonValue, ttlSeconds)
    } catch (error) {
      console.error('Redis SET JSON error:', error)
      return false
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lpush(key, ...values)
    } catch (error) {
      console.error('Redis LPUSH error:', error)
      return 0
    }
  }

  async lrange(key: string, start: number, end: number): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, end)
    } catch (error) {
      console.error('Redis LRANGE error:', error)
      return []
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.client.llen(key)
    } catch (error) {
      console.error('Redis LLEN error:', error)
      return 0
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sadd(key, ...members)
    } catch (error) {
      console.error('Redis SADD error:', error)
      return 0
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key)
    } catch (error) {
      console.error('Redis SMEMBERS error:', error)
      return []
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, member)
      return result === 1
    } catch (error) {
      console.error('Redis SISMEMBER error:', error)
      return false
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.client.hset(key, field, value)
      return true
    } catch (error) {
      console.error('Redis HSET error:', error)
      return false
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field)
    } catch (error) {
      console.error('Redis HGET error:', error)
      return null
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(key)
    } catch (error) {
      console.error('Redis HGETALL error:', error)
      return {}
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    try {
      return await this.publisher.publish(channel, message)
    } catch (error) {
      console.error('Redis PUBLISH error:', error)
      return 0
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel)
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          callback(message)
        }
      })
    } catch (error) {
      console.error('Redis SUBSCRIBE error:', error)
    }
  }

  // Cache patterns for review management
  async cacheReviewData(businessId: string, locationId: string, data: any, ttlSeconds = 300): Promise<boolean> {
    const key = `review_cache:${businessId}:${locationId}`
    return await this.setJson(key, data, ttlSeconds)
  }

  async getCachedReviewData(businessId: string, locationId: string): Promise<any> {
    const key = `review_cache:${businessId}:${locationId}`
    return await this.getJson(key)
  }

  async cacheAnalyticsData(businessId: string, period: string, data: any, ttlSeconds = 3600): Promise<boolean> {
    const key = `analytics:${businessId}:${period}`
    return await this.setJson(key, data, ttlSeconds)
  }

  async getCachedAnalyticsData(businessId: string, period: string): Promise<any> {
    const key = `analytics:${businessId}:${period}`
    return await this.getJson(key)
  }

  // Rate limiting
  async rateLimitCheck(identifier: string, limit: number, windowSeconds: number): Promise<boolean> {
    const key = `rate_limit:${identifier}`
    try {
      const current = await this.client.incr(key)
      if (current === 1) {
        await this.client.expire(key, windowSeconds)
      }
      return current <= limit
    } catch (error) {
      console.error('Rate limit check error:', error)
      return false
    }
  }

  // Session management
  async storeSession(sessionId: string, data: any, ttlSeconds = 86400): Promise<boolean> {
    const key = `session:${sessionId}`
    return await this.setJson(key, data, ttlSeconds)
  }

  async getSession(sessionId: string): Promise<any> {
    const key = `session:${sessionId}`
    return await this.getJson(key)
  }

  async destroySession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`
    return await this.del(key)
  }

  // Queue operations for background jobs
  async enqueueJob(queue: string, jobData: any, priority = 0): Promise<boolean> {
    const job = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: jobData,
      priority,
      createdAt: new Date().toISOString()
    }
    const queueKey = `queue:${queue}`
    return await this.setJson(`job:${job.id}`, job) && 
           await this.lpush(queueKey, job.id) > 0
  }

  async dequeueJob(queue: string): Promise<any> {
    const queueKey = `queue:${queue}`
    try {
      const jobId = await this.client.rpop(queueKey)
      if (!jobId) return null
      
      const job = await this.getJson(`job:${jobId}`)
      if (job) {
        await this.del(`job:${jobId}`)
      }
      return job
    } catch (error) {
      console.error('Dequeue job error:', error)
      return null
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    const start = Date.now()
    try {
      await this.client.ping()
      const latency = Date.now() - start
      return { status: 'healthy', latency }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    try {
      await Promise.all([
        this.client.disconnect(),
        this.subscriber.disconnect(),
        this.publisher.disconnect()
      ])
    } catch (error) {
      console.error('Redis disconnect error:', error)
    }
  }
}

// Export singleton instance
export const redis = RedisClient.getInstance()

// Utility functions
export const cacheKeys = {
  reviewData: (businessId: string, locationId: string) => `review_cache:${businessId}:${locationId}`,
  analyticsData: (businessId: string, period: string) => `analytics:${businessId}:${period}`,
  userSession: (sessionId: string) => `session:${sessionId}`,
  rateLimiting: (identifier: string) => `rate_limit:${identifier}`,
  platformSync: (businessId: string, platform: string) => `sync:${businessId}:${platform}`,
  alertQueue: 'queue:alerts',
  reviewSyncQueue: 'queue:review_sync',
  aiResponseQueue: 'queue:ai_responses'
}