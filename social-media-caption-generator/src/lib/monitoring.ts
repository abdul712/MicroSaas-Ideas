import * as Sentry from '@sentry/nextjs';
import { prisma } from './prisma';

// Performance monitoring metrics
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface BusinessMetric {
  name: string;
  value: number;
  unit: string;
  userId?: string;
  organizationId?: string;
  metadata?: any;
  timestamp: Date;
}

// Monitoring service class
export class MonitoringService {
  private static instance: MonitoringService;
  private metricsBuffer: PerformanceMetric[] = [];
  private businessMetricsBuffer: BusinessMetric[] = [];

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  constructor() {
    // Initialize Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: 1.0,
        beforeSend(event) {
          // Filter out noise and PII
          if (event.request?.headers?.authorization) {
            delete event.request.headers.authorization;
          }
          return event;
        }
      });
    }

    // Flush metrics periodically
    setInterval(() => {
      this.flushMetrics();
    }, 30000); // Every 30 seconds
  }

  // Performance monitoring
  recordPerformanceMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    this.metricsBuffer.push({
      ...metric,
      timestamp: new Date()
    });

    // Also send to Sentry for real-time monitoring
    if (process.env.SENTRY_DSN) {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${metric.name}: ${metric.value}${metric.unit}`,
        level: 'info',
        data: metric.tags
      });
    }
  }

  // Business metrics tracking
  recordBusinessMetric(metric: Omit<BusinessMetric, 'timestamp'>): void {
    this.businessMetricsBuffer.push({
      ...metric,
      timestamp: new Date()
    });
  }

  // AI generation metrics
  recordAIGenerationMetric(data: {
    provider: string;
    model: string;
    platform: string;
    tokensUsed: number;
    cost: number;
    processingTime: number;
    success: boolean;
    userId: string;
    organizationId?: string;
  }): void {
    this.recordPerformanceMetric({
      name: 'ai_generation_time',
      value: data.processingTime,
      unit: 'ms',
      tags: {
        provider: data.provider,
        model: data.model,
        platform: data.platform,
        success: data.success.toString()
      }
    });

    this.recordBusinessMetric({
      name: 'ai_generation',
      value: 1,
      unit: 'count',
      userId: data.userId,
      organizationId: data.organizationId,
      metadata: {
        provider: data.provider,
        model: data.model,
        platform: data.platform,
        tokensUsed: data.tokensUsed,
        cost: data.cost,
        success: data.success
      }
    });

    // Track costs separately
    this.recordBusinessMetric({
      name: 'ai_cost',
      value: data.cost,
      unit: 'usd',
      userId: data.userId,
      organizationId: data.organizationId,
      metadata: {
        provider: data.provider,
        model: data.model,
        tokensUsed: data.tokensUsed
      }
    });
  }

  // User activity metrics
  recordUserActivity(data: {
    userId: string;
    action: string;
    resource: string;
    success: boolean;
    duration?: number;
    organizationId?: string;
  }): void {
    this.recordBusinessMetric({
      name: 'user_activity',
      value: 1,
      unit: 'count',
      userId: data.userId,
      organizationId: data.organizationId,
      metadata: {
        action: data.action,
        resource: data.resource,
        success: data.success,
        duration: data.duration
      }
    });

    if (data.duration) {
      this.recordPerformanceMetric({
        name: 'user_action_duration',
        value: data.duration,
        unit: 'ms',
        tags: {
          action: data.action,
          resource: data.resource,
          success: data.success.toString()
        }
      });
    }
  }

  // Subscription metrics
  recordSubscriptionMetric(data: {
    userId: string;
    action: 'created' | 'upgraded' | 'downgraded' | 'cancelled' | 'renewed';
    fromTier?: string;
    toTier: string;
    revenue?: number;
  }): void {
    this.recordBusinessMetric({
      name: 'subscription_event',
      value: 1,
      unit: 'count',
      userId: data.userId,
      metadata: {
        action: data.action,
        fromTier: data.fromTier,
        toTier: data.toTier,
        revenue: data.revenue
      }
    });

    if (data.revenue) {
      this.recordBusinessMetric({
        name: 'revenue',
        value: data.revenue,
        unit: 'usd',
        userId: data.userId,
        metadata: {
          source: 'subscription',
          action: data.action,
          tier: data.toTier
        }
      });
    }
  }

  // Error tracking
  recordError(error: Error, context?: {
    userId?: string;
    action?: string;
    extra?: any;
  }): void {
    // Send to Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        if (context?.userId) {
          scope.setUser({ id: context.userId });
        }
        if (context?.action) {
          scope.setTag('action', context.action);
        }
        if (context?.extra) {
          scope.setContext('extra', context.extra);
        }
        Sentry.captureException(error);
      });
    }

    // Record as business metric
    this.recordBusinessMetric({
      name: 'error',
      value: 1,
      unit: 'count',
      userId: context?.userId,
      metadata: {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines
        action: context?.action,
        extra: context?.extra
      }
    });
  }

  // System health metrics
  async recordSystemHealth(): Promise<void> {
    const startTime = Date.now();

    try {
      // Database health
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbTime = Date.now() - dbStart;

      this.recordPerformanceMetric({
        name: 'database_response_time',
        value: dbTime,
        unit: 'ms',
        tags: { status: 'healthy' }
      });

      // Memory usage
      const memUsage = process.memoryUsage();
      this.recordPerformanceMetric({
        name: 'memory_usage_rss',
        value: memUsage.rss,
        unit: 'bytes'
      });
      this.recordPerformanceMetric({
        name: 'memory_usage_heap_used',
        value: memUsage.heapUsed,
        unit: 'bytes'
      });
      this.recordPerformanceMetric({
        name: 'memory_usage_heap_total',
        value: memUsage.heapTotal,
        unit: 'bytes'
      });

      // CPU usage (simplified)
      const cpuUsage = process.cpuUsage();
      this.recordPerformanceMetric({
        name: 'cpu_usage_user',
        value: cpuUsage.user / 1000, // Convert to milliseconds
        unit: 'ms'
      });
      this.recordPerformanceMetric({
        name: 'cpu_usage_system',
        value: cpuUsage.system / 1000,
        unit: 'ms'
      });

      // Overall health check time
      this.recordPerformanceMetric({
        name: 'health_check_duration',
        value: Date.now() - startTime,
        unit: 'ms',
        tags: { status: 'success' }
      });

    } catch (error) {
      this.recordPerformanceMetric({
        name: 'health_check_duration',
        value: Date.now() - startTime,
        unit: 'ms',
        tags: { status: 'failed' }
      });

      this.recordError(error as Error, { action: 'health_check' });
    }
  }

  // Flush metrics to storage
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0 && this.businessMetricsBuffer.length === 0) {
      return;
    }

    try {
      const performanceMetrics = [...this.metricsBuffer];
      const businessMetrics = [...this.businessMetricsBuffer];

      // Clear buffers
      this.metricsBuffer = [];
      this.businessMetricsBuffer = [];

      // Store in database (simplified - in production use time-series DB)
      await prisma.$transaction(async (tx) => {
        // Store performance metrics
        for (const metric of performanceMetrics) {
          try {
            await tx.$executeRaw`
              INSERT INTO system_metrics (name, value, unit, tags, timestamp)
              VALUES (${metric.name}, ${metric.value}, ${metric.unit}, ${JSON.stringify(metric.tags || {})}, ${metric.timestamp})
            `;
          } catch (error) {
            console.error('Failed to store performance metric:', error);
          }
        }

        // Store business metrics
        for (const metric of businessMetrics) {
          try {
            await tx.$executeRaw`
              INSERT INTO business_metrics (name, value, unit, user_id, organization_id, metadata, timestamp)
              VALUES (${metric.name}, ${metric.value}, ${metric.unit}, ${metric.userId}, ${metric.organizationId}, ${JSON.stringify(metric.metadata || {})}, ${metric.timestamp})
            `;
          } catch (error) {
            console.error('Failed to store business metric:', error);
          }
        }
      });

    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Put metrics back in buffer to retry
      this.metricsBuffer.push(...this.metricsBuffer);
      this.businessMetricsBuffer.push(...this.businessMetricsBuffer);
    }
  }

  // Get system metrics for dashboard
  async getSystemMetrics(timeRange: {
    start: Date;
    end: Date;
  }): Promise<{
    performance: PerformanceMetric[];
    business: BusinessMetric[];
  }> {
    try {
      const [performanceMetrics, businessMetrics] = await Promise.all([
        prisma.$queryRaw<PerformanceMetric[]>`
          SELECT name, value, unit, tags, timestamp
          FROM system_metrics
          WHERE timestamp BETWEEN ${timeRange.start} AND ${timeRange.end}
          ORDER BY timestamp DESC
          LIMIT 1000
        `,
        prisma.$queryRaw<BusinessMetric[]>`
          SELECT name, value, unit, user_id as "userId", organization_id as "organizationId", metadata, timestamp
          FROM business_metrics
          WHERE timestamp BETWEEN ${timeRange.start} AND ${timeRange.end}
          ORDER BY timestamp DESC
          LIMIT 1000
        `
      ]);

      return {
        performance: performanceMetrics,
        business: businessMetrics
      };
    } catch (error) {
      this.recordError(error as Error, { action: 'get_system_metrics' });
      return { performance: [], business: [] };
    }
  }

  // Get aggregated metrics for dashboard
  async getAggregatedMetrics(timeRange: {
    start: Date;
    end: Date;
  }): Promise<{
    totalUsers: number;
    totalGenerations: number;
    totalRevenue: number;
    avgResponseTime: number;
    errorRate: number;
    aiCosts: number;
  }> {
    try {
      const [metrics] = await prisma.$queryRaw<Array<{
        total_users: bigint;
        total_generations: bigint;
        total_revenue: number;
        avg_response_time: number;
        error_count: bigint;
        total_requests: bigint;
        ai_costs: number;
      }>>`
        SELECT 
          COUNT(DISTINCT user_id) as total_users,
          SUM(CASE WHEN name = 'ai_generation' THEN value ELSE 0 END) as total_generations,
          SUM(CASE WHEN name = 'revenue' THEN value ELSE 0 END) as total_revenue,
          AVG(CASE WHEN name = 'user_action_duration' THEN value ELSE NULL END) as avg_response_time,
          SUM(CASE WHEN name = 'error' THEN value ELSE 0 END) as error_count,
          SUM(CASE WHEN name = 'user_activity' THEN value ELSE 0 END) as total_requests,
          SUM(CASE WHEN name = 'ai_cost' THEN value ELSE 0 END) as ai_costs
        FROM business_metrics
        WHERE timestamp BETWEEN ${timeRange.start} AND ${timeRange.end}
      `;

      const totalRequests = Number(metrics?.total_requests || 0);
      const errorCount = Number(metrics?.error_count || 0);

      return {
        totalUsers: Number(metrics?.total_users || 0),
        totalGenerations: Number(metrics?.total_generations || 0),
        totalRevenue: metrics?.total_revenue || 0,
        avgResponseTime: metrics?.avg_response_time || 0,
        errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
        aiCosts: metrics?.ai_costs || 0
      };
    } catch (error) {
      this.recordError(error as Error, { action: 'get_aggregated_metrics' });
      return {
        totalUsers: 0,
        totalGenerations: 0,
        totalRevenue: 0,
        avgResponseTime: 0,
        errorRate: 0,
        aiCosts: 0
      };
    }
  }
}

// Alert service for critical events
export class AlertService {
  private static instance: AlertService;
  
  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  // Send alert for critical events
  async sendAlert(alert: {
    level: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    metadata?: any;
  }): Promise<void> {
    try {
      // Send to Sentry
      if (process.env.SENTRY_DSN) {
        Sentry.captureMessage(`${alert.title}: ${alert.message}`, alert.level as any);
      }

      // Log to console
      console.log(`[${alert.level.toUpperCase()}] ${alert.title}: ${alert.message}`);

      // In production, integrate with alerting systems:
      // - Slack webhooks
      // - PagerDuty
      // - Email notifications
      // - SMS alerts

      // Store alert in database
      await prisma.auditLog.create({
        data: {
          userId: null,
          action: 'system_alert',
          resource: 'monitoring',
          metadata: {
            level: alert.level,
            title: alert.title,
            message: alert.message,
            ...alert.metadata
          }
        }
      });
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  // Check for alert conditions
  async checkAlerts(): Promise<void> {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Check error rate
      const errorRate = await this.getErrorRate(fiveMinutesAgo, now);
      if (errorRate > 5) { // > 5% error rate
        await this.sendAlert({
          level: 'error',
          title: 'High Error Rate',
          message: `Error rate is ${errorRate.toFixed(2)}% in the last 5 minutes`,
          metadata: { errorRate, timeWindow: '5m' }
        });
      }

      // Check response time
      const avgResponseTime = await this.getAverageResponseTime(fiveMinutesAgo, now);
      if (avgResponseTime > 5000) { // > 5 seconds
        await this.sendAlert({
          level: 'warning',
          title: 'High Response Time',
          message: `Average response time is ${avgResponseTime}ms in the last 5 minutes`,
          metadata: { avgResponseTime, timeWindow: '5m' }
        });
      }

      // Check AI costs
      const hourlyCosts = await this.getAICosts(new Date(now.getTime() - 60 * 60 * 1000), now);
      if (hourlyCosts > 100) { // > $100/hour
        await this.sendAlert({
          level: 'warning',
          title: 'High AI Costs',
          message: `AI costs are $${hourlyCosts.toFixed(2)} in the last hour`,
          metadata: { hourlyCosts, timeWindow: '1h' }
        });
      }

    } catch (error) {
      console.error('Failed to check alerts:', error);
    }
  }

  private async getErrorRate(start: Date, end: Date): Promise<number> {
    try {
      const [result] = await prisma.$queryRaw<Array<{
        error_count: bigint;
        total_count: bigint;
      }>>`
        SELECT 
          SUM(CASE WHEN name = 'error' THEN value ELSE 0 END) as error_count,
          SUM(value) as total_count
        FROM business_metrics
        WHERE timestamp BETWEEN ${start} AND ${end}
        AND name IN ('user_activity', 'error')
      `;

      const totalCount = Number(result?.total_count || 0);
      const errorCount = Number(result?.error_count || 0);

      return totalCount > 0 ? (errorCount / totalCount) * 100 : 0;
    } catch (error) {
      console.error('Failed to get error rate:', error);
      return 0;
    }
  }

  private async getAverageResponseTime(start: Date, end: Date): Promise<number> {
    try {
      const [result] = await prisma.$queryRaw<Array<{ avg_time: number }>>`
        SELECT AVG(value) as avg_time
        FROM system_metrics
        WHERE timestamp BETWEEN ${start} AND ${end}
        AND name = 'user_action_duration'
      `;

      return result?.avg_time || 0;
    } catch (error) {
      console.error('Failed to get average response time:', error);
      return 0;
    }
  }

  private async getAICosts(start: Date, end: Date): Promise<number> {
    try {
      const [result] = await prisma.$queryRaw<Array<{ total_cost: number }>>`
        SELECT SUM(value) as total_cost
        FROM business_metrics
        WHERE timestamp BETWEEN ${start} AND ${end}
        AND name = 'ai_cost'
      `;

      return result?.total_cost || 0;
    } catch (error) {
      console.error('Failed to get AI costs:', error);
      return 0;
    }
  }
}

// Export service instances
export const monitoringService = MonitoringService.getInstance();
export const alertService = AlertService.getInstance();

// Initialize health checks
if (typeof setInterval !== 'undefined') {
  // Run system health check every 5 minutes
  setInterval(() => {
    monitoringService.recordSystemHealth();
  }, 5 * 60 * 1000);

  // Run alert checks every minute
  setInterval(() => {
    alertService.checkAlerts();
  }, 60 * 1000);
}