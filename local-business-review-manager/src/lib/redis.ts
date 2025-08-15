import Redis from 'ioredis'

let redis: Redis | null = null

function createRedisInstance(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  
  const redisInstance = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    lazyConnect: true,
    keepAlive: 30000,
    connectionName: 'review-manager',
    keyPrefix: 'rm:',
  })

  redisInstance.on('error', (error) => {
    console.error('Redis connection error:', error)
  })

  redisInstance.on('connect', () => {
    console.log('Redis connected successfully')
  })

  redisInstance.on('ready', () => {
    console.log('Redis ready for operations')
  })

  redisInstance.on('close', () => {
    console.log('Redis connection closed')
  })

  return redisInstance
}

export function getRedis(): Redis {
  if (!redis) {
    redis = createRedisInstance()
  }
  return redis
}

// Cache keys
export const CACHE_KEYS = {
  USER_SESSION: (userId: string) => `session:${userId}`,
  BUSINESS_SUMMARY: (businessId: string) => `business:summary:${businessId}`,
  REVIEW_ANALYTICS: (businessId: string, period: string) => `analytics:${businessId}:${period}`,
  PLATFORM_STATUS: (businessId: string, platform: string) => `platform:status:${businessId}:${platform}`,
  RATE_LIMIT: (identifier: string) => `rate_limit:${identifier}`,
  REVIEW_SYNC: (platformId: string) => `sync:${platformId}`,
  NOTIFICATION_QUEUE: 'notifications:queue',
  AI_RESPONSE_CACHE: (reviewId: string) => `ai:response:${reviewId}`,
  WEBHOOK_QUEUE: 'webhooks:queue',
}

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  DAY: 86400,      // 24 hours
  WEEK: 604800,    // 7 days
}

// Session management
export async function setUserSession(userId: string, sessionData: any, ttl = CACHE_TTL.DAY): Promise<void> {
  const redis = getRedis()
  await redis.setex(CACHE_KEYS.USER_SESSION(userId), ttl, JSON.stringify(sessionData))
}

export async function getUserSession(userId: string): Promise<any | null> {
  const redis = getRedis()
  const session = await redis.get(CACHE_KEYS.USER_SESSION(userId))
  return session ? JSON.parse(session) : null
}

export async function deleteUserSession(userId: string): Promise<void> {
  const redis = getRedis()
  await redis.del(CACHE_KEYS.USER_SESSION(userId))
}

// Business data caching
export async function cachBusinessSummary(businessId: string, summary: any, ttl = CACHE_TTL.MEDIUM): Promise<void> {
  const redis = getRedis()
  await redis.setex(CACHE_KEYS.BUSINESS_SUMMARY(businessId), ttl, JSON.stringify(summary))
}

export async function getBusinessSummary(businessId: string): Promise<any | null> {
  const redis = getRedis()
  const summary = await redis.get(CACHE_KEYS.BUSINESS_SUMMARY(businessId))
  return summary ? JSON.parse(summary) : null
}

// Analytics caching
export async function cacheAnalytics(businessId: string, period: string, analytics: any, ttl = CACHE_TTL.LONG): Promise<void> {
  const redis = getRedis()
  await redis.setex(CACHE_KEYS.REVIEW_ANALYTICS(businessId, period), ttl, JSON.stringify(analytics))
}

export async function getAnalytics(businessId: string, period: string): Promise<any | null> {
  const redis = getRedis()
  const analytics = await redis.get(CACHE_KEYS.REVIEW_ANALYTICS(businessId, period))
  return analytics ? JSON.parse(analytics) : null
}

// Platform status caching
export async function setPlatformStatus(businessId: string, platform: string, status: any, ttl = CACHE_TTL.MEDIUM): Promise<void> {
  const redis = getRedis()
  await redis.setex(CACHE_KEYS.PLATFORM_STATUS(businessId, platform), ttl, JSON.stringify(status))
}

export async function getPlatformStatus(businessId: string, platform: string): Promise<any | null> {
  const redis = getRedis()
  const status = await redis.get(CACHE_KEYS.PLATFORM_STATUS(businessId, platform))
  return status ? JSON.parse(status) : null
}

// Rate limiting
export async function checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const redis = getRedis()
  const key = CACHE_KEYS.RATE_LIMIT(identifier)
  
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, windowSeconds)
  }
  
  const ttl = await redis.ttl(key)
  const resetTime = Date.now() + (ttl * 1000)
  
  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetTime,
  }
}

// Review sync locking
export async function acquireSyncLock(platformId: string, ttl = 300): Promise<boolean> {
  const redis = getRedis()
  const key = CACHE_KEYS.REVIEW_SYNC(platformId)
  
  const result = await redis.set(key, Date.now(), 'EX', ttl, 'NX')
  return result === 'OK'
}

export async function releaseSyncLock(platformId: string): Promise<void> {
  const redis = getRedis()
  await redis.del(CACHE_KEYS.REVIEW_SYNC(platformId))
}

// Queue management
export async function addToNotificationQueue(notification: any): Promise<void> {
  const redis = getRedis()
  await redis.lpush(CACHE_KEYS.NOTIFICATION_QUEUE, JSON.stringify(notification))
}

export async function getFromNotificationQueue(): Promise<any | null> {
  const redis = getRedis()
  const notification = await redis.rpop(CACHE_KEYS.NOTIFICATION_QUEUE)
  return notification ? JSON.parse(notification) : null
}

export async function addToWebhookQueue(webhook: any): Promise<void> {
  const redis = getRedis()
  await redis.lpush(CACHE_KEYS.WEBHOOK_QUEUE, JSON.stringify(webhook))
}

export async function getFromWebhookQueue(): Promise<any | null> {
  const redis = getRedis()
  const webhook = await redis.rpop(CACHE_KEYS.WEBHOOK_QUEUE)
  return webhook ? JSON.parse(webhook) : null
}

// AI response caching
export async function cacheAIResponse(reviewId: string, response: string, ttl = CACHE_TTL.DAY): Promise<void> {
  const redis = getRedis()
  await redis.setex(CACHE_KEYS.AI_RESPONSE_CACHE(reviewId), ttl, response)
}

export async function getCachedAIResponse(reviewId: string): Promise<string | null> {
  const redis = getRedis()
  return await redis.get(CACHE_KEYS.AI_RESPONSE_CACHE(reviewId))
}

// Distributed locks
export async function acquireLock(key: string, ttl = 30): Promise<string | null> {
  const redis = getRedis()
  const lockId = `${Date.now()}-${Math.random()}`
  const lockKey = `lock:${key}`
  
  const result = await redis.set(lockKey, lockId, 'EX', ttl, 'NX')
  return result === 'OK' ? lockId : null
}

export async function releaseLock(key: string, lockId: string): Promise<boolean> {
  const redis = getRedis()
  const lockKey = `lock:${key}`
  
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `
  
  const result = await redis.eval(script, 1, lockKey, lockId)
  return result === 1
}

// Bulk operations
export async function mget(keys: string[]): Promise<(string | null)[]> {
  if (keys.length === 0) return []
  
  const redis = getRedis()
  return await redis.mget(...keys)
}

export async function mset(keyValuePairs: [string, string][], ttl?: number): Promise<void> {
  if (keyValuePairs.length === 0) return
  
  const redis = getRedis()
  const pipeline = redis.pipeline()
  
  for (const [key, value] of keyValuePairs) {
    if (ttl) {
      pipeline.setex(key, ttl, value)
    } else {
      pipeline.set(key, value)
    }
  }
  
  await pipeline.exec()
}

export async function del(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0
  
  const redis = getRedis()
  return await redis.del(...keys)
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    const redis = getRedis()
    const result = await redis.ping()
    return result === 'PONG'
  } catch (error) {
    console.error('Redis health check failed:', error)
    return false
  }
}

// Cleanup and shutdown
export async function disconnect(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
  }
}

// Pub/Sub for real-time features
export class RedisPubSub {
  private publisher: Redis
  private subscriber: Redis
  private subscriptions: Map<string, Set<(message: any) => void>> = new Map()

  constructor() {
    this.publisher = createRedisInstance()
    this.subscriber = createRedisInstance()
    
    this.subscriber.on('message', (channel, message) => {
      const handlers = this.subscriptions.get(channel)
      if (handlers) {
        const parsedMessage = JSON.parse(message)
        handlers.forEach(handler => handler(parsedMessage))
      }
    })
  }

  async publish(channel: string, message: any): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(message))
  }

  subscribe(channel: string, handler: (message: any) => void): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set())
      this.subscriber.subscribe(channel)
    }
    
    this.subscriptions.get(channel)!.add(handler)
  }

  unsubscribe(channel: string, handler?: (message: any) => void): void {
    const handlers = this.subscriptions.get(channel)
    
    if (handlers) {
      if (handler) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.subscriptions.delete(channel)
          this.subscriber.unsubscribe(channel)
        }
      } else {
        this.subscriptions.delete(channel)
        this.subscriber.unsubscribe(channel)
      }
    }
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.publisher.quit(),
      this.subscriber.quit()
    ])
  }
}

// Real-time channels
export const CHANNELS = {
  NEW_REVIEW: (businessId: string) => `reviews:new:${businessId}`,
  REVIEW_RESPONSE: (businessId: string) => `reviews:response:${businessId}`,
  PLATFORM_STATUS: (businessId: string) => `platform:status:${businessId}`,
  NOTIFICATION: (userId: string) => `notifications:${userId}`,
  SYNC_UPDATE: (businessId: string) => `sync:update:${businessId}`,
}

// Singleton pub/sub instance
let pubSub: RedisPubSub | null = null

export function getPubSub(): RedisPubSub {
  if (!pubSub) {
    pubSub = new RedisPubSub()
  }
  return pubSub
}