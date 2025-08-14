import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/prisma'
import { Redis } from 'ioredis'

let redis: Redis | null = null
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL)
  } catch (error) {
    console.warn('Redis connection failed in health check:', error)
  }
}

export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, { status: 'healthy' | 'unhealthy', latency?: number, error?: string }> = {}

  // Database health check
  try {
    const dbStart = Date.now()
    const dbHealth = await testConnection()
    checks.database = {
      status: dbHealth.success ? 'healthy' : 'unhealthy',
      latency: Date.now() - dbStart,
      ...(dbHealth.error && { error: dbHealth.error })
    }
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }

  // Redis health check
  if (redis) {
    try {
      const redisStart = Date.now()
      await redis.ping()
      checks.redis = {
        status: 'healthy',
        latency: Date.now() - redisStart
      }
    } catch (error) {
      checks.redis = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown Redis error'
      }
    }
  } else {
    checks.redis = {
      status: 'unhealthy',
      error: 'Redis not configured or connection failed'
    }
  }

  // Memory usage check
  const memUsage = process.memoryUsage()
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  }

  checks.memory = {
    status: memUsageMB.heapUsed < 1000 ? 'healthy' : 'unhealthy', // Alert if using more than 1GB
    ...memUsageMB
  }

  // Overall health status
  const overallStatus = Object.values(checks).every(check => check.status === 'healthy') 
    ? 'healthy' 
    : 'unhealthy'

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'unknown',
    uptime: process.uptime(),
    responseTime: Date.now() - startTime,
    checks,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid
    }
  }

  // Return 503 if unhealthy, 200 if healthy
  const statusCode = overallStatus === 'healthy' ? 200 : 503
  
  return NextResponse.json(response, { status: statusCode })
}

// Simple ping endpoint for basic health checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}