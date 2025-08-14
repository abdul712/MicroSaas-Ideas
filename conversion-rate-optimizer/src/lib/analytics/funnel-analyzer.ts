import { Funnel, Event, UserSession } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { redisService } from '@/lib/redis';

export interface FunnelStep {
  id: string;
  name: string;
  url?: string;
  eventType?: string;
  eventName?: string;
  selector?: string;
  order: number;
}

export interface FunnelStepData {
  step: FunnelStep;
  users: number;
  conversions: number;
  conversionRate: number;
  dropOffRate: number;
  averageTimeToNext?: number;
  topDropOffReasons?: string[];
}

export interface FunnelAnalysis {
  funnel: Funnel;
  steps: FunnelStepData[];
  totalUsers: number;
  overallConversionRate: number;
  criticalDropOff: FunnelStepData | null;
  recommendations: string[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface CohortAnalysis {
  cohortDate: string;
  totalUsers: number;
  stepConversions: { [stepId: string]: number };
  dayRanges: { [day: string]: { [stepId: string]: number } };
}

export class FunnelAnalyzer {
  private static instance: FunnelAnalyzer;

  public static getInstance(): FunnelAnalyzer {
    if (!FunnelAnalyzer.instance) {
      FunnelAnalyzer.instance = new FunnelAnalyzer();
    }
    return FunnelAnalyzer.instance;
  }

  /**
   * Analyze funnel performance over a date range
   */
  async analyzeFunnel(
    funnelId: string,
    startDate: Date,
    endDate: Date,
    options?: {
      segmentBy?: string;
      deviceType?: string;
      trafficSource?: string;
      country?: string;
    }
  ): Promise<FunnelAnalysis | null> {
    try {
      const funnel = await prisma.funnel.findUnique({
        where: { id: funnelId },
        include: { project: true }
      });

      if (!funnel) return null;

      const funnelSteps = funnel.steps as FunnelStep[];
      const stepAnalysis: FunnelStepData[] = [];

      // Get all events in the date range for this project
      const events = await this.getEventsForFunnel(
        funnel.projectId,
        funnelSteps,
        startDate,
        endDate,
        options
      );

      // Group events by session
      const sessionEvents = this.groupEventsBySession(events);

      // Analyze each step
      let previousStepUsers = 0;
      
      for (let i = 0; i < funnelSteps.length; i++) {
        const step = funnelSteps[i];
        const stepUsers = this.getUsersReachingStep(sessionEvents, step, i);
        
        const conversionRate = i === 0 ? 100 : 
          previousStepUsers > 0 ? (stepUsers / previousStepUsers) * 100 : 0;
        
        const dropOffRate = 100 - conversionRate;
        
        const averageTimeToNext = i < funnelSteps.length - 1 ? 
          await this.calculateAverageTimeToNextStep(sessionEvents, step, funnelSteps[i + 1]) : 
          undefined;

        const stepData: FunnelStepData = {
          step,
          users: stepUsers,
          conversions: i === funnelSteps.length - 1 ? stepUsers : 0,
          conversionRate,
          dropOffRate,
          averageTimeToNext,
          topDropOffReasons: await this.getDropOffReasons(sessionEvents, step, i)
        };

        stepAnalysis.push(stepData);
        previousStepUsers = stepUsers;
      }

      // Calculate overall metrics
      const totalUsers = stepAnalysis[0]?.users || 0;
      const finalStepUsers = stepAnalysis[stepAnalysis.length - 1]?.users || 0;
      const overallConversionRate = totalUsers > 0 ? (finalStepUsers / totalUsers) * 100 : 0;

      // Find critical drop-off point
      const criticalDropOff = this.findCriticalDropOff(stepAnalysis);

      // Generate recommendations
      const recommendations = this.generateFunnelRecommendations(stepAnalysis, funnel);

      return {
        funnel,
        steps: stepAnalysis,
        totalUsers,
        overallConversionRate,
        criticalDropOff,
        recommendations,
        timeRange: { start: startDate, end: endDate }
      };
    } catch (error) {
      console.error('Error analyzing funnel:', error);
      return null;
    }
  }

  /**
   * Perform cohort analysis for funnel
   */
  async analyzeFunnelCohorts(
    funnelId: string,
    startDate: Date,
    endDate: Date,
    cohortPeriod: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<CohortAnalysis[]> {
    try {
      const funnel = await prisma.funnel.findUnique({
        where: { id: funnelId }
      });

      if (!funnel) return [];

      const funnelSteps = funnel.steps as FunnelStep[];
      const cohorts: CohortAnalysis[] = [];

      // Generate cohort date ranges
      const cohortDates = this.generateCohortDates(startDate, endDate, cohortPeriod);

      for (const cohortDate of cohortDates) {
        const cohortStart = new Date(cohortDate);
        const cohortEnd = this.getCohortEndDate(cohortStart, cohortPeriod);

        // Get users who started the funnel in this cohort period
        const cohortUsers = await this.getCohortUsers(
          funnel.projectId,
          funnelSteps[0],
          cohortStart,
          cohortEnd
        );

        // Track their progression through the funnel over time
        const stepConversions: { [stepId: string]: number } = {};
        const dayRanges: { [day: string]: { [stepId: string]: number } } = {};

        // Analyze conversion for each step
        for (const step of funnelSteps) {
          const conversions = await this.getCohortStepConversions(
            cohortUsers,
            step,
            cohortStart,
            new Date() // Track until now
          );
          stepConversions[step.id] = conversions;
        }

        // Analyze day-by-day progression (for first 30 days)
        for (let day = 0; day < 30; day++) {
          const dayKey = `day_${day}`;
          const dayEnd = new Date(cohortStart.getTime() + (day + 1) * 24 * 60 * 60 * 1000);
          
          dayRanges[dayKey] = {};
          
          for (const step of funnelSteps) {
            const dayConversions = await this.getCohortStepConversions(
              cohortUsers,
              step,
              cohortStart,
              dayEnd
            );
            dayRanges[dayKey][step.id] = dayConversions;
          }
        }

        cohorts.push({
          cohortDate: cohortDate,
          totalUsers: cohortUsers.length,
          stepConversions,
          dayRanges
        });
      }

      return cohorts;
    } catch (error) {
      console.error('Error analyzing funnel cohorts:', error);
      return [];
    }
  }

  /**
   * Detect funnel automatically based on user behavior
   */
  async detectFunnels(projectId: string, minSessions: number = 100): Promise<FunnelStep[][]> {
    try {
      // Get common user paths
      const commonPaths = await this.getCommonUserPaths(projectId, minSessions);
      
      // Convert paths to funnel steps
      const detectedFunnels: FunnelStep[][] = [];
      
      for (const path of commonPaths) {
        const funnelSteps: FunnelStep[] = path.map((url, index) => ({
          id: `step_${index}`,
          name: this.generateStepName(url),
          url,
          order: index
        }));
        
        detectedFunnels.push(funnelSteps);
      }
      
      return detectedFunnels;
    } catch (error) {
      console.error('Error detecting funnels:', error);
      return [];
    }
  }

  /**
   * Get events for funnel analysis
   */
  private async getEventsForFunnel(
    projectId: string,
    steps: FunnelStep[],
    startDate: Date,
    endDate: Date,
    filters?: any
  ): Promise<Event[]> {
    const whereConditions: any = {
      projectId,
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    };

    // Add filters
    if (filters?.deviceType) {
      whereConditions.properties = {
        path: ['deviceType'],
        equals: filters.deviceType
      };
    }

    // Get relevant events for funnel steps
    const relevantEventTypes = steps
      .map(step => step.eventType)
      .filter(Boolean);

    const relevantUrls = steps
      .map(step => step.url)
      .filter(Boolean);

    if (relevantEventTypes.length > 0 || relevantUrls.length > 0) {
      whereConditions.OR = [];
      
      if (relevantEventTypes.length > 0) {
        whereConditions.OR.push({
          eventType: { in: relevantEventTypes }
        });
      }
      
      if (relevantUrls.length > 0) {
        whereConditions.OR.push({
          pageUrl: { in: relevantUrls }
        });
      }
    }

    return await prisma.event.findMany({
      where: whereConditions,
      orderBy: { timestamp: 'asc' }
    });
  }

  /**
   * Group events by session
   */
  private groupEventsBySession(events: Event[]): Map<string, Event[]> {
    const sessionGroups = new Map<string, Event[]>();
    
    for (const event of events) {
      if (!sessionGroups.has(event.sessionId)) {
        sessionGroups.set(event.sessionId, []);
      }
      sessionGroups.get(event.sessionId)!.push(event);
    }
    
    return sessionGroups;
  }

  /**
   * Get users reaching a specific step
   */
  private getUsersReachingStep(
    sessionEvents: Map<string, Event[]>,
    step: FunnelStep,
    stepIndex: number
  ): number {
    let usersReachingStep = 0;
    
    for (const [sessionId, events] of sessionEvents) {
      const reachedStep = this.sessionReachedStep(events, step);
      if (reachedStep) {
        usersReachingStep++;
      }
    }
    
    return usersReachingStep;
  }

  /**
   * Check if session reached a specific step
   */
  private sessionReachedStep(events: Event[], step: FunnelStep): boolean {
    return events.some(event => {
      if (step.eventType && event.eventType === step.eventType) {
        return step.eventName ? event.eventName === step.eventName : true;
      }
      
      if (step.url && event.pageUrl === step.url) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Calculate average time to next step
   */
  private async calculateAverageTimeToNextStep(
    sessionEvents: Map<string, Event[]>,
    currentStep: FunnelStep,
    nextStep: FunnelStep
  ): Promise<number> {
    const timeDifferences: number[] = [];
    
    for (const [sessionId, events] of sessionEvents) {
      const currentStepEvent = events.find(e => this.eventMatchesStep(e, currentStep));
      const nextStepEvent = events.find(e => 
        this.eventMatchesStep(e, nextStep) && 
        currentStepEvent && 
        e.timestamp > currentStepEvent.timestamp
      );
      
      if (currentStepEvent && nextStepEvent) {
        const timeDiff = nextStepEvent.timestamp.getTime() - currentStepEvent.timestamp.getTime();
        timeDifferences.push(timeDiff / 1000); // Convert to seconds
      }
    }
    
    return timeDifferences.length > 0 ? 
      timeDifferences.reduce((sum, time) => sum + time, 0) / timeDifferences.length : 0;
  }

  /**
   * Check if event matches step criteria
   */
  private eventMatchesStep(event: Event, step: FunnelStep): boolean {
    if (step.eventType && event.eventType === step.eventType) {
      return step.eventName ? event.eventName === step.eventName : true;
    }
    
    if (step.url && event.pageUrl === step.url) {
      return true;
    }
    
    return false;
  }

  /**
   * Get drop-off reasons for a step
   */
  private async getDropOffReasons(
    sessionEvents: Map<string, Event[]>,
    step: FunnelStep,
    stepIndex: number
  ): Promise<string[]> {
    const dropOffReasons: string[] = [];
    
    // Analyze sessions that reached this step but didn't continue
    for (const [sessionId, events] of sessionEvents) {
      const reachedCurrentStep = this.sessionReachedStep(events, step);
      
      if (reachedCurrentStep) {
        // Check for common drop-off patterns
        const lastEvent = events[events.length - 1];
        const timeOnStep = this.calculateTimeOnStep(events, step);
        
        if (timeOnStep < 5) { // Less than 5 seconds
          dropOffReasons.push('Quick exit - potential usability issue');
        }
        
        if (lastEvent.eventType === 'error') {
          dropOffReasons.push('Technical error encountered');
        }
      }
    }
    
    // Return top 3 reasons
    const reasonCounts = this.countReasons(dropOffReasons);
    return Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([reason]) => reason);
  }

  /**
   * Calculate time spent on a step
   */
  private calculateTimeOnStep(events: Event[], step: FunnelStep): number {
    const stepEvent = events.find(e => this.eventMatchesStep(e, step));
    if (!stepEvent) return 0;
    
    const nextEvent = events.find(e => e.timestamp > stepEvent.timestamp);
    if (!nextEvent) return 0;
    
    return (nextEvent.timestamp.getTime() - stepEvent.timestamp.getTime()) / 1000;
  }

  /**
   * Count occurrence of reasons
   */
  private countReasons(reasons: string[]): { [reason: string]: number } {
    const counts: { [reason: string]: number } = {};
    
    for (const reason of reasons) {
      counts[reason] = (counts[reason] || 0) + 1;
    }
    
    return counts;
  }

  /**
   * Find critical drop-off point
   */
  private findCriticalDropOff(steps: FunnelStepData[]): FunnelStepData | null {
    let maxDropOff = 0;
    let criticalStep: FunnelStepData | null = null;
    
    for (const step of steps) {
      if (step.dropOffRate > maxDropOff && step.users > 50) { // Minimum users for statistical significance
        maxDropOff = step.dropOffRate;
        criticalStep = step;
      }
    }
    
    return criticalStep;
  }

  /**
   * Generate funnel recommendations
   */
  private generateFunnelRecommendations(steps: FunnelStepData[], funnel: Funnel): string[] {
    const recommendations: string[] = [];
    
    const criticalStep = this.findCriticalDropOff(steps);
    
    if (criticalStep && criticalStep.dropOffRate > 50) {
      recommendations.push(
        `Critical drop-off at "${criticalStep.step.name}" (${criticalStep.dropOffRate.toFixed(1)}% drop-off). Focus optimization efforts here.`
      );
    }
    
    // Check for long time to convert
    const slowSteps = steps.filter(s => s.averageTimeToNext && s.averageTimeToNext > 300); // 5 minutes
    if (slowSteps.length > 0) {
      recommendations.push(
        `Users take too long at: ${slowSteps.map(s => s.step.name).join(', ')}. Consider simplifying these steps.`
      );
    }
    
    // Check overall conversion rate
    const finalStep = steps[steps.length - 1];
    if (finalStep && finalStep.conversionRate < 10) {
      recommendations.push(
        'Low overall conversion rate. Consider A/B testing major funnel changes.'
      );
    }
    
    // Mobile-specific recommendations
    recommendations.push(
      'Analyze mobile vs desktop performance to identify device-specific issues.'
    );
    
    return recommendations;
  }

  /**
   * Get common user paths
   */
  private async getCommonUserPaths(projectId: string, minSessions: number): Promise<string[][]> {
    // Get session sequences
    const sessions = await prisma.userSession.findMany({
      where: { projectId },
      include: {
        events: {
          where: { eventType: 'pageview' },
          orderBy: { timestamp: 'asc' },
          select: { pageUrl: true }
        }
      }
    });

    const pathCounts = new Map<string, number>();
    
    // Count path occurrences
    for (const session of sessions) {
      if (session.events.length >= 2) { // Minimum 2 pages
        const path = session.events.map(e => e.pageUrl).slice(0, 5); // Max 5 steps
        const pathKey = path.join(' -> ');
        pathCounts.set(pathKey, (pathCounts.get(pathKey) || 0) + 1);
      }
    }
    
    // Return paths with minimum sessions
    return Array.from(pathCounts.entries())
      .filter(([, count]) => count >= minSessions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 paths
      .map(([path]) => path.split(' -> '));
  }

  /**
   * Generate step name from URL
   */
  private generateStepName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      if (pathname === '/') return 'Homepage';
      if (pathname.includes('product')) return 'Product Page';
      if (pathname.includes('cart')) return 'Cart';
      if (pathname.includes('checkout')) return 'Checkout';
      if (pathname.includes('signup')) return 'Sign Up';
      if (pathname.includes('login')) return 'Login';
      
      return pathname.split('/').filter(Boolean).join(' ').replace(/-/g, ' ');
    } catch {
      return url;
    }
  }

  /**
   * Generate cohort dates
   */
  private generateCohortDates(
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'weekly' | 'monthly'
  ): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      
      switch (period) {
        case 'daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
    
    return dates;
  }

  /**
   * Get cohort end date
   */
  private getCohortEndDate(startDate: Date, period: 'daily' | 'weekly' | 'monthly'): Date {
    const endDate = new Date(startDate);
    
    switch (period) {
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

  /**
   * Get users who started funnel in cohort period
   */
  private async getCohortUsers(
    projectId: string,
    firstStep: FunnelStep,
    startDate: Date,
    endDate: Date
  ): Promise<string[]> {
    const events = await prisma.event.findMany({
      where: {
        projectId,
        timestamp: { gte: startDate, lt: endDate },
        OR: [
          { eventType: firstStep.eventType },
          { pageUrl: firstStep.url }
        ]
      },
      select: { sessionId: true },
      distinct: ['sessionId']
    });
    
    return events.map(e => e.sessionId);
  }

  /**
   * Get cohort step conversions
   */
  private async getCohortStepConversions(
    cohortUsers: string[],
    step: FunnelStep,
    cohortStart: Date,
    endDate: Date
  ): Promise<number> {
    const events = await prisma.event.findMany({
      where: {
        sessionId: { in: cohortUsers },
        timestamp: { gte: cohortStart, lte: endDate },
        OR: [
          { eventType: step.eventType },
          { pageUrl: step.url }
        ]
      },
      select: { sessionId: true },
      distinct: ['sessionId']
    });
    
    return events.length;
  }
}

export const funnelAnalyzer = FunnelAnalyzer.getInstance();