import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { readRateLimit, writeRateLimit } from '../middleware/rateLimit';
import { validate, analyticsSchemas } from '../middleware/validation';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger, loggers } from '../utils/logger';
import { AnalyticsService } from '../services/analytics';
import { QueueService } from '../services/queue';

const router = express.Router();
const prisma = new PrismaClient();
const analyticsService = new AnalyticsService();
const queueService = new QueueService();

/**
 * @swagger
 * /analytics/metrics:
 *   get:
 *     summary: Get sales metrics with filtering and aggregation
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metric_types
 *         schema:
 *           type: string
 *         description: Comma-separated list of metric types
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for metrics
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for metrics
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, quarter, year]
 *         description: Time granularity for aggregation
 *       - in: query
 *         name: dimensions
 *         schema:
 *           type: string
 *         description: Group by dimensions (JSON object)
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *       400:
 *         description: Invalid parameters
 */
router.get('/metrics',
  readRateLimit,
  requirePermission('analytics:read'),
  validate(analyticsSchemas.getMetrics),
  async (req, res) => {
    const user = (req as any).user;
    const {
      metric_types,
      start_date,
      end_date,
      granularity,
      dimensions,
      page,
      limit,
      sort,
      order,
    } = req.query as any;

    const params = {
      organizationId: user.organizationId,
      metricTypes: metric_types ? metric_types.split(',') : undefined,
      startDate: start_date ? new Date(start_date) : undefined,
      endDate: end_date ? new Date(end_date) : undefined,
      granularity: granularity || 'day',
      dimensions: dimensions ? JSON.parse(dimensions) : undefined,
      pagination: {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sort: sort || 'time',
        order: order || 'desc',
      },
    };

    const result = await analyticsService.getMetrics(params);

    res.json(result);
  }
);

/**
 * @swagger
 * /analytics/metrics:
 *   post:
 *     summary: Add a new sales metric data point
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metric_type
 *               - value
 *             properties:
 *               metric_type:
 *                 type: string
 *                 enum: [revenue, deals_count, pipeline_value, conversion_rate, avg_deal_size]
 *               value:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               dimensions:
 *                 type: object
 *               metadata:
 *                 type: object
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Metric created successfully
 *       400:
 *         description: Validation error
 */
router.post('/metrics',
  writeRateLimit,
  requirePermission('analytics:write'),
  validate(analyticsSchemas.addMetric),
  async (req, res) => {
    const user = (req as any).user;
    const { metric_type, value, currency, dimensions, metadata, timestamp } = req.body;

    const metric = await analyticsService.addMetric({
      organizationId: user.organizationId,
      metricType: metric_type,
      value,
      currency: currency || 'USD',
      dimensions: dimensions || {},
      metadata: metadata || {},
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      sourceIntegrationId: null, // Manual entry
    });

    // Log metric creation
    loggers.business.dashboardCreated(metric.id, `Manual ${metric_type} metric`, user.id);

    res.status(201).json(metric);
  }
);

/**
 * @swagger
 * /analytics/kpis:
 *   get:
 *     summary: Get calculated KPIs and performance indicators
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *         description: Time period for KPI calculation
 *       - in: query
 *         name: compare_previous
 *         schema:
 *           type: boolean
 *         description: Include comparison with previous period
 *     responses:
 *       200:
 *         description: KPIs retrieved successfully
 */
router.get('/kpis',
  readRateLimit,
  requirePermission('analytics:read'),
  validate(analyticsSchemas.getKPIs),
  async (req, res) => {
    const user = (req as any).user;
    const { period, compare_previous } = req.query as any;

    const kpis = await analyticsService.calculateKPIs({
      organizationId: user.organizationId,
      period: period || 'month',
      comparePrevious: compare_previous !== 'false',
    });

    res.json(kpis);
  }
);

/**
 * @swagger
 * /analytics/forecasts:
 *   get:
 *     summary: Get AI-generated sales forecasts
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: forecast_type
 *         schema:
 *           type: string
 *           enum: [revenue, deals, pipeline]
 *         description: Type of forecast to retrieve
 *       - in: query
 *         name: time_period
 *         schema:
 *           type: string
 *           enum: [monthly, quarterly, yearly]
 *         description: Forecast time period
 *       - in: query
 *         name: horizon_months
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 24
 *         description: Number of months to forecast ahead
 *     responses:
 *       200:
 *         description: Forecasts retrieved successfully
 */
router.get('/forecasts',
  readRateLimit,
  requirePermission('analytics:read'),
  async (req, res) => {
    const user = (req as any).user;
    const {
      forecast_type = 'revenue',
      time_period = 'monthly',
      horizon_months = 12,
    } = req.query as any;

    const forecasts = await analyticsService.getForecasts({
      organizationId: user.organizationId,
      forecastType: forecast_type,
      timePeriod: time_period,
      horizonMonths: parseInt(horizon_months),
    });

    res.json(forecasts);
  }
);

/**
 * @swagger
 * /analytics/forecasts:
 *   post:
 *     summary: Generate new forecast with custom parameters
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - forecast_type
 *               - time_period
 *             properties:
 *               forecast_type:
 *                 type: string
 *                 enum: [revenue, deals, pipeline]
 *               time_period:
 *                 type: string
 *                 enum: [monthly, quarterly, yearly]
 *               horizon_months:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 24
 *               include_seasonality:
 *                 type: boolean
 *               include_holidays:
 *                 type: boolean
 *     responses:
 *       202:
 *         description: Forecast generation started
 */
router.post('/forecasts',
  writeRateLimit,
  requirePermission('analytics:write'),
  validate(analyticsSchemas.generateForecast),
  async (req, res) => {
    const user = (req as any).user;
    const {
      forecast_type,
      time_period,
      horizon_months = 12,
      include_seasonality = true,
      include_holidays = true,
    } = req.body;

    // Queue forecast generation job
    const job = await queueService.addForecastJob({
      organizationId: user.organizationId,
      forecastType: forecast_type,
      timePeriod: time_period,
      horizonMonths: horizon_months,
      includeSeasonality: include_seasonality,
      includeHolidays: include_holidays,
      requestedBy: user.id,
    });

    res.status(202).json({
      jobId: job.id,
      status: 'pending',
      message: 'Forecast generation started',
    });
  }
);

/**
 * @swagger
 * /analytics/trends:
 *   get:
 *     summary: Get trend analysis for sales metrics
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metric_type
 *         required: true
 *         schema:
 *           type: string
 *         description: Metric type to analyze
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: trend_type
 *         schema:
 *           type: string
 *           enum: [linear, polynomial, seasonal]
 *         description: Type of trend analysis
 *     responses:
 *       200:
 *         description: Trend analysis retrieved successfully
 */
router.get('/trends',
  readRateLimit,
  requirePermission('analytics:read'),
  async (req, res) => {
    const user = (req as any).user;
    const {
      metric_type,
      start_date,
      end_date,
      trend_type = 'linear',
    } = req.query as any;

    if (!metric_type) {
      throw new ValidationError('metric_type is required');
    }

    const trends = await analyticsService.analyzeTrends({
      organizationId: user.organizationId,
      metricType: metric_type,
      startDate: start_date ? new Date(start_date) : undefined,
      endDate: end_date ? new Date(end_date) : undefined,
      trendType: trend_type,
    });

    res.json(trends);
  }
);

/**
 * @swagger
 * /analytics/insights:
 *   get:
 *     summary: Get AI-powered insights and recommendations
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: focus_area
 *         schema:
 *           type: string
 *           enum: [revenue, pipeline, team_performance, conversion]
 *         description: Focus area for insights
 *       - in: query
 *         name: time_range
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *         description: Time range for analysis
 *     responses:
 *       200:
 *         description: Insights retrieved successfully
 */
router.get('/insights',
  readRateLimit,
  requirePermission('analytics:read'),
  async (req, res) => {
    const user = (req as any).user;
    const {
      focus_area = 'revenue',
      time_range = 'month',
    } = req.query as any;

    const insights = await analyticsService.generateInsights({
      organizationId: user.organizationId,
      focusArea: focus_area,
      timeRange: time_range,
    });

    res.json(insights);
  }
);

/**
 * @swagger
 * /analytics/export:
 *   post:
 *     summary: Export analytics data in various formats
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - export_type
 *               - format
 *             properties:
 *               export_type:
 *                 type: string
 *                 enum: [metrics, kpis, forecasts, insights]
 *               format:
 *                 type: string
 *                 enum: [csv, xlsx, pdf, json]
 *               filters:
 *                 type: object
 *               include_charts:
 *                 type: boolean
 *     responses:
 *       202:
 *         description: Export job started
 */
router.post('/export',
  writeRateLimit,
  requirePermission('analytics:read'),
  async (req, res) => {
    const user = (req as any).user;
    const {
      export_type,
      format,
      filters = {},
      include_charts = false,
    } = req.body;

    if (!export_type || !format) {
      throw new ValidationError('export_type and format are required');
    }

    // Queue export job
    const job = await queueService.addExportJob({
      organizationId: user.organizationId,
      exportType: export_type,
      format,
      filters,
      includeCharts: include_charts,
      requestedBy: user.id,
    });

    res.status(202).json({
      jobId: job.id,
      status: 'pending',
      message: 'Export job started',
    });
  }
);

/**
 * @swagger
 * /analytics/real-time/subscribe:
 *   post:
 *     summary: Subscribe to real-time metric updates
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metric_types:
 *                 type: array
 *                 items:
 *                   type: string
 *               filters:
 *                 type: object
 *     responses:
 *       200:
 *         description: Subscription created successfully
 */
router.post('/real-time/subscribe',
  requirePermission('analytics:read'),
  async (req, res) => {
    const user = (req as any).user;
    const { metric_types = [], filters = {} } = req.body;

    // Create real-time subscription
    const subscription = await analyticsService.createRealtimeSubscription({
      organizationId: user.organizationId,
      userId: user.id,
      metricTypes: metric_types,
      filters,
    });

    res.json({
      subscriptionId: subscription.id,
      message: 'Real-time subscription created',
    });
  }
);

/**
 * @swagger
 * /analytics/alerts:
 *   get:
 *     summary: Get analytics alerts and notifications
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 */
router.get('/alerts',
  readRateLimit,
  requirePermission('analytics:read'),
  async (req, res) => {
    const user = (req as any).user;

    const alerts = await prisma.alert.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        lastTriggered: 'desc',
      },
    });

    res.json(alerts);
  }
);

/**
 * @swagger
 * /analytics/alerts:
 *   post:
 *     summary: Create a new analytics alert
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - conditions
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               conditions:
 *                 type: object
 *               notification_channels:
 *                 type: object
 *     responses:
 *       201:
 *         description: Alert created successfully
 */
router.post('/alerts',
  writeRateLimit,
  requirePermission('analytics:write'),
  async (req, res) => {
    const user = (req as any).user;
    const {
      name,
      description,
      conditions,
      notification_channels = {},
    } = req.body;

    if (!name || !conditions) {
      throw new ValidationError('name and conditions are required');
    }

    const alert = await prisma.alert.create({
      data: {
        organizationId: user.organizationId,
        createdBy: user.id,
        name,
        description,
        conditions,
        notificationChannels: notification_channels,
        isActive: true,
      },
    });

    res.status(201).json(alert);
  }
);

export default router;