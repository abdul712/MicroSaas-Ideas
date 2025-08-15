import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import type { HeatmapData, HeatmapPoint, ScrollHeatmapData } from '@/types/tracking'
import { calculateHeatmapIntensity, getHeatmapColor } from '@/lib/utils'

export class HeatmapProcessor {
  
  async generateClickHeatmap(
    websiteId: string, 
    url: string, 
    dateRange?: { from: Date; to: Date }
  ): Promise<HeatmapData> {
    try {
      // Try to get cached data first
      const cacheKey = `heatmap:processed:clicks:${websiteId}:${this.normalizeUrl(url)}:${this.getCacheKeySuffix(dateRange)}`
      const cached = await redis.get(cacheKey)
      
      if (cached) {
        return JSON.parse(cached)
      }

      // Get click events from database
      const whereClause: any = {
        pageView: {
          websiteId,
          url: {
            contains: this.normalizeUrl(url)
          }
        }
      }

      if (dateRange) {
        whereClause.timestamp = {
          gte: dateRange.from,
          lte: dateRange.to,
        }
      }

      const clickEvents = await prisma.clickEvent.findMany({
        where: whereClause,
        select: {
          x: true,
          y: true,
          pageView: {
            select: {
              viewportWidth: true,
              viewportHeight: true,
              documentWidth: true,
              documentHeight: true,
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 10000, // Limit for performance
      })

      // Process clicks into heatmap points
      const clickMap = new Map<string, { count: number; x: number; y: number }>()
      let maxCount = 0
      let totalClicks = 0
      let avgViewport = { width: 0, height: 0 }
      let avgDocument = { width: 0, height: 0 }

      for (const event of clickEvents) {
        // Grid snap to reduce noise (5px grid)
        const gridX = Math.floor(event.x / 5) * 5
        const gridY = Math.floor(event.y / 5) * 5
        const key = `${gridX},${gridY}`

        if (clickMap.has(key)) {
          const existing = clickMap.get(key)!
          existing.count += 1
          maxCount = Math.max(maxCount, existing.count)
        } else {
          clickMap.set(key, { count: 1, x: gridX, y: gridY })
          maxCount = Math.max(maxCount, 1)
        }

        totalClicks += 1

        // Calculate average viewport/document sizes
        avgViewport.width += event.pageView.viewportWidth
        avgViewport.height += event.pageView.viewportHeight
        if (event.pageView.documentWidth) {
          avgDocument.width += event.pageView.documentWidth
        }
        if (event.pageView.documentHeight) {
          avgDocument.height += event.pageView.documentHeight
        }
      }

      if (clickEvents.length > 0) {
        avgViewport.width = Math.round(avgViewport.width / clickEvents.length)
        avgViewport.height = Math.round(avgViewport.height / clickEvents.length)
        avgDocument.width = Math.round(avgDocument.width / clickEvents.length)
        avgDocument.height = Math.round(avgDocument.height / clickEvents.length)
      }

      // Convert to heatmap points
      const points: HeatmapPoint[] = Array.from(clickMap.values()).map(point => ({
        x: point.x,
        y: point.y,
        count: point.count,
        intensity: calculateHeatmapIntensity(point.count, maxCount),
      }))

      const heatmapData: HeatmapData = {
        points,
        maxIntensity: maxCount,
        totalClicks,
        viewport: avgViewport,
        document: avgDocument,
        dateRange: dateRange || {
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          to: new Date()
        }
      }

      // Cache the result for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(heatmapData))

      return heatmapData

    } catch (error) {
      console.error('Error generating click heatmap:', error)
      throw error
    }
  }

  async generateMovementHeatmap(
    websiteId: string, 
    url: string, 
    dateRange?: { from: Date; to: Date }
  ): Promise<HeatmapData> {
    try {
      const cacheKey = `heatmap:processed:moves:${websiteId}:${this.normalizeUrl(url)}:${this.getCacheKeySuffix(dateRange)}`
      const cached = await redis.get(cacheKey)
      
      if (cached) {
        return JSON.parse(cached)
      }

      const whereClause: any = {
        pageView: {
          websiteId,
          url: {
            contains: this.normalizeUrl(url)
          }
        }
      }

      if (dateRange) {
        whereClause.timestamp = {
          gte: dateRange.from,
          lte: dateRange.to,
        }
      }

      // Sample mouse move events (they can be very numerous)
      const mouseMoveEvents = await prisma.mouseMoveEvent.findMany({
        where: whereClause,
        select: {
          x: true,
          y: true,
          pageView: {
            select: {
              viewportWidth: true,
              viewportHeight: true,
              documentWidth: true,
              documentHeight: true,
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 5000, // Limit to most recent for performance
      })

      // Process into heatmap with larger grid (20px) for movement
      const moveMap = new Map<string, { count: number; x: number; y: number }>()
      let maxCount = 0
      let totalMoves = 0
      let avgViewport = { width: 0, height: 0 }
      let avgDocument = { width: 0, height: 0 }

      for (const event of mouseMoveEvents) {
        const gridX = Math.floor(event.x / 20) * 20
        const gridY = Math.floor(event.y / 20) * 20
        const key = `${gridX},${gridY}`

        if (moveMap.has(key)) {
          const existing = moveMap.get(key)!
          existing.count += 1
          maxCount = Math.max(maxCount, existing.count)
        } else {
          moveMap.set(key, { count: 1, x: gridX, y: gridY })
          maxCount = Math.max(maxCount, 1)
        }

        totalMoves += 1

        avgViewport.width += event.pageView.viewportWidth
        avgViewport.height += event.pageView.viewportHeight
        if (event.pageView.documentWidth) {
          avgDocument.width += event.pageView.documentWidth
        }
        if (event.pageView.documentHeight) {
          avgDocument.height += event.pageView.documentHeight
        }
      }

      if (mouseMoveEvents.length > 0) {
        avgViewport.width = Math.round(avgViewport.width / mouseMoveEvents.length)
        avgViewport.height = Math.round(avgViewport.height / mouseMoveEvents.length)
        avgDocument.width = Math.round(avgDocument.width / mouseMoveEvents.length)
        avgDocument.height = Math.round(avgDocument.height / mouseMoveEvents.length)
      }

      const points: HeatmapPoint[] = Array.from(moveMap.values()).map(point => ({
        x: point.x,
        y: point.y,
        count: point.count,
        intensity: calculateHeatmapIntensity(point.count, maxCount),
      }))

      const heatmapData: HeatmapData = {
        points,
        maxIntensity: maxCount,
        totalClicks: totalMoves,
        viewport: avgViewport,
        document: avgDocument,
        dateRange: dateRange || {
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          to: new Date()
        }
      }

      await redis.setex(cacheKey, 3600, JSON.stringify(heatmapData))
      return heatmapData

    } catch (error) {
      console.error('Error generating movement heatmap:', error)
      throw error
    }
  }

  async generateScrollHeatmap(
    websiteId: string, 
    url: string, 
    dateRange?: { from: Date; to: Date }
  ): Promise<ScrollHeatmapData> {
    try {
      const cacheKey = `heatmap:processed:scroll:${websiteId}:${this.normalizeUrl(url)}:${this.getCacheKeySuffix(dateRange)}`
      const cached = await redis.get(cacheKey)
      
      if (cached) {
        return JSON.parse(cached)
      }

      const whereClause: any = {
        pageView: {
          websiteId,
          url: {
            contains: this.normalizeUrl(url)
          }
        }
      }

      if (dateRange) {
        whereClause.timestamp = {
          gte: dateRange.from,
          lte: dateRange.to,
        }
      }

      // Get max scroll depth per session
      const scrollData = await prisma.scrollEvent.findMany({
        where: whereClause,
        select: {
          scrollDepth: true,
          pageView: {
            select: {
              sessionId: true,
              documentHeight: true,
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
      })

      // Get max scroll depth per session to avoid counting multiple scroll events from same session
      const sessionMaxScrolls = new Map<string, number>()
      let totalDocumentHeight = 0
      let documentHeightCount = 0

      for (const event of scrollData) {
        const sessionId = event.pageView.sessionId
        const currentMax = sessionMaxScrolls.get(sessionId) || 0
        sessionMaxScrolls.set(sessionId, Math.max(currentMax, event.scrollDepth))

        if (event.pageView.documentHeight) {
          totalDocumentHeight += event.pageView.documentHeight
          documentHeightCount += 1
        }
      }

      const avgDocumentHeight = documentHeightCount > 0 ? 
        Math.round(totalDocumentHeight / documentHeightCount) : 0

      // Create segments for scroll depth (10% buckets)
      const segments: Array<{ depth: number; percentage: number; count: number }> = []
      const depthCounts = new Array(11).fill(0) // 0%, 10%, 20%, ..., 100%

      let totalSessions = 0
      let totalScrollDepth = 0
      let maxScrollDepth = 0

      for (const scrollDepth of sessionMaxScrolls.values()) {
        const bucket = Math.min(Math.floor(scrollDepth / 10), 10)
        depthCounts[bucket] += 1
        totalSessions += 1
        totalScrollDepth += scrollDepth
        maxScrollDepth = Math.max(maxScrollDepth, scrollDepth)
      }

      // Convert counts to percentages and create segments
      for (let i = 0; i < depthCounts.length; i++) {
        const percentage = totalSessions > 0 ? (depthCounts[i] / totalSessions) * 100 : 0
        segments.push({
          depth: i * 10,
          percentage: Math.round(percentage * 100) / 100,
          count: depthCounts[i],
        })
      }

      const scrollHeatmapData: ScrollHeatmapData = {
        segments,
        averageScrollDepth: totalSessions > 0 ? Math.round(totalScrollDepth / totalSessions) : 0,
        maxScrollDepth,
        totalViews: totalSessions,
        documentHeight: avgDocumentHeight,
      }

      await redis.setex(cacheKey, 3600, JSON.stringify(scrollHeatmapData))
      return scrollHeatmapData

    } catch (error) {
      console.error('Error generating scroll heatmap:', error)
      throw error
    }
  }

  async generateHeatmapImage(
    heatmapData: HeatmapData,
    width: number = 1200,
    height: number = 800
  ): Promise<Buffer> {
    try {
      // This would typically use a canvas library like node-canvas
      // For now, return a placeholder
      
      const { createCanvas } = await import('canvas')
      const canvas = createCanvas(width, height)
      const ctx = canvas.getContext('2d')

      // Fill background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fillRect(0, 0, width, height)

      // Draw heatmap points
      for (const point of heatmapData.points) {
        const scaledX = (point.x / heatmapData.document.width) * width
        const scaledY = (point.y / heatmapData.document.height) * height
        const radius = Math.max(5, point.intensity * 30)

        // Create radial gradient
        const gradient = ctx.createRadialGradient(scaledX, scaledY, 0, scaledX, scaledY, radius)
        gradient.addColorStop(0, `rgba(255, 0, 0, ${point.intensity * 0.8})`)
        gradient.addColorStop(0.5, `rgba(255, 255, 0, ${point.intensity * 0.4})`)
        gradient.addColorStop(1, `rgba(0, 0, 255, ${point.intensity * 0.1})`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(scaledX, scaledY, radius, 0, 2 * Math.PI)
        ctx.fill()
      }

      return canvas.toBuffer('image/png')

    } catch (error) {
      console.error('Error generating heatmap image:', error)
      throw error
    }
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname + urlObj.search
    } catch {
      return url
    }
  }

  private getCacheKeySuffix(dateRange?: { from: Date; to: Date }): string {
    if (!dateRange) {
      return 'default'
    }
    return `${dateRange.from.toISOString()}-${dateRange.to.toISOString()}`
  }

  async invalidateCache(websiteId: string, url?: string) {
    const pattern = url ? 
      `heatmap:processed:*:${websiteId}:${this.normalizeUrl(url)}:*` :
      `heatmap:processed:*:${websiteId}:*`
    
    // This would need to be implemented based on your Redis setup
    // For now, we'll use a simple approach
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}