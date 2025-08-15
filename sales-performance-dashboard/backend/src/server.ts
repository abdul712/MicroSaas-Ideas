import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import dotenv from 'dotenv'

import { errorHandler } from '@/middleware/errorHandler'
import { rateLimiter } from '@/middleware/rateLimiter'
import { requestLogger } from '@/middleware/logger'
import { authentication } from '@/middleware/auth'
import { tenantContext } from '@/middleware/tenant'
import { validation } from '@/middleware/validation'

import authRoutes from '@/routes/auth'
import userRoutes from '@/routes/users'
import organizationRoutes from '@/routes/organizations'
import metricsRoutes from '@/routes/metrics'
import dashboardRoutes from '@/routes/dashboards'
import integrationRoutes from '@/routes/integrations'
import alertRoutes from '@/routes/alerts'
import reportRoutes from '@/routes/reports'
import healthRoutes from '@/routes/health'

import { setupSwagger } from '@/config/swagger'
import { logger } from '@/utils/logger'
import { redis } from '@/config/redis'
import { prisma } from '@/config/database'
import { SocketService } from '@/services/socketService'
import { MetricsService } from '@/services/metricsService'

// Load environment variables
dotenv.config()

const app = express()
const httpServer = createServer(app)

// Socket.IO setup with Redis adapter for scaling
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

// Global middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
}))

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Security and logging middleware
app.use(rateLimiter)
app.use(requestLogger)

// Health check endpoint (before auth)
app.use('/health', healthRoutes)

// Swagger documentation
setupSwagger(app)

// Authentication middleware (applied to protected routes)
app.use('/api/v1', authentication)
app.use('/api/v1', tenantContext)

// API routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/organizations', organizationRoutes)
app.use('/api/v1/metrics', metricsRoutes)
app.use('/api/v1/dashboards', dashboardRoutes)
app.use('/api/v1/integrations', integrationRoutes)
app.use('/api/v1/alerts', alertRoutes)
app.use('/api/v1/reports', reportRoutes)

// WebSocket connection handling
const socketService = new SocketService(io)
const metricsService = new MetricsService()

io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id })
  
  // Handle tenant room joining
  socket.on('join-tenant', async (data) => {
    try {
      await socketService.joinTenantRoom(socket, data.tenantId, data.userId)
    } catch (error) {
      logger.error('Error joining tenant room', { error, socketId: socket.id })
      socket.emit('error', { message: 'Failed to join tenant room' })
    }
  })

  // Handle real-time metrics subscription
  socket.on('subscribe-metrics', async (data) => {
    try {
      await socketService.subscribeToMetrics(socket, data.tenantId, data.filters)
    } catch (error) {
      logger.error('Error subscribing to metrics', { error, socketId: socket.id })
      socket.emit('error', { message: 'Failed to subscribe to metrics' })
    }
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id })
    socketService.handleDisconnect(socket.id)
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: `Cannot ${req.method} ${req.originalUrl}`
  })
})

const PORT = process.env.PORT || 8080
const NODE_ENV = process.env.NODE_ENV || 'development'

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  
  httpServer.close(async () => {
    try {
      await prisma.$disconnect()
      await redis.disconnect()
      logger.info('Server closed successfully')
      process.exit(0)
    } catch (error) {
      logger.error('Error during shutdown', { error })
      process.exit(1)
    }
  })
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  
  httpServer.close(async () => {
    try {
      await prisma.$disconnect()
      await redis.disconnect()
      logger.info('Server closed successfully')
      process.exit(0)
    } catch (error) {
      logger.error('Error during shutdown', { error })
      process.exit(1)
    }
  })
})

// Start server
httpServer.listen(PORT, () => {
  logger.info(`🚀 Sales Performance Dashboard API running in ${NODE_ENV} mode on port ${PORT}`)
  logger.info(`📊 Health check: http://localhost:${PORT}/health`)
  logger.info(`📖 API Documentation: http://localhost:${PORT}/docs`)
  logger.info(`🔌 WebSocket endpoint: ws://localhost:${PORT}`)
})

export { app, httpServer, io }