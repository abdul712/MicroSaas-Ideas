import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { HeatmapProcessor } from './heatmap-processor'
import type { TrackingEvent, ProcessingContext } from '@/types/tracking'

export class TrackingService {
  private heatmapProcessor: HeatmapProcessor

  constructor() {
    this.heatmapProcessor = new HeatmapProcessor()
  }

  async processEvents(
    trackingId: string, 
    events: TrackingEvent[], 
    context: ProcessingContext
  ) {
    try {
      // Verify tracking ID exists and is active
      const website = await this.getWebsiteByTrackingId(trackingId)
      if (!website) {
        throw new Error('Invalid tracking ID')
      }

      // Process events by type
      const clickEvents = events.filter(e => e.type === 'click')
      const mouseMoveEvents = events.filter(e => e.type === 'mouse_move')
      const scrollEvents = events.filter(e => e.type === 'scroll')
      const pageViewEvents = events.filter(e => e.type === 'page_view')
      const customEvents = events.filter(e => e.type === 'custom')

      // Store page views first
      for (const event of pageViewEvents) {
        await this.processPageView(website.id, event, context)
      }

      // Batch process interaction events
      if (clickEvents.length > 0) {
        await this.processClickEvents(website.id, clickEvents, context)
      }

      if (mouseMoveEvents.length > 0) {
        await this.processMouseMoveEvents(website.id, mouseMoveEvents, context)
      }

      if (scrollEvents.length > 0) {
        await this.processScrollEvents(website.id, scrollEvents, context)
      }

      if (customEvents.length > 0) {
        await this.processCustomEvents(website.id, customEvents, context)
      }

      // Update real-time metrics
      await this.updateRealTimeMetrics(website.id, events)

      // Trigger heatmap regeneration if needed
      if (clickEvents.length > 0 || mouseMoveEvents.length > 0) {
        await this.scheduleHeatmapUpdate(website.id, events[0]?.url || '')
      }

    } catch (error) {
      console.error('Error processing tracking events:', error)
      throw error
    }
  }

  private async getWebsiteByTrackingId(trackingId: string) {
    const website = await prisma.website.findFirst({
      where: {
        trackingId,
        isActive: true,
      },
      include: {
        user: true,
      },
    })

    return website
  }

  private async processPageView(
    websiteId: string, 
    event: TrackingEvent, 
    context: ProcessingContext
  ) {
    const pageView = await prisma.pageView.create({
      data: {
        id: event.page_view_id,
        websiteId,
        sessionId: event.session_id,
        url: event.url,
        title: event.title || '',
        referrer: event.referrer || '',
        viewportWidth: event.viewport_width,
        viewportHeight: event.viewport_height,
        documentWidth: event.document_width,
        documentHeight: event.document_height,
        userAgent: context.userAgent,
        ipAddress: this.hashIP(context.ip),
        language: event.language,
        timezone: event.timezone,
        timestamp: new Date(event.timestamp),
      },
    })

    // Cache page view for quick lookup
    await redis.setex(
      `pageview:${event.page_view_id}`,
      3600, // 1 hour
      JSON.stringify({
        id: pageView.id,
        websiteId,
        url: event.url,
        timestamp: event.timestamp,
      })
    )

    return pageView
  }

  private async processClickEvents(
    websiteId: string, 
    events: TrackingEvent[], 
    context: ProcessingContext
  ) {
    const clickData = events.map(event => ({
      pageViewId: event.page_view_id,
      x: event.x,
      y: event.y,
      clientX: event.client_x,
      clientY: event.client_y,
      elementSelector: event.element_selector,
      elementPath: event.element_path,
      elementTag: event.element_tag,
      elementText: event.element_text?.substring(0, 255),
      elementAttributes: event.element_attributes ? 
        JSON.stringify(event.element_attributes) : null,
      timestamp: new Date(event.timestamp),
    }))

    await prisma.clickEvent.createMany({
      data: clickData,
      skipDuplicates: true,
    })

    // Update click heatmap data in Redis
    for (const event of events) {
      const key = `heatmap:clicks:${websiteId}:${this.normalizeUrl(event.url || '')}`
      await redis.hincrby(key, `${event.x},${event.y}`, 1)
      await redis.expire(key, 86400 * 30) // 30 days
    }
  }

  private async processMouseMoveEvents(
    websiteId: string, 
    events: TrackingEvent[], 
    context: ProcessingContext
  ) {
    // Sample mouse move events to reduce storage
    const sampledEvents = this.sampleEvents(events, 0.1) // Keep 10%

    const mouseMoveData = sampledEvents.map(event => ({
      pageViewId: event.page_view_id,
      x: event.x,
      y: event.y,
      clientX: event.client_x,
      clientY: event.client_y,
      timestamp: new Date(event.timestamp),
    }))

    await prisma.mouseMoveEvent.createMany({
      data: mouseMoveData,
      skipDuplicates: true,
    })

    // Update movement heatmap data in Redis (with lower resolution)
    for (const event of sampledEvents) {
      const gridX = Math.floor(event.x / 20) * 20 // 20px grid
      const gridY = Math.floor(event.y / 20) * 20
      const key = `heatmap:moves:${websiteId}:${this.normalizeUrl(event.url || '')}`
      await redis.hincrby(key, `${gridX},${gridY}`, 1)
      await redis.expire(key, 86400 * 30) // 30 days
    }
  }

  private async processScrollEvents(
    websiteId: string, 
    events: TrackingEvent[], 
    context: ProcessingContext
  ) {
    const scrollData = events.map(event => ({
      pageViewId: event.page_view_id,
      scrollX: event.scroll_x,
      scrollY: event.scroll_y,
      scrollDepth: event.scroll_depth,
      viewportWidth: event.viewport_width,
      viewportHeight: event.viewport_height,
      timestamp: new Date(event.timestamp),
    }))

    await prisma.scrollEvent.createMany({
      data: scrollData,
      skipDuplicates: true,
    })

    // Update scroll depth analytics
    for (const event of events) {
      const key = `analytics:scroll:${websiteId}:${this.normalizeUrl(event.url || '')}`
      const depthBucket = Math.floor(event.scroll_depth / 10) * 10 // 10% buckets
      await redis.hincrby(key, depthBucket.toString(), 1)
      await redis.expire(key, 86400 * 30) // 30 days
    }
  }

  private async processCustomEvents(
    websiteId: string, 
    events: TrackingEvent[], 
    context: ProcessingContext
  ) {
    const customData = events.map(event => ({
      pageViewId: event.page_view_id,
      eventName: event.event_name,
      properties: event.properties ? JSON.stringify(event.properties) : null,
      timestamp: new Date(event.timestamp),
    }))

    await prisma.customEvent.createMany({
      data: customData,
      skipDuplicates: true,
    })
  }

  private async updateRealTimeMetrics(websiteId: string, events: TrackingEvent[]) {
    const activeSessionsKey = `realtime:sessions:${websiteId}`
    const activeViewersKey = `realtime:viewers:${websiteId}`
    const now = Date.now()

    // Track active sessions
    for (const event of events) {
      if (event.session_id) {
        await redis.zadd(activeSessionsKey, now, event.session_id)
        await redis.expire(activeSessionsKey, 3600) // 1 hour
      }

      if (event.page_view_id) {
        await redis.zadd(activeViewersKey, now, event.page_view_id)
        await redis.expire(activeViewersKey, 300) // 5 minutes
      }
    }

    // Clean up old sessions (older than 30 minutes)
    const cutoff = now - (30 * 60 * 1000)
    await redis.zremrangebyscore(activeSessionsKey, 0, cutoff)
    await redis.zremrangebyscore(activeViewersKey, 0, cutoff - (25 * 60 * 1000))

    // Update page view counters
    const pageViews = events.filter(e => e.type === 'page_view')
    for (const pageView of pageViews) {
      const key = `counter:pageviews:${websiteId}:${this.formatDate(new Date())}`
      await redis.incr(key)
      await redis.expire(key, 86400 * 90) // 90 days
    }
  }

  private async scheduleHeatmapUpdate(websiteId: string, url: string) {
    const key = `heatmap:update:${websiteId}:${this.normalizeUrl(url)}`
    await redis.setex(key, 300, Date.now().toString()) // 5 minute delay
  }

  private sampleEvents(events: TrackingEvent[], rate: number): TrackingEvent[] {
    return events.filter(() => Math.random() < rate)
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname + urlObj.search
    } catch {
      return url.substring(0, 255)
    }
  }

  private hashIP(ip: string): string {
    // Simple hash for privacy - in production use crypto.createHash
    let hash = 0
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  // Public methods for retrieving analytics data
  async getClickHeatmapData(websiteId: string, url: string, dateRange?: { from: Date; to: Date }) {
    return this.heatmapProcessor.generateClickHeatmap(websiteId, url, dateRange)
  }

  async getMouseMoveHeatmapData(websiteId: string, url: string, dateRange?: { from: Date; to: Date }) {
    return this.heatmapProcessor.generateMovementHeatmap(websiteId, url, dateRange)
  }

  async getScrollHeatmapData(websiteId: string, url: string, dateRange?: { from: Date; to: Date }) {
    return this.heatmapProcessor.generateScrollHeatmap(websiteId, url, dateRange)
  }

  async getRealTimeMetrics(websiteId: string) {
    const [activeSessions, activeViewers] = await Promise.all([
      redis.zcard(`realtime:sessions:${websiteId}`),
      redis.zcard(`realtime:viewers:${websiteId}`),
    ])

    const today = this.formatDate(new Date())
    const todayViews = await redis.get(`counter:pageviews:${websiteId}:${today}`) || '0'

    return {
      activeSessions: parseInt(activeSessions.toString()),
      activeViewers: parseInt(activeViewers.toString()),
      todayViews: parseInt(todayViews),
      timestamp: new Date(),
    }
  }
}

export const trackingService = new TrackingService()