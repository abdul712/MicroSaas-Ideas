import { Event, UserSession, Heatmap, SessionRecording } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { redisService } from '@/lib/redis';

export interface TrackingEvent {
  type: string;
  name?: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  pageUrl?: string;
  userId?: string;
  sessionId: string;
  deviceInfo?: DeviceInfo;
  performance?: PerformanceMetrics;
}

export interface DeviceInfo {
  userAgent: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browserFamily: string;
  osFamily: string;
  screenResolution: string;
  viewportSize: string;
}

export interface PerformanceMetrics {
  loadTime: number;
  domReady: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export interface HeatmapData {
  x: number;
  y: number;
  value: number;
  elementPath?: string;
}

export interface ScrollData {
  maxDepth: number;
  timeToScroll: number;
  scrollPattern: { depth: number; timestamp: number }[];
}

export interface FormAnalytics {
  formId: string;
  interactions: FormInteraction[];
  abandonment: FormAbandonment;
  completion: FormCompletion;
}

export interface FormInteraction {
  fieldName: string;
  action: 'focus' | 'blur' | 'change' | 'error';
  timestamp: Date;
  value?: string;
  timeSpent?: number;
}

export interface FormAbandonment {
  abandonedAt: string;
  fieldsCompleted: number;
  totalFields: number;
  timeSpent: number;
  lastInteraction: FormInteraction;
}

export interface FormCompletion {
  completedAt: Date;
  totalTime: number;
  fieldsModified: number;
  errors: number;
  submissionAttempts: number;
}

export interface UserBehaviorInsights {
  session: UserSession;
  pageViews: Event[];
  interactions: Event[];
  conversionPath: Event[];
  engagementScore: number;
  riskFactors: string[];
  recommendations: string[];
}

export class BehaviorTracker {
  private static instance: BehaviorTracker;

  public static getInstance(): BehaviorTracker {
    if (!BehaviorTracker.instance) {
      BehaviorTracker.instance = new BehaviorTracker();
    }
    return BehaviorTracker.instance;
  }

  /**
   * Track user event with privacy compliance
   */
  async trackEvent(projectId: string, event: TrackingEvent): Promise<void> {
    try {
      // Anonymize sensitive data
      const anonymizedEvent = this.anonymizeEvent(event);

      // Store event in database
      await prisma.event.create({
        data: {
          projectId,
          sessionId: anonymizedEvent.sessionId,
          userId: anonymizedEvent.userId,
          eventType: anonymizedEvent.type,
          eventName: anonymizedEvent.name,
          pageUrl: anonymizedEvent.pageUrl || '',
          properties: anonymizedEvent.properties as any,
          timestamp: anonymizedEvent.timestamp || new Date(),
          loadTime: anonymizedEvent.performance?.loadTime,
          scrollDepth: this.extractScrollDepth(anonymizedEvent.properties),
          clickX: this.extractClickX(anonymizedEvent.properties),
          clickY: this.extractClickY(anonymizedEvent.properties),
          elementPath: this.extractElementPath(anonymizedEvent.properties),
          userAgent: anonymizedEvent.deviceInfo?.userAgent,
          country: this.extractCountry(anonymizedEvent.properties),
          city: this.extractCity(anonymizedEvent.properties),
        }
      });

      // Update session data
      await this.updateSessionData(anonymizedEvent.sessionId, anonymizedEvent);

      // Update real-time analytics
      await this.updateRealTimeAnalytics(projectId, anonymizedEvent);

      // Generate heatmap data
      if (anonymizedEvent.type === 'click') {
        await this.updateHeatmapData(projectId, anonymizedEvent);
      }

      // Check for conversion
      if (this.isConversionEvent(anonymizedEvent)) {
        await this.handleConversion(projectId, anonymizedEvent);
      }

    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Start session recording (privacy-compliant)
   */
  async startSessionRecording(
    projectId: string,
    sessionId: string,
    options: { sampleRate?: number; maskSelectors?: string[] } = {}
  ): Promise<void> {
    try {
      const { sampleRate = 0.1, maskSelectors = [] } = options;

      // Check if this session should be recorded (sampling)
      if (Math.random() > sampleRate) {
        return;
      }

      // Create session recording entry
      await prisma.sessionRecording.create({
        data: {
          projectId,
          sessionId,
          duration: 0,
          events: [],
          deviceType: 'unknown'
        }
      });

      // Store recording configuration in Redis
      await redisService.setJson(
        `recording:${sessionId}`,
        { 
          isRecording: true, 
          maskSelectors,
          startTime: Date.now()
        },
        3600 // 1 hour TTL
      );

    } catch (error) {
      console.error('Error starting session recording:', error);
    }
  }

  /**
   * Record session interaction
   */
  async recordInteraction(
    sessionId: string,
    interaction: {
      type: 'dom_change' | 'click' | 'scroll' | 'input' | 'resize';
      target: string;
      data: any;
      timestamp: number;
    }
  ): Promise<void> {
    try {
      const recordingConfig = await redisService.getJson(`recording:${sessionId}`);
      
      if (!recordingConfig?.isRecording) {
        return;
      }

      // Apply privacy masks
      const maskedInteraction = this.maskSensitiveData(interaction, recordingConfig.maskSelectors);

      // Store interaction in Redis (temporary storage)
      const interactionKey = `interactions:${sessionId}`;
      await redisService.sadd(interactionKey, JSON.stringify(maskedInteraction));
      await redisService.expire(interactionKey, 3600); // 1 hour TTL

    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }

  /**
   * Analyze user behavior patterns
   */
  async analyzeUserBehavior(
    projectId: string,
    sessionId: string
  ): Promise<UserBehaviorInsights | null> {
    try {
      // Get session data
      const session = await prisma.userSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) return null;

      // Get all events for this session
      const events = await prisma.event.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' }
      });

      // Categorize events
      const pageViews = events.filter(e => e.eventType === 'pageview');
      const interactions = events.filter(e => ['click', 'scroll', 'input'].includes(e.eventType));
      const conversionPath = this.extractConversionPath(events);

      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(session, events);

      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(session, events);

      // Generate recommendations
      const recommendations = this.generateBehaviorRecommendations(session, events);

      return {
        session,
        pageViews,
        interactions,
        conversionPath,
        engagementScore,
        riskFactors,
        recommendations
      };

    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      return null;
    }
  }

  /**
   * Generate heatmap data
   */
  async generateHeatmap(
    projectId: string,
    pageUrl: string,
    type: 'click' | 'scroll' | 'move' | 'attention',
    dateRange: { start: Date; end: Date },
    filters?: { deviceType?: string; country?: string }
  ): Promise<HeatmapData[]> {
    try {
      let whereConditions: any = {
        projectId,
        pageUrl,
        timestamp: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      };

      // Add type-specific conditions
      switch (type) {
        case 'click':
          whereConditions.eventType = 'click';
          whereConditions.clickX = { not: null };
          whereConditions.clickY = { not: null };
          break;
        case 'scroll':
          whereConditions.eventType = 'scroll';
          whereConditions.scrollDepth = { not: null };
          break;
        case 'move':
          whereConditions.eventType = 'mousemove';
          break;
      }

      // Add filters
      if (filters?.deviceType) {
        whereConditions.properties = {
          path: ['deviceType'],
          equals: filters.deviceType
        };
      }

      const events = await prisma.event.findMany({
        where: whereConditions,
        select: {
          clickX: true,
          clickY: true,
          scrollDepth: true,
          properties: true
        }
      });

      const heatmapData: HeatmapData[] = [];

      for (const event of events) {
        if (type === 'click' && event.clickX && event.clickY) {
          heatmapData.push({
            x: event.clickX,
            y: event.clickY,
            value: 1,
            elementPath: event.properties?.elementPath as string
          });
        } else if (type === 'scroll' && event.scrollDepth) {
          heatmapData.push({
            x: 0,
            y: event.scrollDepth * 1000, // Convert to pixel position
            value: 1
          });
        }
      }

      // Aggregate and normalize data
      return this.aggregateHeatmapData(heatmapData);

    } catch (error) {
      console.error('Error generating heatmap:', error);
      return [];
    }
  }

  /**
   * Analyze form performance
   */
  async analyzeFormPerformance(
    projectId: string,
    formSelector: string,
    dateRange: { start: Date; end: Date }
  ): Promise<FormAnalytics | null> {
    try {
      const formEvents = await prisma.event.findMany({
        where: {
          projectId,
          eventType: { in: ['form_focus', 'form_blur', 'form_change', 'form_submit', 'form_error'] },
          elementPath: { contains: formSelector },
          timestamp: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        orderBy: { timestamp: 'asc' }
      });

      if (formEvents.length === 0) return null;

      // Group events by session
      const sessionGroups = new Map<string, Event[]>();
      for (const event of formEvents) {
        if (!sessionGroups.has(event.sessionId)) {
          sessionGroups.set(event.sessionId, []);
        }
        sessionGroups.get(event.sessionId)!.push(event);
      }

      // Analyze interactions
      const interactions: FormInteraction[] = [];
      let totalCompletions = 0;
      let totalAbandonments = 0;
      const abandonmentReasons: FormAbandonment[] = [];

      for (const [sessionId, events] of sessionGroups) {
        const sessionInteractions = this.extractFormInteractions(events);
        interactions.push(...sessionInteractions);

        const hasSubmission = events.some(e => e.eventType === 'form_submit');
        if (hasSubmission) {
          totalCompletions++;
        } else {
          totalAbandonments++;
          const abandonment = this.analyzeFormAbandonment(events);
          if (abandonment) {
            abandonmentReasons.push(abandonment);
          }
        }
      }

      const completion: FormCompletion = {
        completedAt: new Date(),
        totalTime: this.calculateAverageFormTime(sessionGroups),
        fieldsModified: this.calculateAverageFieldsModified(sessionGroups),
        errors: this.calculateAverageErrors(sessionGroups),
        submissionAttempts: this.calculateAverageSubmissionAttempts(sessionGroups)
      };

      return {
        formId: formSelector,
        interactions,
        abandonment: abandonmentReasons[0] || this.getDefaultAbandonment(),
        completion
      };

    } catch (error) {
      console.error('Error analyzing form performance:', error);
      return null;
    }
  }

  /**
   * Anonymize event data for privacy compliance
   */
  private anonymizeEvent(event: TrackingEvent): TrackingEvent {
    const anonymized = { ...event };

    // Hash user ID if present
    if (anonymized.userId) {
      anonymized.userId = this.hashUserId(anonymized.userId);
    }

    // Remove or anonymize sensitive properties
    if (anonymized.properties) {
      anonymized.properties = this.anonymizeProperties(anonymized.properties);
    }

    // Anonymize IP address in device info
    if (anonymized.deviceInfo?.userAgent) {
      anonymized.deviceInfo.userAgent = this.generalizeUserAgent(anonymized.deviceInfo.userAgent);
    }

    return anonymized;
  }

  /**
   * Hash user ID for privacy
   */
  private hashUserId(userId: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
  }

  /**
   * Anonymize properties
   */
  private anonymizeProperties(properties: Record<string, any>): Record<string, any> {
    const anonymized = { ...properties };

    // Remove sensitive fields
    delete anonymized.email;
    delete anonymized.phone;
    delete anonymized.name;
    delete anonymized.address;

    // Generalize location data
    if (anonymized.city) {
      anonymized.region = this.generalizeLocation(anonymized.city);
      delete anonymized.city;
    }

    return anonymized;
  }

  /**
   * Generalize user agent string
   */
  private generalizeUserAgent(userAgent: string): string {
    // Extract only browser family and major version
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Generalize location for privacy
   */
  private generalizeLocation(city: string): string {
    // Return region or country instead of specific city
    return 'North America'; // Simplified for example
  }

  /**
   * Extract scroll depth from properties
   */
  private extractScrollDepth(properties?: Record<string, any>): number | null {
    return properties?.scrollDepth || null;
  }

  /**
   * Extract click coordinates
   */
  private extractClickX(properties?: Record<string, any>): number | null {
    return properties?.clickX || null;
  }

  private extractClickY(properties?: Record<string, any>): number | null {
    return properties?.clickY || null;
  }

  /**
   * Extract element path
   */
  private extractElementPath(properties?: Record<string, any>): string | null {
    return properties?.elementPath || null;
  }

  /**
   * Extract geographic data
   */
  private extractCountry(properties?: Record<string, any>): string | null {
    return properties?.country || null;
  }

  private extractCity(properties?: Record<string, any>): string | null {
    return properties?.city || null;
  }

  /**
   * Update session data
   */
  private async updateSessionData(sessionId: string, event: TrackingEvent): Promise<void> {
    try {
      // Get or create session
      let session = await prisma.userSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        session = await prisma.userSession.create({
          data: {
            id: sessionId,
            projectId: event.properties?.projectId || '',
            sessionHash: this.hashUserId(sessionId),
            startTime: new Date(),
            deviceType: event.deviceInfo?.deviceType,
            browserFamily: event.deviceInfo?.browserFamily,
            osFamily: event.deviceInfo?.osFamily,
            country: this.extractCountry(event.properties),
            referrerDomain: event.properties?.referrer ? this.extractDomain(event.properties.referrer) : null
          }
        });
      }

      // Update session metrics
      const updates: any = {
        endTime: new Date(),
        pageViews: event.type === 'pageview' ? { increment: 1 } : undefined,
        clickCount: event.type === 'click' ? { increment: 1 } : undefined
      };

      await prisma.userSession.update({
        where: { id: sessionId },
        data: updates
      });

    } catch (error) {
      console.error('Error updating session data:', error);
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  /**
   * Update real-time analytics
   */
  private async updateRealTimeAnalytics(projectId: string, event: TrackingEvent): Promise<void> {
    const minute = Math.floor(Date.now() / 60000);
    const key = `analytics:${projectId}:${minute}`;
    
    const pipeline = await redisService.pipeline();
    pipeline.hincrby(key, 'events', 1);
    pipeline.hincrby(key, event.type, 1);
    pipeline.expire(key, 3600); // 1 hour TTL
    await pipeline.exec();
  }

  /**
   * Update heatmap data
   */
  private async updateHeatmapData(projectId: string, event: TrackingEvent): Promise<void> {
    if (!event.pageUrl) return;

    const clickData = {
      x: event.properties?.clickX,
      y: event.properties?.clickY,
      element: event.properties?.elementPath,
      timestamp: Date.now()
    };

    const key = `heatmap:${projectId}:${event.pageUrl}:click`;
    await redisService.sadd(key, JSON.stringify(clickData));
    await redisService.expire(key, 86400); // 24 hours
  }

  /**
   * Check if event is a conversion
   */
  private isConversionEvent(event: TrackingEvent): boolean {
    return event.type === 'conversion' || 
           event.type === 'purchase' || 
           event.type === 'signup' ||
           event.name === 'goal_completed';
  }

  /**
   * Handle conversion event
   */
  private async handleConversion(projectId: string, event: TrackingEvent): Promise<void> {
    try {
      // Update session conversion status
      await prisma.userSession.update({
        where: { id: event.sessionId },
        data: {
          isConverted: true,
          conversionValue: event.properties?.value || 0
        }
      });

      // Update real-time conversion metrics
      const key = `conversions:${projectId}:${new Date().toISOString().split('T')[0]}`;
      await redisService.incr(key);
      await redisService.expire(key, 86400 * 30); // 30 days

    } catch (error) {
      console.error('Error handling conversion:', error);
    }
  }

  /**
   * Mask sensitive data in recordings
   */
  private maskSensitiveData(interaction: any, maskSelectors: string[]): any {
    const masked = { ...interaction };

    // Apply masking based on selectors
    for (const selector of maskSelectors) {
      if (masked.target?.includes(selector)) {
        masked.data = '[MASKED]';
      }
    }

    // Always mask password fields
    if (masked.target?.includes('password') || masked.target?.includes('pwd')) {
      masked.data = '[MASKED]';
    }

    return masked;
  }

  /**
   * Extract conversion path from events
   */
  private extractConversionPath(events: Event[]): Event[] {
    const conversionEvent = events.find(e => this.isConversionEventType(e.eventType));
    if (!conversionEvent) return [];

    // Return events leading up to conversion
    const conversionIndex = events.findIndex(e => e.id === conversionEvent.id);
    return events.slice(0, conversionIndex + 1);
  }

  private isConversionEventType(eventType: string): boolean {
    return ['conversion', 'purchase', 'signup', 'goal_completed'].includes(eventType);
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(session: UserSession, events: Event[]): number {
    let score = 0;

    // Time on site (max 40 points)
    const duration = session.duration || 0;
    score += Math.min(40, duration / 60); // 1 point per minute, max 40

    // Page views (max 20 points)
    score += Math.min(20, session.pageViews * 5);

    // Interactions (max 30 points)
    const interactionEvents = events.filter(e => ['click', 'scroll', 'input'].includes(e.eventType));
    score += Math.min(30, interactionEvents.length);

    // Conversion bonus (10 points)
    if (session.isConverted) {
      score += 10;
    }

    return Math.round(score);
  }

  /**
   * Identify risk factors for churn/abandonment
   */
  private identifyRiskFactors(session: UserSession, events: Event[]): string[] {
    const riskFactors: string[] = [];

    // Short session duration
    if ((session.duration || 0) < 30) {
      riskFactors.push('Very short session duration');
    }

    // High bounce rate (single page view)
    if (session.pageViews === 1) {
      riskFactors.push('Single page visit (bounce)');
    }

    // Low interaction
    const interactions = events.filter(e => ['click', 'scroll', 'input'].includes(e.eventType));
    if (interactions.length < 3) {
      riskFactors.push('Low user interaction');
    }

    // Mobile issues
    if (session.deviceType === 'mobile' && (session.duration || 0) < 60) {
      riskFactors.push('Quick mobile exit');
    }

    // Form abandonment
    const formEvents = events.filter(e => e.eventType.startsWith('form_'));
    const formSubmit = formEvents.find(e => e.eventType === 'form_submit');
    if (formEvents.length > 0 && !formSubmit) {
      riskFactors.push('Form abandonment detected');
    }

    return riskFactors;
  }

  /**
   * Generate behavior-based recommendations
   */
  private generateBehaviorRecommendations(session: UserSession, events: Event[]): string[] {
    const recommendations: string[] = [];

    // Quick exit recommendations
    if ((session.duration || 0) < 30) {
      recommendations.push('Improve page load speed and initial value proposition');
    }

    // Mobile optimization
    if (session.deviceType === 'mobile') {
      recommendations.push('Optimize mobile user experience and navigation');
    }

    // Form optimization
    const formEvents = events.filter(e => e.eventType.startsWith('form_'));
    if (formEvents.length > 0) {
      recommendations.push('Review form design and reduce friction');
    }

    // Engagement improvement
    const interactions = events.filter(e => ['click', 'scroll', 'input'].includes(e.eventType));
    if (interactions.length < 5) {
      recommendations.push('Add more interactive elements to increase engagement');
    }

    return recommendations;
  }

  /**
   * Aggregate heatmap data points
   */
  private aggregateHeatmapData(data: HeatmapData[]): HeatmapData[] {
    const aggregated = new Map<string, HeatmapData>();

    for (const point of data) {
      // Round coordinates to create clusters
      const roundedX = Math.round(point.x / 10) * 10;
      const roundedY = Math.round(point.y / 10) * 10;
      const key = `${roundedX},${roundedY}`;

      if (aggregated.has(key)) {
        aggregated.get(key)!.value += point.value;
      } else {
        aggregated.set(key, {
          x: roundedX,
          y: roundedY,
          value: point.value,
          elementPath: point.elementPath
        });
      }
    }

    return Array.from(aggregated.values());
  }

  /**
   * Extract form interactions from events
   */
  private extractFormInteractions(events: Event[]): FormInteraction[] {
    return events.map(event => ({
      fieldName: event.properties?.fieldName || 'unknown',
      action: event.eventType.replace('form_', '') as any,
      timestamp: event.timestamp,
      value: event.properties?.value,
      timeSpent: event.properties?.timeSpent
    }));
  }

  /**
   * Analyze form abandonment
   */
  private analyzeFormAbandonment(events: Event[]): FormAbandonment | null {
    const lastEvent = events[events.length - 1];
    if (!lastEvent) return null;

    const formInteractions = this.extractFormInteractions(events);
    const uniqueFields = new Set(formInteractions.map(i => i.fieldName)).size;

    return {
      abandonedAt: lastEvent.properties?.fieldName || 'unknown',
      fieldsCompleted: uniqueFields,
      totalFields: events.length,
      timeSpent: this.calculateFormDuration(events),
      lastInteraction: formInteractions[formInteractions.length - 1]
    };
  }

  /**
   * Calculate form completion duration
   */
  private calculateFormDuration(events: Event[]): number {
    if (events.length < 2) return 0;
    
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    
    return (lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime()) / 1000;
  }

  /**
   * Helper functions for form analytics
   */
  private calculateAverageFormTime(sessionGroups: Map<string, Event[]>): number {
    let totalTime = 0;
    let count = 0;

    for (const events of sessionGroups.values()) {
      totalTime += this.calculateFormDuration(events);
      count++;
    }

    return count > 0 ? totalTime / count : 0;
  }

  private calculateAverageFieldsModified(sessionGroups: Map<string, Event[]>): number {
    let totalFields = 0;
    let count = 0;

    for (const events of sessionGroups.values()) {
      const uniqueFields = new Set(events.map(e => e.properties?.fieldName)).size;
      totalFields += uniqueFields;
      count++;
    }

    return count > 0 ? totalFields / count : 0;
  }

  private calculateAverageErrors(sessionGroups: Map<string, Event[]>): number {
    let totalErrors = 0;
    let count = 0;

    for (const events of sessionGroups.values()) {
      const errors = events.filter(e => e.eventType === 'form_error').length;
      totalErrors += errors;
      count++;
    }

    return count > 0 ? totalErrors / count : 0;
  }

  private calculateAverageSubmissionAttempts(sessionGroups: Map<string, Event[]>): number {
    let totalAttempts = 0;
    let count = 0;

    for (const events of sessionGroups.values()) {
      const attempts = events.filter(e => e.eventType === 'form_submit').length;
      totalAttempts += Math.max(1, attempts);
      count++;
    }

    return count > 0 ? totalAttempts / count : 1;
  }

  private getDefaultAbandonment(): FormAbandonment {
    return {
      abandonedAt: 'unknown',
      fieldsCompleted: 0,
      totalFields: 0,
      timeSpent: 0,
      lastInteraction: {
        fieldName: 'unknown',
        action: 'focus',
        timestamp: new Date()
      }
    };
  }
}

export const behaviorTracker = BehaviorTracker.getInstance();