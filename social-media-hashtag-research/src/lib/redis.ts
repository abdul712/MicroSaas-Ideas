import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Rate limiting functions
export async function checkRateLimit(
  identifier: string,
  limit: number,
  window: number
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  const windowStart = now - window * 1000

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart)

  // Count current requests
  const requestCount = await redis.zcard(key)

  if (requestCount >= limit) {
    const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES')
    const resetTime = oldestRequest.length > 0 ? 
      parseInt(oldestRequest[1] as string) + window * 1000 : 
      now + window * 1000

    return {
      success: false,
      remaining: 0,
      resetTime
    }
  }

  // Add current request
  await redis.zadd(key, now, now)
  await redis.expire(key, window)

  return {
    success: true,
    remaining: limit - requestCount - 1,
    resetTime: now + window * 1000
  }
}

// Caching functions
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Redis get error:', error)
    return null
  }
}

export async function setCachedData(
  key: string,
  data: any,
  ttl: number = 3600
): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(data))
  } catch (error) {
    console.error('Redis set error:', error)
  }
}

export async function deleteCachedData(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Redis delete error:', error)
  }
}

// Session management
export async function setUserSession(
  userId: string,
  sessionData: any,
  ttl: number = 86400
): Promise<void> {
  const key = `session:${userId}`
  await setCachedData(key, sessionData, ttl)
}

export async function getUserSession(userId: string): Promise<any | null> {
  const key = `session:${userId}`
  return await getCachedData(key)
}

export async function clearUserSession(userId: string): Promise<void> {
  const key = `session:${userId}`
  await deleteCachedData(key)
}