import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Check database connectivity
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbTime = Date.now() - dbStart

    // Check Redis connectivity
    const redisStart = Date.now()
    await redis.ping()
    const redisTime = Date.now() - redisStart

    // Check OpenAI API (optional - not included in health check to avoid unnecessary API calls)

    const totalTime = Date.now() - startTime

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: 'healthy',
          responseTime: `${dbTime}ms`,
        },
        redis: {
          status: 'healthy',
          responseTime: `${redisTime}ms`,
        },
      },
      responseTime: `${totalTime}ms`,
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100,
      },
    }

    return NextResponse.json(health, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        checks: {
          database: { status: 'unknown' },
          redis: { status: 'unknown' },
        },
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  }
}

// Detailed health check for internal monitoring
export async function POST() {
  try {
    const checks = {
      database: await checkDatabase(),
      redis: await checkRedis(),
      disk: await checkDiskSpace(),
      memory: getMemoryUsage(),
    }

    const allHealthy = Object.values(checks).every(check => check.status === 'healthy')

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}

async function checkDatabase() {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - start

    // Get basic stats
    const userCount = await prisma.user.count()
    const orgCount = await prisma.organization.count()

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      stats: {
        users: userCount,
        organizations: orgCount,
      },
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed',
    }
  }
}

async function checkRedis() {
  try {
    const start = Date.now()
    const pong = await redis.ping()
    const responseTime = Date.now() - start

    const info = await redis.info('memory')
    const memoryUsed = info.match(/used_memory_human:(.+)/)?.[1]?.trim()

    return {
      status: pong === 'PONG' ? 'healthy' : 'unhealthy',
      responseTime: `${responseTime}ms`,
      stats: {
        memoryUsed,
      },
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Redis connection failed',
    }
  }
}

async function checkDiskSpace() {
  // Note: This is a simplified check. In production, you might use fs.statSync
  return {
    status: 'healthy',
    message: 'Disk space check not implemented in this environment',
  }
}

function getMemoryUsage() {
  const usage = process.memoryUsage()
  const memoryThreshold = 1024 * 1024 * 1024 // 1GB

  return {
    status: usage.heapUsed < memoryThreshold ? 'healthy' : 'warning',
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
  }
}