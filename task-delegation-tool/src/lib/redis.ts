import Redis, { RedisOptions } from 'ioredis'

// Redis client configuration
const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
}

// Main Redis client for general use
export const redis = new Redis(redisConfig)

// Separate client for pub/sub (recommended by ioredis)
export const redisPub = new Redis(redisConfig)
export const redisSub = new Redis(redisConfig)

// Redis key prefixes for organization
export const REDIS_KEYS = {
  // Real-time features
  TASK_UPDATES: 'task:updates:',
  USER_PRESENCE: 'user:presence:',
  ORGANIZATION_ACTIVITY: 'org:activity:',
  
  // Caching
  USER_CACHE: 'cache:user:',
  TASK_CACHE: 'cache:task:',
  ORGANIZATION_CACHE: 'cache:org:',
  
  // AI features
  AI_INSIGHTS: 'ai:insights:',
  WORKLOAD_CACHE: 'ai:workload:',
  PERFORMANCE_CACHE: 'ai:performance:',
  
  // Rate limiting
  RATE_LIMIT: 'rate:limit:',
  
  // Sessions and notifications
  USER_SESSIONS: 'session:',
  NOTIFICATIONS_QUEUE: 'notifications:queue',
  
  // Real-time collaboration
  TASK_COLLABORATION: 'collab:task:',
  TEAM_ACTIVITY: 'team:activity:',
}

// Utility functions for common Redis operations
export class RedisService {
  
  // Cache management
  static async setCache(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Redis setCache error:', error)
    }
  }

  static async getCache<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Redis getCache error:', error)
      return null
    }
  }

  static async deleteCache(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Redis deleteCache error:', error)
    }
  }

  static async deleteCachePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Redis deleteCachePattern error:', error)
    }
  }

  // User presence tracking
  static async setUserPresence(userId: string, organizationId: string, data: {
    status: 'online' | 'away' | 'busy' | 'offline'
    lastActivity: Date
    currentPage?: string
    currentTask?: string
  }): Promise<void> {
    try {
      const key = `${REDIS_KEYS.USER_PRESENCE}${organizationId}:${userId}`
      await redis.setex(key, 300, JSON.stringify({ // 5 minutes TTL
        ...data,
        timestamp: new Date(),
      }))

      // Also track in organization-wide presence
      await redis.zadd(
        `${REDIS_KEYS.ORGANIZATION_ACTIVITY}${organizationId}`,
        Date.now(),
        userId
      )
    } catch (error) {
      console.error('Redis setUserPresence error:', error)
    }
  }

  static async getUserPresence(userId: string, organizationId: string): Promise<any> {
    try {
      const key = `${REDIS_KEYS.USER_PRESENCE}${organizationId}:${userId}`
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Redis getUserPresence error:', error)
      return null
    }
  }

  static async getActiveUsers(organizationId: string, limit: number = 50): Promise<string[]> {
    try {
      const key = `${REDIS_KEYS.ORGANIZATION_ACTIVITY}${organizationId}`
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      
      // Get users active in the last 5 minutes
      return await redis.zrevrangebyscore(key, '+inf', fiveMinutesAgo, 'LIMIT', 0, limit)
    } catch (error) {
      console.error('Redis getActiveUsers error:', error)
      return []
    }
  }

  // Real-time task updates
  static async publishTaskUpdate(taskId: string, update: {
    type: string
    userId: string
    data: any
    timestamp: Date
  }): Promise<void> {
    try {
      const channel = `${REDIS_KEYS.TASK_UPDATES}${taskId}`
      await redisPub.publish(channel, JSON.stringify(update))
    } catch (error) {
      console.error('Redis publishTaskUpdate error:', error)
    }
  }

  static async subscribeToTaskUpdates(taskId: string, callback: (update: any) => void): Promise<() => void> {
    try {
      const channel = `${REDIS_KEYS.TASK_UPDATES}${taskId}`
      
      redisSub.subscribe(channel)
      redisSub.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const update = JSON.parse(message)
            callback(update)
          } catch (error) {
            console.error('Error parsing task update:', error)
          }
        }
      })

      // Return unsubscribe function
      return () => {
        redisSub.unsubscribe(channel)
      }
    } catch (error) {
      console.error('Redis subscribeToTaskUpdates error:', error)
      return () => {}
    }
  }

  // Rate limiting
  static async checkRateLimit(key: string, limit: number, window: number): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    try {
      const fullKey = `${REDIS_KEYS.RATE_LIMIT}${key}`
      const current = await redis.incr(fullKey)
      
      if (current === 1) {
        await redis.expire(fullKey, window)
      }
      
      const ttl = await redis.ttl(fullKey)
      const remaining = Math.max(0, limit - current)
      const resetTime = Date.now() + (ttl * 1000)
      
      return {
        allowed: current <= limit,
        remaining,
        resetTime
      }
    } catch (error) {
      console.error('Redis checkRateLimit error:', error)
      return { allowed: true, remaining: limit, resetTime: Date.now() + window * 1000 }
    }
  }

  // AI insights caching
  static async cacheAIInsights(taskId: string, insights: any): Promise<void> {
    try {
      const key = `${REDIS_KEYS.AI_INSIGHTS}${taskId}`
      await redis.setex(key, 1800, JSON.stringify(insights)) // 30 minutes cache
    } catch (error) {
      console.error('Redis cacheAIInsights error:', error)
    }
  }

  static async getAIInsights(taskId: string): Promise<any> {
    try {
      const key = `${REDIS_KEYS.AI_INSIGHTS}${taskId}`
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Redis getAIInsights error:', error)
      return null
    }
  }

  // Workload tracking
  static async updateUserWorkload(userId: string, workload: {
    activeTasks: number
    completedToday: number
    cognitiveLoad: number
    lastUpdated: Date
  }): Promise<void> {
    try {
      const key = `${REDIS_KEYS.WORKLOAD_CACHE}${userId}`
      await redis.setex(key, 3600, JSON.stringify(workload)) // 1 hour cache
    } catch (error) {
      console.error('Redis updateUserWorkload error:', error)
    }
  }

  static async getUserWorkload(userId: string): Promise<any> {
    try {
      const key = `${REDIS_KEYS.WORKLOAD_CACHE}${userId}`
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Redis getUserWorkload error:', error)
      return null
    }
  }

  // Notification queue management
  static async queueNotification(notification: {
    userId: string
    type: string
    title: string
    message: string
    data?: any
    channels: ('email' | 'push' | 'slack')[]
  }): Promise<void> {
    try {
      await redis.lpush(REDIS_KEYS.NOTIFICATIONS_QUEUE, JSON.stringify({
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      }))
    } catch (error) {
      console.error('Redis queueNotification error:', error)
    }
  }

  static async processNotificationQueue(): Promise<any[]> {
    try {
      const notifications = []
      let notification

      // Process up to 10 notifications at a time
      for (let i = 0; i < 10; i++) {
        notification = await redis.rpop(REDIS_KEYS.NOTIFICATIONS_QUEUE)
        if (!notification) break
        
        try {
          notifications.push(JSON.parse(notification))
        } catch (error) {
          console.error('Error parsing notification:', error)
        }
      }

      return notifications
    } catch (error) {
      console.error('Redis processNotificationQueue error:', error)
      return []
    }
  }

  // Session management
  static async setUserSession(userId: string, sessionData: any, ttl: number = 86400): Promise<void> {
    try {
      const key = `${REDIS_KEYS.USER_SESSIONS}${userId}`
      await redis.setex(key, ttl, JSON.stringify(sessionData))
    } catch (error) {
      console.error('Redis setUserSession error:', error)
    }
  }

  static async getUserSession(userId: string): Promise<any> {
    try {
      const key = `${REDIS_KEYS.USER_SESSIONS}${userId}`
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Redis getUserSession error:', error)
      return null
    }
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      await redis.ping()
      return true
    } catch (error) {
      console.error('Redis health check failed:', error)
      return false
    }
  }

  // Cleanup expired keys (run periodically)
  static async cleanup(): Promise<void> {
    try {
      // Clean up expired presence data
      const organizationKeys = await redis.keys(`${REDIS_KEYS.ORGANIZATION_ACTIVITY}*`)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      
      for (const key of organizationKeys) {
        await redis.zremrangebyscore(key, 0, fiveMinutesAgo)
      }
    } catch (error) {
      console.error('Redis cleanup error:', error)
    }
  }
}

// Connection event handlers
redis.on('connect', () => {
  console.log('Redis connected')
})

redis.on('ready', () => {
  console.log('Redis ready')
})

redis.on('error', (error) => {
  console.error('Redis error:', error)
})

redis.on('close', () => {
  console.log('Redis connection closed')
})

// Graceful shutdown
export async function disconnectRedis(): Promise<void> {
  await Promise.all([
    redis.disconnect(),
    redisPub.disconnect(),
    redisSub.disconnect(),
  ])
}