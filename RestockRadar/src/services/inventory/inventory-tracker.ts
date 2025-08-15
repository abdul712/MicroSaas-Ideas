/**
 * Real-Time Inventory Tracking System
 * 
 * Provides comprehensive inventory monitoring with:
 * - Real-time stock level updates
 * - Multi-location tracking
 * - Automated threshold monitoring
 * - Integration with e-commerce platforms
 * - Webhook processing for live updates
 */

import { EventEmitter } from 'events'
import { WebSocket } from 'ws'

export interface InventoryItem {
  id: string
  productId: string
  variantId?: string
  warehouseId: string
  sku: string
  title: string
  
  // Current inventory levels
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  quantityIncoming: number
  
  // Reorder settings
  reorderPoint?: number
  reorderQuantity?: number
  maxStock?: number
  minStock?: number
  
  // Tracking metadata
  location?: string
  lastCountedAt?: Date
  lastReceivedAt?: Date
  lastSoldAt?: Date
  
  // Platform sync
  platformQuantities: Record<string, number> // e.g., { shopify: 10, amazon: 5 }
  lastSyncAt?: Date
  syncStatus: 'synced' | 'syncing' | 'error' | 'pending'
}

export interface InventoryChange {
  id: string
  inventoryItemId: string
  type: 'sale' | 'return' | 'adjustment' | 'transfer' | 'damage' | 'recount' | 'received'
  quantityBefore: number
  quantityAfter: number
  quantityChange: number
  reason?: string
  reference?: string // Order ID, adjustment ID, etc.
  source: 'manual' | 'shopify' | 'amazon' | 'ebay' | 'system' | 'api'
  metadata?: Record<string, any>
  timestamp: Date
  userId?: string
}

export interface InventoryAlert {
  id: string
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'reorder_point' | 'sync_error'
  severity: 'low' | 'medium' | 'high' | 'critical'
  inventoryItemId: string
  productTitle: string
  message: string
  currentQuantity: number
  threshold?: number
  recommendation?: string
  createdAt: Date
  acknowledgedAt?: Date
  resolvedAt?: Date
}

export interface WebhookPayload {
  platform: string
  type: string
  productId: string
  variantId?: string
  quantity: number
  data: Record<string, any>
  timestamp: Date
}

export class InventoryTracker extends EventEmitter {
  private items: Map<string, InventoryItem> = new Map()
  private changes: InventoryChange[] = []
  private alerts: InventoryAlert[] = []
  private websocketClients: Set<WebSocket> = new Set()
  private syncQueue: Set<string> = new Set()
  private isProcessing = false

  constructor(
    private config: {
      enableRealTimeUpdates: boolean
      alertThresholds: {
        lowStock: number // percentage
        overstock: number // percentage
      }
      webhookEndpoints: Record<string, string>
      retryAttempts: number
      syncInterval: number
    }
  ) {
    super()
    this.setupEventHandlers()
    this.startPeriodicSync()
  }

  private setupEventHandlers(): void {
    this.on('inventory:changed', this.handleInventoryChange.bind(this))
    this.on('inventory:alert', this.handleInventoryAlert.bind(this))
    this.on('webhook:received', this.handleWebhook.bind(this))
  }

  private startPeriodicSync(): void {
    setInterval(() => {
      this.processSyncQueue()
    }, this.config.syncInterval)
  }

  // Core inventory operations
  async updateInventory(
    inventoryItemId: string,
    change: Partial<Pick<InventoryItem, 'quantityOnHand' | 'quantityReserved' | 'quantityIncoming'>>,
    source: InventoryChange['source'] = 'manual',
    reference?: string,
    reason?: string
  ): Promise<void> {
    const item = this.items.get(inventoryItemId)
    if (!item) {
      throw new Error(`Inventory item ${inventoryItemId} not found`)
    }

    const previousQuantities = {
      onHand: item.quantityOnHand,
      reserved: item.quantityReserved,
      incoming: item.quantityIncoming
    }

    // Update quantities
    if (change.quantityOnHand !== undefined) {
      item.quantityOnHand = Math.max(0, change.quantityOnHand)
    }
    if (change.quantityReserved !== undefined) {
      item.quantityReserved = Math.max(0, change.quantityReserved)
    }
    if (change.quantityIncoming !== undefined) {
      item.quantityIncoming = Math.max(0, change.quantityIncoming)
    }

    // Recalculate available quantity
    item.quantityAvailable = Math.max(0, item.quantityOnHand - item.quantityReserved)

    // Record the change
    const inventoryChange: InventoryChange = {
      id: this.generateId(),
      inventoryItemId,
      type: this.determineChangeType(change, source),
      quantityBefore: previousQuantities.onHand,
      quantityAfter: item.quantityOnHand,
      quantityChange: item.quantityOnHand - previousQuantities.onHand,
      reason,
      reference,
      source,
      timestamp: new Date(),
      metadata: {
        previousQuantities,
        newQuantities: {
          onHand: item.quantityOnHand,
          reserved: item.quantityReserved,
          incoming: item.quantityIncoming,
          available: item.quantityAvailable
        }
      }
    }

    this.changes.push(inventoryChange)
    this.items.set(inventoryItemId, item)

    // Emit events
    this.emit('inventory:changed', { item, change: inventoryChange })

    // Check for alerts
    await this.checkAlerts(item)

    // Queue for platform sync
    this.queueForSync(inventoryItemId)

    // Broadcast real-time updates
    if (this.config.enableRealTimeUpdates) {
      this.broadcastUpdate(item, inventoryChange)
    }
  }

  async adjustInventory(
    inventoryItemId: string,
    adjustment: number,
    reason: string,
    reference?: string
  ): Promise<void> {
    const item = this.items.get(inventoryItemId)
    if (!item) {
      throw new Error(`Inventory item ${inventoryItemId} not found`)
    }

    const newQuantity = Math.max(0, item.quantityOnHand + adjustment)
    
    await this.updateInventory(
      inventoryItemId,
      { quantityOnHand: newQuantity },
      'manual',
      reference,
      reason
    )
  }

  async reserveInventory(
    inventoryItemId: string,
    quantity: number,
    reference: string
  ): Promise<boolean> {
    const item = this.items.get(inventoryItemId)
    if (!item) {
      throw new Error(`Inventory item ${inventoryItemId} not found`)
    }

    if (item.quantityAvailable < quantity) {
      return false // Insufficient inventory
    }

    await this.updateInventory(
      inventoryItemId,
      { quantityReserved: item.quantityReserved + quantity },
      'system',
      reference,
      'Inventory reserved for order'
    )

    return true
  }

  async releaseReservation(
    inventoryItemId: string,
    quantity: number,
    reference: string
  ): Promise<void> {
    const item = this.items.get(inventoryItemId)
    if (!item) {
      throw new Error(`Inventory item ${inventoryItemId} not found`)
    }

    const newReserved = Math.max(0, item.quantityReserved - quantity)
    
    await this.updateInventory(
      inventoryItemId,
      { quantityReserved: newReserved },
      'system',
      reference,
      'Reservation released'
    )
  }

  async fulfillOrder(
    inventoryItemId: string,
    quantity: number,
    orderId: string
  ): Promise<void> {
    const item = this.items.get(inventoryItemId)
    if (!item) {
      throw new Error(`Inventory item ${inventoryItemId} not found`)
    }

    // Reduce both on-hand and reserved quantities
    const newOnHand = Math.max(0, item.quantityOnHand - quantity)
    const newReserved = Math.max(0, item.quantityReserved - quantity)

    await this.updateInventory(
      inventoryItemId,
      { 
        quantityOnHand: newOnHand,
        quantityReserved: newReserved
      },
      'system',
      orderId,
      'Order fulfilled'
    )

    // Update last sold timestamp
    item.lastSoldAt = new Date()
    this.items.set(inventoryItemId, item)
  }

  async receiveInventory(
    inventoryItemId: string,
    quantity: number,
    purchaseOrderId?: string
  ): Promise<void> {
    const item = this.items.get(inventoryItemId)
    if (!item) {
      throw new Error(`Inventory item ${inventoryItemId} not found`)
    }

    const newOnHand = item.quantityOnHand + quantity
    const newIncoming = Math.max(0, item.quantityIncoming - quantity)

    await this.updateInventory(
      inventoryItemId,
      { 
        quantityOnHand: newOnHand,
        quantityIncoming: newIncoming
      },
      'system',
      purchaseOrderId,
      'Inventory received'
    )

    // Update last received timestamp
    item.lastReceivedAt = new Date()
    this.items.set(inventoryItemId, item)
  }

  // Alert management
  private async checkAlerts(item: InventoryItem): Promise<void> {
    const alerts: InventoryAlert[] = []

    // Check for out of stock
    if (item.quantityAvailable === 0) {
      alerts.push({
        id: this.generateId(),
        type: 'out_of_stock',
        severity: 'critical',
        inventoryItemId: item.id,
        productTitle: item.title,
        message: `${item.title} is out of stock`,
        currentQuantity: item.quantityAvailable,
        recommendation: 'Reorder immediately or update product availability',
        createdAt: new Date()
      })
    }

    // Check for low stock
    if (item.reorderPoint && item.quantityAvailable <= item.reorderPoint && item.quantityAvailable > 0) {
      alerts.push({
        id: this.generateId(),
        type: 'low_stock',
        severity: 'high',
        inventoryItemId: item.id,
        productTitle: item.title,
        message: `${item.title} is below reorder point (${item.reorderPoint})`,
        currentQuantity: item.quantityAvailable,
        threshold: item.reorderPoint,
        recommendation: `Reorder ${item.reorderQuantity || 'default quantity'}`,
        createdAt: new Date()
      })
    }

    // Check for overstock
    if (item.maxStock && item.quantityOnHand > item.maxStock) {
      alerts.push({
        id: this.generateId(),
        type: 'overstock',
        severity: 'medium',
        inventoryItemId: item.id,
        productTitle: item.title,
        message: `${item.title} is above maximum stock level (${item.maxStock})`,
        currentQuantity: item.quantityOnHand,
        threshold: item.maxStock,
        recommendation: 'Consider promotional campaigns or return to supplier',
        createdAt: new Date()
      })
    }

    // Add alerts and emit events
    for (const alert of alerts) {
      this.alerts.push(alert)
      this.emit('inventory:alert', alert)
    }
  }

  // Webhook processing
  async processWebhook(payload: WebhookPayload): Promise<void> {
    try {
      this.emit('webhook:received', payload)
      
      // Find the corresponding inventory item
      const item = this.findItemByPlatformIds(payload.productId, payload.variantId)
      if (!item) {
        console.warn(`Inventory item not found for webhook: ${payload.productId}`)
        return
      }

      // Process based on webhook type
      switch (payload.type) {
        case 'inventory_level_update':
          await this.handleInventoryLevelUpdate(item, payload)
          break
        case 'order_created':
          await this.handleOrderCreated(item, payload)
          break
        case 'order_cancelled':
          await this.handleOrderCancelled(item, payload)
          break
        case 'product_updated':
          await this.handleProductUpdated(item, payload)
          break
        default:
          console.warn(`Unknown webhook type: ${payload.type}`)
      }
    } catch (error) {
      console.error('Error processing webhook:', error)
      
      // Create sync error alert
      const alert: InventoryAlert = {
        id: this.generateId(),
        type: 'sync_error',
        severity: 'high',
        inventoryItemId: payload.productId,
        productTitle: 'Unknown Product',
        message: `Failed to process ${payload.platform} webhook: ${payload.type}`,
        currentQuantity: 0,
        recommendation: 'Check webhook configuration and retry sync',
        createdAt: new Date()
      }
      
      this.alerts.push(alert)
      this.emit('inventory:alert', alert)
    }
  }

  private async handleInventoryLevelUpdate(item: InventoryItem, payload: WebhookPayload): Promise<void> {
    const platformQuantity = payload.quantity
    const currentPlatformQuantity = item.platformQuantities[payload.platform] || 0
    
    // Only update if the platform quantity has changed
    if (platformQuantity !== currentPlatformQuantity) {
      const quantityDifference = platformQuantity - currentPlatformQuantity
      
      // Update platform quantity tracking
      item.platformQuantities[payload.platform] = platformQuantity
      
      // Adjust main inventory if this is the primary platform
      if (this.isPrimaryPlatform(payload.platform, item)) {
        await this.updateInventory(
          item.id,
          { quantityOnHand: item.quantityOnHand + quantityDifference },
          payload.platform as InventoryChange['source'],
          payload.data.reference,
          `Platform sync: ${payload.platform}`
        )
      }
    }
  }

  private async handleOrderCreated(item: InventoryItem, payload: WebhookPayload): Promise<void> {
    const quantity = payload.data.line_items?.[0]?.quantity || payload.quantity
    const orderId = payload.data.id || payload.data.order_id
    
    // Reserve inventory for the order
    const reserved = await this.reserveInventory(item.id, quantity, orderId)
    
    if (!reserved) {
      // Create alert for insufficient inventory
      const alert: InventoryAlert = {
        id: this.generateId(),
        type: 'out_of_stock',
        severity: 'critical',
        inventoryItemId: item.id,
        productTitle: item.title,
        message: `Insufficient inventory for order ${orderId}`,
        currentQuantity: item.quantityAvailable,
        recommendation: 'Increase inventory or cancel order',
        createdAt: new Date()
      }
      
      this.alerts.push(alert)
      this.emit('inventory:alert', alert)
    }
  }

  private async handleOrderCancelled(item: InventoryItem, payload: WebhookPayload): Promise<void> {
    const quantity = payload.data.line_items?.[0]?.quantity || payload.quantity
    const orderId = payload.data.id || payload.data.order_id
    
    // Release the reservation
    await this.releaseReservation(item.id, quantity, orderId)
  }

  private async handleProductUpdated(item: InventoryItem, payload: WebhookPayload): Promise<void> {
    // Update product metadata
    if (payload.data.title) {
      item.title = payload.data.title
    }
    
    if (payload.data.sku) {
      item.sku = payload.data.sku
    }
    
    this.items.set(item.id, item)
  }

  // Platform synchronization
  private queueForSync(inventoryItemId: string): void {
    this.syncQueue.add(inventoryItemId)
  }

  private async processSyncQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.size === 0) {
      return
    }

    this.isProcessing = true

    try {
      const itemIds = Array.from(this.syncQueue)
      this.syncQueue.clear()

      await Promise.all(
        itemIds.map(itemId => this.syncInventoryToPlatforms(itemId))
      )
    } catch (error) {
      console.error('Error processing sync queue:', error)
    } finally {
      this.isProcessing = false
    }
  }

  private async syncInventoryToPlatforms(inventoryItemId: string): Promise<void> {
    const item = this.items.get(inventoryItemId)
    if (!item) return

    const platforms = Object.keys(item.platformQuantities)
    
    for (const platform of platforms) {
      try {
        await this.syncToPlatform(item, platform)
        item.syncStatus = 'synced'
        item.lastSyncAt = new Date()
      } catch (error) {
        console.error(`Failed to sync to ${platform}:`, error)
        item.syncStatus = 'error'
        
        // Create sync error alert
        const alert: InventoryAlert = {
          id: this.generateId(),
          type: 'sync_error',
          severity: 'medium',
          inventoryItemId: item.id,
          productTitle: item.title,
          message: `Failed to sync inventory to ${platform}`,
          currentQuantity: item.quantityAvailable,
          recommendation: `Check ${platform} API connection and retry`,
          createdAt: new Date()
        }
        
        this.alerts.push(alert)
        this.emit('inventory:alert', alert)
      }
    }

    this.items.set(inventoryItemId, item)
  }

  private async syncToPlatform(item: InventoryItem, platform: string): Promise<void> {
    // Platform-specific sync logic would be implemented here
    // This is a placeholder for the actual API calls
    console.log(`Syncing ${item.title} to ${platform}: ${item.quantityAvailable}`)
  }

  // Real-time updates
  private broadcastUpdate(item: InventoryItem, change: InventoryChange): void {
    const update = {
      type: 'inventory_update',
      item: {
        id: item.id,
        productId: item.productId,
        title: item.title,
        quantityAvailable: item.quantityAvailable,
        quantityOnHand: item.quantityOnHand,
        quantityReserved: item.quantityReserved
      },
      change: {
        type: change.type,
        quantityChange: change.quantityChange,
        source: change.source,
        timestamp: change.timestamp
      }
    }

    this.websocketClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(update))
      }
    })
  }

  addWebSocketClient(client: WebSocket): void {
    this.websocketClients.add(client)
    
    client.on('close', () => {
      this.websocketClients.delete(client)
    })
  }

  // Utility methods
  private findItemByPlatformIds(productId: string, variantId?: string): InventoryItem | undefined {
    for (const [_, item] of this.items) {
      if (item.productId === productId && (!variantId || item.variantId === variantId)) {
        return item
      }
    }
    return undefined
  }

  private isPrimaryPlatform(platform: string, item: InventoryItem): boolean {
    // Logic to determine if this platform is the primary source of truth for this item
    // This would be configurable per item
    return true // Simplified for demo
  }

  private determineChangeType(
    change: Partial<Pick<InventoryItem, 'quantityOnHand' | 'quantityReserved' | 'quantityIncoming'>>,
    source: InventoryChange['source']
  ): InventoryChange['type'] {
    if (change.quantityOnHand !== undefined) {
      return source === 'manual' ? 'adjustment' : 'sale'
    }
    if (change.quantityReserved !== undefined) {
      return 'adjustment'
    }
    if (change.quantityIncoming !== undefined) {
      return 'received'
    }
    return 'adjustment'
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private handleInventoryChange(data: { item: InventoryItem; change: InventoryChange }): void {
    // Additional processing for inventory changes
    console.log(`Inventory changed: ${data.item.title} - ${data.change.quantityChange}`)
  }

  private handleInventoryAlert(alert: InventoryAlert): void {
    // Additional processing for alerts (e.g., send notifications)
    console.log(`Alert: ${alert.type} - ${alert.message}`)
  }

  private handleWebhook(payload: WebhookPayload): void {
    // Additional webhook processing
    console.log(`Webhook received: ${payload.platform} - ${payload.type}`)
  }

  // Public API methods
  getInventoryItem(inventoryItemId: string): InventoryItem | undefined {
    return this.items.get(inventoryItemId)
  }

  getAllInventoryItems(): InventoryItem[] {
    return Array.from(this.items.values())
  }

  getInventoryChanges(inventoryItemId?: string): InventoryChange[] {
    if (inventoryItemId) {
      return this.changes.filter(change => change.inventoryItemId === inventoryItemId)
    }
    return this.changes
  }

  getActiveAlerts(): InventoryAlert[] {
    return this.alerts.filter(alert => !alert.resolvedAt)
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledgedAt = new Date()
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolvedAt = new Date()
    }
  }

  addInventoryItem(item: InventoryItem): void {
    this.items.set(item.id, item)
  }

  removeInventoryItem(inventoryItemId: string): void {
    this.items.delete(inventoryItemId)
  }
}