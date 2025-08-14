import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    CLICKHOUSE_URL: z.string().url().optional(),
    
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string().min(1) : z.string().url()
    ),
    
    // OAuth Providers
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    
    // Email Services
    RESEND_API_KEY: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    
    // SMS Services
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),
    
    // E-commerce Platform APIs
    SHOPIFY_API_KEY: z.string().optional(),
    SHOPIFY_API_SECRET: z.string().optional(),
    SHOPIFY_WEBHOOK_SECRET: z.string().optional(),
    
    AMAZON_SP_API_CLIENT_ID: z.string().optional(),
    AMAZON_SP_API_CLIENT_SECRET: z.string().optional(),
    AMAZON_SP_API_REFRESH_TOKEN: z.string().optional(),
    
    EBAY_CLIENT_ID: z.string().optional(),
    EBAY_CLIENT_SECRET: z.string().optional(),
    EBAY_SANDBOX_MODE: z.string().default("true"),
    
    WOOCOMMERCE_CONSUMER_KEY: z.string().optional(),
    WOOCOMMERCE_CONSUMER_SECRET: z.string().optional(),
    
    BIGCOMMERCE_CLIENT_ID: z.string().optional(),
    BIGCOMMERCE_CLIENT_SECRET: z.string().optional(),
    BIGCOMMERCE_ACCESS_TOKEN: z.string().optional(),
    
    // Payment Processing
    STRIPE_PUBLIC_KEY: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    
    // File Storage
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    
    // Monitoring & Analytics
    SENTRY_DSN: z.string().optional(),
    POSTHOG_API_KEY: z.string().optional(),
    MIXPANEL_TOKEN: z.string().optional(),
    
    // Search Engine
    TYPESENSE_API_KEY: z.string().optional(),
    TYPESENSE_HOST: z.string().optional(),
    TYPESENSE_PORT: z.string().optional(),
    
    ALGOLIA_APP_ID: z.string().optional(),
    ALGOLIA_API_KEY: z.string().optional(),
    ALGOLIA_SEARCH_KEY: z.string().optional(),
    
    // AI/ML Services
    OPENAI_API_KEY: z.string().optional(),
    HUGGING_FACE_API_KEY: z.string().optional(),
    REPLICATE_API_TOKEN: z.string().optional(),
    
    // Security & Encryption
    ENCRYPTION_KEY: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    WEBHOOK_SECRET: z.string().min(1),
    
    // Rate Limiting
    UPSTASH_REDIS_REST_URL: z.string().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    
    // Configuration
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.string().default("3000"),
    
    // API Configuration
    API_RATE_LIMIT: z.string().default("1000"),
    API_RATE_WINDOW: z.string().default("3600"),
    API_TIMEOUT: z.string().default("30000"),
    
    // ML Configuration
    ML_MODEL_UPDATE_INTERVAL: z.string().default("86400"),
    ML_FORECAST_HORIZON_DAYS: z.string().default("30"),
    ML_CONFIDENCE_THRESHOLD: z.string().default("0.8"),
    
    // Inventory Configuration
    DEFAULT_REORDER_POINT: z.string().default("10"),
    DEFAULT_REORDER_QUANTITY: z.string().default("50"),
    DEFAULT_LEAD_TIME_DAYS: z.string().default("7"),
    SAFETY_STOCK_MULTIPLIER: z.string().default("1.5"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
    NEXT_PUBLIC_ALGOLIA_APP_ID: z.string().optional(),
    NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: z.string().optional(),
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_CRISP_WEBSITE_ID: z.string().optional(),
    NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().default("false"),
    NEXT_PUBLIC_ENABLE_MONITORING: z.string().default("false"),
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
    NEXT_PUBLIC_WS_URL: z.string().url().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    // Server
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    CLICKHOUSE_URL: process.env.CLICKHOUSE_URL,
    
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
    SHOPIFY_WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET,
    
    AMAZON_SP_API_CLIENT_ID: process.env.AMAZON_SP_API_CLIENT_ID,
    AMAZON_SP_API_CLIENT_SECRET: process.env.AMAZON_SP_API_CLIENT_SECRET,
    AMAZON_SP_API_REFRESH_TOKEN: process.env.AMAZON_SP_API_REFRESH_TOKEN,
    
    EBAY_CLIENT_ID: process.env.EBAY_CLIENT_ID,
    EBAY_CLIENT_SECRET: process.env.EBAY_CLIENT_SECRET,
    EBAY_SANDBOX_MODE: process.env.EBAY_SANDBOX_MODE,
    
    WOOCOMMERCE_CONSUMER_KEY: process.env.WOOCOMMERCE_CONSUMER_KEY,
    WOOCOMMERCE_CONSUMER_SECRET: process.env.WOOCOMMERCE_CONSUMER_SECRET,
    
    BIGCOMMERCE_CLIENT_ID: process.env.BIGCOMMERCE_CLIENT_ID,
    BIGCOMMERCE_CLIENT_SECRET: process.env.BIGCOMMERCE_CLIENT_SECRET,
    BIGCOMMERCE_ACCESS_TOKEN: process.env.BIGCOMMERCE_ACCESS_TOKEN,
    
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    
    SENTRY_DSN: process.env.SENTRY_DSN,
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN,
    
    TYPESENSE_API_KEY: process.env.TYPESENSE_API_KEY,
    TYPESENSE_HOST: process.env.TYPESENSE_HOST,
    TYPESENSE_PORT: process.env.TYPESENSE_PORT,
    
    ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID,
    ALGOLIA_API_KEY: process.env.ALGOLIA_API_KEY,
    ALGOLIA_SEARCH_KEY: process.env.ALGOLIA_SEARCH_KEY,
    
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    HUGGING_FACE_API_KEY: process.env.HUGGING_FACE_API_KEY,
    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
    
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    
    API_RATE_LIMIT: process.env.API_RATE_LIMIT,
    API_RATE_WINDOW: process.env.API_RATE_WINDOW,
    API_TIMEOUT: process.env.API_TIMEOUT,
    
    ML_MODEL_UPDATE_INTERVAL: process.env.ML_MODEL_UPDATE_INTERVAL,
    ML_FORECAST_HORIZON_DAYS: process.env.ML_FORECAST_HORIZON_DAYS,
    ML_CONFIDENCE_THRESHOLD: process.env.ML_CONFIDENCE_THRESHOLD,
    
    DEFAULT_REORDER_POINT: process.env.DEFAULT_REORDER_POINT,
    DEFAULT_REORDER_QUANTITY: process.env.DEFAULT_REORDER_QUANTITY,
    DEFAULT_LEAD_TIME_DAYS: process.env.DEFAULT_LEAD_TIME_DAYS,
    SAFETY_STOCK_MULTIPLIER: process.env.SAFETY_STOCK_MULTIPLIER,
    
    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_ALGOLIA_APP_ID: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
    NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_CRISP_WEBSITE_ID: process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    NEXT_PUBLIC_ENABLE_MONITORING: process.env.NEXT_PUBLIC_ENABLE_MONITORING,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
  /**
   * Run `build` or `dev` with SKIP_ENV_VALIDATION to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});