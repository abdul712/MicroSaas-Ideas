import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface Config {
  environment: string
  server: {
    port: number
  }
  database: {
    url: string
  }
  redis: {
    url: string
  }
  clickhouse: {
    url: string
    database: string
  }
  jwt: {
    secret: string
    expiresIn: string
    refreshSecret: string
    refreshExpiresIn: string
  }
  frontend: {
    url: string
  }
  scraper: {
    serviceUrl: string
    userAgent: string
  }
  openai: {
    apiKey: string
    model: string
  }
  huggingface: {
    apiKey: string
  }
  email: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
    from: string
  }
  slack: {
    webhookUrl: string
  }
  stripe: {
    secretKey: string
    publishableKey: string
    webhookSecret: string
  }
  twilio: {
    accountSid: string
    authToken: string
    phoneNumber: string
  }
  monitoring: {
    sentryDsn: string
  }
}

const config: Config = {
  environment: process.env.NODE_ENV || 'development',
  
  server: {
    port: parseInt(process.env.PORT || '8000', 10),
  },
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/competitor_analysis',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  clickhouse: {
    url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
    database: process.env.CLICKHOUSE_DATABASE || 'analytics',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  
  scraper: {
    serviceUrl: process.env.SCRAPER_SERVICE_URL || 'http://localhost:8001',
    userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (compatible; CompetitorBot/1.0; +https://competitor-analysis.com/bot)',
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  },
  
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY || '',
  },
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@competitor-analysis.com',
  },
  
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },
  
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN || '',
  },
}

// Validate critical environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
]

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0 && config.environment === 'production') {
  console.error('❌ Missing required environment variables:', missingEnvVars)
  process.exit(1)
}

export { config }