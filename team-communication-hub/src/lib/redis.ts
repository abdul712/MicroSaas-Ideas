import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? 
  new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    lazyConnect: true,
    // Connection timeout
    connectTimeout: 10000,
    commandTimeout: 5000,
    // Reconnection
    reconnectOnError: (err) => {
      const targetError = "READONLY";
      return err.message.includes(targetError);
    },
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// Redis key prefixes for organization
export const REDIS_KEYS = {
  // User session and presence
  USER_SESSION: (userId: string) => `session:${userId}`,
  USER_PRESENCE: (userId: string) => `presence:${userId}`,
  USER_TYPING: (channelId: string, userId: string) => `typing:${channelId}:${userId}`,
  
  // Team and channel data
  TEAM_MEMBERS: (teamId: string) => `team:${teamId}:members`,
  CHANNEL_MEMBERS: (channelId: string) => `channel:${channelId}:members`,
  CHANNEL_MESSAGES: (channelId: string) => `messages:${channelId}`,
  
  // Real-time features
  SOCKET_SESSIONS: (userId: string) => `sockets:${userId}`,
  TEAM_SOCKETS: (teamId: string) => `team:${teamId}:sockets`,
  
  // Rate limiting
  RATE_LIMIT: (identifier: string, action: string) => `rate:${action}:${identifier}`,
  
  // Caching
  CACHE_USER: (userId: string) => `cache:user:${userId}`,
  CACHE_TEAM: (teamId: string) => `cache:team:${teamId}`,
  CACHE_CHANNEL: (channelId: string) => `cache:channel:${channelId}`,
  
  // Message queues
  QUEUE_NOTIFICATIONS: "queue:notifications",
  QUEUE_EMAIL: "queue:email",
  QUEUE_WEBHOOKS: "queue:webhooks",
} as const;

// Cache utilities
export class RedisCache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  static async set(key: string, value: any, expirationSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (expirationSeconds) {
        await redis.setex(key, expirationSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  static async expire(key: string, seconds: number): Promise<boolean> {
    try {
      await redis.expire(key, seconds);
      return true;
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }
}

// Presence management
export class PresenceManager {
  static async setUserOnline(userId: string, metadata?: any): Promise<void> {
    const key = REDIS_KEYS.USER_PRESENCE(userId);
    const presence = {
      status: "online",
      lastSeen: new Date().toISOString(),
      ...metadata,
    };
    await redis.setex(key, 300, JSON.stringify(presence)); // 5 minute expiry
  }

  static async setUserOffline(userId: string): Promise<void> {
    const key = REDIS_KEYS.USER_PRESENCE(userId);
    const presence = {
      status: "offline",
      lastSeen: new Date().toISOString(),
    };
    await redis.setex(key, 3600, JSON.stringify(presence)); // 1 hour expiry
  }

  static async getUserPresence(userId: string): Promise<any> {
    return RedisCache.get(REDIS_KEYS.USER_PRESENCE(userId));
  }

  static async getUsersPresence(userIds: string[]): Promise<Record<string, any>> {
    const pipeline = redis.pipeline();
    userIds.forEach(userId => {
      pipeline.get(REDIS_KEYS.USER_PRESENCE(userId));
    });
    
    const results = await pipeline.exec();
    const presence: Record<string, any> = {};
    
    results?.forEach((result, index) => {
      const userId = userIds[index];
      try {
        presence[userId] = result[1] ? JSON.parse(result[1] as string) : null;
      } catch {
        presence[userId] = null;
      }
    });
    
    return presence;
  }
}

// Rate limiting
export class RateLimiter {
  static async checkRateLimit(
    identifier: string, 
    action: string, 
    limit: number, 
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = REDIS_KEYS.RATE_LIMIT(identifier, action);
    
    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      
      const ttl = await redis.ttl(key);
      const resetTime = Date.now() + (ttl * 1000);
      
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime,
      };
    } catch (error) {
      console.error("Rate limiting error:", error);
      // On error, allow the request
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + (windowSeconds * 1000),
      };
    }
  }
}

// Typing indicators
export class TypingManager {
  static async setUserTyping(channelId: string, userId: string): Promise<void> {
    const key = REDIS_KEYS.USER_TYPING(channelId, userId);
    await redis.setex(key, 10, "1"); // 10 second expiry
  }

  static async removeUserTyping(channelId: string, userId: string): Promise<void> {
    const key = REDIS_KEYS.USER_TYPING(channelId, userId);
    await redis.del(key);
  }

  static async getTypingUsers(channelId: string): Promise<string[]> {
    const pattern = REDIS_KEYS.USER_TYPING(channelId, "*");
    const keys = await redis.keys(pattern);
    return keys.map(key => key.split(":").pop()!).filter(Boolean);
  }
}

// Health check
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error("Redis connection failed:", error);
    return false;
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  redis.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  redis.disconnect();
  process.exit(0);
});