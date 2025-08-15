import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import compress from '@fastify/compress'
import multipart from '@fastify/multipart'
import websocket from '@fastify/websocket'
import { config } from './config'
import { EventProcessor } from './services/event-processor'
import { GeoIPService } from './services/geoip'
import { UserAgentParser } from './services/user-agent-parser'
import { PrivacyFilter } from './services/privacy-filter'
import { ValidationService } from './services/validation'
import { MetricsService } from './services/metrics'
import { eventRoutes } from './routes/events'
import { healthRoutes } from './routes/health'
import { metricsRoutes } from './routes/metrics'
import { wsRoutes } from './routes/websocket'

// Initialize services
const geoIPService = new GeoIPService()
const userAgentParser = new UserAgentParser()
const privacyFilter = new PrivacyFilter()
const validationService = new ValidationService()
const metricsService = new MetricsService()
const eventProcessor = new EventProcessor({
  geoIPService,
  userAgentParser,
  privacyFilter,
  metricsService
})

// Initialize Fastify
const fastify = Fastify({
  logger: {
    level: config.log.level,
    prettyPrint: config.node.env !== 'production' ? {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    } : false
  },
  trustProxy: true,
  disableRequestLogging: false,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId'
})

// Security middleware
fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
  crossOriginEmbedderPolicy: false
})

// CORS configuration for tracking
fastify.register(cors, {
  origin: (origin, callback) => {
    // Allow all origins for tracking endpoint
    callback(null, true)
  },
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tracking-ID']
})

// Rate limiting
fastify.register(rateLimit, {
  max: config.rateLimit.max,
  timeWindow: config.rateLimit.windowMs,
  allowList: ['127.0.0.1', '::1'], // Allow localhost
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true
  },
  errorResponseBuilder: (request, context) => {
    return {
      error: 'Rate limit exceeded',
      message: `Too many requests, please try again later.`,
      retryAfter: Math.round(context.ttl / 1000)
    }
  }
})

// Compression
fastify.register(compress, {
  global: true,
  encodings: ['gzip', 'deflate']
})

// Multipart support for file uploads
fastify.register(multipart, {
  limits: {
    fieldNameSize: 100,
    fieldSize: 1000000, // 1MB
    fields: 10,
    fileSize: 5000000, // 5MB
    files: 1
  }
})

// WebSocket support for real-time updates
fastify.register(websocket)

// Request/Response lifecycle hooks
fastify.addHook('onRequest', async (request, reply) => {
  // Add request start time for performance metrics
  request.requestTime = Date.now()
  
  // Log incoming requests
  request.log.info({
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip
  }, 'Incoming request')
})

fastify.addHook('onResponse', async (request, reply) => {
  // Calculate request duration
  const duration = Date.now() - (request.requestTime || Date.now())
  
  // Update metrics
  metricsService.recordHttpRequest(
    request.method,
    reply.statusCode,
    duration
  )
  
  // Log response
  request.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration
  }, 'Request completed')
})

fastify.addHook('onError', async (request, reply, error) => {
  // Record error metrics
  metricsService.recordError(error.name || 'UnknownError')
  
  // Log error
  request.log.error({
    error: error.message,
    stack: error.stack,
    method: request.method,
    url: request.url
  }, 'Request error')
})

// Validation schemas
const eventSchema = {
  type: 'object',
  required: ['type', 'timestamp', 'sessionId', 'url'],
  properties: {
    type: { type: 'string', enum: ['page_view', 'click', 'scroll', 'hover', 'form_submit', 'form_focus', 'form_blur', 'custom', 'identify'] },
    timestamp: { type: 'number' },
    sessionId: { type: 'string', minLength: 1, maxLength: 100 },
    userId: { type: 'string', maxLength: 100 },
    url: { type: 'string', format: 'uri', maxLength: 2000 },
    userAgent: { type: 'string', maxLength: 500 },
    viewport: {
      type: 'object',
      properties: {
        width: { type: 'number', minimum: 0, maximum: 10000 },
        height: { type: 'number', minimum: 0, maximum: 10000 }
      }
    },
    // Click event properties
    x: { type: 'number', minimum: 0, maximum: 10000 },
    y: { type: 'number', minimum: 0, maximum: 10000 },
    button: { type: 'number', minimum: 0, maximum: 4 },
    element: { type: 'object' },
    // Scroll event properties
    scrollX: { type: 'number', minimum: 0 },
    scrollY: { type: 'number', minimum: 0 },
    scrollPercentage: { type: 'number', minimum: 0, maximum: 100 },
    documentHeight: { type: 'number', minimum: 0 },
    // Custom event properties
    eventName: { type: 'string', maxLength: 100 },
    properties: { type: 'object' }
  }
}

const batchEventSchema = {
  type: 'object',
  required: ['events'],
  properties: {
    events: {
      type: 'array',
      minItems: 1,
      maxItems: 100,
      items: eventSchema
    }
  }
}

// Register routes
fastify.register(async (fastify) => {
  // Add validation service to fastify context
  fastify.decorate('validation', validationService)
  fastify.decorate('eventProcessor', eventProcessor)
  fastify.decorate('metricsService', metricsService)
  
  // Register route modules
  await fastify.register(eventRoutes, { prefix: '/events' })
  await fastify.register(healthRoutes, { prefix: '/health' })
  await fastify.register(metricsRoutes, { prefix: '/metrics' })
  await fastify.register(wsRoutes, { prefix: '/ws' })
})

// Main tracking endpoint (legacy support)
fastify.post('/track', {
  schema: {
    body: eventSchema,
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          eventId: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  try {
    const trackingId = request.headers['x-tracking-id'] as string
    if (!trackingId) {
      return reply.status(400).send({
        error: 'Missing tracking ID',
        message: 'X-Tracking-ID header is required'
      })
    }

    const eventId = await eventProcessor.processEvent(request.body, {
      trackingId,
      ip: request.ip,
      userAgent: request.headers['user-agent'] || ''
    })

    return { success: true, eventId }
  } catch (error) {
    request.log.error(error, 'Error processing tracking event')
    return reply.status(500).send({
      error: 'Processing failed',
      message: 'Unable to process event'
    })
  }
})

// Batch tracking endpoint
fastify.post('/track/batch', {
  schema: {
    body: batchEventSchema,
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          processed: { type: 'number' },
          failed: { type: 'number' },
          eventIds: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }
}, async (request, reply) => {
  try {
    const trackingId = request.headers['x-tracking-id'] as string
    if (!trackingId) {
      return reply.status(400).send({
        error: 'Missing tracking ID',
        message: 'X-Tracking-ID header is required'
      })
    }

    const results = await eventProcessor.processBatchEvents(request.body.events, {
      trackingId,
      ip: request.ip,
      userAgent: request.headers['user-agent'] || ''
    })

    return {
      success: true,
      processed: results.successful.length,
      failed: results.failed.length,
      eventIds: results.successful
    }
  } catch (error) {
    request.log.error(error, 'Error processing batch tracking events')
    return reply.status(500).send({
      error: 'Batch processing failed',
      message: 'Unable to process events'
    })
  }
})

// Pixel tracking endpoint (for no-JS fallback)
fastify.get('/pixel.gif', async (request, reply) => {
  try {
    const { tid: trackingId, url, ref: referrer } = request.query as any
    
    if (!trackingId || !url) {
      return reply.status(400).send('Missing required parameters')
    }

    // Create minimal page view event
    const event = {
      type: 'page_view' as const,
      timestamp: Date.now(),
      sessionId: `pixel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: decodeURIComponent(url),
      referrer: referrer ? decodeURIComponent(referrer) : undefined,
      userAgent: request.headers['user-agent'] || '',
      viewport: { width: 0, height: 0 }
    }

    await eventProcessor.processEvent(event, {
      trackingId,
      ip: request.ip,
      userAgent: request.headers['user-agent'] || ''
    })

    // Return 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
    return reply
      .type('image/gif')
      .header('Cache-Control', 'no-cache, no-store, must-revalidate')
      .header('Pragma', 'no-cache')
      .header('Expires', '0')
      .send(pixel)
  } catch (error) {
    fastify.log.error(error, 'Error processing pixel tracking')
    // Still return pixel even on error
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
    return reply.type('image/gif').send(pixel)
  }
})

// Error handler
fastify.setErrorHandler(async (error, request, reply) => {
  const statusCode = error.statusCode || 500
  
  request.log.error({
    error: error.message,
    stack: error.stack,
    statusCode
  }, 'Request error')

  const response = {
    error: error.name || 'Internal Server Error',
    message: statusCode === 500 ? 'An internal error occurred' : error.message,
    statusCode
  }

  if (config.node.env !== 'production') {
    response.stack = error.stack
  }

  return reply.status(statusCode).send(response)
})

// 404 handler
fastify.setNotFoundHandler(async (request, reply) => {
  return reply.status(404).send({
    error: 'Not Found',
    message: 'The requested resource was not found',
    statusCode: 404
  })
})

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully`)
  
  try {
    await eventProcessor.shutdown()
    await fastify.close()
    process.exit(0)
  } catch (error) {
    fastify.log.error(error, 'Error during shutdown')
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start server
const start = async () => {
  try {
    // Initialize event processor
    await eventProcessor.initialize()
    
    // Start server
    const host = config.server.host || '0.0.0.0'
    const port = config.server.port || 3001
    
    await fastify.listen({ port, host })
    
    fastify.log.info(`Event Collection Service running on ${host}:${port}`)
    fastify.log.info(`Environment: ${config.node.env}`)
    fastify.log.info(`Health check: http://${host}:${port}/health`)
  } catch (error) {
    fastify.log.error(error, 'Failed to start server')
    process.exit(1)
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  fastify.log.fatal(error, 'Uncaught exception')
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  fastify.log.fatal({ reason, promise }, 'Unhandled rejection')
  process.exit(1)
})

start()

export default fastify