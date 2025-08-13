import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { config } from './config/config';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import clvRoutes from './routes/clv';
import integrationRoutes from './routes/integrations';
import analyticsRoutes from './routes/analytics';

// Create Fastify instance
const fastify = Fastify({
  logger: logger,
});

// Database and Redis clients
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export const redis = new Redis(config.redis.url);

// Type declarations for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
  }
}

// Register plugins
const registerPlugins = async () => {
  // Security
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: config.cors.origins,
    credentials: true,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: redis,
  });

  // JWT authentication
  await fastify.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });

  // Swagger documentation
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Customer Lifetime Value Tracker API',
        description: 'API documentation for CLV Tracker',
        version: '1.0.0',
      },
      host: 'localhost:3001',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Add database and Redis to Fastify instance
  fastify.decorate('prisma', prisma);
  fastify.decorate('redis', redis);
};

// Register routes
const registerRoutes = async () => {
  // Health check
  fastify.get('/health', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.environment,
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      reply.code(503);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  });

  // API routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(customerRoutes, { prefix: '/api/customers' });
  await fastify.register(clvRoutes, { prefix: '/api/clv' });
  await fastify.register(integrationRoutes, { prefix: '/api/integrations' });
  await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
};

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  logger.error({
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
  });

  if (error.statusCode) {
    reply.status(error.statusCode).send({
      error: error.message,
      statusCode: error.statusCode,
    });
  } else {
    reply.status(500).send({
      error: 'Internal Server Error',
      statusCode: 500,
    });
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Starting graceful shutdown...');
  
  try {
    await fastify.close();
    await prisma.$disconnect();
    redis.disconnect();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async () => {
  try {
    await registerPlugins();
    await registerRoutes();

    const host = config.server.host;
    const port = config.server.port;

    await fastify.listen({ port, host });
    
    logger.info({
      message: 'Server started successfully',
      port,
      host,
      environment: config.environment,
      docsUrl: `http://${host}:${port}/docs`,
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

if (require.main === module) {
  start();
}

export default fastify;