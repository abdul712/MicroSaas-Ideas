import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { createProxyMiddleware } from 'http-proxy-middleware'
import Redis from 'ioredis'
import winston from 'winston'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import promClient from 'prom-client'

import { config } from './config'
import { authMiddleware } from './middleware/auth'
import { errorHandler } from './middleware/error-handler'
import { requestLogger } from './middleware/request-logger'
import { rateLimitStore } from './middleware/rate-limit-store'
import { healthRoutes } from './routes/health'
import { metricsRoutes } from './routes/metrics'

// Initialize metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics
collectDefaultMetrics({ prefix: 'heatmap_api_gateway_' })

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'heatmap_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10]
})

const httpRequestsTotal = new promClient.Counter({
  name: 'heatmap_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
})

// Initialize logger
const logger = winston.createLogger({
  level: config.log.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

if (config.node.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

// Initialize Redis for rate limiting and caching
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
})

// Initialize Express app
const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
}))

// Compression and parsing
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
app.use(requestLogger(logger))
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: rateLimitStore(redis),
})
app.use('/api/', limiter)

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const route = req.route?.path || req.path
    const method = req.method
    const statusCode = res.statusCode.toString()

    httpRequestDuration
      .labels(method, route, statusCode)
      .observe(duration)

    httpRequestsTotal
      .labels(method, route, statusCode)
      .inc()
  })

  next()
})

// API Documentation
if (config.node.env !== 'production') {
  try {
    const swaggerDocument = YAML.load('./docs/api.yaml')
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  } catch (error) {
    logger.warn('Could not load Swagger documentation')
  }
}

// Health and metrics routes
app.use('/health', healthRoutes)
app.use('/metrics', metricsRoutes)

// Service proxy configurations
const serviceProxies = {
  '/api/v1/events': {
    target: config.services.eventCollection.url,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/events': '' },
    timeout: 30000,
  },
  '/api/v1/analytics': {
    target: config.services.analyticsProcessing.url,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/analytics': '' },
    timeout: 60000,
  },
  '/api/v1/heatmaps': {
    target: config.services.heatmapGeneration.url,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/heatmaps': '' },
    timeout: 120000,
  },
  '/api/v1/users': {
    target: config.services.userManagement.url,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/users': '' },
    timeout: 30000,
  },
  '/api/v1/privacy': {
    target: config.services.privacyService.url,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/privacy': '' },
    timeout: 30000,
  },
  '/api/v1/insights': {
    target: config.services.aiInsights.url,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/insights': '' },
    timeout: 60000,
  },
}

// Apply authentication middleware to protected routes
const protectedRoutes = [
  '/api/v1/analytics',
  '/api/v1/heatmaps',
  '/api/v1/users',
  '/api/v1/privacy',
  '/api/v1/insights'
]

protectedRoutes.forEach(route => {
  app.use(route, authMiddleware)
})

// Setup service proxies
Object.entries(serviceProxies).forEach(([path, options]) => {
  app.use(path, createProxyMiddleware({
    ...options,
    onError: (err, req, res) => {
      logger.error('Proxy error:', err)
      res.status(502).json({ 
        error: 'Service temporarily unavailable',
        message: 'Please try again later'
      })
    },
    onProxyReq: (proxyReq, req) => {
      // Add request ID for tracing
      proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] || generateRequestId())
      
      // Forward user context
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id)
        proxyReq.setHeader('X-User-Role', req.user.role)
        proxyReq.setHeader('X-Organization-ID', req.user.organizationId)
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Add security headers
      proxyRes.headers['X-Content-Type-Options'] = 'nosniff'
      proxyRes.headers['X-Frame-Options'] = 'DENY'
      proxyRes.headers['X-XSS-Protection'] = '1; mode=block'
    }
  }))
})

// Public tracking endpoint (no auth required)
app.use('/track', createProxyMiddleware({
  target: config.services.eventCollection.url,
  changeOrigin: true,
  pathRewrite: { '^/track': '/track' },
  timeout: 10000,
}))

// Global error handler
app.use(errorHandler(logger))

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received, shutting down gracefully')
  
  // Close Redis connection
  await redis.quit()
  
  // Close server
  process.exit(0)
})

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

const PORT = config.server.port || 8080
const HOST = config.server.host || '0.0.0.0'

app.listen(PORT, HOST, () => {
  logger.info(`API Gateway server running on ${HOST}:${PORT}`)
  logger.info(`Environment: ${config.node.env}`)
  logger.info(`Health check: http://${HOST}:${PORT}/health`)
  if (config.node.env !== 'production') {
    logger.info(`API Docs: http://${HOST}:${PORT}/api-docs`)
  }
})

export default app