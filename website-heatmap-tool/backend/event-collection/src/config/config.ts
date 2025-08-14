import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration schema validation
const configSchema = z.object({
  // Server configuration
  server: z.object({
    host: z.string().default('0.0.0.0'),
    port: z.number().default(3001),
    environment: z.enum(['development', 'staging', 'production']).default('development'),
    cors: z.object({
      origin: z.union([z.string(), z.array(z.string()), z.boolean()]).default(true),
      credentials: z.boolean().default(true),
    }),
  }),

  // Redis configuration
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
    db: z.number().default(0),
    connectTimeout: z.number().default(10000),
    lazyConnect: z.boolean().default(true),
    retryDelayOnFailover: z.number().default(100),
    maxRetriesPerRequest: z.number().default(3),
    keyPrefix: z.string().default('heatmap:'),
  }),

  // ClickHouse configuration
  clickhouse: z.object({
    url: z.string().default('http://localhost:8123'),
    database: z.string().default('analytics'),
    username: z.string().default('analytics_user'),
    password: z.string().default('analytics_password_2024'),
    format: z.string().default('JSONEachRow'),
    connectTimeout: z.number().default(10000),
    socketTimeout: z.number().default(30000),
    compression: z.boolean().default(true),
    debug: z.boolean().default(false),
    session_id: z.string().optional(),
    session_timeout: z.number().default(60),
    output_format_json_quote_64bit_integers: z.number().default(0),
    enable_http_compression: z.number().default(1),
    log_queries: z.number().default(1),
  }),

  // Kafka configuration
  kafka: z.object({
    clientId: z.string().default('event-collection-service'),
    brokers: z.array(z.string()).default(['localhost:9092']),
    groupId: z.string().default('event-collection-group'),
    topics: z.object({
      events: z.string().default('heatmap-events'),
      clicks: z.string().default('click-events'),
      scrolls: z.string().default('scroll-events'),
      sessions: z.string().default('session-events'),
    }),
    producer: z.object({
      transactionTimeout: z.number().default(30000),
      idempotent: z.boolean().default(true),
      maxInFlightRequests: z.number().default(1),
      acks: z.union([z.literal(-1), z.literal(0), z.literal(1)]).default(-1),
      compression: z.enum(['gzip', 'snappy', 'lz4', 'zstd']).default('gzip'),
    }),
    consumer: z.object({
      sessionTimeout: z.number().default(30000),
      rebalanceTimeout: z.number().default(60000),
      heartbeatInterval: z.number().default(3000),
      metadataMaxAge: z.number().default(300000),
      allowAutoTopicCreation: z.boolean().default(false),
      maxBytesPerPartition: z.number().default(1048576),
      minBytes: z.number().default(1),
      maxBytes: z.number().default(10485760),
      maxWaitTimeInMs: z.number().default(5000),
    }),
  }),

  // Event processing configuration
  eventProcessing: z.object({
    batchSize: z.number().default(1000),
    batchTimeoutMs: z.number().default(5000),
    maxRetries: z.number().default(3),
    retryDelayMs: z.number().default(1000),
    deadLetterQueueEnabled: z.boolean().default(true),
    metricsEnabled: z.boolean().default(true),
    compressionEnabled: z.boolean().default(true),
    deduplicationEnabled: z.boolean().default(true),
    deduplicationWindowMs: z.number().default(60000),
  }),

  // Rate limiting configuration
  rateLimit: z.object({
    global: z.object({
      max: z.number().default(10000),
      timeWindow: z.string().default('1 minute'),
    }),
    perSite: z.object({
      max: z.number().default(1000),
      timeWindow: z.string().default('1 minute'),
    }),
    perIP: z.object({
      max: z.number().default(100),
      timeWindow: z.string().default('1 minute'),
    }),
    skipOnError: z.boolean().default(true),
    keyGenerator: z.function().optional(),
  }),

  // Security configuration
  security: z.object({
    allowedOrigins: z.array(z.string()).default(['*']),
    maxEventSize: z.number().default(10240), // 10KB
    maxEventsPerBatch: z.number().default(100),
    apiKeyHeader: z.string().default('x-api-key'),
    enableApiKeyAuth: z.boolean().default(false),
    enableIPWhitelist: z.boolean().default(false),
    ipWhitelist: z.array(z.string()).default([]),
    enableDDoSProtection: z.boolean().default(true),
  }),

  // Privacy configuration
  privacy: z.object({
    enableGDPRMode: z.boolean().default(true),
    enableCCPAMode: z.boolean().default(true),
    enableIPAnonymization: z.boolean().default(true),
    dataRetentionDays: z.number().default(365),
    enableConsentValidation: z.boolean().default(true),
    consentCookieName: z.string().default('heatmap_consent'),
    enablePIIDetection: z.boolean().default(true),
    piiScrubbing: z.boolean().default(true),
  }),

  // Monitoring configuration
  monitoring: z.object({
    enableMetrics: z.boolean().default(true),
    enableTracing: z.boolean().default(false),
    metricsInterval: z.number().default(60000),
    healthCheckInterval: z.number().default(30000),
    alertThresholds: z.object({
      errorRate: z.number().default(0.01), // 1%
      latencyP99: z.number().default(1000), // 1s
      memoryUsage: z.number().default(0.8), // 80%
      cpuUsage: z.number().default(0.8), // 80%
    }),
  }),

  // Logging configuration
  logging: z.object({
    level: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    prettyPrint: z.boolean().default(false),
    file: z.string().optional(),
    maxFileSize: z.string().default('10MB'),
    maxFiles: z.number().default(5),
    enableLogRotation: z.boolean().default(true),
  }),
});

// Parse and validate configuration
const rawConfig = {
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3001', 10),
    environment: process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development',
    cors: {
      origin: process.env.CORS_ORIGIN === 'true' || process.env.CORS_ORIGIN?.split(',') || true,
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
    lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'heatmap:',
  },
  clickhouse: {
    url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
    database: process.env.CLICKHOUSE_DB || 'analytics',
    username: process.env.CLICKHOUSE_USER || 'analytics_user',
    password: process.env.CLICKHOUSE_PASSWORD || 'analytics_password_2024',
    format: 'JSONEachRow',
    connectTimeout: parseInt(process.env.CLICKHOUSE_CONNECT_TIMEOUT || '10000', 10),
    socketTimeout: parseInt(process.env.CLICKHOUSE_SOCKET_TIMEOUT || '30000', 10),
    compression: process.env.CLICKHOUSE_COMPRESSION !== 'false',
    debug: process.env.CLICKHOUSE_DEBUG === 'true',
    session_timeout: parseInt(process.env.CLICKHOUSE_SESSION_TIMEOUT || '60', 10),
    output_format_json_quote_64bit_integers: 0,
    enable_http_compression: 1,
    log_queries: process.env.NODE_ENV === 'development' ? 1 : 0,
  },
  kafka: {
    clientId: process.env.KAFKA_CLIENT_ID || 'event-collection-service',
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    groupId: process.env.KAFKA_GROUP_ID || 'event-collection-group',
    topics: {
      events: process.env.KAFKA_EVENTS_TOPIC || 'heatmap-events',
      clicks: process.env.KAFKA_CLICKS_TOPIC || 'click-events',
      scrolls: process.env.KAFKA_SCROLLS_TOPIC || 'scroll-events',
      sessions: process.env.KAFKA_SESSIONS_TOPIC || 'session-events',
    },
    producer: {
      transactionTimeout: parseInt(process.env.KAFKA_TRANSACTION_TIMEOUT || '30000', 10),
      idempotent: process.env.KAFKA_IDEMPOTENT !== 'false',
      maxInFlightRequests: parseInt(process.env.KAFKA_MAX_IN_FLIGHT || '1', 10),
      acks: parseInt(process.env.KAFKA_ACKS || '-1', 10) as -1 | 0 | 1,
      compression: (process.env.KAFKA_COMPRESSION as any) || 'gzip',
    },
    consumer: {
      sessionTimeout: parseInt(process.env.KAFKA_SESSION_TIMEOUT || '30000', 10),
      rebalanceTimeout: parseInt(process.env.KAFKA_REBALANCE_TIMEOUT || '60000', 10),
      heartbeatInterval: parseInt(process.env.KAFKA_HEARTBEAT_INTERVAL || '3000', 10),
      metadataMaxAge: parseInt(process.env.KAFKA_METADATA_MAX_AGE || '300000', 10),
      allowAutoTopicCreation: process.env.KAFKA_AUTO_TOPIC_CREATION === 'true',
      maxBytesPerPartition: parseInt(process.env.KAFKA_MAX_BYTES_PER_PARTITION || '1048576', 10),
      minBytes: parseInt(process.env.KAFKA_MIN_BYTES || '1', 10),
      maxBytes: parseInt(process.env.KAFKA_MAX_BYTES || '10485760', 10),
      maxWaitTimeInMs: parseInt(process.env.KAFKA_MAX_WAIT_TIME || '5000', 10),
    },
  },
  eventProcessing: {
    batchSize: parseInt(process.env.BATCH_SIZE || '1000', 10),
    batchTimeoutMs: parseInt(process.env.BATCH_TIMEOUT_MS || '5000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
    deadLetterQueueEnabled: process.env.DLQ_ENABLED !== 'false',
    metricsEnabled: process.env.METRICS_ENABLED !== 'false',
    compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false',
    deduplicationEnabled: process.env.DEDUPLICATION_ENABLED !== 'false',
    deduplicationWindowMs: parseInt(process.env.DEDUPLICATION_WINDOW_MS || '60000', 10),
  },
  rateLimit: {
    global: {
      max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '10000', 10),
      timeWindow: process.env.RATE_LIMIT_GLOBAL_WINDOW || '1 minute',
    },
    perSite: {
      max: parseInt(process.env.RATE_LIMIT_SITE_MAX || '1000', 10),
      timeWindow: process.env.RATE_LIMIT_SITE_WINDOW || '1 minute',
    },
    perIP: {
      max: parseInt(process.env.RATE_LIMIT_IP_MAX || '100', 10),
      timeWindow: process.env.RATE_LIMIT_IP_WINDOW || '1 minute',
    },
    skipOnError: process.env.RATE_LIMIT_SKIP_ON_ERROR !== 'false',
  },
  security: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
    maxEventSize: parseInt(process.env.MAX_EVENT_SIZE || '10240', 10),
    maxEventsPerBatch: parseInt(process.env.MAX_EVENTS_PER_BATCH || '100', 10),
    apiKeyHeader: process.env.API_KEY_HEADER || 'x-api-key',
    enableApiKeyAuth: process.env.ENABLE_API_KEY_AUTH === 'true',
    enableIPWhitelist: process.env.ENABLE_IP_WHITELIST === 'true',
    ipWhitelist: process.env.IP_WHITELIST?.split(',') || [],
    enableDDoSProtection: process.env.ENABLE_DDOS_PROTECTION !== 'false',
  },
  privacy: {
    enableGDPRMode: process.env.ENABLE_GDPR_MODE !== 'false',
    enableCCPAMode: process.env.ENABLE_CCPA_MODE !== 'false',
    enableIPAnonymization: process.env.ENABLE_IP_ANONYMIZATION !== 'false',
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '365', 10),
    enableConsentValidation: process.env.ENABLE_CONSENT_VALIDATION !== 'false',
    consentCookieName: process.env.CONSENT_COOKIE_NAME || 'heatmap_consent',
    enablePIIDetection: process.env.ENABLE_PII_DETECTION !== 'false',
    piiScrubbing: process.env.PII_SCRUBBING !== 'false',
  },
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    enableTracing: process.env.ENABLE_TRACING === 'true',
    metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60000', 10),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
    alertThresholds: {
      errorRate: parseFloat(process.env.ALERT_ERROR_RATE || '0.01'),
      latencyP99: parseInt(process.env.ALERT_LATENCY_P99 || '1000', 10),
      memoryUsage: parseFloat(process.env.ALERT_MEMORY_USAGE || '0.8'),
      cpuUsage: parseFloat(process.env.ALERT_CPU_USAGE || '0.8'),
    },
  },
  logging: {
    level: (process.env.LOG_LEVEL as any) || 'info',
    prettyPrint: process.env.LOG_PRETTY_PRINT === 'true' || process.env.NODE_ENV === 'development',
    file: process.env.LOG_FILE,
    maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10MB',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
    enableLogRotation: process.env.LOG_ENABLE_ROTATION !== 'false',
  },
};

// Validate configuration
export const config = configSchema.parse(rawConfig);

// Export types
export type Config = z.infer<typeof configSchema>;