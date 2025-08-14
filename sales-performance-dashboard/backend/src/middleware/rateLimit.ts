import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { createClient } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

// Redis client for distributed rate limiting
let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Redis client
const initializeRedis = async () => {
  if (!redisClient) {
    redisClient = createClient({ url: config.redis.url });
    
    redisClient.on('error', (err) => {
      logger.error('Redis rate limit client error:', err);
      redisClient = null; // Fall back to memory store
    });

    try {
      await redisClient.connect();
      logger.info('Rate limit Redis client connected');
    } catch (error) {
      logger.error('Failed to connect rate limit Redis client:', error);
      redisClient = null;
    }
  }
};

// Custom key generator that considers user context
const keyGenerator = (req: Request): string => {
  const user = (req as any).user;
  
  if (user) {
    // Authenticated users: rate limit by user ID
    return `rate_limit:user:${user.id}`;
  }
  
  // Unauthenticated users: rate limit by IP
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
  return `rate_limit:ip:${ip}`;
};

// Redis store for rate limiting
class RedisStore {
  private prefix: string;

  constructor(prefix: string = 'rl:') {
    this.prefix = prefix;
  }

  async increment(key: string, ttl: number): Promise<{ totalHits: number; timeToExpire: number }> {
    if (!redisClient) {
      throw new Error('Redis client not available');
    }

    const fullKey = `${this.prefix}${key}`;
    
    try {
      const current = await redisClient.get(fullKey);
      
      if (current) {
        const totalHits = await redisClient.incr(fullKey);
        const timeToExpire = await redisClient.ttl(fullKey);
        
        return {
          totalHits,
          timeToExpire: timeToExpire > 0 ? timeToExpire : ttl,
        };
      } else {
        await redisClient.setEx(fullKey, ttl, '1');
        return {
          totalHits: 1,
          timeToExpire: ttl,
        };
      }
    } catch (error) {
      logger.error('Redis rate limit error:', error);
      throw error;
    }
  }

  async decrement(key: string): Promise<void> {
    if (!redisClient) return;

    const fullKey = `${this.prefix}${key}`;
    
    try {
      await redisClient.decr(fullKey);
    } catch (error) {
      logger.error('Redis rate limit decrement error:', error);
    }
  }

  async reset(key: string): Promise<void> {
    if (!redisClient) return;

    const fullKey = `${this.prefix}${key}`;
    
    try {
      await redisClient.del(fullKey);
    } catch (error) {
      logger.error('Redis rate limit reset error:', error);
    }
  }
}

// Initialize Redis on module load
initializeRedis();

// Default rate limiting configuration
const defaultConfig = {
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.maxRequests, // Limit each user to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator,
  handler: (req: Request, res: Response) => {
    const user = (req as any).user;
    logger.warn('Rate limit exceeded', {
      userId: user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
    });

    throw new AppError(
      'Too many requests. Please try again later.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  },
};

// Create rate limiter with Redis store if available
const createRateLimiter = (options: any = {}) => {
  const config = { ...defaultConfig, ...options };
  
  if (redisClient) {
    // Use Redis store for distributed rate limiting
    const store = new RedisStore();
    
    return rateLimit({
      ...config,
      store: {
        incr: async (key: string, cb: Function) => {
          try {
            const result = await store.increment(key, Math.ceil(config.windowMs / 1000));
            cb(null, result.totalHits, new Date(Date.now() + result.timeToExpire * 1000));
          } catch (error) {
            cb(error);
          }
        },
        decrement: async (key: string) => {
          await store.decrement(key);
        },
        resetKey: async (key: string) => {
          await store.reset(key);
        },
      },
    });
  } else {
    // Fall back to memory store
    logger.warn('Using memory store for rate limiting - not suitable for production clusters');
    return rateLimit(config);
  }
};

// Export default rate limiter
export const rateLimitMiddleware = createRateLimiter();

// Strict rate limiter for authentication endpoints
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each user to 5 requests per windowMs for auth endpoints
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
});

// Lenient rate limiter for read operations
export const readRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for read operations
  message: {
    error: {
      code: 'READ_RATE_LIMIT_EXCEEDED',
      message: 'Too many read requests. Please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
});

// Strict rate limiter for write operations
export const writeRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Lower limit for write operations
  message: {
    error: {
      code: 'WRITE_RATE_LIMIT_EXCEEDED',
      message: 'Too many write requests. Please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
});

// Rate limiter for file uploads
export const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit file uploads
  message: {
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many file uploads. Please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
});

// Rate limiter for webhook endpoints
export const webhookRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Allow more frequent webhook calls
  keyGenerator: (req: Request) => {
    // Rate limit webhooks by source IP and endpoint
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
    return `webhook:${ip}:${req.originalUrl}`;
  },
  message: {
    error: {
      code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
      message: 'Too many webhook requests.',
      timestamp: new Date().toISOString(),
    },
  },
});

// Dynamic rate limiter based on user plan
export const planBasedRateLimit = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  const organization = (req as any).organization;
  
  if (!organization) {
    return next();
  }

  // Define limits based on subscription plan
  const planLimits: Record<string, { windowMs: number; max: number }> = {
    starter: { windowMs: 15 * 60 * 1000, max: 100 },
    professional: { windowMs: 15 * 60 * 1000, max: 500 },
    enterprise: { windowMs: 15 * 60 * 1000, max: 2000 },
  };

  const planLimit = planLimits[organization.plan] || planLimits.starter;
  
  const dynamicLimiter = createRateLimiter({
    ...planLimit,
    keyGenerator: () => `plan:${organization.id}`,
    message: {
      error: {
        code: 'PLAN_RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded for ${organization.plan} plan. Please upgrade for higher limits.`,
        timestamp: new Date().toISOString(),
      },
    },
  });

  return dynamicLimiter(req, res, next);
};

// Cleanup function for graceful shutdown
export const cleanup = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Rate limit Redis client disconnected');
    } catch (error) {
      logger.error('Error disconnecting rate limit Redis client:', error);
    }
  }
};