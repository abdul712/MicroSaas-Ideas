import Fastify from 'fastify';
import { config } from './config/config';
import { logger } from './utils/logger';
import { registerPlugins } from './plugins';
import { registerRoutes } from './routes';
import { EventProcessor } from './services/event-processor';
import { ClickHouseService } from './services/clickhouse';
import { KafkaService } from './services/kafka';
import { RedisService } from './services/redis';

// Create Fastify instance with configuration
const fastify = Fastify({
  logger: logger,
  trustProxy: true,
  bodyLimit: 1048576, // 1MB limit
  keepAliveTimeout: 30000,
  connectionTimeout: 30000,
  pluginTimeout: 30000,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  genReqId: () => {
    return Math.random().toString(36).substring(2, 15);
  },
});

// Global services
let eventProcessor: EventProcessor;
let clickHouseService: ClickHouseService;
let kafkaService: KafkaService;
let redisService: RedisService;

// Graceful shutdown handler
async function closeGracefully(signal: string) {
  fastify.log.info(`Received signal ${signal}, shutting down gracefully`);

  // Close services in reverse order
  if (eventProcessor) {
    fastify.log.info('Shutting down event processor');
    await eventProcessor.shutdown();
  }

  if (kafkaService) {
    fastify.log.info('Disconnecting from Kafka');
    await kafkaService.disconnect();
  }

  if (clickHouseService) {
    fastify.log.info('Closing ClickHouse connection');
    await clickHouseService.close();
  }

  if (redisService) {
    fastify.log.info('Closing Redis connection');
    await redisService.close();
  }

  // Close Fastify server
  fastify.log.info('Closing Fastify server');
  await fastify.close();

  process.exit(0);
}

// Register graceful shutdown handlers
process.on('SIGTERM', () => closeGracefully('SIGTERM'));
process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGUSR1', () => closeGracefully('SIGUSR1'));
process.on('SIGUSR2', () => closeGracefully('SIGUSR2'));

// Health check route
fastify.get('/health', async (request, reply) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      redis: redisService?.isConnected() || false,
      kafka: kafkaService?.isConnected() || false,
      clickhouse: clickHouseService?.isConnected() || false,
    },
    metrics: {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      pid: process.pid,
    },
  };

  // Check if all critical services are healthy
  const allServicesHealthy = Object.values(health.services).every(Boolean);
  
  if (!allServicesHealthy) {
    reply.status(503);
    health.status = 'unhealthy';
  }

  return health;
});

// Readiness probe for Kubernetes
fastify.get('/ready', async (request, reply) => {
  const services = {
    redis: redisService?.isConnected() || false,
    kafka: kafkaService?.isConnected() || false,
    clickhouse: clickHouseService?.isConnected() || false,
  };

  const allReady = Object.values(services).every(Boolean);

  if (!allReady) {
    reply.status(503);
    return {
      ready: false,
      services,
      message: 'Service dependencies not ready',
    };
  }

  return {
    ready: true,
    services,
    message: 'All services ready',
  };
});

// Liveness probe for Kubernetes
fastify.get('/live', async (request, reply) => {
  return {
    alive: true,
    timestamp: new Date().toISOString(),
    pid: process.pid,
  };
});

// Metrics endpoint for Prometheus
fastify.get('/metrics', async (request, reply) => {
  const metrics = eventProcessor?.getMetrics() || {};
  
  // Convert to Prometheus format
  let prometheusMetrics = '';
  
  Object.entries(metrics).forEach(([key, value]) => {
    prometheusMetrics += `# HELP ${key} Event processing metric\\n`;
    prometheusMetrics += `# TYPE ${key} counter\\n`;
    prometheusMetrics += `${key} ${value}\\n`;
  });

  // Add system metrics
  const memoryUsage = process.memoryUsage();
  prometheusMetrics += `# HELP nodejs_memory_usage_bytes Node.js memory usage\\n`;
  prometheusMetrics += `# TYPE nodejs_memory_usage_bytes gauge\\n`;
  prometheusMetrics += `nodejs_memory_usage_bytes{type=\"rss\"} ${memoryUsage.rss}\\n`;
  prometheusMetrics += `nodejs_memory_usage_bytes{type=\"heapTotal\"} ${memoryUsage.heapTotal}\\n`;
  prometheusMetrics += `nodejs_memory_usage_bytes{type=\"heapUsed\"} ${memoryUsage.heapUsed}\\n`;
  prometheusMetrics += `nodejs_memory_usage_bytes{type=\"external\"} ${memoryUsage.external}\\n`;

  reply.type('text/plain');
  return prometheusMetrics;
});

// Initialize services and start server
async function start() {
  try {
    fastify.log.info('Starting Event Collection Service...');
    
    // Initialize services
    redisService = new RedisService(config.redis);
    await redisService.connect();
    fastify.log.info('✅ Redis connected');

    clickHouseService = new ClickHouseService(config.clickhouse);
    await clickHouseService.connect();
    fastify.log.info('✅ ClickHouse connected');

    kafkaService = new KafkaService(config.kafka);
    await kafkaService.connect();
    fastify.log.info('✅ Kafka connected');

    eventProcessor = new EventProcessor({
      redis: redisService,
      clickhouse: clickHouseService,
      kafka: kafkaService,
    });
    await eventProcessor.initialize();
    fastify.log.info('✅ Event processor initialized');

    // Register plugins and routes
    await registerPlugins(fastify, {
      redis: redisService,
      clickhouse: clickHouseService,
      kafka: kafkaService,
      eventProcessor,
    });

    await registerRoutes(fastify, {
      redis: redisService,
      clickhouse: clickHouseService,
      kafka: kafkaService,
      eventProcessor,
    });

    // Start HTTP server
    const host = config.server.host || '0.0.0.0';
    const port = config.server.port || 3001;
    
    await fastify.listen({ host, port });
    
    fastify.log.info(`🚀 Event Collection Service listening on http://${host}:${port}`);
    fastify.log.info(`🔍 Health check available at http://${host}:${port}/health`);
    fastify.log.info(`📊 Metrics available at http://${host}:${port}/metrics`);
    
  } catch (error) {
    fastify.log.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  fastify.log.fatal('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  fastify.log.fatal('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
start();