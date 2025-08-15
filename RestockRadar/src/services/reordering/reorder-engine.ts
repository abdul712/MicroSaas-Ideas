/**
 * Automated Reordering Engine
 * 
 * Implements intelligent algorithms for automated inventory reordering:
 * - Dynamic reorder point calculation
 * - Supplier performance-based selection
 * - Cost optimization algorithms
 * - Lead time optimization
 * - Safety stock optimization
 * - Bulk discount analysis
 */

import { DemandForecaster, type ForecastInput, type ForecastOutput } from '../ai/demand-forecaster'
import { EventEmitter } from 'events'

export interface ReorderRule {
  id: string
  productId: string
  warehouseId: string
  
  // Basic settings
  enabled: boolean
  autoReorder: boolean
  
  // Reorder parameters
  reorderPoint: number
  reorderQuantity: number
  maxStock?: number
  minStock?: number
  
  // Advanced settings
  leadTimeDays: number
  safetyStockDays: number
  reviewPeriodDays: number
  
  // Cost optimization
  targetServiceLevel: number // 0.95 = 95% service level
  carryingCostRate: number   // Annual carrying cost as percentage
  orderingCost: number       // Fixed cost per order
  
  // Supplier preferences
  preferredSupplierId?: string
  allowAlternativeSuppliers: boolean
  
  // Conditions and constraints
  conditions: {
    minOrderValue?: number
    maxOrderValue?: number
    orderMultiples?: number // Must order in multiples of this number
    seasonalAdjustments?: Record<string, number> // Month-based adjustments
    businessRules?: string[] // Custom business logic
  }
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  lastTriggeredAt?: Date
  lastReorderAt?: Date
}

export interface SupplierInfo {
  id: string
  name: string
  contactInfo: {
    email: string
    phone?: string
    address?: string
  }
  
  // Performance metrics
  performance: {
    onTimeDeliveryRate: number  // 0.0 to 1.0
    qualityScore: number        // 0.0 to 1.0
    responseTime: number        // Hours to respond to orders
    fillRate: number           // Percentage of orders filled completely
    defectRate: number         // Percentage of defective items
  }
  
  // Commercial terms
  terms: {
    paymentTerms: string       // "Net 30", "2/10 Net 30", etc.
    currency: string
    minimumOrder?: number
    shippingCost?: number
    freeShippingThreshold?: number
    bulkDiscounts: Array<{
      minQuantity: number
      discountPercentage: number
    }>
  }
  
  // Operational details
  leadTime: {
    min: number    // Minimum lead time in days
    max: number    // Maximum lead time in days
    average: number // Average lead time in days
    variance: number // Lead time variance for safety stock calculation
  }
  
  // Product-specific information
  products: Array<{
    productId: string
    supplierSku: string
    unitCost: number
    moq: number    // Minimum order quantity
    packSize: number // Items per pack
    availability: 'in_stock' | 'made_to_order' | 'discontinued'
    lastUpdated: Date
  }>
  
  status: 'active' | 'inactive' | 'suspended'
  rating: number // Overall supplier rating 1-5
}

export interface ReorderRecommendation {
  id: string
  productId: string
  productTitle: string
  sku: string
  
  // Current situation
  currentStock: number
  reservedStock: number
  availableStock: number
  incomingStock: number
  
  // Reorder details
  recommendedQuantity: number
  reorderPoint: number
  targetStock: number
  urgency: 'low' | 'medium' | 'high' | 'critical'
  
  // Supplier recommendation
  recommendedSupplier: SupplierInfo
  alternativeSuppliers: SupplierInfo[]
  
  // Financial analysis
  costAnalysis: {
    unitCost: number
    totalCost: number
    potentialSavings: number
    bulkDiscountApplied?: number
    shippingCost: number
    totalOrderValue: number
  }
  
  // Forecasting insights
  demandForecast: {
    next7Days: number
    next30Days: number
    next90Days: number
    seasonalityFactor: number
    trendFactor: number
  }
  
  // Risk assessment
  riskFactors: {
    stockoutRisk: number      // 0.0 to 1.0
    oversupplyRisk: number    // 0.0 to 1.0
    supplierRisk: number      // 0.0 to 1.0
    demandVariabilityRisk: number // 0.0 to 1.0
  }
  
  // Timing
  recommendedOrderDate: Date
  expectedDeliveryDate: Date
  daysUntilStockout?: number
  
  // Justification
  reasoning: string[]
  warnings: string[]
  
  // Metadata
  createdAt: Date
  confidence: number // 0.0 to 1.0
  autoApproved: boolean
  status: 'pending' | 'approved' | 'ordered' | 'rejected' | 'expired'
}

export interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplierName: string
  
  // Order details
  items: Array<{
    productId: string
    sku: string
    productTitle: string
    quantity: number
    unitCost: number
    totalCost: number
    expectedDeliveryDate: Date
  }>
  
  // Financial summary
  subtotal: number
  tax?: number
  shipping?: number
  discount?: number
  total: number
  
  // Status and tracking
  status: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled'
  orderDate: Date
  expectedDeliveryDate: Date
  actualDeliveryDate?: Date
  
  // Communication
  sentAt?: Date
  confirmedAt?: Date
  trackingNumber?: string
  notes?: string
  
  // Generated from recommendation
  recommendationId?: string
  autoGenerated: boolean
}

export class ReorderEngine extends EventEmitter {
  private demandForecaster: DemandForecaster
  private reorderRules: Map<string, ReorderRule> = new Map()
  private suppliers: Map<string, SupplierInfo> = new Map()
  private recommendations: Map<string, ReorderRecommendation> = new Map()
  private purchaseOrders: Map<string, PurchaseOrder> = new Map()
  
  private isProcessing = false
  private lastAnalysisRun?: Date

  constructor(
    private config: {
      autoReorderThreshold: number     // Auto-approve if confidence > threshold
      maxAutoOrderValue: number        // Maximum value for auto-approval
      analysisInterval: number         // How often to run analysis (ms)
      enableAutoOrdering: boolean      // Global auto-ordering flag
      defaultServiceLevel: number     // Default service level (0.95)
      defaultCarryingCost: number     // Default carrying cost rate (0.25)
      defaultOrderingCost: number     // Default ordering cost ($50)
    }
  ) {
    super()
    this.demandForecaster = new DemandForecaster()
    this.startPeriodicAnalysis()
  }

  private startPeriodicAnalysis(): void {
    setInterval(() => {
      this.runReorderAnalysis()
    }, this.config.analysisInterval)
  }

  async runReorderAnalysis(): Promise<ReorderRecommendation[]> {
    if (this.isProcessing) {
      return []
    }

    this.isProcessing = true
    const recommendations: ReorderRecommendation[] = []

    try {
      console.log('Starting reorder analysis...')
      
      // Get all active reorder rules
      const activeRules = Array.from(this.reorderRules.values()).filter(rule => rule.enabled)
      
      for (const rule of activeRules) {
        try {
          const recommendation = await this.analyzeProduct(rule)
          if (recommendation) {
            recommendations.push(recommendation)
            this.recommendations.set(recommendation.id, recommendation)
            
            // Emit event for the recommendation
            this.emit('reorder:recommendation', recommendation)
            
            // Auto-approve if conditions are met
            if (this.shouldAutoApprove(recommendation)) {
              await this.approveRecommendation(recommendation.id)
            }
          }
        } catch (error) {
          console.error(`Failed to analyze product ${rule.productId}:`, error)
        }
      }
      
      this.lastAnalysisRun = new Date()
      console.log(`Reorder analysis complete. Generated ${recommendations.length} recommendations.`)
      
      return recommendations
      
    } finally {
      this.isProcessing = false
    }
  }

  private async analyzeProduct(rule: ReorderRule): Promise<ReorderRecommendation | null> {
    // Get current inventory levels (this would come from your inventory system)
    const inventoryLevels = await this.getCurrentInventoryLevels(rule.productId, rule.warehouseId)
    
    // Check if reorder is needed
    if (inventoryLevels.available > rule.reorderPoint) {
      return null // No reorder needed
    }

    // Get demand forecast
    const forecastInput: ForecastInput = {
      productId: rule.productId,
      historicalSales: await this.getHistoricalSales(rule.productId, 365), // Last year
      forecastHorizon: 90, // 90 days
      confidenceLevel: rule.targetServiceLevel
    }
    
    const forecast = await this.demandForecaster.forecast(forecastInput)
    
    // Calculate optimal order quantity
    const orderQuantity = this.calculateOptimalOrderQuantity(rule, forecast, inventoryLevels)
    
    // Select best supplier
    const supplierSelection = await this.selectBestSupplier(rule.productId, orderQuantity)
    
    // Perform cost analysis
    const costAnalysis = this.calculateCostAnalysis(orderQuantity, supplierSelection.recommended)
    
    // Assess risks
    const riskFactors = this.assessRisks(rule, forecast, inventoryLevels, supplierSelection.recommended)
    
    // Calculate timing
    const timing = this.calculateTiming(rule, forecast, inventoryLevels, supplierSelection.recommended)
    
    // Determine urgency
    const urgency = this.determineUrgency(inventoryLevels, forecast, timing)
    
    // Generate reasoning
    const reasoning = this.generateReasoning(rule, forecast, inventoryLevels, orderQuantity, supplierSelection)
    
    const recommendation: ReorderRecommendation = {
      id: this.generateId(),
      productId: rule.productId,
      productTitle: await this.getProductTitle(rule.productId),
      sku: await this.getProductSku(rule.productId),
      
      currentStock: inventoryLevels.onHand,
      reservedStock: inventoryLevels.reserved,
      availableStock: inventoryLevels.available,
      incomingStock: inventoryLevels.incoming,
      
      recommendedQuantity: orderQuantity,
      reorderPoint: rule.reorderPoint,
      targetStock: rule.maxStock || (rule.reorderPoint * 2),
      urgency,
      
      recommendedSupplier: supplierSelection.recommended,
      alternativeSuppliers: supplierSelection.alternatives,
      
      costAnalysis,
      
      demandForecast: {
        next7Days: forecast.predictions.slice(0, 7).reduce((sum, p) => sum + p.predictedDemand, 0),
        next30Days: forecast.predictions.slice(0, 30).reduce((sum, p) => sum + p.predictedDemand, 0),
        next90Days: forecast.predictions.reduce((sum, p) => sum + p.predictedDemand, 0),
        seasonalityFactor: forecast.insights.seasonalityStrength,
        trendFactor: forecast.insights.trendStrength
      },
      
      riskFactors,
      
      recommendedOrderDate: timing.orderDate,
      expectedDeliveryDate: timing.deliveryDate,
      daysUntilStockout: timing.daysUntilStockout,
      
      reasoning: reasoning.reasons,
      warnings: reasoning.warnings,
      
      createdAt: new Date(),
      confidence: this.calculateRecommendationConfidence(forecast, supplierSelection, riskFactors),
      autoApproved: false,
      status: 'pending'
    }
    
    return recommendation
  }

  private calculateOptimalOrderQuantity(
    rule: ReorderRule,
    forecast: ForecastOutput,
    inventory: any
  ): number {
    // Economic Order Quantity (EOQ) calculation with modifications
    const annualDemand = forecast.predictions.reduce((sum, p) => sum + p.predictedDemand, 0) * 4 // Quarterly to annual
    const holdingCost = rule.carryingCostRate || this.config.defaultCarryingCost
    const orderingCost = rule.orderingCost || this.config.defaultOrderingCost
    
    // Calculate basic EOQ
    let eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost)
    
    // Adjust for lead time and safety stock
    const leadTimeDemand = this.calculateLeadTimeDemand(forecast, rule.leadTimeDays)
    const safetyStock = this.calculateSafetyStock(forecast, rule)
    const minimumOrder = leadTimeDemand + safetyStock - inventory.available
    
    // Use the higher of EOQ or minimum required order
    let orderQuantity = Math.max(eoq, minimumOrder)
    
    // Apply business constraints
    if (rule.conditions.orderMultiples) {
      orderQuantity = Math.ceil(orderQuantity / rule.conditions.orderMultiples) * rule.conditions.orderMultiples
    }
    
    // Ensure within min/max bounds
    if (rule.minStock && orderQuantity < rule.minStock) {
      orderQuantity = rule.minStock
    }
    if (rule.maxStock && (inventory.onHand + orderQuantity) > rule.maxStock) {
      orderQuantity = Math.max(0, rule.maxStock - inventory.onHand)
    }
    
    return Math.round(orderQuantity)
  }

  private async selectBestSupplier(
    productId: string,
    quantity: number
  ): Promise<{ recommended: SupplierInfo; alternatives: SupplierInfo[] }> {
    // Get suppliers for this product
    const availableSuppliers = Array.from(this.suppliers.values())
      .filter(supplier => 
        supplier.status === 'active' &&
        supplier.products.some(p => p.productId === productId && p.availability !== 'discontinued')
      )
    
    if (availableSuppliers.length === 0) {
      throw new Error(`No active suppliers found for product ${productId}`)
    }
    
    // Score each supplier
    const scoredSuppliers = availableSuppliers.map(supplier => {
      const productInfo = supplier.products.find(p => p.productId === productId)!
      const score = this.calculateSupplierScore(supplier, productInfo, quantity)
      
      return { supplier, score, productInfo }
    })
    
    // Sort by score (highest first)
    scoredSuppliers.sort((a, b) => b.score - a.score)
    
    return {
      recommended: scoredSuppliers[0].supplier,
      alternatives: scoredSuppliers.slice(1, 4).map(s => s.supplier) // Top 3 alternatives
    }
  }

  private calculateSupplierScore(
    supplier: SupplierInfo,
    productInfo: any,
    quantity: number
  ): number {
    let score = 0
    
    // Performance factors (40% of score)
    score += supplier.performance.onTimeDeliveryRate * 15
    score += supplier.performance.qualityScore * 15
    score += supplier.performance.fillRate * 10
    
    // Cost factors (30% of score)
    const unitCost = this.getEffectiveUnitCost(productInfo, quantity, supplier.terms.bulkDiscounts)
    const costScore = Math.max(0, 30 - (unitCost / 100)) // Simplified cost scoring
    score += costScore
    
    // Lead time factors (20% of score)
    const leadTimeScore = Math.max(0, 20 - (supplier.leadTime.average / 30) * 20) // Better score for shorter lead times
    score += leadTimeScore
    
    // Reliability factors (10% of score)
    score += (5 - supplier.leadTime.variance) * 2 // Lower variance = higher score
    score += Math.max(0, 5 - supplier.performance.defectRate * 100)
    
    return Math.min(100, Math.max(0, score)) // Ensure score is between 0-100
  }

  private getEffectiveUnitCost(
    productInfo: any,
    quantity: number,
    bulkDiscounts: SupplierInfo['terms']['bulkDiscounts']
  ): number {
    let unitCost = productInfo.unitCost
    
    // Apply bulk discount if applicable
    const applicableDiscount = bulkDiscounts
      .filter(discount => quantity >= discount.minQuantity)
      .sort((a, b) => b.discountPercentage - a.discountPercentage)[0]
    
    if (applicableDiscount) {
      unitCost *= (1 - applicableDiscount.discountPercentage / 100)
    }
    
    return unitCost
  }

  private calculateCostAnalysis(quantity: number, supplier: SupplierInfo): ReorderRecommendation['costAnalysis'] {
    const productInfo = supplier.products[0] // Simplified - would find the right product
    const unitCost = this.getEffectiveUnitCost(productInfo, quantity, supplier.terms.bulkDiscounts)
    const subtotal = unitCost * quantity
    
    // Calculate shipping
    let shippingCost = supplier.terms.shippingCost || 0
    if (supplier.terms.freeShippingThreshold && subtotal >= supplier.terms.freeShippingThreshold) {
      shippingCost = 0
    }
    
    // Calculate potential savings from bulk discount
    const baseUnitCost = productInfo.unitCost
    const potentialSavings = (baseUnitCost - unitCost) * quantity
    
    return {
      unitCost,
      totalCost: subtotal + shippingCost,
      potentialSavings,
      bulkDiscountApplied: potentialSavings > 0 ? ((baseUnitCost - unitCost) / baseUnitCost) * 100 : undefined,
      shippingCost,
      totalOrderValue: subtotal + shippingCost
    }
  }

  private assessRisks(
    rule: ReorderRule,
    forecast: ForecastOutput,
    inventory: any,
    supplier: SupplierInfo
  ): ReorderRecommendation['riskFactors'] {
    // Calculate stockout risk
    const daysUntilStockout = inventory.available / (forecast.predictions.slice(0, 7).reduce((sum, p) => sum + p.predictedDemand, 0) / 7)
    const stockoutRisk = Math.max(0, Math.min(1, (rule.leadTimeDays - daysUntilStockout) / rule.leadTimeDays))
    
    // Calculate oversupply risk
    const totalAfterOrder = inventory.onHand + rule.reorderQuantity
    const monthlyDemand = forecast.predictions.slice(0, 30).reduce((sum, p) => sum + p.predictedDemand, 0)
    const monthsOfSupply = totalAfterOrder / monthlyDemand
    const oversupplyRisk = Math.max(0, Math.min(1, (monthsOfSupply - 3) / 6)) // Risk increases after 3 months of supply
    
    // Calculate supplier risk
    const supplierRisk = 1 - (supplier.performance.onTimeDeliveryRate * supplier.performance.fillRate)
    
    // Calculate demand variability risk
    const demandVariabilityRisk = forecast.insights.volatility
    
    return {
      stockoutRisk,
      oversupplyRisk,
      supplierRisk,
      demandVariabilityRisk
    }
  }

  private calculateTiming(
    rule: ReorderRule,
    forecast: ForecastOutput,
    inventory: any,
    supplier: SupplierInfo
  ): { orderDate: Date; deliveryDate: Date; daysUntilStockout?: number } {
    const now = new Date()
    const dailyDemand = forecast.predictions.slice(0, 7).reduce((sum, p) => sum + p.predictedDemand, 0) / 7
    
    // Calculate when we'll run out of stock
    const daysUntilStockout = inventory.available / Math.max(dailyDemand, 1)
    
    // Order should be placed to arrive before stockout
    const orderDate = new Date(now.getTime() - (supplier.leadTime.average - daysUntilStockout) * 24 * 60 * 60 * 1000)
    
    // If order date is in the past, order immediately
    if (orderDate < now) {
      return {
        orderDate: now,
        deliveryDate: new Date(now.getTime() + supplier.leadTime.average * 24 * 60 * 60 * 1000),
        daysUntilStockout: Math.round(daysUntilStockout)
      }
    }
    
    return {
      orderDate,
      deliveryDate: new Date(orderDate.getTime() + supplier.leadTime.average * 24 * 60 * 60 * 1000),
      daysUntilStockout: Math.round(daysUntilStockout)
    }
  }

  private determineUrgency(
    inventory: any,
    forecast: ForecastOutput,
    timing: { daysUntilStockout?: number }
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (inventory.available === 0) return 'critical'
    if (timing.daysUntilStockout && timing.daysUntilStockout <= 3) return 'critical'
    if (timing.daysUntilStockout && timing.daysUntilStockout <= 7) return 'high'
    if (timing.daysUntilStockout && timing.daysUntilStockout <= 14) return 'medium'
    return 'low'
  }

  private generateReasoning(
    rule: ReorderRule,
    forecast: ForecastOutput,
    inventory: any,
    orderQuantity: number,
    supplierSelection: any
  ): { reasons: string[]; warnings: string[] } {
    const reasons: string[] = []
    const warnings: string[] = []
    
    // Add primary reason
    reasons.push(`Available stock (${inventory.available}) is below reorder point (${rule.reorderPoint})`)
    
    // Add forecast insights
    if (forecast.insights.trendStrength > 0.3) {
      reasons.push(`Demand is trending upward (trend strength: ${(forecast.insights.trendStrength * 100).toFixed(1)}%)`)
    }
    
    if (forecast.insights.seasonalityStrength > 0.5) {
      reasons.push(`Strong seasonal pattern detected (seasonality: ${(forecast.insights.seasonalityStrength * 100).toFixed(1)}%)`)
    }
    
    // Add supplier justification
    reasons.push(`Selected supplier: ${supplierSelection.recommended.name} (score: ${supplierSelection.score?.toFixed(1) || 'N/A'})`)
    
    // Add quantity justification
    reasons.push(`Recommended quantity: ${orderQuantity} units (EOQ-optimized)`)
    
    // Add warnings
    if (forecast.confidence < 0.7) {
      warnings.push(`Low forecast confidence (${(forecast.confidence * 100).toFixed(1)}%) - consider manual review`)
    }
    
    if (supplierSelection.recommended.performance.onTimeDeliveryRate < 0.8) {
      warnings.push(`Supplier has poor on-time delivery rate (${(supplierSelection.recommended.performance.onTimeDeliveryRate * 100).toFixed(1)}%)`)
    }
    
    return { reasons, warnings }
  }

  private calculateRecommendationConfidence(
    forecast: ForecastOutput,
    supplierSelection: any,
    riskFactors: ReorderRecommendation['riskFactors']
  ): number {
    let confidence = forecast.confidence * 0.4 // 40% from forecast confidence
    confidence += (supplierSelection.recommended.performance.onTimeDeliveryRate) * 0.3 // 30% from supplier reliability
    confidence += (1 - riskFactors.stockoutRisk) * 0.2 // 20% from stockout risk
    confidence += (1 - riskFactors.supplierRisk) * 0.1 // 10% from supplier risk
    
    return Math.max(0, Math.min(1, confidence))
  }

  private shouldAutoApprove(recommendation: ReorderRecommendation): boolean {
    if (!this.config.enableAutoOrdering) return false
    if (recommendation.confidence < this.config.autoReorderThreshold) return false
    if (recommendation.costAnalysis.totalOrderValue > this.config.maxAutoOrderValue) return false
    if (recommendation.urgency === 'critical' && recommendation.confidence > 0.8) return true
    if (recommendation.riskFactors.stockoutRisk > 0.8) return true
    
    return false
  }

  async approveRecommendation(recommendationId: string): Promise<PurchaseOrder> {
    const recommendation = this.recommendations.get(recommendationId)
    if (!recommendation) {
      throw new Error(`Recommendation ${recommendationId} not found`)
    }
    
    if (recommendation.status !== 'pending') {
      throw new Error(`Recommendation ${recommendationId} is not in pending status`)
    }
    
    // Create purchase order
    const purchaseOrder: PurchaseOrder = {
      id: this.generateId(),
      orderNumber: this.generateOrderNumber(),
      supplierId: recommendation.recommendedSupplier.id,
      supplierName: recommendation.recommendedSupplier.name,
      
      items: [{
        productId: recommendation.productId,
        sku: recommendation.sku,
        productTitle: recommendation.productTitle,
        quantity: recommendation.recommendedQuantity,
        unitCost: recommendation.costAnalysis.unitCost,
        totalCost: recommendation.costAnalysis.totalCost,
        expectedDeliveryDate: recommendation.expectedDeliveryDate
      }],
      
      subtotal: recommendation.costAnalysis.totalOrderValue - recommendation.costAnalysis.shippingCost,
      shipping: recommendation.costAnalysis.shippingCost,
      total: recommendation.costAnalysis.totalOrderValue,
      
      status: 'draft',
      orderDate: new Date(),
      expectedDeliveryDate: recommendation.expectedDeliveryDate,
      
      recommendationId,
      autoGenerated: true
    }
    
    // Update recommendation status
    recommendation.status = 'approved'
    recommendation.autoApproved = this.shouldAutoApprove(recommendation)
    
    // Store purchase order
    this.purchaseOrders.set(purchaseOrder.id, purchaseOrder)
    
    // Emit events
    this.emit('reorder:approved', { recommendation, purchaseOrder })
    
    // Auto-send if conditions are met
    if (recommendation.autoApproved) {
      await this.sendPurchaseOrder(purchaseOrder.id)
    }
    
    return purchaseOrder
  }

  async sendPurchaseOrder(purchaseOrderId: string): Promise<void> {
    const po = this.purchaseOrders.get(purchaseOrderId)
    if (!po) {
      throw new Error(`Purchase order ${purchaseOrderId} not found`)
    }
    
    // Send to supplier (implementation would depend on supplier's preferred method)
    try {
      await this.sendToSupplier(po)
      
      po.status = 'sent'
      po.sentAt = new Date()
      
      this.emit('purchase_order:sent', po)
      
    } catch (error) {
      console.error(`Failed to send purchase order ${purchaseOrderId}:`, error)
      throw error
    }
  }

  private async sendToSupplier(po: PurchaseOrder): Promise<void> {
    // Implementation would integrate with supplier systems
    // For now, just log the action
    console.log(`Sending purchase order ${po.orderNumber} to ${po.supplierName}`)
  }

  // Helper methods that would integrate with your data layer
  private async getCurrentInventoryLevels(productId: string, warehouseId: string): Promise<any> {
    // This would integrate with your inventory tracking system
    return {
      onHand: 50,
      reserved: 10,
      available: 40,
      incoming: 0
    }
  }

  private async getHistoricalSales(productId: string, days: number): Promise<any[]> {
    // This would integrate with your sales data
    return []
  }

  private async getProductTitle(productId: string): Promise<string> {
    return `Product ${productId}`
  }

  private async getProductSku(productId: string): Promise<string> {
    return `SKU-${productId}`
  }

  private calculateLeadTimeDemand(forecast: ForecastOutput, leadTimeDays: number): number {
    return forecast.predictions
      .slice(0, leadTimeDays)
      .reduce((sum, p) => sum + p.predictedDemand, 0)
  }

  private calculateSafetyStock(forecast: ForecastOutput, rule: ReorderRule): number {
    const demandVariability = forecast.insights.volatility
    const serviceLevel = rule.targetServiceLevel
    const leadTime = rule.leadTimeDays
    
    // Simplified safety stock calculation
    const zScore = this.getZScore(serviceLevel)
    const avgDemand = forecast.predictions.slice(0, 30).reduce((sum, p) => sum + p.predictedDemand, 0) / 30
    const safetyStock = zScore * Math.sqrt(leadTime) * avgDemand * demandVariability
    
    return Math.round(safetyStock)
  }

  private getZScore(serviceLevel: number): number {
    // Simplified Z-score lookup for normal distribution
    const zScores: Record<string, number> = {
      '0.50': 0.00,
      '0.80': 0.84,
      '0.90': 1.28,
      '0.95': 1.65,
      '0.99': 2.33
    }
    
    const key = serviceLevel.toFixed(2)
    return zScores[key] || 1.65 // Default to 95% service level
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private generateOrderNumber(): string {
    return `PO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  }

  // Public API methods
  addReorderRule(rule: ReorderRule): void {
    this.reorderRules.set(rule.id, rule)
  }

  updateReorderRule(ruleId: string, updates: Partial<ReorderRule>): void {
    const rule = this.reorderRules.get(ruleId)
    if (rule) {
      Object.assign(rule, updates, { updatedAt: new Date() })
      this.reorderRules.set(ruleId, rule)
    }
  }

  removeReorderRule(ruleId: string): void {
    this.reorderRules.delete(ruleId)
  }

  addSupplier(supplier: SupplierInfo): void {
    this.suppliers.set(supplier.id, supplier)
  }

  updateSupplier(supplierId: string, updates: Partial<SupplierInfo>): void {
    const supplier = this.suppliers.get(supplierId)
    if (supplier) {
      Object.assign(supplier, updates)
      this.suppliers.set(supplierId, supplier)
    }
  }

  getRecommendations(status?: ReorderRecommendation['status']): ReorderRecommendation[] {
    const recommendations = Array.from(this.recommendations.values())
    return status ? recommendations.filter(r => r.status === status) : recommendations
  }

  getPurchaseOrders(status?: PurchaseOrder['status']): PurchaseOrder[] {
    const orders = Array.from(this.purchaseOrders.values())
    return status ? orders.filter(o => o.status === status) : orders
  }

  rejectRecommendation(recommendationId: string, reason: string): void {
    const recommendation = this.recommendations.get(recommendationId)
    if (recommendation) {
      recommendation.status = 'rejected'
      recommendation.warnings.push(`Rejected: ${reason}`)
      this.emit('reorder:rejected', { recommendation, reason })
    }
  }
}