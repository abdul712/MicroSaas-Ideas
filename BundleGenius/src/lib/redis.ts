import Redis from "ioredis"

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  })

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis

// Cache keys
export const CACHE_KEYS = {
  BUNDLE_RECOMMENDATIONS: (storeId: string, productId: string) => 
    `recommendations:${storeId}:${productId}`,
  PRODUCT_ANALYTICS: (storeId: string, date: string) =>
    `analytics:product:${storeId}:${date}`,
  BUNDLE_ANALYTICS: (bundleId: string, date: string) =>
    `analytics:bundle:${bundleId}:${date}`,
  STORE_CONFIG: (storeId: string) =>
    `config:store:${storeId}`,
  ML_MODEL: (storeId: string, version: string) =>
    `ml:model:${storeId}:${version}`,
  PRICING_OPTIMIZATION: (bundleId: string) =>
    `pricing:${bundleId}`,
}

// Cache utilities
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  } catch (error) {
    console.error("Redis get error:", error)
    return null
  }
}

export const cacheSet = async <T>(
  key: string,
  value: T,
  ttl: number = 3600
): Promise<boolean> => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value))
    return true
  } catch (error) {
    console.error("Redis set error:", error)
    return false
  }
}

export const cacheDelete = async (key: string): Promise<boolean> => {
  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.error("Redis delete error:", error)
    return false
  }
}

export const cacheInvalidatePattern = async (pattern: string): Promise<number> => {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      return await redis.del(...keys)
    }
    return 0
  } catch (error) {
    console.error("Redis invalidate pattern error:", error)
    return 0
  }
}