/**
 * Shopify Integration Service
 * 
 * Comprehensive integration with Shopify that provides:
 * - Real-time inventory synchronization
 * - Webhook processing for orders, inventory, and products
 * - Product and variant management
 * - Order tracking and fulfillment
 * - Multi-location support
 * - Bulk operations and data sync
 */

import { EventEmitter } from 'events'

export interface ShopifyConfig {
  shop: string           // myshop.myshopify.com
  accessToken: string    // Private app access token
  apiVersion: string     // 2023-10 (latest stable)
  webhookSecret: string  // For webhook verification
  retryAttempts: number
  rateLimitDelay: number
}

export interface ShopifyProduct {
  id: number
  title: string
  handle: string
  body_html: string
  vendor: string
  product_type: string
  tags: string
  status: 'active' | 'archived' | 'draft'
  created_at: string
  updated_at: string
  published_at?: string
  
  variants: ShopifyVariant[]
  images: ShopifyImage[]
  options: ShopifyOption[]
  
  // SEO
  seo_title?: string
  seo_description?: string
  
  // Additional metadata
  metafields?: ShopifyMetafield[]
}

export interface ShopifyVariant {
  id: number
  product_id: number
  title: string
  price: string
  sku: string
  position: number
  inventory_policy: 'deny' | 'continue'
  compare_at_price?: string
  fulfillment_service: string
  inventory_management: string
  option1?: string
  option2?: string
  option3?: string
  created_at: string
  updated_at: string
  taxable: boolean
  barcode?: string
  grams: number
  image_id?: number
  weight: number
  weight_unit: string
  inventory_item_id: number
  inventory_quantity: number
  old_inventory_quantity: number
  requires_shipping: boolean
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number
  location_id: number
  available: number
  updated_at: string
}

export interface ShopifyLocation {
  id: number
  name: string
  address1?: string
  address2?: string
  city?: string
  zip?: string
  province?: string
  country?: string
  phone?: string
  created_at: string
  updated_at: string
  country_code?: string
  country_name?: string
  province_code?: string
  legacy: boolean
  active: boolean
  admin_graphql_api_id: string
}

export interface ShopifyOrder {
  id: number
  email: string
  closed_at?: string
  created_at: string
  updated_at: string
  number: number
  note?: string
  token: string
  gateway: string
  test: boolean
  total_price: string
  subtotal_price: string
  total_weight: number
  total_tax: string
  taxes_included: boolean
  currency: string
  financial_status: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided'
  confirmed: boolean
  total_discounts: string
  total_line_items_price: string
  cart_token?: string
  buyer_accepts_marketing: boolean
  name: string
  referring_site?: string
  landing_site?: string
  cancelled_at?: string
  cancel_reason?: string
  total_price_usd?: string
  checkout_token?: string
  reference?: string
  user_id?: number
  location_id?: number
  source_identifier?: string
  source_url?: string
  processed_at: string
  device_id?: number
  phone?: string
  customer_locale?: string
  app_id?: number
  browser_ip?: string
  landing_site_ref?: string
  order_number: number
  discount_applications: any[]
  discount_codes: any[]
  note_attributes: any[]
  payment_gateway_names: string[]
  processing_method: string
  checkout_id?: number
  source_name: string
  fulfillment_status?: 'fulfilled' | 'null' | 'partial' | 'restocked'
  tax_lines: any[]
  tags: string
  contact_email: string
  order_status_url: string
  presentment_currency: string
  total_line_items_price_set: any
  total_discounts_set: any
  total_shipping_price_set: any
  subtotal_price_set: any
  total_price_set: any
  total_tax_set: any
  line_items: ShopifyLineItem[]
  fulfillments: any[]
  refunds: any[]
  
  // Customer information
  customer?: ShopifyCustomer
  
  // Shipping and billing addresses
  billing_address?: ShopifyAddress
  shipping_address?: ShopifyAddress
  
  // Additional data
  client_details?: any
  payment_details?: any
  shipping_lines: any[]
}

export interface ShopifyLineItem {
  id: number
  variant_id?: number
  title: string
  quantity: number
  sku: string
  variant_title?: string
  vendor?: string
  fulfillment_service: string
  product_id: number
  requires_shipping: boolean
  taxable: boolean
  gift_card: boolean
  name: string
  variant_inventory_management?: string
  properties: any[]
  product_exists: boolean
  fulfillable_quantity: number
  grams: number
  price: string
  total_discount: string
  fulfillment_status?: 'fulfilled' | 'null' | 'partial'
  price_set: any
  total_discount_set: any
  discount_allocations: any[]
  duties: any[]
  admin_graphql_api_id: string
  tax_lines: any[]
}

export interface ShopifyWebhook {
  id: number
  topic: string
  address: string
  format: 'json' | 'xml'
  created_at: string
  updated_at: string
  api_version: string
  fields?: string[]
  metafield_namespaces?: string[]
  private_metafield_namespaces?: string[]
}

export interface ShopifyCustomer {
  id: number
  email: string
  accepts_marketing: boolean
  created_at: string
  updated_at: string
  first_name: string
  last_name: string
  orders_count: number
  state: string
  total_spent: string
  last_order_id?: number
  note?: string
  verified_email: boolean
  multipass_identifier?: string
  tax_exempt: boolean
  phone?: string
  tags: string
  last_order_name?: string
  currency: string
  addresses: ShopifyAddress[]
  accepts_marketing_updated_at: string
  marketing_opt_in_level?: string
  tax_exemptions: any[]
  admin_graphql_api_id: string
  default_address?: ShopifyAddress
}

export interface ShopifyAddress {
  id?: number
  customer_id?: number
  first_name?: string
  last_name?: string
  company?: string
  address1?: string
  address2?: string
  city?: string
  province?: string
  country?: string
  zip?: string
  phone?: string
  name?: string
  province_code?: string
  country_code?: string
  country_name?: string
  default?: boolean
}

export interface ShopifyImage {
  id: number
  product_id: number
  position: number
  created_at: string
  updated_at: string
  alt?: string
  width: number
  height: number
  src: string
  variant_ids: number[]
  admin_graphql_api_id: string
}

export interface ShopifyOption {
  id: number
  product_id: number
  name: string
  position: number
  values: string[]
}

export interface ShopifyMetafield {
  id: number
  namespace: string
  key: string
  value: string
  description?: string
  owner_id: number
  created_at: string
  updated_at: string
  owner_resource: string
  type: string
  admin_graphql_api_id: string
}

export class ShopifyIntegration extends EventEmitter {
  private config: ShopifyConfig
  private baseUrl: string
  private rateLimitState: {
    callsMade: number
    maxCalls: number
    resetTime: number
  } = {
    callsMade: 0,
    maxCalls: 40,
    resetTime: Date.now() + 1000
  }

  constructor(config: ShopifyConfig) {
    super()
    this.config = config
    this.baseUrl = `https://${config.shop}/admin/api/${config.apiVersion}`
  }

  // Core API Methods
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    await this.checkRateLimit()

    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'X-Shopify-Access-Token': this.config.accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    }

    try {
      const response = await fetch(url, requestOptions)
      
      // Update rate limit state from response headers
      this.updateRateLimitState(response.headers)
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorData}`)
      }
      
      const result = await response.json()
      return result
    } catch (error) {
      console.error(`Shopify API request failed: ${method} ${endpoint}`, error)
      throw error
    }
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    
    if (now < this.rateLimitState.resetTime) {
      if (this.rateLimitState.callsMade >= this.rateLimitState.maxCalls) {
        const waitTime = this.rateLimitState.resetTime - now
        console.log(`Rate limit reached, waiting ${waitTime}ms`)
        await this.sleep(waitTime)
        this.rateLimitState.callsMade = 0
        this.rateLimitState.resetTime = Date.now() + 1000
      }
    } else {
      this.rateLimitState.callsMade = 0
      this.rateLimitState.resetTime = now + 1000
    }
    
    this.rateLimitState.callsMade++
  }

  private updateRateLimitState(headers: Headers): void {
    const callLimit = headers.get('X-Shopify-Shop-Api-Call-Limit')
    if (callLimit) {
      const [used, limit] = callLimit.split('/').map(Number)
      this.rateLimitState.callsMade = used
      this.rateLimitState.maxCalls = limit
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Product Management
  async getProducts(params?: {
    limit?: number
    since_id?: number
    created_at_min?: string
    created_at_max?: string
    updated_at_min?: string
    updated_at_max?: string
    published_at_min?: string
    published_at_max?: string
    published_status?: 'published' | 'unpublished' | 'any'
    vendor?: string
    product_type?: string
    collection_id?: number
    handle?: string
    ids?: string
    fields?: string
  }): Promise<{ products: ShopifyProduct[] }> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, value.toString())
        }
      })
    }
    
    const endpoint = `/products.json${query.toString() ? '?' + query.toString() : ''}`
    return this.makeRequest<{ products: ShopifyProduct[] }>(endpoint)
  }

  async getProduct(productId: number, fields?: string[]): Promise<{ product: ShopifyProduct }> {
    const query = fields ? `?fields=${fields.join(',')}` : ''
    return this.makeRequest<{ product: ShopifyProduct }>(`/products/${productId}.json${query}`)
  }

  async createProduct(product: Partial<ShopifyProduct>): Promise<{ product: ShopifyProduct }> {
    return this.makeRequest<{ product: ShopifyProduct }>('/products.json', 'POST', { product })
  }

  async updateProduct(productId: number, product: Partial<ShopifyProduct>): Promise<{ product: ShopifyProduct }> {
    return this.makeRequest<{ product: ShopifyProduct }>(`/products/${productId}.json`, 'PUT', { product })
  }

  async deleteProduct(productId: number): Promise<void> {
    await this.makeRequest(`/products/${productId}.json`, 'DELETE')
  }

  // Variant Management
  async getVariant(variantId: number): Promise<{ variant: ShopifyVariant }> {
    return this.makeRequest<{ variant: ShopifyVariant }>(`/variants/${variantId}.json`)
  }

  async updateVariant(variantId: number, variant: Partial<ShopifyVariant>): Promise<{ variant: ShopifyVariant }> {
    return this.makeRequest<{ variant: ShopifyVariant }>(`/variants/${variantId}.json`, 'PUT', { variant })
  }

  // Inventory Management
  async getInventoryLevels(params?: {
    inventory_item_ids?: string
    location_ids?: string
    limit?: number
    updated_at_min?: string
  }): Promise<{ inventory_levels: ShopifyInventoryLevel[] }> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, value.toString())
        }
      })
    }
    
    const endpoint = `/inventory_levels.json${query.toString() ? '?' + query.toString() : ''}`
    return this.makeRequest<{ inventory_levels: ShopifyInventoryLevel[] }>(endpoint)
  }

  async setInventoryLevel(
    inventoryItemId: number,
    locationId: number,
    available: number,
    disconnectIfNecessary: boolean = false
  ): Promise<{ inventory_level: ShopifyInventoryLevel }> {
    const data = {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available,
      disconnect_if_necessary: disconnectIfNecessary
    }
    
    return this.makeRequest<{ inventory_level: ShopifyInventoryLevel }>('/inventory_levels/set.json', 'POST', data)
  }

  async adjustInventoryLevel(
    inventoryItemId: number,
    locationId: number,
    quantityAdjustment: number
  ): Promise<{ inventory_level: ShopifyInventoryLevel }> {
    const data = {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      quantity_adjustment: quantityAdjustment
    }
    
    return this.makeRequest<{ inventory_level: ShopifyInventoryLevel }>('/inventory_levels/adjust.json', 'POST', data)
  }

  // Location Management
  async getLocations(): Promise<{ locations: ShopifyLocation[] }> {
    return this.makeRequest<{ locations: ShopifyLocation[] }>('/locations.json')
  }

  async getLocation(locationId: number): Promise<{ location: ShopifyLocation }> {
    return this.makeRequest<{ location: ShopifyLocation }>(`/locations/${locationId}.json`)
  }

  // Order Management
  async getOrders(params?: {
    status?: 'open' | 'closed' | 'cancelled' | 'any'
    financial_status?: string
    fulfillment_status?: string
    created_at_min?: string
    created_at_max?: string
    updated_at_min?: string
    updated_at_max?: string
    processed_at_min?: string
    processed_at_max?: string
    since_id?: number
    limit?: number
    fields?: string
  }): Promise<{ orders: ShopifyOrder[] }> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, value.toString())
        }
      })
    }
    
    const endpoint = `/orders.json${query.toString() ? '?' + query.toString() : ''}`
    return this.makeRequest<{ orders: ShopifyOrder[] }>(endpoint)
  }

  async getOrder(orderId: number, fields?: string[]): Promise<{ order: ShopifyOrder }> {
    const query = fields ? `?fields=${fields.join(',')}` : ''
    return this.makeRequest<{ order: ShopifyOrder }>(`/orders/${orderId}.json${query}`)
  }

  async updateOrder(orderId: number, order: Partial<ShopifyOrder>): Promise<{ order: ShopifyOrder }> {
    return this.makeRequest<{ order: ShopifyOrder }>(`/orders/${orderId}.json`, 'PUT', { order })
  }

  // Webhook Management
  async getWebhooks(): Promise<{ webhooks: ShopifyWebhook[] }> {
    return this.makeRequest<{ webhooks: ShopifyWebhook[] }>('/webhooks.json')
  }

  async createWebhook(webhook: {
    topic: string
    address: string
    format?: 'json' | 'xml'
    fields?: string[]
  }): Promise<{ webhook: ShopifyWebhook }> {
    return this.makeRequest<{ webhook: ShopifyWebhook }>('/webhooks.json', 'POST', { webhook })
  }

  async updateWebhook(webhookId: number, webhook: Partial<ShopifyWebhook>): Promise<{ webhook: ShopifyWebhook }> {
    return this.makeRequest<{ webhook: ShopifyWebhook }>(`/webhooks/${webhookId}.json`, 'PUT', { webhook })
  }

  async deleteWebhook(webhookId: number): Promise<void> {
    await this.makeRequest(`/webhooks/${webhookId}.json`, 'DELETE')
  }

  // Webhook Processing
  verifyWebhook(data: string, hmacHeader: string): boolean {
    const crypto = require('crypto')
    const calculatedHmac = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(data, 'utf8')
      .digest('base64')
    
    return crypto.timingSafeEqual(Buffer.from(calculatedHmac), Buffer.from(hmacHeader))
  }

  async processWebhook(topic: string, data: any): Promise<void> {
    try {
      this.emit('webhook:received', { topic, data })
      
      switch (topic) {
        case 'orders/create':
          await this.handleOrderCreated(data)
          break
        case 'orders/updated':
          await this.handleOrderUpdated(data)
          break
        case 'orders/paid':
          await this.handleOrderPaid(data)
          break
        case 'orders/cancelled':
          await this.handleOrderCancelled(data)
          break
        case 'orders/fulfilled':
          await this.handleOrderFulfilled(data)
          break
        case 'products/create':
          await this.handleProductCreated(data)
          break
        case 'products/update':
          await this.handleProductUpdated(data)
          break
        case 'products/delete':
          await this.handleProductDeleted(data)
          break
        case 'inventory_levels/update':
          await this.handleInventoryLevelUpdated(data)
          break
        default:
          console.warn(`Unhandled webhook topic: ${topic}`)
      }
    } catch (error) {
      console.error(`Error processing webhook ${topic}:`, error)
      this.emit('webhook:error', { topic, data, error })
    }
  }

  private async handleOrderCreated(order: ShopifyOrder): Promise<void> {
    console.log(`Order created: ${order.name} (${order.id})`)
    
    // Reserve inventory for order items
    for (const lineItem of order.line_items) {
      if (lineItem.variant_id && lineItem.fulfillable_quantity > 0) {
        this.emit('inventory:reserve', {
          variantId: lineItem.variant_id,
          quantity: lineItem.fulfillable_quantity,
          orderId: order.id,
          orderName: order.name
        })
      }
    }
    
    this.emit('order:created', order)
  }

  private async handleOrderUpdated(order: ShopifyOrder): Promise<void> {
    console.log(`Order updated: ${order.name} (${order.id})`)
    this.emit('order:updated', order)
  }

  private async handleOrderPaid(order: ShopifyOrder): Promise<void> {
    console.log(`Order paid: ${order.name} (${order.id})`)
    this.emit('order:paid', order)
  }

  private async handleOrderCancelled(order: ShopifyOrder): Promise<void> {
    console.log(`Order cancelled: ${order.name} (${order.id})`)
    
    // Release reserved inventory
    for (const lineItem of order.line_items) {
      if (lineItem.variant_id && lineItem.quantity > 0) {
        this.emit('inventory:release', {
          variantId: lineItem.variant_id,
          quantity: lineItem.quantity,
          orderId: order.id,
          orderName: order.name
        })
      }
    }
    
    this.emit('order:cancelled', order)
  }

  private async handleOrderFulfilled(order: ShopifyOrder): Promise<void> {
    console.log(`Order fulfilled: ${order.name} (${order.id})`)
    
    // Update inventory levels
    for (const lineItem of order.line_items) {
      if (lineItem.variant_id && lineItem.quantity > 0) {
        this.emit('inventory:fulfilled', {
          variantId: lineItem.variant_id,
          quantity: lineItem.quantity,
          orderId: order.id,
          orderName: order.name
        })
      }
    }
    
    this.emit('order:fulfilled', order)
  }

  private async handleProductCreated(product: ShopifyProduct): Promise<void> {
    console.log(`Product created: ${product.title} (${product.id})`)
    this.emit('product:created', product)
  }

  private async handleProductUpdated(product: ShopifyProduct): Promise<void> {
    console.log(`Product updated: ${product.title} (${product.id})`)
    this.emit('product:updated', product)
  }

  private async handleProductDeleted(product: { id: number }): Promise<void> {
    console.log(`Product deleted: ${product.id}`)
    this.emit('product:deleted', product)
  }

  private async handleInventoryLevelUpdated(inventoryLevel: ShopifyInventoryLevel): Promise<void> {
    console.log(`Inventory level updated: Item ${inventoryLevel.inventory_item_id} at location ${inventoryLevel.location_id} = ${inventoryLevel.available}`)
    this.emit('inventory:updated', inventoryLevel)
  }

  // Bulk Operations
  async syncAllProducts(): Promise<void> {
    console.log('Starting full product sync...')
    let page = 1
    const limit = 250 // Maximum allowed by Shopify
    
    try {
      while (true) {
        const { products } = await this.getProducts({
          limit,
          page
        } as any)
        
        if (products.length === 0) break
        
        for (const product of products) {
          this.emit('product:sync', product)
        }
        
        console.log(`Synced ${products.length} products (page ${page})`)
        
        if (products.length < limit) break
        page++
        
        // Rate limiting delay
        await this.sleep(this.config.rateLimitDelay)
      }
      
      console.log('Product sync completed')
      this.emit('sync:products:complete')
      
    } catch (error) {
      console.error('Product sync failed:', error)
      this.emit('sync:products:error', error)
      throw error
    }
  }

  async syncAllOrders(since?: Date): Promise<void> {
    console.log('Starting order sync...')
    const params: any = {
      limit: 250,
      status: 'any'
    }
    
    if (since) {
      params.created_at_min = since.toISOString()
    }
    
    try {
      let hasMore = true
      let sinceId = 0
      
      while (hasMore) {
        if (sinceId > 0) {
          params.since_id = sinceId
        }
        
        const { orders } = await this.getOrders(params)
        
        if (orders.length === 0) {
          hasMore = false
          break
        }
        
        for (const order of orders) {
          this.emit('order:sync', order)
          sinceId = Math.max(sinceId, order.id)
        }
        
        console.log(`Synced ${orders.length} orders`)
        
        if (orders.length < params.limit) {
          hasMore = false
        }
        
        // Rate limiting delay
        await this.sleep(this.config.rateLimitDelay)
      }
      
      console.log('Order sync completed')
      this.emit('sync:orders:complete')
      
    } catch (error) {
      console.error('Order sync failed:', error)
      this.emit('sync:orders:error', error)
      throw error
    }
  }

  async syncInventoryLevels(): Promise<void> {
    console.log('Starting inventory sync...')
    
    try {
      const { locations } = await this.getLocations()
      
      for (const location of locations) {
        if (!location.active) continue
        
        console.log(`Syncing inventory for location: ${location.name}`)
        
        const { inventory_levels } = await this.getInventoryLevels({
          location_ids: location.id.toString(),
          limit: 250
        })
        
        for (const level of inventory_levels) {
          this.emit('inventory:sync', level)
        }
        
        console.log(`Synced ${inventory_levels.length} inventory levels for ${location.name}`)
        
        // Rate limiting delay
        await this.sleep(this.config.rateLimitDelay)
      }
      
      console.log('Inventory sync completed')
      this.emit('sync:inventory:complete')
      
    } catch (error) {
      console.error('Inventory sync failed:', error)
      this.emit('sync:inventory:error', error)
      throw error
    }
  }

  // Setup and Configuration
  async setupWebhooks(webhookBaseUrl: string): Promise<void> {
    const requiredWebhooks = [
      'orders/create',
      'orders/updated',
      'orders/paid',
      'orders/cancelled',
      'orders/fulfilled',
      'products/create',
      'products/update',
      'products/delete',
      'inventory_levels/update'
    ]
    
    try {
      // Get existing webhooks
      const { webhooks: existingWebhooks } = await this.getWebhooks()
      
      for (const topic of requiredWebhooks) {
        const existingWebhook = existingWebhooks.find(w => w.topic === topic && w.address.startsWith(webhookBaseUrl))
        
        if (!existingWebhook) {
          // Create new webhook
          const webhook = await this.createWebhook({
            topic,
            address: `${webhookBaseUrl}/webhooks/shopify/${topic.replace('/', '-')}`,
            format: 'json'
          })
          
          console.log(`Created webhook for ${topic}: ${webhook.webhook.id}`)
        } else {
          console.log(`Webhook for ${topic} already exists: ${existingWebhook.id}`)
        }
      }
      
      console.log('Webhook setup completed')
      
    } catch (error) {
      console.error('Webhook setup failed:', error)
      throw error
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const { products } = await this.getProducts({ limit: 1 })
      console.log('Shopify connection test successful')
      return true
    } catch (error) {
      console.error('Shopify connection test failed:', error)
      return false
    }
  }

  // Utility Methods
  getShopInfo(): { shop: string; apiVersion: string } {
    return {
      shop: this.config.shop,
      apiVersion: this.config.apiVersion
    }
  }

  getRateLimitStatus(): typeof this.rateLimitState {
    return { ...this.rateLimitState }
  }
}