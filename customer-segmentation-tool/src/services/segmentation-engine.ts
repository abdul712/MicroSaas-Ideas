import { prisma } from '@/lib/prisma'
import { cacheUtils, CACHE_KEYS } from '@/lib/redis'
import { Customer, Segment, SegmentType } from '@prisma/client'
import { RFMScores, ClusteringResult, SegmentCriteria, MLModelConfig } from '@/types'

export class SegmentationEngine {
  /**
   * RFM Analysis - Recency, Frequency, Monetary segmentation
   */
  async performRFMAnalysis(organizationId: string): Promise<RFMScores[]> {
    const cacheKey = CACHE_KEYS.RFM_SCORES(organizationId)
    
    // Check cache first
    const cached = await cacheUtils.get<RFMScores[]>(cacheKey)
    if (cached) return cached

    // Calculate RFM scores from database
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      include: {
        events: {
          where: { eventType: 'purchase' },
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    const rfmScores = customers.map(customer => {
      const purchaseEvents = customer.events.filter(e => e.eventType === 'purchase')
      
      // Calculate Recency (days since last purchase)
      const lastPurchase = purchaseEvents[0]?.timestamp
      const recencyDays = lastPurchase 
        ? Math.floor((Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
        : 999

      // Calculate Frequency (number of purchases)
      const frequency = purchaseEvents.length

      // Calculate Monetary (total spent)
      const monetary = purchaseEvents.reduce((sum, event) => 
        sum + (event.value || 0), 0)

      return {
        customerId: customer.id,
        recency: recencyDays,
        frequency,
        monetary
      }
    })

    // Calculate quintiles for scoring
    const recencyQuintiles = this.calculateQuintiles(rfmScores.map(r => r.recency).sort((a, b) => a - b))
    const frequencyQuintiles = this.calculateQuintiles(rfmScores.map(r => r.frequency).sort((a, b) => b - a))
    const monetaryQuintiles = this.calculateQuintiles(rfmScores.map(r => r.monetary).sort((a, b) => b - a))

    const scoredRFM: RFMScores[] = rfmScores.map(rfm => {
      const rScore = this.getQuintileScore(rfm.recency, recencyQuintiles, true) // Lower recency is better
      const fScore = this.getQuintileScore(rfm.frequency, frequencyQuintiles, false)
      const mScore = this.getQuintileScore(rfm.monetary, monetaryQuintiles, false)

      const segment = this.getRFMSegment(rScore, fScore, mScore)

      return {
        customerId: rfm.customerId,
        recency: rScore,
        frequency: fScore,
        monetary: mScore,
        segment
      }
    })

    // Update customer records with RFM scores
    await Promise.all(scoredRFM.map(async (rfm) => {
      await prisma.customer.update({
        where: { id: rfm.customerId },
        data: {
          recencyScore: rfm.recency,
          frequencyScore: rfm.frequency,
          monetaryScore: rfm.monetary,
          rfmSegment: rfm.segment
        }
      })
    }))

    // Cache results for 1 hour
    await cacheUtils.set(cacheKey, scoredRFM, 3600)

    return scoredRFM
  }

  /**
   * K-Means Clustering for behavioral segmentation
   */
  async performKMeansClustering(
    organizationId: string, 
    config: MLModelConfig
  ): Promise<ClusteringResult[]> {
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      include: {
        events: true
      }
    })

    // Extract features for clustering
    const features = customers.map(customer => {
      const purchaseEvents = customer.events.filter(e => e.eventType === 'purchase')
      const viewEvents = customer.events.filter(e => e.eventType === 'page_view')
      
      return {
        customerId: customer.id,
        features: {
          totalSpent: customer.totalSpent,
          orderCount: customer.orderCount,
          avgOrderValue: customer.avgOrderValue,
          daysSinceLastOrder: customer.lastOrderAt ? 
            Math.floor((Date.now() - customer.lastOrderAt.getTime()) / (1000 * 60 * 60 * 24)) : 999,
          pageViews: viewEvents.length,
          sessionCount: this.calculateSessions(viewEvents),
          recency: customer.recencyScore || 0,
          frequency: customer.frequencyScore || 0,
          monetary: customer.monetaryScore || 0
        }
      }
    })

    // Normalize features
    const normalizedFeatures = this.normalizeFeatures(features)
    
    // Perform K-means clustering (simplified implementation)
    const k = config.parameters.k || 5
    const clusters = await this.kMeansAlgorithm(normalizedFeatures, k)

    // Update customer segments
    await Promise.all(clusters.map(async (result) => {
      await prisma.customer.update({
        where: { id: result.customerId },
        data: {
          // Store cluster info in attributes
          attributes: {
            ...((await prisma.customer.findUnique({ 
              where: { id: result.customerId },
              select: { attributes: true }
            }))?.attributes as object || {}),
            mlClusterId: result.clusterId,
            clusterConfidence: result.confidence
          }
        }
      })
    }))

    return clusters
  }

  /**
   * Behavioral segmentation based on customer actions
   */
  async performBehavioralSegmentation(organizationId: string): Promise<void> {
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      include: {
        events: {
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    for (const customer of customers) {
      const segments = this.identifyBehavioralSegments(customer.events)
      
      // Create segment memberships
      for (const segmentName of segments) {
        let segment = await prisma.segment.findFirst({
          where: {
            organizationId,
            name: segmentName,
            type: SegmentType.BEHAVIORAL
          }
        })

        if (!segment) {
          segment = await prisma.segment.create({
            data: {
              organizationId,
              name: segmentName,
              type: SegmentType.BEHAVIORAL,
              description: `Automatically generated behavioral segment: ${segmentName}`,
              rules: { behavioral: true, pattern: segmentName }
            }
          })
        }

        // Create membership if not exists
        await prisma.segmentMembership.upsert({
          where: {
            customerId_segmentId: {
              customerId: customer.id,
              segmentId: segment.id
            }
          },
          create: {
            customerId: customer.id,
            segmentId: segment.id,
            confidenceScore: 0.85
          },
          update: {
            confidenceScore: 0.85
          }
        })
      }
    }
  }

  /**
   * Create segments based on rules/criteria
   */
  async createRuleBasedSegment(
    organizationId: string,
    name: string,
    description: string,
    criteria: SegmentCriteria
  ): Promise<Segment> {
    // Create the segment
    const segment = await prisma.segment.create({
      data: {
        organizationId,
        name,
        description,
        type: SegmentType.MANUAL,
        rules: criteria
      }
    })

    // Apply the segment rules and add customers
    await this.updateSegmentMembership(segment.id)

    return segment
  }

  /**
   * Update segment membership based on rules
   */
  async updateSegmentMembership(segmentId: string): Promise<void> {
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
      include: { organization: true }
    })

    if (!segment) return

    // Clear existing memberships
    await prisma.segmentMembership.deleteMany({
      where: { segmentId }
    })

    const criteria = segment.rules as SegmentCriteria
    const customers = await this.findCustomersByCriteria(segment.organizationId, criteria)

    // Create new memberships
    await Promise.all(customers.map(async (customerId) => {
      await prisma.segmentMembership.create({
        data: {
          customerId,
          segmentId: segment.id,
          confidenceScore: 1.0
        }
      })
    }))

    // Update segment stats
    await prisma.segment.update({
      where: { id: segmentId },
      data: {
        customerCount: customers.length,
        lastUpdatedAt: new Date()
      }
    })

    // Invalidate cache
    await cacheUtils.del(CACHE_KEYS.SEGMENT_CUSTOMERS(segmentId))
  }

  /**
   * Predict customer churn probability
   */
  async predictChurnProbability(organizationId: string): Promise<void> {
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      include: {
        events: {
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    for (const customer of customers) {
      const churnProbability = this.calculateChurnProbability(customer)
      
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          churnProbability
        }
      })

      // Store prediction record
      await prisma.prediction.create({
        data: {
          organizationId,
          customerId: customer.id,
          predictionType: 'CHURN_PROBABILITY',
          value: churnProbability,
          confidence: 0.8,
          modelVersion: '1.0'
        }
      })
    }
  }

  /**
   * Calculate Customer Lifetime Value prediction
   */
  async predictCustomerLifetimeValue(organizationId: string): Promise<void> {
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      include: {
        events: {
          where: { eventType: 'purchase' },
          orderBy: { timestamp: 'asc' }
        }
      }
    })

    for (const customer of customers) {
      const clvPrediction = this.calculateCLV(customer)
      
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          lifetimeValuePrediction: clvPrediction
        }
      })

      // Store prediction record
      await prisma.prediction.create({
        data: {
          organizationId,
          customerId: customer.id,
          predictionType: 'LIFETIME_VALUE',
          value: clvPrediction,
          confidence: 0.75,
          modelVersion: '1.0'
        }
      })
    }
  }

  // Private helper methods

  private calculateQuintiles(values: number[]): number[] {
    const quintileSize = Math.floor(values.length / 5)
    return [
      values[quintileSize - 1] || 0,
      values[quintileSize * 2 - 1] || 0,
      values[quintileSize * 3 - 1] || 0,
      values[quintileSize * 4 - 1] || 0,
      values[values.length - 1] || 0
    ]
  }

  private getQuintileScore(value: number, quintiles: number[], lowerIsBetter: boolean = false): number {
    for (let i = 0; i < quintiles.length; i++) {
      if (value <= quintiles[i]) {
        return lowerIsBetter ? 5 - i : i + 1
      }
    }
    return lowerIsBetter ? 1 : 5
  }

  private getRFMSegment(r: number, f: number, m: number): string {
    const score = `${r}${f}${m}`
    
    // Champions
    if (r >= 4 && f >= 4 && m >= 4) return 'Champions'
    
    // Loyal Customers
    if (r >= 3 && f >= 4 && m >= 3) return 'Loyal Customers'
    
    // Potential Loyalists
    if (r >= 4 && f >= 2 && m >= 2) return 'Potential Loyalists'
    
    // New Customers
    if (r >= 4 && f === 1) return 'New Customers'
    
    // Promising
    if (r >= 3 && f === 1 && m >= 2) return 'Promising'
    
    // Need Attention
    if (r >= 3 && f >= 2 && m >= 2) return 'Need Attention'
    
    // About to Sleep
    if (r === 2 && f >= 2 && m >= 2) return 'About to Sleep'
    
    // At Risk
    if (r <= 2 && f >= 3 && m >= 3) return 'At Risk'
    
    // Cannot Lose Them
    if (r <= 2 && f >= 4 && m >= 4) return 'Cannot Lose Them'
    
    // Hibernating
    if (r <= 2 && f <= 2 && m >= 3) return 'Hibernating'
    
    // Lost
    return 'Lost'
  }

  private normalizeFeatures(features: any[]): any[] {
    const featureKeys = Object.keys(features[0].features)
    const normalized = [...features]

    featureKeys.forEach(key => {
      const values = features.map(f => f.features[key])
      const min = Math.min(...values)
      const max = Math.max(...values)
      const range = max - min || 1

      normalized.forEach(f => {
        f.features[key] = (f.features[key] - min) / range
      })
    })

    return normalized
  }

  private async kMeansAlgorithm(features: any[], k: number): Promise<ClusteringResult[]> {
    // Simplified K-means implementation
    // In production, you would use a proper ML library like scikit-learn via API
    
    const centroids = this.initializeCentroids(features, k)
    let iterations = 0
    const maxIterations = 100

    while (iterations < maxIterations) {
      const clusters = this.assignToClusters(features, centroids)
      const newCentroids = this.updateCentroids(clusters, k)
      
      if (this.centroidsConverged(centroids, newCentroids)) break
      
      centroids.splice(0, centroids.length, ...newCentroids)
      iterations++
    }

    // Assign final clusters and calculate confidence
    return this.assignToClusters(features, centroids).map(assignment => ({
      customerId: assignment.customerId,
      clusterId: assignment.clusterId,
      confidence: assignment.confidence,
      features: assignment.features
    }))
  }

  private initializeCentroids(features: any[], k: number): number[][] {
    const centroids = []
    const featureKeys = Object.keys(features[0].features)
    
    for (let i = 0; i < k; i++) {
      const centroid = featureKeys.map(() => Math.random())
      centroids.push(centroid)
    }
    
    return centroids
  }

  private assignToClusters(features: any[], centroids: number[][]): any[] {
    return features.map(f => {
      const featureValues = Object.values(f.features) as number[]
      let minDistance = Infinity
      let clusterId = 0
      
      centroids.forEach((centroid, i) => {
        const distance = this.euclideanDistance(featureValues, centroid)
        if (distance < minDistance) {
          minDistance = distance
          clusterId = i
        }
      })

      return {
        customerId: f.customerId,
        clusterId,
        confidence: Math.max(0, 1 - minDistance),
        features: f.features
      }
    })
  }

  private updateCentroids(assignments: any[], k: number): number[][] {
    const newCentroids = []
    const featureCount = Object.keys(assignments[0].features).length

    for (let i = 0; i < k; i++) {
      const clusterPoints = assignments.filter(a => a.clusterId === i)
      if (clusterPoints.length === 0) {
        // If no points assigned to this cluster, keep random centroid
        newCentroids.push(Array(featureCount).fill(0).map(() => Math.random()))
        continue
      }

      const centroid = Array(featureCount).fill(0)
      clusterPoints.forEach(point => {
        Object.values(point.features).forEach((value, idx) => {
          centroid[idx] += value as number
        })
      })

      newCentroids.push(centroid.map(sum => sum / clusterPoints.length))
    }

    return newCentroids
  }

  private euclideanDistance(point1: number[], point2: number[]): number {
    return Math.sqrt(
      point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0)
    )
  }

  private centroidsConverged(old: number[][], new_: number[][], threshold = 0.001): boolean {
    return old.every((oldCentroid, i) =>
      oldCentroid.every((val, j) => Math.abs(val - new_[i][j]) < threshold)
    )
  }

  private identifyBehavioralSegments(events: any[]): string[] {
    const segments: string[] = []
    
    const purchaseEvents = events.filter(e => e.eventType === 'purchase')
    const viewEvents = events.filter(e => e.eventType === 'page_view')
    const emailEvents = events.filter(e => e.eventType === 'email_open')

    // High Value Customers
    if (purchaseEvents.length >= 5) {
      segments.push('High Value Customers')
    }

    // Browser Abandoners
    if (viewEvents.length >= 10 && purchaseEvents.length === 0) {
      segments.push('Browser Abandoners')
    }

    // Email Engaged
    if (emailEvents.length >= 3) {
      segments.push('Email Engaged')
    }

    // Repeat Buyers
    if (purchaseEvents.length >= 2) {
      segments.push('Repeat Buyers')
    }

    return segments
  }

  private calculateSessions(events: any[]): number {
    if (events.length === 0) return 0

    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    let sessions = 1
    let lastEventTime = events[0].timestamp.getTime()

    for (let i = 1; i < events.length; i++) {
      const timeDiff = events[i].timestamp.getTime() - lastEventTime
      // If more than 30 minutes between events, consider it a new session
      if (timeDiff > 30 * 60 * 1000) {
        sessions++
      }
      lastEventTime = events[i].timestamp.getTime()
    }

    return sessions
  }

  private async findCustomersByCriteria(organizationId: string, criteria: SegmentCriteria): Promise<string[]> {
    // Build where clause based on criteria rules
    let whereClause: any = { organizationId }
    
    criteria.rules.forEach(rule => {
      switch (rule.operator) {
        case 'equals':
          whereClause[rule.field] = rule.value
          break
        case 'greater_than':
          whereClause[rule.field] = { gt: rule.value }
          break
        case 'less_than':
          whereClause[rule.field] = { lt: rule.value }
          break
        case 'contains':
          whereClause[rule.field] = { contains: rule.value }
          break
        case 'in':
          whereClause[rule.field] = { in: rule.value }
          break
        case 'between':
          whereClause[rule.field] = { 
            gte: rule.value.min, 
            lte: rule.value.max 
          }
          break
      }
    })

    const customers = await prisma.customer.findMany({
      where: whereClause,
      select: { id: true }
    })

    return customers.map(c => c.id)
  }

  private calculateChurnProbability(customer: any): number {
    const daysSinceLastOrder = customer.lastOrderAt ? 
      Math.floor((Date.now() - customer.lastOrderAt.getTime()) / (1000 * 60 * 60 * 24)) : 999
    
    // Simple churn prediction model
    let churnScore = 0
    
    // Recency factor
    if (daysSinceLastOrder > 90) churnScore += 0.4
    else if (daysSinceLastOrder > 60) churnScore += 0.2
    else if (daysSinceLastOrder > 30) churnScore += 0.1
    
    // Frequency factor
    if (customer.orderCount === 1) churnScore += 0.3
    else if (customer.orderCount < 3) churnScore += 0.2
    
    // Value factor
    if (customer.totalSpent < 50) churnScore += 0.2
    else if (customer.totalSpent > 500) churnScore -= 0.1
    
    // Recent engagement
    const recentEvents = customer.events.filter((e: any) => {
      const daysSince = Math.floor((Date.now() - e.timestamp.getTime()) / (1000 * 60 * 60 * 24))
      return daysSince <= 30
    })
    
    if (recentEvents.length === 0) churnScore += 0.2
    
    return Math.min(Math.max(churnScore, 0), 1)
  }

  private calculateCLV(customer: any): number {
    if (customer.orderCount === 0) return 0
    
    const avgOrderValue = customer.totalSpent / customer.orderCount
    const purchaseFrequency = customer.orderCount / Math.max(1, this.getCustomerLifespanMonths(customer))
    
    // Simple CLV calculation: AOV × Purchase Frequency × Customer Lifespan
    const projectedLifespanMonths = Math.max(12, this.getCustomerLifespanMonths(customer) * 2)
    
    return avgOrderValue * purchaseFrequency * projectedLifespanMonths
  }

  private getCustomerLifespanMonths(customer: any): number {
    if (!customer.firstOrderAt || !customer.lastOrderAt) return 1
    
    const lifespanMs = customer.lastOrderAt.getTime() - customer.firstOrderAt.getTime()
    return Math.max(1, lifespanMs / (1000 * 60 * 60 * 24 * 30))
  }
}