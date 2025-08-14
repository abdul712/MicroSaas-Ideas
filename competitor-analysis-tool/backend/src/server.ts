import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { config } from './config/config'
import { connectDatabase } from './config/database'
import { connectRedis } from './config/redis'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/error-handler'
import { authMiddleware } from './middleware/auth'
import { organizationMiddleware } from './middleware/organization'

// Import routes
import authRoutes from './routes/auth'
import competitorRoutes from './routes/competitors'
import alertRoutes from './routes/alerts'
import analyticsRoutes from './routes/analytics'
import reportRoutes from './routes/reports'
import scrapingRoutes from './routes/scraping'
import webhookRoutes from './routes/webhooks'
import healthRoutes from './routes/health'

// Import socket handlers
import { setupSocketHandlers } from './sockets/socket-handlers'

// Import queue processors
import { initializeQueues } from './queues/queue-manager'

const app = express()
const server = createServer(app)
const io = new SocketServer(server, {
  cors: {
    origin: config.frontend.url,
    credentials: true,
  },
})

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}))

// CORS configuration
app.use(cors({
  origin: [config.frontend.url, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)

// Middleware
app.use(compression())
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) }}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check (before auth)
app.use('/api/health', healthRoutes)

// Webhook routes (before auth - they have their own auth)
app.use('/api/webhooks', webhookRoutes)

// Authentication middleware for protected routes
app.use('/api', authMiddleware)
app.use('/api', organizationMiddleware)

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/competitors', competitorRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/scraping', scrapingRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    timestamp: new Date().toISOString(),
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Socket.IO setup
setupSocketHandlers(io)

// Initialize services
async function initializeServices() {
  try {
    // Connect to database
    await connectDatabase()
    logger.info('📊 Database connected successfully')

    // Connect to Redis
    await connectRedis()
    logger.info('🔴 Redis connected successfully')

    // Initialize queues
    await initializeQueues()
    logger.info('📋 Queues initialized successfully')

    logger.info('✅ All services initialized successfully')
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

// Start server
const PORT = config.server.port || 8000

initializeServices().then(() => {
  server.listen(PORT, () => {
    logger.info(`🚀 Competitor Analysis API Server running on port ${PORT}`)
    logger.info(`📊 Environment: ${config.environment}`)
    logger.info(`🔗 Socket.IO enabled for real-time updates`)
    logger.info(`🛡️  Security middleware enabled`)
    logger.info(`⚡ Rate limiting: 100 requests per 15 minutes`)
  })
})

export { app, server, io }