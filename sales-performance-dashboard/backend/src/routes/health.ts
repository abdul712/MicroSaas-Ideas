import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { checkDatabaseConnection } from '@/config/database'
import { checkRedisConnection } from '@/config/redis'
import { logger } from '@/utils/logger'

const router = express.Router()

// Basic health check
router.get('/', async (req, res) => {
  try {
    const timestamp = new Date().toISOString()
    
    res.status(StatusCodes.OK).json({
      status: 'healthy',
      timestamp,
      service: 'sales-dashboard-api',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    })
  } catch (error) {
    logger.error('Health check failed', { error })
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    })
  }
})

// Detailed health check with dependencies
router.get('/detailed', async (req, res) => {
  try {
    const timestamp = new Date().toISOString()
    const checks = {
      database: false,
      redis: false,
      memory: true,
      disk: true
    }

    // Check database connection
    try {
      checks.database = await checkDatabaseConnection()
    } catch (error) {
      logger.error('Database health check failed', { error })
    }

    // Check Redis connection
    try {
      checks.redis = await checkRedisConnection()
    } catch (error) {
      logger.error('Redis health check failed', { error })
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage()
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    }

    // Memory check - warn if heap usage > 512MB
    checks.memory = memoryUsageMB.heapUsed < 512

    // Overall health status
    const isHealthy = Object.values(checks).every(check => check === true)
    const status = isHealthy ? 'healthy' : 'unhealthy'
    const statusCode = isHealthy ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE

    const response = {
      status,
      timestamp,
      service: 'sales-dashboard-api',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks,
      system: {
        memory: memoryUsageMB,
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid
      }
    }

    logger.info('Detailed health check completed', { status, checks })
    res.status(statusCode).json(response)
  } catch (error) {
    logger.error('Detailed health check failed', { error })
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    })
  }
})

// Readiness probe for Kubernetes
router.get('/ready', async (req, res) => {
  try {
    const dbHealthy = await checkDatabaseConnection()
    const redisHealthy = await checkRedisConnection()
    
    if (dbHealthy && redisHealthy) {
      res.status(StatusCodes.OK).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        database: dbHealthy,
        redis: redisHealthy
      })
    }
  } catch (error) {
    logger.error('Readiness check failed', { error })
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

// Liveness probe for Kubernetes
router.get('/live', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

export default router