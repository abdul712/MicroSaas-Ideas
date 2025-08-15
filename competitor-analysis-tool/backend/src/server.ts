import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

// Import configurations and utilities
import { config } from '@/config/app'
import { logger } from '@/utils/logger'
import { errorHandler, notFoundHandler } from '@/middleware/error-handler'
import { requestLogger } from '@/middleware/request-logger'
import { validateEnv } from '@/utils/validate-env'

// Import routes
import { authRoutes } from '@/routes/auth'
import { competitorRoutes } from '@/routes/competitors'
import { monitoringRoutes } from '@/routes/monitoring'
import { alertRoutes } from '@/routes/alerts'
import { analyticsRoutes } from '@/routes/analytics'
import { reportRoutes } from '@/routes/reports'
import { organizationRoutes } from '@/routes/organizations'
import { userRoutes } from '@/routes/users'
import { apiKeyRoutes } from '@/routes/api-keys'
import { integrationRoutes } from '@/routes/integrations'
import { webhookRoutes } from '@/routes/webhooks'

// Import WebSocket handlers
import { initializeSocketHandlers } from '@/websocket/handlers'

// Import background jobs
import { startJobProcessors } from '@/jobs/processor'

// Import database connections
import { connectDatabases } from '@/lib/database'

// Validate environment variables
validateEnv()

// Initialize Express app
const app = express()
const server = createServer(app)

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})

// Initialize database clients
const prisma = new PrismaClient({
  log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
})

const redis = new Redis(config.redis.url, {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

// Global error handlers for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

// Graceful shutdown handler
const gracefulShutdown = async () => {
  logger.info('Starting graceful shutdown...')
  
  try {
    // Close HTTP server
    server.close(() => {
      logger.info('HTTP server closed')
    })

    // Close database connections
    await prisma.$disconnect()
    logger.info('Database disconnected')

    // Close Redis connection
    redis.disconnect()
    logger.info('Redis disconnected')

    logger.info('Graceful shutdown completed')
    process.exit(0)
  } catch (error) {
    logger.error('Error during shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}))

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  },
}))

// Rate limiting
const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health'
  },
})

const speedLimiter = slowDown({
  windowMs: config.rateLimit.windowMs,
  delayAfter: Math.floor(config.rateLimit.max * 0.7),
  delayMs: 500,
  maxDelayMs: 20000,
})

app.use(rateLimiter)
app.use(speedLimiter)

// Request parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook signature verification
    if (req.path.startsWith('/api/webhooks/')) {
      (req as any).rawBody = buf
    }
  }
}))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging middleware
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }))
}
app.use(requestLogger)

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check Redis connection
    await redis.ping()
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.env,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    })
  } catch (error) {
    logger.error('Health check failed:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service dependencies unavailable',
    })
  }
})

// API routes
const apiRouter = express.Router()

// Mount route handlers
apiRouter.use('/auth', authRoutes)
apiRouter.use('/competitors', competitorRoutes)
apiRouter.use('/monitoring', monitoringRoutes)
apiRouter.use('/alerts', alertRoutes)
apiRouter.use('/analytics', analyticsRoutes)
apiRouter.use('/reports', reportRoutes)
apiRouter.use('/organizations', organizationRoutes)
apiRouter.use('/users', userRoutes)
apiRouter.use('/api-keys', apiKeyRoutes)
apiRouter.use('/integrations', integrationRoutes)
apiRouter.use('/webhooks', webhookRoutes)

// Mount API router
app.use('/api', apiRouter)

// WebSocket handling
initializeSocketHandlers(io, { prisma, redis })

// Error handling middleware
app.use(notFoundHandler)
app.use(errorHandler)

// Initialize services and start server
async function startServer() {
  try {
    logger.info('Starting Competitor Analysis Platform Backend...')
    
    // Connect to databases
    await connectDatabases({ prisma, redis })
    
    // Start background job processors
    await startJobProcessors({ prisma, redis })
    
    // Start HTTP server
    const port = config.port
    server.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`)
      logger.info(`📊 Environment: ${config.env}`)
      logger.info(`🔗 API URL: http://localhost:${port}/api`)
      logger.info(`🌐 WebSocket URL: ws://localhost:${port}`)
      
      if (config.env === 'development') {
        logger.info(`📚 API Documentation: http://localhost:${port}/api/docs`)
      }
    })
    
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Export app and server for testing
export { app, server, io, prisma, redis }

// Start server if this file is run directly
if (require.main === module) {
  startServer()
}