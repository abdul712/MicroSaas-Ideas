/**
 * Event Collection Service
 * High-performance event ingestion and initial processing
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { config } from './config/config';
import { connectDatabase } from './database/connection';
import { connectRedis } from './cache/redis';
import { initKafka } from './messaging/kafka';
import { eventRoutes } from './routes/events';
import { healthRoutes } from './routes/health';
import { metricsRoutes } from './routes/metrics';
import { websocketHandler } from './websocket/handler';
import { errorHandler } from './middleware/errorHandler';
import { requestValidator } from './middleware/validation';
import { corsHandler } from './middleware/cors';

// Initialize logger
const logger = pino({
  level: config.LOG_LEVEL,
  ...(config.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  }),
});

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(corsHandler);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.RATE_LIMIT_MAX, // Limit each IP to max requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Special rate limiting for event collection
const eventLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Much higher limit for event collection
  skip: (req) => {
    // Skip rate limiting for verified tracking scripts
    const apiKey = req.headers['x-api-key'];
    return apiKey && typeof apiKey === 'string';
  },
});
app.use('/api/v1/events', eventLimiter);

// Request logging
app.use(pinoHttp({ logger }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request validation middleware
app.use(requestValidator);

// API Routes
app.use('/api/v1/events', eventRoutes);
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);

// WebSocket server for real-time communication
const wss = new WebSocketServer({ 
  server,
  path: '/ws',
  verifyClient: (info) => {
    // Implement WebSocket authentication here
    const origin = info.origin;
    const allowedOrigins = config.CORS_ORIGINS;
    return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  },
});

websocketHandler(wss, logger);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connections, Redis, Kafka, etc.
    Promise.all([
      // Add cleanup functions here
    ]).then(() => {
      logger.info('All connections closed');
      process.exit(0);
    }).catch((error) => {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    });
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function startServer() {
  try {
    // Initialize connections
    await connectDatabase();
    await connectRedis();
    await initKafka();

    const port = config.PORT || 3001;
    
    server.listen(port, () => {
      logger.info(`Event Collection Service listening on port ${port}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Health check available at: http://localhost:${port}/health`);
      logger.info(`WebSocket server available at: ws://localhost:${port}/ws`);
    });

  } catch (error) {
    logger.fatal('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export { app, server };