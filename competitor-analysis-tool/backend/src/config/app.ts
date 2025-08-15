import { z } from 'zod'

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  
  // Database URLs
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  CLICKHOUSE_URL: z.string().url(),
  ELASTICSEARCH_URL: z.string().url(),
  
  // Kafka
  KAFKA_BROKER: z.string(),
  KAFKA_CLIENT_ID: z.string().default('competitor-analysis'),
  KAFKA_GROUP_ID: z.string().default('competitor-consumers'),
  
  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  
  // External APIs
  OPENAI_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  
  // Social Media APIs
  TWITTER_API_KEY: z.string().optional(),
  TWITTER_API_SECRET: z.string().optional(),
  TWITTER_BEARER_TOKEN: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  
  // SEO APIs
  GOOGLE_SEARCH_API_KEY: z.string().optional(),
  GOOGLE_SEARCH_ENGINE_ID: z.string().optional(),
  SEMRUSH_API_KEY: z.string().optional(),
  AHREFS_API_KEY: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // Notification services
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  DISCORD_WEBHOOK_URL: z.string().url().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: z.string().transform(Boolean).default('true'),
  
  // File upload
  UPLOAD_MAX_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  SENTRY_DSN: z.string().url().optional(),
  
  // Feature flags
  ENABLE_SOCIAL_MONITORING: z.string().transform(Boolean).default('true'),
  ENABLE_SEO_TRACKING: z.string().transform(Boolean).default('true'),
  ENABLE_AI_INSIGHTS: z.string().transform(Boolean).default('true'),
  
  // Browser automation
  HEADLESS_BROWSER: z.string().transform(Boolean).default('true'),
  BROWSER_TIMEOUT: z.string().transform(Number).default('30000'),
  
  // Scraping settings
  USER_AGENT: z.string().default('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
  SCRAPING_DELAY_MIN: z.string().transform(Number).default('1'),
  SCRAPING_DELAY_MAX: z.string().transform(Number).default('3'),
  MAX_CONCURRENT_REQUESTS: z.string().transform(Number).default('10'),
  REQUEST_TIMEOUT: z.string().transform(Number).default('30'),
  
  // Data retention
  DATA_RETENTION_DAYS: z.string().transform(Number).default('365'),
  AUTO_ARCHIVE_DAYS: z.string().transform(Number).default('90'),
  
  // SSL
  SSL_ENABLED: z.string().transform(Boolean).default('false'),
  SSL_CERT_PATH: z.string().optional(),
  SSL_KEY_PATH: z.string().optional(),
})

// Parse and validate environment variables
const env = envSchema.parse(process.env)

// Application configuration
export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  
  // Database configuration
  database: {
    url: env.DATABASE_URL,
  },
  
  // Redis configuration
  redis: {
    url: env.REDIS_URL,
  },
  
  // ClickHouse configuration
  clickhouse: {
    url: env.CLICKHOUSE_URL,
  },
  
  // Elasticsearch configuration
  elasticsearch: {
    url: env.ELASTICSEARCH_URL,
  },
  
  // Kafka configuration
  kafka: {
    broker: env.KAFKA_BROKER,
    clientId: env.KAFKA_CLIENT_ID,
    groupId: env.KAFKA_GROUP_ID,
  },
  
  // JWT configuration
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  // Bcrypt configuration
  bcrypt: {
    rounds: env.BCRYPT_ROUNDS,
  },
  
  // External API keys
  apis: {
    openai: env.OPENAI_API_KEY,
    huggingface: env.HUGGINGFACE_API_KEY,
    stripe: env.STRIPE_SECRET_KEY,
    
    // Social media
    twitter: {
      apiKey: env.TWITTER_API_KEY,
      apiSecret: env.TWITTER_API_SECRET,
      bearerToken: env.TWITTER_BEARER_TOKEN,
    },
    facebook: {
      appId: env.FACEBOOK_APP_ID,
      appSecret: env.FACEBOOK_APP_SECRET,
    },
    linkedin: {
      clientId: env.LINKEDIN_CLIENT_ID,
      clientSecret: env.LINKEDIN_CLIENT_SECRET,
    },
    
    // SEO
    google: {
      searchApiKey: env.GOOGLE_SEARCH_API_KEY,
      searchEngineId: env.GOOGLE_SEARCH_ENGINE_ID,
    },
    semrush: env.SEMRUSH_API_KEY,
    ahrefs: env.AHREFS_API_KEY,
  },
  
  // Email configuration
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.FROM_EMAIL,
  },
  
  // Notification services
  notifications: {
    slack: {
      webhookUrl: env.SLACK_WEBHOOK_URL,
    },
    discord: {
      webhookUrl: env.DISCORD_WEBHOOK_URL,
    },
    twilio: {
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
    },
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  // CORS configuration
  cors: {
    origin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
    credentials: env.CORS_CREDENTIALS,
  },
  
  // File upload configuration
  upload: {
    maxSize: env.UPLOAD_MAX_SIZE,
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  
  // AWS configuration
  aws: {
    bucketName: env.AWS_BUCKET_NAME,
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  
  // Logging configuration
  logging: {
    level: env.LOG_LEVEL,
    sentryDsn: env.SENTRY_DSN,
  },
  
  // Feature flags
  features: {
    socialMonitoring: env.ENABLE_SOCIAL_MONITORING,
    seoTracking: env.ENABLE_SEO_TRACKING,
    aiInsights: env.ENABLE_AI_INSIGHTS,
  },
  
  // Browser automation
  browser: {
    headless: env.HEADLESS_BROWSER,
    timeout: env.BROWSER_TIMEOUT,
  },
  
  // Scraping configuration
  scraping: {
    userAgent: env.USER_AGENT,
    delayMin: env.SCRAPING_DELAY_MIN,
    delayMax: env.SCRAPING_DELAY_MAX,
    maxConcurrentRequests: env.MAX_CONCURRENT_REQUESTS,
    requestTimeout: env.REQUEST_TIMEOUT,
  },
  
  // Data retention
  dataRetention: {
    retentionDays: env.DATA_RETENTION_DAYS,
    archiveDays: env.AUTO_ARCHIVE_DAYS,
  },
  
  // SSL configuration
  ssl: {
    enabled: env.SSL_ENABLED,
    certPath: env.SSL_CERT_PATH,
    keyPath: env.SSL_KEY_PATH,
  },
  
  // Application constants
  constants: {
    defaultPagination: {
      page: 1,
      limit: 20,
      maxLimit: 100,
    },
    priceChangeThreshold: 0.05, // 5% price change threshold
    alertRetentionDays: 30,
    reportRetentionDays: 90,
    maxCompetitorsPerOrg: {
      starter: 5,
      professional: 15,
      business: 50,
      enterprise: 999999,
    },
    maxMonitoringRules: {
      starter: 10,
      professional: 50,
      business: 200,
      enterprise: 999999,
    },
    scrapingFrequency: {
      hourly: '0 * * * *',
      daily: '0 0 * * *',
      weekly: '0 0 * * 0',
      monthly: '0 0 1 * *',
    },
    supportedPlatforms: [
      'website',
      'twitter',
      'facebook',
      'linkedin',
      'instagram',
      'youtube',
      'tiktok',
      'google_ads',
      'facebook_ads',
    ],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'],
    defaultTimezone: 'UTC',
  },
} as const

// Type exports
export type Config = typeof config
export type Environment = typeof env.NODE_ENV