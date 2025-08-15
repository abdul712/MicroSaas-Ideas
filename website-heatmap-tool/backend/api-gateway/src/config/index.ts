import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export const config = {
  node: {
    env: process.env.NODE_ENV || 'development',
  },
  server: {
    port: parseInt(process.env.PORT || '8080', 10),
    host: process.env.HOST || '0.0.0.0',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://app.heatmaptool.com',
      'https://heatmaptool.com'
    ],
  },
  services: {
    eventCollection: {
      url: process.env.EVENT_COLLECTION_URL || 'http://localhost:3001',
    },
    analyticsProcessing: {
      url: process.env.ANALYTICS_PROCESSING_URL || 'http://localhost:3002',
    },
    heatmapGeneration: {
      url: process.env.HEATMAP_GENERATION_URL || 'http://localhost:3003',
    },
    userManagement: {
      url: process.env.USER_MANAGEMENT_URL || 'http://localhost:3004',
    },
    privacyService: {
      url: process.env.PRIVACY_SERVICE_URL || 'http://localhost:3005',
    },
    aiInsights: {
      url: process.env.AI_INSIGHTS_URL || 'http://localhost:3006',
    },
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10), // limit each IP to 1000 requests per windowMs
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000', 10), // 15 minutes
  },
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPath: process.env.METRICS_PATH || '/metrics',
  },
}