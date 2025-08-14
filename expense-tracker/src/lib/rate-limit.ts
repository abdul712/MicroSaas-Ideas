import { Redis } from 'ioredis'

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')

// Redis client for rate limiting (fallback to memory if Redis not available)
let redis: Redis | null = null

try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
    })
    
    redis.on('error', (err) => {
      console.warn('Redis connection error, falling back to memory rate limiting:', err.message)
      redis = null
    })
  }
} catch (error) {
  console.warn('Failed to initialize Redis, using memory rate limiting:', error)
}

// In-memory fallback for rate limiting
const memoryStore = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries from memory store
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of memoryStore.entries()) {
    if (now > value.resetTime) {
      memoryStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export class RateLimit {
  private windowMs: number
  private maxRequests: number

  constructor(windowMs = RATE_LIMIT_WINDOW_MS, maxRequests = RATE_LIMIT_MAX_REQUESTS) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    const resetTime = now + this.windowMs
    const key = `ratelimit:${identifier}`

    try {
      if (redis) {
        return await this.redisLimit(key, now, resetTime)
      } else {
        return this.memoryLimit(key, now, resetTime)
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      // On error, allow the request to proceed
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: resetTime,
      }
    }
  }

  private async redisLimit(key: string, now: number, resetTime: number): Promise<RateLimitResult> {
    const pipeline = redis!.pipeline()
    
    // Increment the counter
    pipeline.incr(key)
    
    // Set expiration if this is a new key
    pipeline.expire(key, Math.ceil(this.windowMs / 1000))
    
    // Get the TTL to calculate reset time
    pipeline.ttl(key)
    
    const results = await pipeline.exec()
    
    if (!results) {
      throw new Error('Redis pipeline failed')
    }

    const count = results[0][1] as number
    const ttl = results[2][1] as number
    
    const actualResetTime = ttl > 0 ? now + (ttl * 1000) : resetTime

    return {
      success: count <= this.maxRequests,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - count),
      reset: actualResetTime,
    }
  }

  private memoryLimit(key: string, now: number, resetTime: number): RateLimitResult {
    const existing = memoryStore.get(key)

    if (!existing || now > existing.resetTime) {
      // Create new entry or reset expired entry
      memoryStore.set(key, { count: 1, resetTime })
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: resetTime,
      }
    }

    // Increment existing entry
    existing.count++
    memoryStore.set(key, existing)

    return {
      success: existing.count <= this.maxRequests,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - existing.count),
      reset: existing.resetTime,
    }
  }

  // Different rate limits for different endpoints
  static api = new RateLimit(900000, 100) // 100 requests per 15 minutes for general API
  static auth = new RateLimit(900000, 5)  // 5 login attempts per 15 minutes
  static upload = new RateLimit(3600000, 50) // 50 uploads per hour
  static ocr = new RateLimit(3600000, 100) // 100 OCR processes per hour
}

// Default instance
export const ratelimit = RateLimit.api

// Specific rate limiters
export const authRateLimit = RateLimit.auth
export const uploadRateLimit = RateLimit.upload
export const ocrRateLimit = RateLimit.ocr

// Utility function for API routes
export async function withRateLimit(
  req: any,
  rateLimiter = ratelimit,
  identifier?: string
) {
  const clientIp = identifier || 
    req.headers['x-forwarded-for']?.split(',')[0] || 
    req.headers['x-real-ip'] || 
    req.connection?.remoteAddress || 
    'unknown'

  const result = await rateLimiter.limit(clientIp)
  
  if (!result.success) {
    const error = new Error('Rate limit exceeded')
    ;(error as any).status = 429
    ;(error as any).headers = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.reset).toISOString(),
    }
    throw error
  }

  return result
}

export default ratelimit