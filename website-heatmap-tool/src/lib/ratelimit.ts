import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'

// Create a new ratelimiter that allows 100 requests per minute
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'heatmap_ratelimit',
})

// Stricter rate limit for API endpoints
export const apiRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(50, '1 m'),
  analytics: true,
  prefix: 'heatmap_api_ratelimit',
})

// Rate limit for authentication
export const authRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'heatmap_auth_ratelimit',
})