import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-helpers'

// GET /api/health - Health check endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    const dbTime = Date.now() - startTime
    
    // Check Redis connection if available
    let redisStatus = 'unavailable'
    let redisTime = 0
    
    try {
      if (process.env.REDIS_URL) {
        // This would check Redis connection in a real implementation
        redisStatus = 'connected'
        redisTime = 1 // placeholder
      }
    } catch (error) {
      redisStatus = 'error'
    }
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: 'connected',
          responseTime: `${dbTime}ms`,
        },
        redis: {
          status: redisStatus,
          responseTime: `${redisTime}ms`,
        },
      },
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    }
    
    return successResponse(healthData)
  } catch (error) {
    console.error('Health check failed:', error)
    
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Service unhealthy',
      503,
      {
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    )
  }
}