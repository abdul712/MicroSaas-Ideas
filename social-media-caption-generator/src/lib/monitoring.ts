import * as Sentry from '@sentry/nextjs';

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.BrowserTracing(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out sensitive information
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.stacktrace?.frames) {
          error.stacktrace.frames = error.stacktrace.frames.filter(
            frame => !frame.filename?.includes('node_modules')
          );
        }
      }
      return event;
    },
  });
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface BusinessMetric {
  event: string;
  userId?: string;
  organizationId?: string;
  properties: Record<string, any>;
  timestamp: Date;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private businessEvents: BusinessMetric[] = [];

  // Performance monitoring
  trackPerformance(metric: Omit<PerformanceMetric, 'timestamp'>) {
    const performanceMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(performanceMetric);
    
    // Send to external services in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToObservability(performanceMetric);
    }

    // Log locally for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[METRIC] ${metric.name}: ${metric.value}${metric.unit}`, metric.tags);
    }
  }

  // Business event tracking
  trackEvent(event: Omit<BusinessMetric, 'timestamp'>) {
    const businessMetric: BusinessMetric = {
      ...event,
      timestamp: new Date(),
    };

    this.businessEvents.push(businessMetric);

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(businessMetric);
    }

    // Log locally for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EVENT] ${event.event}:`, event.properties);
    }
  }

  // Error tracking
  trackError(error: Error, context?: Record<string, any>) {
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      Sentry.captureException(error);
    });

    // Also track as performance metric
    this.trackPerformance({
      name: 'error_rate',
      value: 1,
      unit: 'count',
      tags: {
        error_type: error.name,
        error_message: error.message,
        ...context,
      },
    });
  }

  // Custom timing wrapper
  async timeFunction<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.trackPerformance({
        name: `${name}_duration`,
        value: duration,
        unit: 'ms',
        tags: { ...tags, status: 'success' },
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.trackPerformance({
        name: `${name}_duration`,
        value: duration,
        unit: 'ms',
        tags: { ...tags, status: 'error' },
      });
      
      this.trackError(error as Error, { function: name, ...tags });
      throw error;
    }
  }

  // AI generation monitoring
  trackAIGeneration(data: {
    provider: string;
    model: string;
    tokens: number;
    cost: number;
    duration: number;
    success: boolean;
    platform: string;
    userId: string;
  }) {
    // Performance metrics
    this.trackPerformance({
      name: 'ai_generation_duration',
      value: data.duration,
      unit: 'ms',
      tags: {
        provider: data.provider,
        model: data.model,
        platform: data.platform,
        status: data.success ? 'success' : 'error',
      },
    });

    this.trackPerformance({
      name: 'ai_generation_cost',
      value: data.cost,
      unit: 'usd',
      tags: {
        provider: data.provider,
        model: data.model,
      },
    });

    this.trackPerformance({
      name: 'ai_generation_tokens',
      value: data.tokens,
      unit: 'count',
      tags: {
        provider: data.provider,
        model: data.model,
      },
    });

    // Business event
    this.trackEvent({
      event: 'caption_generated',
      userId: data.userId,
      properties: {
        provider: data.provider,
        model: data.model,
        platform: data.platform,
        tokens: data.tokens,
        cost: data.cost,
        duration: data.duration,
        success: data.success,
      },
    });
  }

  // Subscription monitoring
  trackSubscription(event: 'created' | 'upgraded' | 'downgraded' | 'cancelled', data: {
    userId: string;
    organizationId?: string;
    plan: string;
    previousPlan?: string;
    amount?: number;
  }) {
    this.trackEvent({
      event: `subscription_${event}`,
      userId: data.userId,
      organizationId: data.organizationId,
      properties: {
        plan: data.plan,
        previous_plan: data.previousPlan,
        amount: data.amount,
      },
    });

    // Track as performance metric for monitoring
    this.trackPerformance({
      name: 'subscription_events',
      value: 1,
      unit: 'count',
      tags: {
        event,
        plan: data.plan,
        user_type: data.organizationId ? 'organization' : 'individual',
      },
    });
  }

  // Image upload monitoring
  trackImageUpload(data: {
    userId: string;
    fileSize: number;
    format: string;
    processingTime: number;
    analysisSuccess: boolean;
  }) {
    this.trackPerformance({
      name: 'image_upload_size',
      value: data.fileSize,
      unit: 'bytes',
      tags: {
        format: data.format,
      },
    });

    this.trackPerformance({
      name: 'image_processing_time',
      value: data.processingTime,
      unit: 'ms',
      tags: {
        format: data.format,
        analysis_success: data.analysisSuccess.toString(),
      },
    });

    this.trackEvent({
      event: 'image_uploaded',
      userId: data.userId,
      properties: {
        file_size: data.fileSize,
        format: data.format,
        processing_time: data.processingTime,
        analysis_success: data.analysisSuccess,
      },
    });
  }

  // Database performance monitoring
  trackDatabaseQuery(operation: string, table: string, duration: number) {
    this.trackPerformance({
      name: 'database_query_duration',
      value: duration,
      unit: 'ms',
      tags: {
        operation,
        table,
      },
    });
  }

  // API endpoint monitoring
  trackAPIRequest(data: {
    method: string;
    endpoint: string;
    statusCode: number;
    duration: number;
    userId?: string;
  }) {
    this.trackPerformance({
      name: 'api_request_duration',
      value: data.duration,
      unit: 'ms',
      tags: {
        method: data.method,
        endpoint: data.endpoint,
        status_code: data.statusCode.toString(),
        status_class: Math.floor(data.statusCode / 100) + 'xx',
      },
    });

    if (data.statusCode >= 400) {
      this.trackPerformance({
        name: 'api_error_rate',
        value: 1,
        unit: 'count',
        tags: {
          method: data.method,
          endpoint: data.endpoint,
          status_code: data.statusCode.toString(),
        },
      });
    }
  }

  // Health check metrics
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, { status: boolean; latency?: number; error?: string }>;
  }> {
    const checks: Record<string, { status: boolean; latency?: number; error?: string }> = {};
    
    // Database check
    try {
      const start = Date.now();
      const { prisma } = await import('@/lib/prisma');
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: true, latency: Date.now() - start };
    } catch (error) {
      checks.database = { status: false, error: (error as Error).message };
    }

    // AI providers check (sample one)
    try {
      const start = Date.now();
      const { generateEmbedding } = await import('@/lib/ai/openai');
      await generateEmbedding('health check');
      checks.ai_openai = { status: true, latency: Date.now() - start };
    } catch (error) {
      checks.ai_openai = { status: false, error: (error as Error).message };
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    const memoryUsageMB = memUsage.heapUsed / 1024 / 1024;
    checks.memory = { 
      status: memoryUsageMB < 500, // Flag if using more than 500MB
      latency: memoryUsageMB 
    };

    // Determine overall status
    const failedChecks = Object.values(checks).filter(check => !check.status).length;
    const status = failedChecks === 0 ? 'healthy' : 
                   failedChecks <= 1 ? 'degraded' : 'unhealthy';

    return { status, checks };
  }

  private async sendToObservability(metric: PerformanceMetric) {
    // In production, send to your observability platform
    // Example: DataDog, New Relic, Prometheus, etc.
    
    // For now, we'll use a simple webhook approach
    if (process.env.OBSERVABILITY_WEBHOOK) {
      try {
        await fetch(process.env.OBSERVABILITY_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric),
        });
      } catch (error) {
        console.error('Failed to send metric to observability platform:', error);
      }
    }
  }

  private async sendToAnalytics(event: BusinessMetric) {
    // In production, send to your analytics platform
    // Example: Mixpanel, Amplitude, PostHog, etc.
    
    if (process.env.ANALYTICS_WEBHOOK) {
      try {
        await fetch(process.env.ANALYTICS_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
      } catch (error) {
        console.error('Failed to send event to analytics platform:', error);
      }
    }
  }

  // Get recent metrics for debugging
  getRecentMetrics(limit = 100): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }

  getRecentEvents(limit = 100): BusinessMetric[] {
    return this.businessEvents.slice(-limit);
  }

  // Clear old metrics to prevent memory leaks
  cleanup() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    this.businessEvents = this.businessEvents.filter(e => e.timestamp > oneHourAgo);
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// Clean up old metrics every hour
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => monitoring.cleanup(), 60 * 60 * 1000);
}

// Middleware helper for API monitoring
export function withAPIMonitoring<T extends any[], R>(
  endpoint: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return monitoring.timeFunction(
      `api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`,
      () => fn(...args),
      { endpoint }
    );
  };
}

// Database monitoring wrapper
export function withDatabaseMonitoring<T extends any[], R>(
  operation: string,
  table: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      monitoring.trackDatabaseQuery(operation, table, Date.now() - start);
      return result;
    } catch (error) {
      monitoring.trackDatabaseQuery(operation, table, Date.now() - start);
      throw error;
    }
  };
}