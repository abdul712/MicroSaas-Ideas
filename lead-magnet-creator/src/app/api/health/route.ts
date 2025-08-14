import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/prisma'
import { checkRedisHealth } from '@/lib/redis'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Check database connectivity
    const dbHealthy = await checkDatabaseHealth()
    
    // Check Redis connectivity
    const redisHealthy = await checkRedisHealth()
    
    const responseTime = Date.now() - startTime
    
    const health = {
      status: dbHealthy && redisHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        redis: redisHealthy ? 'healthy' : 'unhealthy'
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503
    
    return NextResponse.json(health, { status: statusCode })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        services: {
          database: 'unknown',
          redis: 'unknown'
        }
      },
      { status: 503 }
    )
  }
}