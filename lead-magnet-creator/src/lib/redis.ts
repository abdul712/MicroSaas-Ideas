import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Rate limiting utility
export async function rateLimit(key: string, limit: number, window: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now()
  const resetTime = now + window * 1000
  
  const multi = redis.multi()
  multi.zadd(key, now, now)
  multi.zremrangebyscore(key, 0, now - window * 1000)
  multi.zcard(key)
  multi.expire(key, window)
  
  const results = await multi.exec()
  const count = results?.[2]?.[1] as number || 0
  
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetTime,
  }
}

// Session management
export async function setUserSession(userId: string, sessionData: any, ttl: number = 3600) {
  await redis.setex(`session:${userId}`, ttl, JSON.stringify(sessionData))
}

export async function getUserSession(userId: string) {
  const data = await redis.get(`session:${userId}`)
  return data ? JSON.parse(data) : null
}

export async function deleteUserSession(userId: string) {
  await redis.del(`session:${userId}`)
}

// Caching utilities
export async function setCache(key: string, value: any, ttl: number = 300) {
  await redis.setex(key, ttl, JSON.stringify(value))
}

export async function getCache(key: string) {
  const data = await redis.get(key)
  return data ? JSON.parse(data) : null
}

export async function deleteCache(key: string) {
  await redis.del(key)
}

// Real-time features
export async function publishEvent(channel: string, data: any) {
  await redis.publish(channel, JSON.stringify(data))
}

export function subscribeToEvents(channels: string[], callback: (channel: string, message: any) => void) {
  const subscriber = redis.duplicate()
  subscriber.subscribe(...channels)
  
  subscriber.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message)
      callback(channel, data)
    } catch (error) {
      console.error('Error parsing message:', error)
    }
  })
  
  return subscriber
}