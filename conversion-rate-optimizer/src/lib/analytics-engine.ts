import { prisma } from './prisma'
import { CacheService } from './redis'

export interface ConversionFunnel {
  id: string
  name: string
  steps: FunnelStep[]
  totalVisitors: number
  totalConversions: number
  conversionRate: number
  dropOffPoints: DropOffPoint[]
}

export interface FunnelStep {
  id: string
  name: string
  url: string
  visitors: number
  conversions: number
  conversionRate: number
  dropOffRate: number
  timeOnStep?: number
}

export interface DropOffPoint {
  step: number
  dropOffRate: number
  affectedVisitors: number
  potentialRevenue: number
  severity: 'critical' | 'high' | 'medium' | 'low'
}

export interface UserBehaviorAnalytics {
  heatmapData: HeatmapPoint[]
  scrollDepth: ScrollDepthData
  clickTracking: ClickTrackingData[]
  formAnalytics: FormAnalyticsData
  deviceAnalytics: DeviceAnalyticsData
}

export interface HeatmapPoint {
  x: number
  y: number
  intensity: number
  clicks: number
}

export interface ScrollDepthData {
  quartiles: number[]
  avgScrollDepth: number
  bounceRate: number
}

export interface ClickTrackingData {
  selector: string
  clicks: number
  uniqueClicks: number
  conversionRate: number
}

export interface FormAnalyticsData {
  formId: string
  fields: FormFieldData[]
  abandonment: FormAbandonmentData
  completion: FormCompletionData
}

export interface FormFieldData {
  name: string
  completionRate: number
  errorRate: number
  avgTimeToFill: number
  abandonmentRate: number
}

export interface FormAbandonmentData {
  totalStarts: number
  totalAbandoned: number
  abandonmentRate: number
  topExitFields: string[]
}

export interface FormCompletionData {
  completionRate: number
  avgCompletionTime: number
  conversionRate: number
}

export interface DeviceAnalyticsData {
  mobile: DeviceMetrics
  desktop: DeviceMetrics
  tablet: DeviceMetrics
}

export interface DeviceMetrics {
  visitors: number
  conversionRate: number
  bounceRate: number
  avgSessionDuration: number
}

export class AnalyticsEngine {
  /**
   * Analyze conversion funnel performance
   */
  static async analyzeFunnel(
    projectId: string,
    funnelId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<ConversionFunnel> {
    const cacheKey = `funnel:${funnelId}:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`
    
    // Check cache first
    const cached = await CacheService.getAnalytics<ConversionFunnel>(projectId, cacheKey)
    if (cached) return cached

    const funnel = await prisma.funnel.findUnique({
      where: { id: funnelId },
      include: {
        analytics: {
          where: {
            date: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
        },
      },
    })

    if (!funnel) {
      throw new Error('Funnel not found')
    }

    const steps = funnel.steps as any[]
    const funnelSteps: FunnelStep[] = []
    let totalVisitors = 0
    let totalConversions = 0

    // Process each funnel step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepAnalytics = funnel.analytics.filter(a => a.step === i)
      
      const visitors = stepAnalytics.reduce((sum, a) => sum + a.visitors, 0)
      const conversions = stepAnalytics.reduce((sum, a) => sum + a.conversions, 0)
      const dropOff = stepAnalytics.reduce((sum, a) => sum + a.dropOff, 0)
      
      const conversionRate = visitors > 0 ? (conversions / visitors) * 100 : 0
      const dropOffRate = visitors > 0 ? (dropOff / visitors) * 100 : 0

      funnelSteps.push({
        id: `step_${i}`,
        name: step.name,
        url: step.url,
        visitors,
        conversions,
        conversionRate,
        dropOffRate,
      })

      if (i === 0) totalVisitors = visitors
      if (i === steps.length - 1) totalConversions = conversions
    }

    // Identify drop-off points
    const dropOffPoints = this.identifyDropOffPoints(funnelSteps)

    const result: ConversionFunnel = {
      id: funnelId,
      name: funnel.name,
      steps: funnelSteps,
      totalVisitors,
      totalConversions,
      conversionRate: totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0,
      dropOffPoints,
    }

    // Cache the result
    await CacheService.setAnalytics(projectId, cacheKey, result)

    return result
  }

  /**
   * Analyze user behavior patterns
   */
  static async analyzeUserBehavior(
    projectId: string,
    pageUrl: string,
    dateRange: { start: Date; end: Date }
  ): Promise<UserBehaviorAnalytics> {
    // Get conversion events for the page
    const events = await prisma.conversionEvent.findMany({
      where: {
        projectId,
        pageUrl,
        timestamp: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      orderBy: { timestamp: 'asc' },
    })

    // Process events to generate analytics
    const heatmapData = this.generateHeatmapData(events)
    const scrollDepth = this.analyzeScrollDepth(events)
    const clickTracking = this.analyzeClickTracking(events)
    const formAnalytics = this.analyzeFormBehavior(events)
    const deviceAnalytics = this.analyzeDevicePerformance(events)

    return {
      heatmapData,
      scrollDepth,
      clickTracking,
      formAnalytics,
      deviceAnalytics,
    }
  }

  /**
   * Detect conversion bottlenecks automatically
   */
  static async detectBottlenecks(
    projectId: string,
    funnelId?: string
  ): Promise<any[]> {
    const bottlenecks = []

    // Form abandonment detection
    const formBottlenecks = await this.detectFormBottlenecks(projectId)
    bottlenecks.push(...formBottlenecks)

    // Page load performance bottlenecks
    const performanceBottlenecks = await this.detectPerformanceBottlenecks(projectId)
    bottlenecks.push(...performanceBottlenecks)

    // Mobile experience bottlenecks
    const mobileBottlenecks = await this.detectMobileBottlenecks(projectId)
    bottlenecks.push(...mobileBottlenecks)

    // Checkout process bottlenecks
    const checkoutBottlenecks = await this.detectCheckoutBottlenecks(projectId)
    bottlenecks.push(...checkoutBottlenecks)

    // Save bottlenecks to database
    for (const bottleneck of bottlenecks) {
      await prisma.bottleneck.upsert({
        where: {
          id: bottleneck.id || 'new',
        },
        update: bottleneck,
        create: {
          ...bottleneck,
          projectId,
          detectedAt: new Date(),
        },
      })
    }

    return bottlenecks
  }

  /**
   * Generate automated insights and recommendations
   */
  static async generateInsights(projectId: string): Promise<any[]> {
    const insights = []

    // Conversion rate insights
    const conversionInsights = await this.analyzeConversionTrends(projectId)
    insights.push(...conversionInsights)

    // Traffic source insights
    const trafficInsights = await this.analyzeTrafficSources(projectId)
    insights.push(...trafficInsights)

    // Device performance insights
    const deviceInsights = await this.analyzeDeviceInsights(projectId)
    insights.push(...deviceInsights)

    // Time-based insights (seasonal, weekly patterns)
    const timeInsights = await this.analyzeTimePatterns(projectId)
    insights.push(...timeInsights)

    // Save insights to database
    for (const insight of insights) {
      await prisma.insight.create({
        data: {
          projectId,
          type: insight.type,
          title: insight.title,
          description: insight.description,
          potentialImpact: insight.potentialImpact,
          priority: insight.priority,
        },
      })
    }

    return insights
  }

  // Private helper methods

  private static identifyDropOffPoints(steps: FunnelStep[]): DropOffPoint[] {
    const dropOffPoints: DropOffPoint[] = []

    for (let i = 0; i < steps.length - 1; i++) {
      const currentStep = steps[i]
      const nextStep = steps[i + 1]
      
      const dropOffRate = currentStep.visitors > 0 
        ? ((currentStep.visitors - nextStep.visitors) / currentStep.visitors) * 100 
        : 0

      if (dropOffRate > 20) { // Significant drop-off threshold
        const severity = dropOffRate > 60 ? 'critical' 
          : dropOffRate > 40 ? 'high' 
          : dropOffRate > 30 ? 'medium' 
          : 'low'

        dropOffPoints.push({
          step: i,
          dropOffRate,
          affectedVisitors: currentStep.visitors - nextStep.visitors,
          potentialRevenue: (currentStep.visitors - nextStep.visitors) * 50, // Estimate
          severity,
        })
      }
    }

    return dropOffPoints
  }

  private static generateHeatmapData(events: any[]): HeatmapPoint[] {
    const clickEvents = events.filter(e => e.eventType === 'click')
    const heatmapData: Map<string, HeatmapPoint> = new Map()

    clickEvents.forEach(event => {
      const properties = event.properties as any
      if (properties?.x && properties?.y) {
        const key = `${Math.floor(properties.x / 10)}_${Math.floor(properties.y / 10)}`
        const existing = heatmapData.get(key)

        if (existing) {
          existing.clicks += 1
          existing.intensity += 1
        } else {
          heatmapData.set(key, {
            x: Math.floor(properties.x / 10) * 10,
            y: Math.floor(properties.y / 10) * 10,
            intensity: 1,
            clicks: 1,
          })
        }
      }
    })

    return Array.from(heatmapData.values())
  }

  private static analyzeScrollDepth(events: any[]): ScrollDepthData {
    const scrollEvents = events.filter(e => e.eventType === 'scroll')
    
    if (scrollEvents.length === 0) {
      return {
        quartiles: [0, 0, 0, 0],
        avgScrollDepth: 0,
        bounceRate: 100,
      }
    }

    const scrollDepths = scrollEvents.map(e => (e.properties as any)?.scrollDepth || 0)
    const avgScrollDepth = scrollDepths.reduce((sum, depth) => sum + depth, 0) / scrollDepths.length

    // Calculate quartiles
    const sorted = scrollDepths.sort((a, b) => a - b)
    const quartiles = [
      sorted[Math.floor(sorted.length * 0.25)],
      sorted[Math.floor(sorted.length * 0.5)],
      sorted[Math.floor(sorted.length * 0.75)],
      sorted[sorted.length - 1],
    ]

    const bounceRate = (scrollEvents.filter(e => (e.properties as any)?.scrollDepth < 25).length / scrollEvents.length) * 100

    return {
      quartiles,
      avgScrollDepth,
      bounceRate,
    }
  }

  private static analyzeClickTracking(events: any[]): ClickTrackingData[] {
    const clickEvents = events.filter(e => e.eventType === 'click')
    const clickMap: Map<string, ClickTrackingData> = new Map()

    clickEvents.forEach(event => {
      const selector = event.elementSelector || 'unknown'
      const existing = clickMap.get(selector)

      if (existing) {
        existing.clicks += 1
        // Track unique clicks by session
      } else {
        clickMap.set(selector, {
          selector,
          clicks: 1,
          uniqueClicks: 1,
          conversionRate: 0, // Calculate separately
        })
      }
    })

    return Array.from(clickMap.values())
  }

  private static analyzeFormBehavior(events: any[]): FormAnalyticsData {
    const formEvents = events.filter(e => e.eventType.startsWith('form_'))
    
    // Placeholder implementation
    return {
      formId: 'main_form',
      fields: [],
      abandonment: {
        totalStarts: 0,
        totalAbandoned: 0,
        abandonmentRate: 0,
        topExitFields: [],
      },
      completion: {
        completionRate: 0,
        avgCompletionTime: 0,
        conversionRate: 0,
      },
    }
  }

  private static analyzeDevicePerformance(events: any[]): DeviceAnalyticsData {
    const deviceGroups = {
      mobile: events.filter(e => e.device === 'mobile'),
      desktop: events.filter(e => e.device === 'desktop'),
      tablet: events.filter(e => e.device === 'tablet'),
    }

    const getDeviceMetrics = (deviceEvents: any[]): DeviceMetrics => {
      const uniqueVisitors = new Set(deviceEvents.map(e => e.sessionId)).size
      const conversionEvents = deviceEvents.filter(e => e.eventType === 'conversion')
      
      return {
        visitors: uniqueVisitors,
        conversionRate: uniqueVisitors > 0 ? (conversionEvents.length / uniqueVisitors) * 100 : 0,
        bounceRate: 0, // Calculate based on session duration
        avgSessionDuration: 0, // Calculate from session events
      }
    }

    return {
      mobile: getDeviceMetrics(deviceGroups.mobile),
      desktop: getDeviceMetrics(deviceGroups.desktop),
      tablet: getDeviceMetrics(deviceGroups.tablet),
    }
  }

  private static async detectFormBottlenecks(projectId: string): Promise<any[]> {
    // Analyze form abandonment patterns
    const formEvents = await prisma.conversionEvent.findMany({
      where: {
        projectId,
        eventType: {
          startsWith: 'form_',
        },
      },
    })

    const bottlenecks = []
    // Implementation for form bottleneck detection
    return bottlenecks
  }

  private static async detectPerformanceBottlenecks(projectId: string): Promise<any[]> {
    // Analyze page load times and performance metrics
    const bottlenecks = []
    // Implementation for performance bottleneck detection
    return bottlenecks
  }

  private static async detectMobileBottlenecks(projectId: string): Promise<any[]> {
    // Analyze mobile-specific issues
    const bottlenecks = []
    // Implementation for mobile bottleneck detection
    return bottlenecks
  }

  private static async detectCheckoutBottlenecks(projectId: string): Promise<any[]> {
    // Analyze checkout process issues
    const bottlenecks = []
    // Implementation for checkout bottleneck detection
    return bottlenecks
  }

  private static async analyzeConversionTrends(projectId: string): Promise<any[]> {
    // Analyze conversion rate trends over time
    const insights = []
    // Implementation for conversion trend analysis
    return insights
  }

  private static async analyzeTrafficSources(projectId: string): Promise<any[]> {
    // Analyze performance by traffic source
    const insights = []
    // Implementation for traffic source analysis
    return insights
  }

  private static async analyzeDeviceInsights(projectId: string): Promise<any[]> {
    // Generate device-specific insights
    const insights = []
    // Implementation for device insights
    return insights
  }

  private static async analyzeTimePatterns(projectId: string): Promise<any[]> {
    // Analyze time-based conversion patterns
    const insights = []
    // Implementation for time pattern analysis
    return insights
  }
}

export default AnalyticsEngine