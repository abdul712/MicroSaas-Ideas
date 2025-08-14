import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define environment schema
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('8080'),
  APP_URL: z.string().url().default('http://localhost:8080'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Session
  SESSION_SECRET: z.string().min(32),
  
  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  SALESFORCE_CLIENT_ID: z.string().optional(),
  SALESFORCE_CLIENT_SECRET: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_SECURE: z.string().transform(Boolean).default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().default('noreply@salesdashboard.com'),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // External APIs
  HUBSPOT_CLIENT_ID: z.string().optional(),
  HUBSPOT_CLIENT_SECRET: z.string().optional(),
  PIPEDRIVE_CLIENT_ID: z.string().optional(),
  PIPEDRIVE_CLIENT_SECRET: z.string().optional(),
  
  // File uploads
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  UPLOAD_PATH: z.string().default('./uploads'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // Analytics
  ML_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  CLICKHOUSE_URL: z.string().url().optional(),
  CLICKHOUSE_USER: z.string().default('default'),
  CLICKHOUSE_PASSWORD: z.string().default(''),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  PROMETHEUS_PORT: z.string().transform(Number).default('9090'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  
  app: {
    url: env.APP_URL,
    frontendUrl: env.FRONTEND_URL,
  },
  
  database: {
    url: env.DATABASE_URL,
    ssl: env.NODE_ENV === 'production',
  },
  
  redis: {
    url: env.REDIS_URL,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  session: {
    secret: env.SESSION_SECRET,
  },
  
  oauth: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    microsoft: {
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
    },
    salesforce: {
      clientId: env.SALESFORCE_CLIENT_ID,
      clientSecret: env.SALESFORCE_CLIENT_SECRET,
    },
  },
  
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER && env.SMTP_PASS ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      } : undefined,
    },
    from: env.FROM_EMAIL,
  },
  
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  
  integrations: {
    hubspot: {
      clientId: env.HUBSPOT_CLIENT_ID,
      clientSecret: env.HUBSPOT_CLIENT_SECRET,
    },
    pipedrive: {
      clientId: env.PIPEDRIVE_CLIENT_ID,
      clientSecret: env.PIPEDRIVE_CLIENT_SECRET,
    },
  },
  
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    path: env.UPLOAD_PATH,
  },
  
  logging: {
    level: env.LOG_LEVEL,
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  analytics: {
    mlServiceUrl: env.ML_SERVICE_URL,
    clickhouse: {
      url: env.CLICKHOUSE_URL,
      user: env.CLICKHOUSE_USER,
      password: env.CLICKHOUSE_PASSWORD,
    },
  },
  
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    prometheusPort: env.PROMETHEUS_PORT,
  },
  
  cors: {
    origin: env.NODE_ENV === 'production' 
      ? [env.FRONTEND_URL] 
      : ['http://localhost:3000', 'http://localhost:3001'],
  },
  
  // Feature flags
  features: {
    enableClickhouse: !!env.CLICKHOUSE_URL,
    enableOAuth: !!(env.GOOGLE_CLIENT_ID || env.MICROSOFT_CLIENT_ID),
    enableStripe: !!env.STRIPE_SECRET_KEY,
    enableEmail: !!(env.SMTP_HOST && env.SMTP_USER),
    enableSentry: !!env.SENTRY_DSN,
  },
};

export type Config = typeof config;