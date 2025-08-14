import Redis from 'ioredis';

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  
  throw new Error('REDIS_URL is not defined');
};

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis(getRedisUrl());

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Redis utility functions
export const RedisKeys = {
  session: (sessionId: string) => `session:${sessionId}`,
  user: (userId: string) => `user:${userId}`,
  experiment: (experimentId: string) => `experiment:${experimentId}`,
  variant: (variantId: string) => `variant:${variantId}`,
  analytics: (projectId: string, date: string) => `analytics:${projectId}:${date}`,
  heatmap: (projectId: string, pageUrl: string) => `heatmap:${projectId}:${pageUrl}`,
  rateLimit: (ip: string, endpoint: string) => `rate_limit:${ip}:${endpoint}`,
  cache: (key: string) => `cache:${key}`,
};

export class RedisService {
  private redis: Redis;

  constructor() {
    this.redis = redis;
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
    const jsonValue = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, jsonValue);
    } else {
      await this.redis.set(key, jsonValue);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.redis.expire(key, ttl);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.redis.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.redis.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.redis.hgetall(key);
  }

  async sadd(key: string, member: string): Promise<void> {
    await this.redis.sadd(key, member);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.redis.sismember(key, member);
    return result === 1;
  }

  async smembers(key: string): Promise<string[]> {
    return await this.redis.smembers(key);
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.redis.zadd(key, score, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.redis.zrange(key, start, stop);
  }

  async zrangebyscore(key: string, min: string | number, max: string | number): Promise<string[]> {
    return await this.redis.zrangebyscore(key, min, max);
  }

  async pipeline(): Promise<Redis.Pipeline> {
    return this.redis.pipeline();
  }
}

export const redisService = new RedisService();