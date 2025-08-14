import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

redis.on('connect', () => {
  console.log('🔗 Redis connected successfully')
})

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err)
})

redis.on('ready', () => {
  console.log('✅ Redis ready for operations')
})

// Cache utilities
export const cache = {
  // Get cached data
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },

  // Set cached data with optional TTL
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized)
      } else {
        await redis.set(key, serialized)
      }
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  },

  // Delete cached data
  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  },

  // Get multiple keys
  async mget(keys: string[]): Promise<(any | null)[]> {
    try {
      const data = await redis.mget(keys)
      return data.map((item) => (item ? JSON.parse(item) : null))
    } catch (error) {
      console.error('Cache mget error:', error)
      return keys.map(() => null)
    }
  },

  // Set multiple key-value pairs
  async mset(data: Record<string, any>, ttlSeconds?: number): Promise<boolean> {
    try {
      const pipeline = redis.pipeline()
      
      Object.entries(data).forEach(([key, value]) => {
        const serialized = JSON.stringify(value)
        if (ttlSeconds) {
          pipeline.setex(key, ttlSeconds, serialized)
        } else {
          pipeline.set(key, serialized)
        }
      })

      await pipeline.exec()
      return true
    } catch (error) {
      console.error('Cache mset error:', error)
      return false
    }
  },

  // Increment counter
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const result = await redis.incr(key)
      if (ttlSeconds && result === 1) {
        await redis.expire(key, ttlSeconds)
      }
      return result
    } catch (error) {
      console.error('Cache incr error:', error)
      return 0
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  },

  // Set expiration for key
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await redis.expire(key, ttlSeconds)
      return result === 1
    } catch (error) {
      console.error('Cache expire error:', error)
      return false
    }
  },

  // Get TTL for key
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key)
    } catch (error) {
      console.error('Cache ttl error:', error)
      return -1
    }
  },
}

// Rate limiting utilities
export const rateLimiter = {
  // Check and increment rate limit
  async check(identifier: string, limit: number, windowMs: number): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    const key = `rate_limit:${identifier}`
    const window = Math.floor(Date.now() / windowMs)
    const windowKey = `${key}:${window}`

    try {
      const current = await redis.incr(windowKey)
      
      if (current === 1) {
        await redis.expire(windowKey, Math.ceil(windowMs / 1000))
      }

      const allowed = current <= limit
      const remaining = Math.max(0, limit - current)
      const resetTime = (window + 1) * windowMs

      return {
        allowed,
        remaining,
        resetTime,
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: limit,
        resetTime: Date.now() + windowMs,
      }
    }
  },

  // Get current rate limit status
  async status(identifier: string, limit: number, windowMs: number): Promise<{
    remaining: number
    resetTime: number
  }> {
    const key = `rate_limit:${identifier}`
    const window = Math.floor(Date.now() / windowMs)
    const windowKey = `${key}:${window}`

    try {
      const current = await redis.get(windowKey)
      const used = current ? parseInt(current, 10) : 0
      const remaining = Math.max(0, limit - used)
      const resetTime = (window + 1) * windowMs

      return {
        remaining,
        resetTime,
      }
    } catch (error) {
      console.error('Rate limiter status error:', error)
      return {
        remaining: limit,
        resetTime: Date.now() + windowMs,
      }
    }
  },
}

// Session utilities
export const session = {
  // Store session data
  async set(sessionId: string, data: any, ttlSeconds: number = 3600): Promise<boolean> {
    const key = `session:${sessionId}`
    return cache.set(key, data, ttlSeconds)
  },

  // Get session data
  async get<T>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`
    return cache.get<T>(key)
  },

  // Delete session
  async del(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`
    return cache.del(key)
  },

  // Extend session TTL
  async extend(sessionId: string, ttlSeconds: number = 3600): Promise<boolean> {
    const key = `session:${sessionId}`
    return cache.expire(key, ttlSeconds)
  },
}

// Real-time features
export const realtime = {
  // Publish message to channel
  async publish(channel: string, message: any): Promise<number> {
    try {
      const serialized = JSON.stringify(message)
      return await redis.publish(channel, serialized)
    } catch (error) {
      console.error('Realtime publish error:', error)
      return 0
    }
  },

  // Subscribe to channel
  subscribe(channel: string, callback: (message: any) => void): void {
    const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    
    subscriber.subscribe(channel)
    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const parsed = JSON.parse(message)
          callback(parsed)
        } catch (error) {
          console.error('Realtime message parse error:', error)
          callback(message)
        }
      }
    })

    subscriber.on('error', (err) => {
      console.error('Realtime subscriber error:', err)
    })
  },
}

// Queue utilities (for background jobs)
export const queue = {
  // Add job to queue
  async add(queueName: string, jobData: any, options?: {
    delay?: number
    attempts?: number
    priority?: number
  }): Promise<boolean> {
    try {
      const key = `queue:${queueName}`
      const job = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: jobData,
        attempts: options?.attempts || 3,
        priority: options?.priority || 0,
        createdAt: new Date().toISOString(),
        processAt: options?.delay ? new Date(Date.now() + options.delay).toISOString() : new Date().toISOString(),
      }

      await redis.lpush(key, JSON.stringify(job))
      return true
    } catch (error) {
      console.error('Queue add error:', error)
      return false
    }
  },

  // Get next job from queue
  async next<T>(queueName: string): Promise<T | null> {
    try {
      const key = `queue:${queueName}`
      const result = await redis.brpop(key, 10) // 10 second timeout
      
      if (result) {
        return JSON.parse(result[1])
      }
      return null
    } catch (error) {
      console.error('Queue next error:', error)
      return null
    }
  },

  // Get queue length
  async length(queueName: string): Promise<number> {
    try {
      const key = `queue:${queueName}`
      return await redis.llen(key)
    } catch (error) {
      console.error('Queue length error:', error)
      return 0
    }
  },
}

export default redis