import { NextRequest } from 'next/server';

interface RateLimitOptions {
  interval: number; // Time window in seconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

interface RateLimitResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  resetTime?: number;
  retryAfter?: number;
}

// In-memory store for development (use Redis in production)
const tokenCache = new Map<string, { count: number; resetTime: number }>();

// Rate limit configurations for different endpoints
const rateLimitConfigs: Record<string, RateLimitOptions> = {
  // Authentication endpoints - strict limits
  '/api/auth': { interval: 900, uniqueTokenPerInterval: 5 }, // 5 requests per 15 minutes
  
  // Receipt upload - moderate limits
  '/api/receipts/upload': { interval: 60, uniqueTokenPerInterval: 10 }, // 10 uploads per minute
  
  // General API endpoints - generous limits
  '/api/expenses': { interval: 60, uniqueTokenPerInterval: 100 }, // 100 requests per minute
  '/api/reports': { interval: 60, uniqueTokenPerInterval: 20 }, // 20 reports per minute
  
  // Default for all other API routes
  default: { interval: 60, uniqueTokenPerInterval: 60 }, // 60 requests per minute
};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenCache.entries()) {
    if (now > value.resetTime) {
      tokenCache.delete(key);
    }
  }
}, 60000); // Clean up every minute

export async function rateLimit(
  request: NextRequest,
  options?: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    const { pathname } = request.nextUrl;
    
    // Determine rate limit configuration
    const config = options || getRateLimitConfig(pathname);
    
    // Generate unique identifier for the request
    const identifier = await getIdentifier(request);
    
    const now = Date.now();
    const windowStart = now - (config.interval * 1000);
    
    // Get or create token bucket
    let tokenBucket = tokenCache.get(identifier);
    
    if (!tokenBucket || now > tokenBucket.resetTime) {
      // Create new bucket or reset expired bucket
      tokenBucket = {
        count: 0,
        resetTime: now + (config.interval * 1000),
      };
    }
    
    // Check if limit exceeded
    if (tokenBucket.count >= config.uniqueTokenPerInterval) {
      const retryAfter = Math.ceil((tokenBucket.resetTime - now) / 1000);
      
      return {
        success: false,
        limit: config.uniqueTokenPerInterval,
        remaining: 0,
        resetTime: tokenBucket.resetTime,
        retryAfter,
      };
    }
    
    // Increment counter and update cache
    tokenBucket.count++;
    tokenCache.set(identifier, tokenBucket);
    
    return {
      success: true,
      limit: config.uniqueTokenPerInterval,
      remaining: config.uniqueTokenPerInterval - tokenBucket.count,
      resetTime: tokenBucket.resetTime,
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - allow request if rate limiting fails
    return { success: true };
  }
}

function getRateLimitConfig(pathname: string): RateLimitOptions {
  // Find matching configuration
  for (const [pattern, config] of Object.entries(rateLimitConfigs)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config;
    }
  }
  
  return rateLimitConfigs.default;
}

async function getIdentifier(request: NextRequest): Promise<string> {
  // Priority order for identifier:
  // 1. User ID from session (most specific)
  // 2. IP address (fallback)
  // 3. User agent + IP (for anonymous users)
  
  const userAgent = request.headers.get('user-agent') || '';
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  // Extract IP address
  let ip = realIp || 
    (forwardedFor && forwardedFor.split(',')[0].trim()) ||
    request.ip ||
    'unknown';
  
  // Remove IPv6 prefix if present
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  // Try to get user ID from authorization header or session
  const authHeader = request.headers.get('authorization');
  const userId = await getUserIdFromRequest(request);
  
  if (userId) {
    return `user:${userId}`;
  }
  
  // For anonymous users, use IP + User Agent hash
  const userAgentHash = await hashString(userAgent);
  return `anon:${ip}:${userAgentHash}`;
}

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Check for user ID in custom headers (set by middleware)
    const userIdHeader = request.headers.get('x-user-id');
    if (userIdHeader) {
      return userIdHeader;
    }
    
    // Could also check JWT token here if needed
    // const token = request.headers.get('authorization')?.replace('Bearer ', '');
    // if (token) {
    //   const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
    //   return decoded.sub;
    // }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8);
}

// Middleware factory for specific rate limits
export function createRateLimit(options: RateLimitOptions) {
  return (request: NextRequest) => rateLimit(request, options);
}

// Preset rate limiters for common use cases
export const authRateLimit = createRateLimit({
  interval: 900, // 15 minutes
  uniqueTokenPerInterval: 5,
});

export const uploadRateLimit = createRateLimit({
  interval: 60, // 1 minute
  uniqueTokenPerInterval: 10,
});

export const apiRateLimit = createRateLimit({
  interval: 60, // 1 minute
  uniqueTokenPerInterval: 100,
});

// Rate limit bypass for admin users (could be extended)
export function shouldBypassRateLimit(request: NextRequest): boolean {
  const userRole = request.headers.get('x-user-role');
  return userRole === 'SUPER_ADMIN';
}