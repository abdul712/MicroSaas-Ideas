import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Import routes
import { authRoutes } from './routes/auth'
import { competitorRoutes } from './routes/competitors'
import { metricsRoutes } from './routes/metrics'
import { alertsRoutes } from './routes/alerts'
import { reportsRoutes } from './routes/reports'
import { organizationRoutes } from './routes/organizations'

// Import middleware
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { authMiddleware } from './middleware/auth'

// Import services
import { logger } from './utils/logger'
import { initializeKafka } from './services/kafka'
import { initializeRedis } from './services/redis'
import { initializeElasticsearch } from './services/elasticsearch'

const app = express()
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: [\"'self'\"],
      styleSrc: [\"'self'\", \"'unsafe-inline'\"],
      scriptSrc: [\"'self'\"],
      imgSrc: [\"'self'\", 'data:', 'https:'],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compression
app.use(compression())

// Logging
app.use(morgan('combined', { 
  stream: { 
    write: (message: string) => logger.info(message.trim()) 
  } 
}))
app.use(requestLogger)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/competitors', authMiddleware, competitorRoutes)
app.use('/api/metrics', authMiddleware, metricsRoutes)
app.use('/api/alerts', authMiddleware, alertsRoutes)
app.use('/api/reports', authMiddleware, reportsRoutes)
app.use('/api/organizations', authMiddleware, organizationRoutes)

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`)
  
  socket.on('join-organization', (organizationId: string) => {
    socket.join(`org-${organizationId}`)
    logger.info(`Client ${socket.id} joined organization ${organizationId}`)
  })
  
  socket.on('leave-organization', (organizationId: string) => {
    socket.leave(`org-${organizationId}`)
    logger.info(`Client ${socket.id} left organization ${organizationId}`)
  })
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })
})

// Make io available to other modules
app.set('io', io)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use(errorHandler)

// Initialize services
async function initializeServices() {
  try {
    logger.info('Initializing services...')
    
    await initializeRedis()
    logger.info('Redis initialized')
    
    await initializeKafka()
    logger.info('Kafka initialized')
    
    await initializeElasticsearch()
    logger.info('Elasticsearch initialized')
    
    logger.info('All services initialized successfully')
  } catch (error) {
    logger.error('Failed to initialize services:', error)
    process.exit(1)
  }
}

// Start server
const PORT = process.env.PORT || 3001

async function startServer() {
  try {
    await initializeServices()
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`)
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

if (require.main === module) {
  startServer()
}

export { app, server, io }