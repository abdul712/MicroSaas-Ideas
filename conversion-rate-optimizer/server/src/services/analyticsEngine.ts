import { prisma } from '../utils/prisma';
import { cache } from '../utils/redis';
import { logger } from '../utils/logger';

export interface FunnelStep {
  id: string;
  name: string;
  pageUrl?: string;
  eventType?: string;
  elementSelector?: string;
}

export interface FunnelAnalysis {
  funnelId: string;
  steps: FunnelStepAnalysis[];
  overallConversionRate: number;
  totalVisitors: number;
  totalConversions: number;
  dropOffPoints: DropOffPoint[];
}

export interface FunnelStepAnalysis {
  stepIndex: number;
  step: FunnelStep;
  visitors: number;
  conversions: number;
  conversionRate: number;
  dropOffRate: number;
  avgTimeOnStep: number;
}

export interface DropOffPoint {
  fromStep: number;
  toStep: number;
  dropOffRate: number;
  visitors: number;
  potentialImpact: number;
}

export interface CohortAnalysis {
  cohortDate: string;
  size: number;
  retentionRates: number[];
  conversionRates: number[];
  revenuePerUser: number;
}

export interface UserSegment {
  id: string;
  name: string;
  conditions: SegmentCondition[];
  userCount: number;
  conversionRate: number;
  avgSessionDuration: number;
  avgPageViews: number;
}

export interface SegmentCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | string[];
}

export interface HeatmapData {
  elementSelector: string;
  x: number;
  y: number;
  clicks: number;
  hovers: number;
  scrollDepth: number;
  timeSpent: number;
}

export interface SessionRecording {
  id: string;
  sessionId: string;
  duration: number;
  pageViews: number;
  events: SessionEvent[];
  convertedToGoal: boolean;
  deviceType: string;
  browserName: string;
}

export interface SessionEvent {
  timestamp: number;
  type: 'click' | 'hover' | 'scroll' | 'input' | 'navigation';
  elementSelector?: string;
  pageUrl: string;
  data?: any;
}

export class AnalyticsEngine {
  // Funnel Analysis
  static async analyzeFunnel(
    projectId: string,
    funnelId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<FunnelAnalysis> {
    const cacheKey = `funnel_analysis:${funnelId}:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const funnel = await prisma.funnel.findUnique({
        where: { id: funnelId },
        include: { project: true }
      });

      if (!funnel || funnel.projectId !== projectId) {
        throw new Error('Funnel not found or access denied');
      }

      const steps = funnel.steps as FunnelStep[];
      const stepAnalyses: FunnelStepAnalysis[] = [];
      const dropOffPoints: DropOffPoint[] = [];

      let previousStepVisitors = 0;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepAnalysis = await this.analyzeStep(
          projectId,
          step,
          dateRange,
          i === 0 ? undefined : steps[i - 1]
        );

        stepAnalyses.push(stepAnalysis);

        // Calculate drop-off points
        if (i > 0) {
          const dropOffRate = (previousStepVisitors - stepAnalysis.visitors) / previousStepVisitors;
          const potentialImpact = this.calculatePotentialImpact(
            dropOffRate,
            stepAnalysis.visitors,
            funnel.goalValue as number
          );

          dropOffPoints.push({
            fromStep: i - 1,
            toStep: i,
            dropOffRate,
            visitors: previousStepVisitors - stepAnalysis.visitors,
            potentialImpact
          });
        }

        previousStepVisitors = stepAnalysis.visitors;
      }

      const totalVisitors = stepAnalyses[0]?.visitors || 0;
      const totalConversions = stepAnalyses[stepAnalyses.length - 1]?.visitors || 0;
      const overallConversionRate = totalVisitors > 0 ? totalConversions / totalVisitors : 0;

      const analysis: FunnelAnalysis = {
        funnelId,
        steps: stepAnalyses,
        overallConversionRate,
        totalVisitors,
        totalConversions,
        dropOffPoints: dropOffPoints.sort((a, b) => b.potentialImpact - a.potentialImpact)
      };

      // Cache for 1 hour
      await cache.set(cacheKey, JSON.stringify(analysis), 3600);

      return analysis;
    } catch (error) {
      logger.error('Error analyzing funnel:', error);
      throw error;
    }
  }

  // User Segmentation
  static async analyzeUserSegments(
    projectId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<UserSegment[]> {
    try {
      const segments = await prisma.segment.findMany({
        where: { projectId, isActive: true }
      });

      const analyses: UserSegment[] = [];

      for (const segment of segments) {
        const conditions = segment.conditions as SegmentCondition[];
        const analysis = await this.analyzeSegment(projectId, segment.id, conditions, dateRange);
        analyses.push(analysis);
      }

      return analyses;
    } catch (error) {
      logger.error('Error analyzing user segments:', error);
      throw error;
    }
  }

  // Cohort Analysis
  static async analyzeCohorts(
    projectId: string,
    cohortType: 'daily' | 'weekly' | 'monthly' = 'weekly',
    periods: number = 12
  ): Promise<CohortAnalysis[]> {
    const cacheKey = `cohort_analysis:${projectId}:${cohortType}:${periods}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const cohorts: CohortAnalysis[] = [];
      const now = new Date();

      for (let i = 0; i < periods; i++) {
        const cohortDate = this.getCohortDate(now, cohortType, i);
        const cohortAnalysis = await this.analyzeCohort(projectId, cohortDate, cohortType);
        cohorts.push(cohortAnalysis);
      }

      // Cache for 6 hours
      await cache.set(cacheKey, JSON.stringify(cohorts), 21600);

      return cohorts;
    } catch (error) {
      logger.error('Error analyzing cohorts:', error);
      throw error;
    }
  }

  // Heatmap Generation
  static async generateHeatmap(
    projectId: string,
    pageUrl: string,
    dateRange: { start: Date; end: Date }
  ): Promise<HeatmapData[]> {
    const cacheKey = `heatmap:${projectId}:${encodeURIComponent(pageUrl)}:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const events = await prisma.event.findMany({
        where: {
          projectId,
          pageUrl,
          eventType: { in: ['click', 'hover', 'scroll'] },
          timestamp: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        select: {
          eventType: true,
          elementSelector: true,
          properties: true
        }
      });

      const heatmapData = this.processHeatmapEvents(events);

      // Cache for 2 hours
      await cache.set(cacheKey, JSON.stringify(heatmapData), 7200);

      return heatmapData;
    } catch (error) {
      logger.error('Error generating heatmap:', error);
      throw error;
    }
  }

  // Session Recordings
  static async getSessionRecordings(
    projectId: string,
    filters: {
      converted?: boolean;
      deviceType?: string;
      minDuration?: number;
      dateRange: { start: Date; end: Date };
    },
    limit: number = 50
  ): Promise<SessionRecording[]> {
    try {
      const whereClause: any = {
        projectId,
        timestamp: {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        }
      };

      if (filters.deviceType) {
        whereClause.deviceType = filters.deviceType;
      }

      const events = await prisma.event.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit * 10 // Get more events to group by session
      });

      const sessionMap = new Map<string, SessionEvent[]>();
      
      events.forEach(event => {
        if (!sessionMap.has(event.sessionId)) {
          sessionMap.set(event.sessionId, []);
        }
        
        sessionMap.get(event.sessionId)!.push({
          timestamp: event.timestamp.getTime(),
          type: event.eventType as any,
          elementSelector: event.elementSelector || undefined,
          pageUrl: event.pageUrl || '',
          data: event.properties
        });
      });

      const recordings: SessionRecording[] = [];
      
      for (const [sessionId, sessionEvents] of sessionMap.entries()) {
        if (sessionEvents.length === 0) continue;

        const sortedEvents = sessionEvents.sort((a, b) => a.timestamp - b.timestamp);
        const duration = sortedEvents[sortedEvents.length - 1].timestamp - sortedEvents[0].timestamp;
        
        if (filters.minDuration && duration < filters.minDuration) continue;

        const pageViews = new Set(sortedEvents.map(e => e.pageUrl)).size;
        
        // Check if session converted
        const convertedToGoal = await this.checkSessionConversion(projectId, sessionId, filters.dateRange);
        
        if (filters.converted !== undefined && filters.converted !== convertedToGoal) continue;

        // Get device info from first event
        const firstEvent = await prisma.event.findFirst({
          where: { sessionId },
          select: { deviceType: true, browserName: true }
        });

        recordings.push({
          id: sessionId,
          sessionId,
          duration,
          pageViews,
          events: sortedEvents,
          convertedToGoal,
          deviceType: firstEvent?.deviceType || 'unknown',
          browserName: firstEvent?.browserName || 'unknown'
        });

        if (recordings.length >= limit) break;
      }

      return recordings;
    } catch (error) {
      logger.error('Error getting session recordings:', error);
      throw error;
    }
  }

  // Real-time Analytics
  static async getRealTimeMetrics(projectId: string): Promise<{
    activeVisitors: number;
    conversionsLast24h: number;
    topPages: Array<{ page: string; visitors: number }>;
    conversionRate24h: number;
  }> {
    const cacheKey = `realtime_metrics:${projectId}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last15min = new Date(now.getTime() - 15 * 60 * 1000);

      // Active visitors (last 15 minutes)
      const activeVisitors = await prisma.event.groupBy({
        by: ['sessionId'],
        where: {
          projectId,
          timestamp: { gte: last15min }
        },
        _count: { sessionId: true }
      });

      // Conversions last 24h
      const conversions = await prisma.conversion.count({
        where: {
          funnel: { projectId },
          timestamp: { gte: last24h }
        }
      });

      // Top pages
      const topPagesData = await prisma.event.groupBy({
        by: ['pageUrl'],
        where: {
          projectId,
          timestamp: { gte: last24h },
          pageUrl: { not: null }
        },
        _count: { sessionId: true },
        orderBy: { _count: { sessionId: 'desc' } },
        take: 5
      });

      const topPages = topPagesData.map(item => ({
        page: item.pageUrl || 'Unknown',
        visitors: item._count.sessionId
      }));

      // Total visitors last 24h for conversion rate
      const totalVisitors = await prisma.event.groupBy({
        by: ['sessionId'],
        where: {
          projectId,
          timestamp: { gte: last24h }
        },
        _count: { sessionId: true }
      });

      const conversionRate24h = totalVisitors.length > 0 ? conversions / totalVisitors.length : 0;

      const metrics = {
        activeVisitors: activeVisitors.length,
        conversionsLast24h: conversions,
        topPages,
        conversionRate24h
      };

      // Cache for 1 minute
      await cache.set(cacheKey, JSON.stringify(metrics), 60);

      return metrics;
    } catch (error) {
      logger.error('Error getting real-time metrics:', error);
      throw error;
    }
  }

  // Helper methods
  private static async analyzeStep(
    projectId: string,
    step: FunnelStep,
    dateRange: { start: Date; end: Date },
    previousStep?: FunnelStep
  ): Promise<FunnelStepAnalysis> {
    let visitors = 0;
    let conversions = 0;
    let totalTime = 0;

    if (step.pageUrl) {
      // Page-based step
      const pageViews = await prisma.event.groupBy({
        by: ['sessionId'],
        where: {
          projectId,
          eventType: 'pageview',
          pageUrl: step.pageUrl,
          timestamp: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        _count: { sessionId: true }
      });

      visitors = pageViews.length;
      conversions = visitors; // For page views, visiting the page is the conversion
    } else if (step.eventType && step.elementSelector) {
      // Event-based step
      const events = await prisma.event.groupBy({
        by: ['sessionId'],
        where: {
          projectId,
          eventType: step.eventType,
          elementSelector: step.elementSelector,
          timestamp: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        _count: { sessionId: true }
      });

      conversions = events.length;
      
      // Get total visitors who could have performed this action
      if (previousStep) {
        visitors = await this.getStepVisitors(projectId, previousStep, dateRange);
      } else {
        visitors = conversions; // First step
      }
    }

    const conversionRate = visitors > 0 ? conversions / visitors : 0;
    const dropOffRate = 1 - conversionRate;

    return {
      stepIndex: 0, // Will be set by caller
      step,
      visitors,
      conversions,
      conversionRate,
      dropOffRate,
      avgTimeOnStep: totalTime / Math.max(visitors, 1)
    };
  }

  private static async getStepVisitors(
    projectId: string,
    step: FunnelStep,
    dateRange: { start: Date; end: Date }
  ): Promise<number> {
    if (step.pageUrl) {
      const pageViews = await prisma.event.groupBy({
        by: ['sessionId'],
        where: {
          projectId,
          eventType: 'pageview',
          pageUrl: step.pageUrl,
          timestamp: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      });
      return pageViews.length;
    } else if (step.eventType && step.elementSelector) {
      const events = await prisma.event.groupBy({
        by: ['sessionId'],
        where: {
          projectId,
          eventType: step.eventType,
          elementSelector: step.elementSelector,
          timestamp: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      });
      return events.length;
    }
    return 0;
  }

  private static calculatePotentialImpact(
    dropOffRate: number,
    visitors: number,
    goalValue: number
  ): number {
    // Calculate potential revenue if drop-off was reduced by 50%
    const improvementRate = dropOffRate * 0.5;
    const additionalConversions = visitors * improvementRate;
    return additionalConversions * goalValue;
  }

  private static async analyzeSegment(
    projectId: string,
    segmentId: string,
    conditions: SegmentCondition[],
    dateRange: { start: Date; end: Date }
  ): Promise<UserSegment> {
    // This is a simplified implementation
    // In a real system, you'd build dynamic SQL queries based on conditions
    
    const userCount = await this.getUserCountForSegment(projectId, conditions, dateRange);
    const conversionRate = await this.getConversionRateForSegment(projectId, conditions, dateRange);
    
    return {
      id: segmentId,
      name: `Segment ${segmentId}`,
      conditions,
      userCount,
      conversionRate,
      avgSessionDuration: 0, // Would calculate based on conditions
      avgPageViews: 0 // Would calculate based on conditions
    };
  }

  private static async getUserCountForSegment(
    projectId: string,
    conditions: SegmentCondition[],
    dateRange: { start: Date; end: Date }
  ): Promise<number> {
    // Simplified - would build dynamic query based on conditions
    const users = await prisma.event.groupBy({
      by: ['sessionId'],
      where: {
        projectId,
        timestamp: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    });
    
    return users.length;
  }

  private static async getConversionRateForSegment(
    projectId: string,
    conditions: SegmentCondition[],
    dateRange: { start: Date; end: Date }
  ): Promise<number> {
    // Simplified - would apply segment conditions
    return 0.05; // Placeholder
  }

  private static async analyzeCohort(
    projectId: string,
    cohortDate: Date,
    cohortType: 'daily' | 'weekly' | 'monthly'
  ): Promise<CohortAnalysis> {
    const endDate = this.getCohortEndDate(cohortDate, cohortType);
    
    // Get users who first visited in this cohort period
    const cohortUsers = await prisma.event.groupBy({
      by: ['sessionId'],
      where: {
        projectId,
        timestamp: {
          gte: cohortDate,
          lt: endDate
        }
      },
      _min: { timestamp: true }
    });

    const cohortSize = cohortUsers.length;
    const retentionRates: number[] = [];
    const conversionRates: number[] = [];
    
    // Calculate retention for subsequent periods
    for (let period = 1; period <= 12; period++) {
      const periodStart = this.addPeriods(endDate, cohortType, period - 1);
      const periodEnd = this.addPeriods(endDate, cohortType, period);
      
      const returningUsers = await this.getReturningUsers(
        projectId,
        cohortUsers.map(u => u.sessionId),
        periodStart,
        periodEnd
      );
      
      retentionRates.push(cohortSize > 0 ? returningUsers / cohortSize : 0);
      
      // Calculate conversion rate for this period
      const conversions = await this.getConversionsForUsers(
        projectId,
        cohortUsers.map(u => u.sessionId),
        periodStart,
        periodEnd
      );
      
      conversionRates.push(cohortSize > 0 ? conversions / cohortSize : 0);
    }

    return {
      cohortDate: cohortDate.toISOString().split('T')[0],
      size: cohortSize,
      retentionRates,
      conversionRates,
      revenuePerUser: 0 // Would calculate based on conversion values
    };
  }

  private static getCohortDate(now: Date, cohortType: string, periodsAgo: number): Date {
    const date = new Date(now);
    
    switch (cohortType) {
      case 'daily':
        date.setDate(date.getDate() - periodsAgo);
        break;
      case 'weekly':
        date.setDate(date.getDate() - (periodsAgo * 7));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() - periodsAgo);
        break;
    }
    
    return date;
  }

  private static getCohortEndDate(startDate: Date, cohortType: string): Date {
    const endDate = new Date(startDate);
    
    switch (cohortType) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }
    
    return endDate;
  }

  private static addPeriods(date: Date, cohortType: string, periods: number): Date {
    const newDate = new Date(date);
    
    switch (cohortType) {
      case 'daily':
        newDate.setDate(newDate.getDate() + periods);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + (periods * 7));
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + periods);
        break;
    }
    
    return newDate;
  }

  private static async getReturningUsers(
    projectId: string,
    cohortSessionIds: string[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    const returning = await prisma.event.groupBy({
      by: ['sessionId'],
      where: {
        projectId,
        sessionId: { in: cohortSessionIds },
        timestamp: {
          gte: periodStart,
          lt: periodEnd
        }
      }
    });
    
    return returning.length;
  }

  private static async getConversionsForUsers(
    projectId: string,
    cohortSessionIds: string[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    // This would need to be implemented based on your conversion tracking
    return 0; // Placeholder
  }

  private static processHeatmapEvents(events: any[]): HeatmapData[] {
    const elementMap = new Map<string, HeatmapData>();
    
    events.forEach(event => {
      const selector = event.elementSelector || 'unknown';
      const properties = event.properties || {};
      
      if (!elementMap.has(selector)) {
        elementMap.set(selector, {
          elementSelector: selector,
          x: properties.x || 0,
          y: properties.y || 0,
          clicks: 0,
          hovers: 0,
          scrollDepth: 0,
          timeSpent: 0
        });
      }
      
      const data = elementMap.get(selector)!;
      
      switch (event.eventType) {
        case 'click':
          data.clicks++;
          break;
        case 'hover':
          data.hovers++;
          break;
        case 'scroll':
          data.scrollDepth = Math.max(data.scrollDepth, properties.scrollDepth || 0);
          break;
      }
      
      if (properties.timeSpent) {
        data.timeSpent += properties.timeSpent;
      }
    });
    
    return Array.from(elementMap.values());
  }

  private static async checkSessionConversion(
    projectId: string,
    sessionId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<boolean> {
    const conversion = await prisma.conversion.findFirst({
      where: {
        sessionId,
        timestamp: {
          gte: dateRange.start,
          lte: dateRange.end
        },
        funnel: { projectId }
      }
    });
    
    return !!conversion;
  }
}

export default AnalyticsEngine;