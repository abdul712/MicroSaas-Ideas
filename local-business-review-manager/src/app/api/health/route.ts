import { NextRequest, NextResponse } from 'next/server'
import { getSystemHealth } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const [dbHealth, redisHealth] = await Promise.all([
      getSystemHealth(),
      redis.healthCheck()
    ])

    const overallStatus = 
      dbHealth.database.status === 'healthy' && 
      redisHealth.status === 'healthy' 
        ? 'healthy' 
        : 'degraded'

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth.database,
        redis: redisHealth,
        migrations: dbHealth.migrations
      },
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV
    }

    return NextResponse.json(healthData, {
      status: overallStatus === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      version: process.env.npm_package_version || '1.0.0'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}