import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'

const redis = new Redis({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  token: process.env.REDIS_TOKEN || '',
})

interface RateLimitConfig {
  requests: number
  window: number // seconds
}

const defaultConfig: RateLimitConfig = {
  requests: 100,
  window: 900, // 15 minutes
}

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...defaultConfig, ...config }
  }

  async limit(identifier: string): Promise<{
    success: boolean
    remaining: number
    resetTime: number
  }> {
    const key = `rate_limit:${identifier}`
    const now = Date.now()
    const window = this.config.window * 1000 // Convert to milliseconds

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline()
      
      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, now - window)
      
      // Count current requests
      pipeline.zcard(key)
      
      // Add current request
      pipeline.zadd(key, { score: now, member: now })
      
      // Set expiry
      pipeline.expire(key, this.config.window)
      
      const results = await pipeline.exec()
      const count = results[1] as number

      const remaining = Math.max(0, this.config.requests - count - 1)
      const resetTime = now + window

      return {
        success: count < this.config.requests,
        remaining,
        resetTime,
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      // Fail open - allow request if Redis is down
      return {
        success: true,
        remaining: this.config.requests - 1,
        resetTime: now + window,
      }
    }
  }
}

// Helper function to get client identifier
export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for proxies/CDNs)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0] || realIP || cfConnectingIP || 'anonymous'
  
  return ip
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // General API endpoints
  api: new RateLimiter({ requests: 100, window: 900 }), // 100 req/15min
  
  // Auth endpoints (more strict)
  auth: new RateLimiter({ requests: 10, window: 900 }), // 10 req/15min
  
  // Response collection (more lenient for widgets)
  responses: new RateLimiter({ requests: 1000, window: 3600 }), // 1000 req/hour
  
  // Admin operations (strict)
  admin: new RateLimiter({ requests: 50, window: 900 }), // 50 req/15min
  
  // Export operations (very strict)
  exports: new RateLimiter({ requests: 5, window: 3600 }), // 5 req/hour
}