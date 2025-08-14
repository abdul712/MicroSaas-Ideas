import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import redis from '@/lib/redis'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      ai: 'unknown',
    },
    performance: {
      responseTime: 0,
      uptime: process.uptime(),
    },
    version: process.env.npm_package_version || '1.0.0',
  }

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`
    health.services.database = 'healthy'
  } catch (error) {
    health.services.database = 'unhealthy'
    health.status = 'degraded'
    console.error('Database health check failed:', error)
  }

  // Check Redis connection
  try {
    await redis.ping()
    health.services.redis = 'healthy'
  } catch (error) {
    health.services.redis = 'unhealthy'
    health.status = 'degraded'
    console.error('Redis health check failed:', error)
  }

  // Check AI service availability
  try {
    if (process.env.OPENAI_API_KEY) {
      health.services.ai = 'configured'
    } else {
      health.services.ai = 'not_configured'
      health.status = 'degraded'
    }
  } catch (error) {
    health.services.ai = 'unhealthy'
    health.status = 'degraded'
    console.error('AI service health check failed:', error)
  }

  // Calculate response time
  health.performance.responseTime = Date.now() - startTime

  // Return appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}

export async function POST(request: NextRequest) {
  // Detailed health check with database metrics
  const startTime = Date.now()
  
  try {
    // Get database statistics
    const [userCount, organizationCount, leadMagnetCount] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.leadMagnet.count(),
    ])

    // Get Redis info
    const redisInfo = await redis.info('memory')
    const redisMemory = redisInfo.match(/used_memory_human:(.+)/)?.[1]?.trim()

    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'healthy',
          metrics: {
            users: userCount,
            organizations: organizationCount,
            leadMagnets: leadMagnetCount,
          },
        },
        redis: {
          status: 'healthy',
          metrics: {
            memory: redisMemory,
          },
        },
        ai: {
          status: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
        },
      },
      performance: {
        responseTime: Date.now() - startTime,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }

    return NextResponse.json(detailedHealth)
  } catch (error) {
    console.error('Detailed health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        performance: {
          responseTime: Date.now() - startTime,
        },
      },
      { status: 503 }
    )
  }
}