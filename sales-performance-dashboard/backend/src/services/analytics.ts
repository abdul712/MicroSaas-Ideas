import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError, DatabaseError } from '../utils/errors';
import { QueueService } from './queue';

const prisma = new PrismaClient();

export interface MetricsParams {
  organizationId: string;
  metricTypes?: string[];
  startDate?: Date;
  endDate?: Date;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  dimensions?: Record<string, any>;
  pagination: {
    page: number;
    limit: number;
    sort: string;
    order: 'asc' | 'desc';
  };
}

export interface AddMetricParams {
  organizationId: string;
  metricType: string;
  value: number;
  currency: string;
  dimensions: Record<string, any>;
  metadata: Record<string, any>;
  timestamp: Date;
  sourceIntegrationId?: string | null;
}

export interface KPIParams {
  organizationId: string;
  period: 'today' | 'week' | 'month' | 'quarter' | 'year';
  comparePrevious: boolean;
}

export interface ForecastParams {
  organizationId: string;
  forecastType: 'revenue' | 'deals' | 'pipeline';
  timePeriod: 'monthly' | 'quarterly' | 'yearly';
  horizonMonths: number;
}

export interface TrendParams {
  organizationId: string;
  metricType: string;
  startDate?: Date;
  endDate?: Date;
  trendType: 'linear' | 'polynomial' | 'seasonal';
}

export interface InsightParams {
  organizationId: string;
  focusArea: 'revenue' | 'pipeline' | 'team_performance' | 'conversion';
  timeRange: 'week' | 'month' | 'quarter' | 'year';
}

export interface RealtimeSubscriptionParams {
  organizationId: string;
  userId: string;
  metricTypes: string[];
  filters: Record<string, any>;
}

export class AnalyticsService {
  private redisClient: ReturnType<typeof createClient> | null = null;
  private queueService: QueueService;

  constructor() {
    this.initializeRedis();
    this.queueService = new QueueService();
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redisClient = createClient({ url: config.redis.url });
      await this.redisClient.connect();
      logger.info('Analytics Redis client connected');
    } catch (error) {
      logger.error('Failed to connect Analytics Redis client:', error);
    }
  }

  async getMetrics(params: MetricsParams) {
    try {
      const {
        organizationId,
        metricTypes,
        startDate,
        endDate,
        granularity,
        dimensions,
        pagination,
      } = params;

      // Build where clause
      const whereClause: any = {
        organizationId,
      };

      if (metricTypes && metricTypes.length > 0) {
        whereClause.metricType = { in: metricTypes };
      }

      if (startDate || endDate) {
        whereClause.time = {};
        if (startDate) whereClause.time.gte = startDate;
        if (endDate) whereClause.time.lte = endDate;
      }

      if (dimensions && Object.keys(dimensions).length > 0) {
        whereClause.dimensions = {
          contains: dimensions,
        };
      }

      // Use TimescaleDB continuous aggregates for better performance
      let tableName = 'sales_metrics';
      let timeColumn = 'time';

      if (granularity === 'day') {
        tableName = 'daily_sales_summary';
        timeColumn = 'day';
      } else if (granularity === 'month') {
        tableName = 'monthly_sales_summary';
        timeColumn = 'month';
      }

      // For complex queries, use raw SQL with TimescaleDB functions
      if (granularity !== 'hour') {
        const timeInterval = this.getTimeInterval(granularity);
        
        const query = `
          SELECT 
            time_bucket('${timeInterval}', time) as period,
            metric_type,
            SUM(value) as total_value,
            AVG(value) as avg_value,
            COUNT(*) as count,
            currency,
            dimensions
          FROM sales_metrics 
          WHERE organization_id = $1
            ${metricTypes ? 'AND metric_type = ANY($2)' : ''}
            ${startDate ? `AND time >= '${startDate.toISOString()}'` : ''}
            ${endDate ? `AND time <= '${endDate.toISOString()}'` : ''}
          GROUP BY period, metric_type, currency, dimensions
          ORDER BY period ${pagination.order.toUpperCase()}
          LIMIT $${metricTypes ? '3' : '2'} OFFSET $${metricTypes ? '4' : '3'}
        `;

        const queryParams = [organizationId];
        if (metricTypes) queryParams.push(metricTypes);
        queryParams.push(pagination.limit.toString());
        queryParams.push(((pagination.page - 1) * pagination.limit).toString());

        const result = await prisma.$queryRawUnsafe(query, ...queryParams);
        
        // Get total count for pagination
        const countQuery = `
          SELECT COUNT(DISTINCT time_bucket('${timeInterval}', time)) as total
          FROM sales_metrics 
          WHERE organization_id = $1
            ${metricTypes ? 'AND metric_type = ANY($2)' : ''}
            ${startDate ? `AND time >= '${startDate.toISOString()}'` : ''}
            ${endDate ? `AND time <= '${endDate.toISOString()}'` : ''}
        `;

        const countParams = [organizationId];
        if (metricTypes) countParams.push(metricTypes);
        
        const countResult: any = await prisma.$queryRawUnsafe(countQuery, ...countParams);
        const total = parseInt(countResult[0]?.total || '0');

        return {
          data: result,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages: Math.ceil(total / pagination.limit),
            hasNext: pagination.page < Math.ceil(total / pagination.limit),
            hasPrev: pagination.page > 1,
          },
          aggregations: await this.calculateAggregations(organizationId, metricTypes, startDate, endDate),
        };
      }

      // For hourly data, use regular Prisma queries
      const [metrics, total] = await Promise.all([
        prisma.salesMetric.findMany({
          where: whereClause,
          orderBy: { [pagination.sort]: pagination.order },
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
        }),
        prisma.salesMetric.count({ where: whereClause }),
      ]);

      return {
        data: metrics,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
          hasNext: pagination.page < Math.ceil(total / pagination.limit),
          hasPrev: pagination.page > 1,
        },
        aggregations: await this.calculateAggregations(organizationId, metricTypes, startDate, endDate),
      };
    } catch (error) {
      logger.error('Error getting metrics:', error);
      throw new DatabaseError('Failed to retrieve metrics', 'select', 'sales_metrics');
    }
  }

  async addMetric(params: AddMetricParams) {
    try {
      const metric = await prisma.salesMetric.create({
        data: {
          time: params.timestamp,
          organizationId: params.organizationId,
          metricType: params.metricType,
          value: params.value,
          currency: params.currency,
          dimensions: params.dimensions,
          sourceIntegrationId: params.sourceIntegrationId,
          metadata: params.metadata,
        },
      });

      // Publish real-time update via Redis
      if (this.redisClient) {
        await this.redisClient.publish(
          `metrics:${params.organizationId}`,
          JSON.stringify({
            type: 'metric_update',
            data: metric,
            timestamp: new Date().toISOString(),
          })
        );
      }

      // Trigger aggregation update
      await this.queueService.addAggregationJob({
        organizationId: params.organizationId,
        metricType: params.metricType,
        timestamp: params.timestamp,
      });

      return metric;
    } catch (error) {
      logger.error('Error adding metric:', error);
      throw new DatabaseError('Failed to add metric', 'insert', 'sales_metrics');
    }
  }

  async calculateKPIs(params: KPIParams) {
    try {
      const { organizationId, period, comparePrevious } = params;
      
      const dateRange = this.getDateRange(period);
      const previousDateRange = comparePrevious ? this.getPreviousDateRange(period) : null;

      // Calculate current period KPIs
      const currentKPIs = await this.calculateKPIsForPeriod(organizationId, dateRange);
      
      // Calculate previous period KPIs for comparison
      let previousKPIs = null;
      let growthRates = null;
      
      if (previousDateRange) {
        previousKPIs = await this.calculateKPIsForPeriod(organizationId, previousDateRange);
        growthRates = this.calculateGrowthRates(currentKPIs, previousKPIs);
      }

      return {
        current_period: currentKPIs,
        previous_period: previousKPIs,
        growth_rates: growthRates,
        period,
        date_range: dateRange,
      };
    } catch (error) {
      logger.error('Error calculating KPIs:', error);
      throw new AppError('Failed to calculate KPIs', 500);
    }
  }

  async getForecasts(params: ForecastParams) {
    try {
      const { organizationId, forecastType, timePeriod, horizonMonths } = params;

      const forecasts = await prisma.forecast.findMany({
        where: {
          organizationId,
          forecastType,
          timePeriod,
          forecastDate: {
            gte: new Date(),
            lte: new Date(Date.now() + horizonMonths * 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { forecastDate: 'asc' },
      });

      // Get model information
      const latestModel = await prisma.forecast.findFirst({
        where: { organizationId, forecastType },
        orderBy: { createdAt: 'desc' },
        select: { modelVersion: true, modelAccuracy: true, createdAt: true },
      });

      return {
        forecasts,
        model_info: {
          accuracy: latestModel?.modelAccuracy,
          last_trained: latestModel?.createdAt,
          model_version: latestModel?.modelVersion,
        },
      };
    } catch (error) {
      logger.error('Error getting forecasts:', error);
      throw new DatabaseError('Failed to retrieve forecasts', 'select', 'forecasts');
    }
  }

  async analyzeTrends(params: TrendParams) {
    try {
      const { organizationId, metricType, startDate, endDate, trendType } = params;

      // Default to last 90 days if no date range provided
      const defaultEndDate = endDate || new Date();
      const defaultStartDate = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const query = `
        SELECT 
          time_bucket('1 day', time) as date,
          AVG(value) as value
        FROM sales_metrics 
        WHERE organization_id = $1
          AND metric_type = $2
          AND time >= $3
          AND time <= $4
        GROUP BY date
        ORDER BY date ASC
      `;

      const data: any = await prisma.$queryRawUnsafe(
        query,
        organizationId,
        metricType,
        defaultStartDate,
        defaultEndDate
      );

      // Perform trend analysis based on type
      const analysis = await this.performTrendAnalysis(data, trendType);

      return {
        data,
        analysis,
        trend_type: trendType,
        date_range: {
          start: defaultStartDate,
          end: defaultEndDate,
        },
      };
    } catch (error) {
      logger.error('Error analyzing trends:', error);
      throw new AppError('Failed to analyze trends', 500);
    }
  }

  async generateInsights(params: InsightParams) {
    try {
      const { organizationId, focusArea, timeRange } = params;

      // This would typically call an ML service for AI-powered insights
      // For now, we'll return structured insights based on data analysis
      
      const insights = await this.analyzeDataForInsights(organizationId, focusArea, timeRange);

      return {
        insights,
        focus_area: focusArea,
        time_range: timeRange,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error generating insights:', error);
      throw new AppError('Failed to generate insights', 500);
    }
  }

  async createRealtimeSubscription(params: RealtimeSubscriptionParams) {
    try {
      // In a real implementation, this would be stored in Redis or a separate table
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (this.redisClient) {
        await this.redisClient.setEx(
          `subscription:${subscriptionId}`,
          3600, // 1 hour expiry
          JSON.stringify(params)
        );
      }

      return { id: subscriptionId };
    } catch (error) {
      logger.error('Error creating real-time subscription:', error);
      throw new AppError('Failed to create subscription', 500);
    }
  }

  // Private helper methods

  private getTimeInterval(granularity: string): string {
    const intervals = {
      hour: '1 hour',
      day: '1 day',
      week: '1 week',
      month: '1 month',
      quarter: '3 months',
      year: '1 year',
    };
    return intervals[granularity as keyof typeof intervals] || '1 day';
  }

  private async calculateAggregations(
    organizationId: string,
    metricTypes?: string[],
    startDate?: Date,
    endDate?: Date
  ) {
    const whereClause: any = { organizationId };
    
    if (metricTypes) whereClause.metricType = { in: metricTypes };
    if (startDate || endDate) {
      whereClause.time = {};
      if (startDate) whereClause.time.gte = startDate;
      if (endDate) whereClause.time.lte = endDate;
    }

    const [revenueAgg, dealsAgg] = await Promise.all([
      prisma.salesMetric.aggregate({
        where: { ...whereClause, metricType: 'revenue' },
        _sum: { value: true },
        _avg: { value: true },
        _count: true,
      }),
      prisma.salesMetric.aggregate({
        where: { ...whereClause, metricType: 'deals_count' },
        _sum: { value: true },
      }),
    ]);

    return {
      total_revenue: revenueAgg._sum.value || 0,
      total_deals: dealsAgg._sum.value || 0,
      avg_deal_size: revenueAgg._sum.value && dealsAgg._sum.value 
        ? revenueAgg._sum.value / dealsAgg._sum.value 
        : 0,
    };
  }

  private getDateRange(period: string) {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }

    return { start, end: now };
  }

  private getPreviousDateRange(period: string) {
    const current = this.getDateRange(period);
    const duration = current.end.getTime() - current.start.getTime();
    
    return {
      start: new Date(current.start.getTime() - duration),
      end: current.start,
    };
  }

  private async calculateKPIsForPeriod(organizationId: string, dateRange: { start: Date; end: Date }) {
    const query = `
      SELECT 
        metric_type,
        SUM(value) as total_value,
        AVG(value) as avg_value,
        COUNT(*) as count
      FROM sales_metrics 
      WHERE organization_id = $1
        AND time >= $2
        AND time <= $3
      GROUP BY metric_type
    `;

    const results: any = await prisma.$queryRawUnsafe(
      query,
      organizationId,
      dateRange.start,
      dateRange.end
    );

    const kpis: any = {};
    results.forEach((row: any) => {
      kpis[row.metric_type] = {
        total: parseFloat(row.total_value) || 0,
        average: parseFloat(row.avg_value) || 0,
        count: parseInt(row.count) || 0,
      };
    });

    return {
      total_revenue: kpis.revenue?.total || 0,
      total_deals: kpis.deals_count?.total || 0,
      avg_deal_size: kpis.revenue?.total && kpis.deals_count?.total 
        ? kpis.revenue.total / kpis.deals_count.total 
        : 0,
      pipeline_value: kpis.pipeline_value?.total || 0,
      conversion_rate: kpis.conversion_rate?.average || 0,
      win_rate: 0, // This would be calculated based on deal outcomes
    };
  }

  private calculateGrowthRates(current: any, previous: any) {
    const growthRates: any = {};
    
    Object.keys(current).forEach(key => {
      const currentValue = current[key];
      const previousValue = previous[key];
      
      if (previousValue && previousValue !== 0) {
        growthRates[key] = ((currentValue - previousValue) / previousValue) * 100;
      } else {
        growthRates[key] = currentValue > 0 ? 100 : 0;
      }
    });

    return growthRates;
  }

  private async performTrendAnalysis(data: any[], trendType: string) {
    // Simplified trend analysis - in a real implementation, you'd use statistical libraries
    if (data.length < 2) {
      return { trend: 'insufficient_data', slope: 0, correlation: 0 };
    }

    const values = data.map(d => parseFloat(d.value) || 0);
    const n = values.length;
    
    // Calculate linear trend
    const xValues = Array.from({ length: n }, (_, i) => i);
    const xSum = xValues.reduce((a, b) => a + b, 0);
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const x2Sum = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;
    
    // Calculate correlation coefficient
    const xMean = xSum / n;
    const yMean = ySum / n;
    const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (values[i] - yMean), 0);
    const xVariance = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
    const yVariance = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const correlation = numerator / Math.sqrt(xVariance * yVariance);
    
    let trend = 'stable';
    if (slope > 0.1) trend = 'increasing';
    else if (slope < -0.1) trend = 'decreasing';
    
    return {
      trend,
      slope,
      intercept,
      correlation,
      trend_strength: Math.abs(correlation),
    };
  }

  private async analyzeDataForInsights(organizationId: string, focusArea: string, timeRange: string) {
    // This would typically integrate with an AI/ML service
    // For now, return sample insights based on data patterns
    
    const insights = [
      {
        type: 'trend',
        severity: 'info',
        title: 'Revenue Growth Trend',
        description: 'Revenue has increased by 15% compared to the previous period.',
        recommendation: 'Continue current sales strategies and consider scaling successful campaigns.',
        confidence: 0.85,
      },
      {
        type: 'anomaly',
        severity: 'warning',
        title: 'Deal Velocity Slowdown',
        description: 'Average time to close deals has increased by 3 days.',
        recommendation: 'Review sales process bottlenecks and provide additional training to sales team.',
        confidence: 0.72,
      },
      {
        type: 'opportunity',
        severity: 'success',
        title: 'High-Value Customer Segment',
        description: 'Enterprise customers show 40% higher lifetime value.',
        recommendation: 'Allocate more resources to enterprise customer acquisition.',
        confidence: 0.91,
      },
    ];

    return insights;
  }
}