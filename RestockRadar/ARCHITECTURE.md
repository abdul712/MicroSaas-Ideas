# RestockRadar - System Architecture

## Executive Summary

RestockRadar is an enterprise-grade AI-powered inventory management platform that enables businesses to optimize stock levels, automate reordering, and forecast demand using machine learning. The system follows modern SaaS architectural patterns with multi-tenancy, real-time synchronization, and comprehensive analytics.

## System Overview

### Core Capabilities
- **AI-Powered Demand Forecasting**: ML models for predicting inventory needs
- **Multi-Channel Inventory Sync**: Real-time synchronization across e-commerce platforms
- **Automated Reordering**: Intelligent purchase order generation and supplier management
- **Advanced Analytics**: Comprehensive reporting and business intelligence
- **Multi-Tenant SaaS**: Scalable architecture supporting thousands of businesses

### Technology Stack

```typescript
interface TechnologyStack {
  frontend: {
    framework: 'Next.js 14 with App Router';
    language: 'TypeScript 5.0+';
    ui: 'Tailwind CSS + shadcn/ui + Framer Motion';
    state: 'Zustand + TanStack Query';
    forms: 'React Hook Form + Zod';
    charts: 'Recharts + Observable Plot';
  };
  backend: {
    api: 'Next.js API Routes + tRPC';
    auth: 'NextAuth.js + Clerk';
    validation: 'Zod';
    queue: 'BullMQ + Redis';
    cron: 'node-cron + agenda';
  };
  database: {
    primary: 'PostgreSQL 15+ with Prisma ORM';
    cache: 'Redis 7+';
    analytics: 'ClickHouse or TimescaleDB';
    search: 'Typesense';
  };
  ai_ml: {
    forecasting: 'TensorFlow.js + Prophet.js';
    processing: 'Python microservices';
    hosting: 'Modal or Replicate';
  };
  infrastructure: {
    hosting: 'Vercel + Railway';
    monitoring: 'Better Stack + Sentry';
    cdn: 'Cloudflare';
    email: 'Resend';
    sms: 'Twilio';
  };
}
```

## Architecture Diagrams

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend Layer                            │
├─────────────────────────────────────────────────────────────────────┤
│  Next.js 14 Dashboard    │  Mobile App        │  Widget Library     │
│  (React + TypeScript)    │  (React Native)    │  (Vanilla JS)       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ API Gateway
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            API Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│  Next.js API Routes      │  tRPC Procedures   │  GraphQL Endpoints  │
│  Authentication          │  Rate Limiting     │  Input Validation   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│   Business Logic    │ │   Integration       │ │   ML/AI Services    │
│                     │ │   Services          │ │                     │
│ • Inventory Mgmt    │ │ • Shopify API       │ │ • Demand Forecast   │
│ • Demand Planning   │ │ • Amazon SP-API     │ │ • Trend Analysis    │
│ • Order Automation  │ │ • eBay API          │ │ • Anomaly Detection │
│ • Analytics Engine  │ │ • WooCommerce       │ │ • Price Optimization│
│ • Notification Sys  │ │ • BigCommerce       │ │ • Supplier Scoring  │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│   Primary Database  │ │   Cache Layer       │ │   Message Queue     │
│                     │ │                     │ │                     │
│ PostgreSQL 15+      │ │ Redis 7+            │ │ BullMQ + Redis      │
│ • Transactional     │ │ • Session Cache     │ │ • Job Processing    │
│ • Multi-tenant      │ │ • API Cache         │ │ • Event Handling    │
│ • ACID Compliance   │ │ • Real-time Sync    │ │ • Notification Queue│
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│   Analytics DB      │ │   Search Engine     │ │   External APIs     │
│                     │ │                     │ │                     │
│ ClickHouse          │ │ Typesense           │ │ • Payment Gateways  │
│ • Time-series Data  │ │ • Product Search    │ │ • Email Services    │
│ • Business Metrics  │ │ • Full-text Search  │ │ • SMS Providers     │
│ • Real-time Analytics│ │ • Faceted Filters   │ │ • Shipping APIs     │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

### Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   E-commerce    │───▶│   Webhook       │───▶│   Event         │
│   Platform      │    │   Receiver      │    │   Processor     │
│   (Inventory    │    │   (API Gateway) │    │   (Lambda)      │
│   Updates)      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Analytics     │◀───│   Inventory     │◀───│   Real-time     │
│   Engine        │    │   Synchronizer  │    │   Event Bus     │
│   (ClickHouse)  │    │   (Database     │    │   (Redis        │
│                 │    │   Updates)      │    │   Pub/Sub)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ML Forecast   │    │   Reorder       │    │   Notification  │
│   Engine        │    │   Automation    │    │   Service       │
│   (Python)      │    │   (Business     │    │   (Multi-       │
│                 │    │   Rules)        │    │   Channel)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Database Architecture

### Multi-Tenant Data Model

```sql
-- Core tenant isolation
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  subscription_plan VARCHAR(50) DEFAULT 'free',
  api_rate_limit INTEGER DEFAULT 1000,
  storage_limit_gb INTEGER DEFAULT 10,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced stores with multi-platform support
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  platform_store_id VARCHAR(255),
  api_credentials JSONB,
  webhook_config JSONB,
  sync_settings JSONB DEFAULT '{}',
  last_sync TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_platform CHECK (platform IN (
    'shopify', 'woocommerce', 'bigcommerce', 'magento', 'amazon', 'ebay', 'custom'
  )),
  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'error', 'syncing'))
);

-- Products with enhanced metadata
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  vendor VARCHAR(255),
  product_type VARCHAR(255),
  tags TEXT[],
  sku VARCHAR(255),
  barcode VARCHAR(255),
  weight_grams INTEGER,
  dimensions JSONB, -- {length, width, height, unit}
  variants JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  seo_metadata JSONB DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_synced TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(store_id, external_id)
);

-- Locations for multi-warehouse support
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address JSONB,
  location_type VARCHAR(50) DEFAULT 'warehouse',
  is_primary BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_location_type CHECK (location_type IN (
    'warehouse', 'store', 'dropshipper', 'supplier', 'virtual'
  ))
);

-- Enhanced inventory tracking
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  variant_id VARCHAR(255),
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  reorder_point INTEGER DEFAULT 10,
  reorder_quantity INTEGER DEFAULT 50,
  max_stock INTEGER,
  min_stock INTEGER DEFAULT 0,
  cost_per_unit DECIMAL(10,2),
  safety_stock INTEGER DEFAULT 0,
  lead_time_days INTEGER DEFAULT 7,
  supplier_id UUID,
  last_counted TIMESTAMP,
  last_movement TIMESTAMP,
  abc_classification CHAR(1), -- A, B, or C for ABC analysis
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT non_negative_quantity CHECK (quantity >= 0),
  CONSTRAINT non_negative_reserved CHECK (reserved_quantity >= 0),
  CONSTRAINT valid_abc_class CHECK (abc_classification IN ('A', 'B', 'C'))
);

-- Inventory movements with comprehensive audit trail
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type VARCHAR(50) NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  reference_type VARCHAR(50),
  reference_id VARCHAR(255),
  batch_id VARCHAR(255),
  expiry_date DATE,
  notes TEXT,
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_movement_type CHECK (movement_type IN (
    'sale', 'purchase', 'adjustment', 'transfer_in', 'transfer_out',
    'return', 'damaged', 'expired', 'lost', 'found', 'cycle_count'
  )),
  CONSTRAINT valid_reference_type CHECK (reference_type IN (
    'order', 'purchase_order', 'transfer', 'adjustment', 'cycle_count', 'system'
  ))
);

-- Suppliers for procurement management
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  contact_info JSONB,
  payment_terms VARCHAR(100),
  lead_time_days INTEGER DEFAULT 7,
  minimum_order_value DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  performance_metrics JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase orders for automated procurement
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  order_date DATE NOT NULL,
  expected_delivery DATE,
  actual_delivery DATE,
  total_amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_po_status CHECK (status IN (
    'draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled'
  )),
  CONSTRAINT valid_payment_status CHECK (payment_status IN (
    'pending', 'paid', 'partial', 'overdue'
  ))
);

-- Purchase order line items
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id VARCHAR(255),
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity_ordered * unit_cost) STORED,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Demand forecasting results
CREATE TABLE demand_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),
  forecast_date DATE NOT NULL,
  forecast_horizon_days INTEGER NOT NULL,
  predicted_demand INTEGER NOT NULL,
  confidence_interval JSONB, -- {lower_bound, upper_bound}
  model_used VARCHAR(50),
  model_accuracy DECIMAL(5,4),
  external_factors JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(product_id, location_id, forecast_date, forecast_horizon_days)
);

-- Notification queue for alerts and communications
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  priority INTEGER DEFAULT 0,
  recipient_type VARCHAR(20) NOT NULL,
  recipient_id VARCHAR(255) NOT NULL,
  channels JSONB DEFAULT '["email"]',
  subject VARCHAR(255),
  message TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  delivery_status VARCHAR(20) DEFAULT 'pending',
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_notification_type CHECK (notification_type IN (
    'low_stock', 'reorder_suggestion', 'stockout', 'demand_forecast',
    'price_alert', 'supplier_update', 'system_alert'
  )),
  CONSTRAINT valid_recipient_type CHECK (recipient_type IN (
    'user', 'store_owner', 'supplier', 'customer'
  )),
  CONSTRAINT valid_delivery_status CHECK (delivery_status IN (
    'pending', 'sent', 'delivered', 'failed', 'bounced'
  ))
);

-- Analytics events for business intelligence
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  properties JSONB DEFAULT '{}',
  user_id UUID,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Performance Indexes

```sql
-- Core performance indexes
CREATE INDEX idx_stores_tenant_platform ON stores(tenant_id, platform);
CREATE INDEX idx_products_store_active ON products(store_id, is_active);
CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_inventory_product_location ON inventory_items(product_id, location_id);
CREATE INDEX idx_inventory_reorder_check ON inventory_items(store_id, available_quantity, reorder_point) 
  WHERE available_quantity <= reorder_point;
CREATE INDEX idx_movements_item_created ON inventory_movements(inventory_item_id, created_at);
CREATE INDEX idx_movements_type_date ON inventory_movements(movement_type, created_at);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status, order_date);
CREATE INDEX idx_notifications_scheduled ON notification_queue(delivery_status, scheduled_for) 
  WHERE delivery_status = 'pending';
CREATE INDEX idx_forecasts_product_date ON demand_forecasts(product_id, forecast_date);
CREATE INDEX idx_analytics_store_type_created ON analytics_events(store_id, event_type, created_at);

-- Full-text search indexes
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_suppliers_search ON suppliers USING gin(to_tsvector('english', name));
```

## API Architecture

### tRPC Procedure Structure

```typescript
// Core API router structure
export const appRouter = router({
  // Authentication & tenant management
  auth: authRouter,
  tenant: tenantRouter,
  
  // Core inventory management
  inventory: inventoryRouter,
  products: productsRouter,
  locations: locationsRouter,
  movements: movementsRouter,
  
  // Procurement & suppliers
  suppliers: suppliersRouter,
  purchaseOrders: purchaseOrdersRouter,
  
  // Integrations & sync
  integrations: integrationsRouter,
  sync: syncRouter,
  
  // AI & forecasting
  forecasting: forecastingRouter,
  analytics: analyticsRouter,
  
  // Notifications & alerts
  notifications: notificationsRouter,
  alerts: alertsRouter,
  
  // Settings & configuration
  settings: settingsRouter,
  billing: billingRouter
});

// Example inventory router
export const inventoryRouter = router({
  // Query procedures
  getAll: publicProcedure
    .input(z.object({
      storeId: z.string().uuid(),
      locationId: z.string().uuid().optional(),
      filters: inventoryFiltersSchema.optional(),
      pagination: paginationSchema.optional()
    }))
    .query(async ({ input, ctx }) => {
      return ctx.db.inventory.findMany({
        where: {
          product: { storeId: input.storeId },
          locationId: input.locationId,
          ...buildFilters(input.filters)
        },
        include: {
          product: true,
          location: true,
          movements: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        },
        ...buildPagination(input.pagination)
      });
    }),
    
  // Mutation procedures
  updateQuantity: protectedProcedure
    .input(z.object({
      inventoryItemId: z.string().uuid(),
      newQuantity: z.number().min(0),
      movementType: z.enum(['adjustment', 'cycle_count']),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const item = await tx.inventoryItem.findUnique({
          where: { id: input.inventoryItemId }
        });
        
        if (!item) throw new TRPCError({ code: 'NOT_FOUND' });
        
        // Create movement record
        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: input.inventoryItemId,
            movementType: input.movementType,
            quantityChange: input.newQuantity - item.quantity,
            quantityBefore: item.quantity,
            quantityAfter: input.newQuantity,
            notes: input.notes,
            userId: ctx.user.id
          }
        });
        
        // Update inventory quantity
        return tx.inventoryItem.update({
          where: { id: input.inventoryItemId },
          data: { 
            quantity: input.newQuantity,
            lastMovement: new Date()
          }
        });
      });
    }),
    
  // Real-time subscription
  onInventoryChange: publicProcedure
    .input(z.object({ storeId: z.string().uuid() }))
    .subscription(async ({ input }) => {
      return observable<InventoryItem>((emit) => {
        const unsubscribe = ee.on('inventory:updated', (data) => {
          if (data.storeId === input.storeId) {
            emit.next(data.item);
          }
        });
        
        return unsubscribe;
      });
    })
});
```

### Authentication & Authorization

```typescript
// Multi-tenant JWT structure
interface JWTPayload {
  sub: string; // User ID
  tenantId: string;
  storeIds: string[];
  roles: string[];
  permissions: string[];
  plan: string;
  exp: number;
  iat: number;
}

// Role-based access control
const permissions = {
  'store:read': ['owner', 'manager', 'staff'],
  'store:write': ['owner', 'manager'],
  'inventory:read': ['owner', 'manager', 'staff'],
  'inventory:write': ['owner', 'manager'],
  'analytics:read': ['owner', 'manager'],
  'settings:write': ['owner'],
  'billing:read': ['owner'],
  'api:access': ['owner', 'manager']
};

// Authorization middleware
export const authorize = (permission: string) => {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    
    const hasPermission = ctx.user.roles.some(role => 
      permissions[permission]?.includes(role)
    );
    
    if (!hasPermission) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    
    return next();
  });
};
```

## AI/ML Architecture

### Demand Forecasting Pipeline

```typescript
// ML service interface
interface ForecastingService {
  trainModel(productId: string, historicalData: SalesData[]): Promise<ModelMetrics>;
  generateForecast(productId: string, horizon: number): Promise<ForecastResult>;
  evaluateAccuracy(productId: string, actualSales: SalesData[]): Promise<AccuracyMetrics>;
  retrain(): Promise<void>;
}

// Prophet.js implementation
class ProphetForecaster implements ForecastingService {
  async generateForecast(productId: string, horizon: number): Promise<ForecastResult> {
    const historicalData = await this.getHistoricalSales(productId);
    
    // Prepare data for Prophet
    const ds = historicalData.map(d => d.date);
    const y = historicalData.map(d => d.quantity);
    
    // Create and fit Prophet model
    const prophet = new Prophet({
      growth: 'linear',
      yearly_seasonality: true,
      weekly_seasonality: true,
      daily_seasonality: false
    });
    
    await prophet.fit({ ds, y });
    
    // Generate future dates
    const future = prophet.make_future_dataframe(horizon);
    
    // Generate forecast
    const forecast = await prophet.predict(future);
    
    return {
      productId,
      predictions: forecast.yhat,
      confidenceInterval: {
        lower: forecast.yhat_lower,
        upper: forecast.yhat_upper
      },
      trend: forecast.trend,
      seasonal: forecast.seasonal,
      accuracy: await this.calculateAccuracy(productId, forecast)
    };
  }
}

// Ensemble forecasting
class EnsembleForecaster {
  private models: ForecastingService[] = [
    new ProphetForecaster(),
    new ARIMAForecaster(),
    new LSTMForecaster()
  ];
  
  async generateForecast(productId: string, horizon: number): Promise<ForecastResult> {
    // Generate forecasts from all models
    const forecasts = await Promise.all(
      this.models.map(model => model.generateForecast(productId, horizon))
    );
    
    // Weight models based on historical accuracy
    const weights = await this.getModelWeights(productId);
    
    // Combine forecasts using weighted average
    return this.combineForecasts(forecasts, weights);
  }
}
```

### Automated Reordering Logic

```typescript
// Intelligent reorder calculation
class ReorderOptimizer {
  async calculateOptimalReorder(inventoryItem: InventoryItem): Promise<ReorderSuggestion> {
    const forecast = await this.forecastingService.generateForecast(
      inventoryItem.productId, 
      30 // 30-day horizon
    );
    
    const leadTime = inventoryItem.leadTimeDays || 7;
    const serviceLevel = 0.95; // 95% service level
    
    // Calculate demand during lead time
    const leadTimeDemand = this.calculateLeadTimeDemand(forecast, leadTime);
    
    // Calculate safety stock using normal distribution
    const demandVariability = this.calculateDemandVariability(forecast);
    const safetyStock = this.calculateSafetyStock(
      demandVariability, 
      leadTime, 
      serviceLevel
    );
    
    // Optimal reorder point
    const reorderPoint = leadTimeDemand + safetyStock;
    
    // Economic order quantity (EOQ)
    const annualDemand = forecast.predictions.reduce((sum, val) => sum + val, 0) * 12;
    const orderingCost = inventoryItem.orderingCost || 50;
    const holdingCost = inventoryItem.holdingCost || inventoryItem.costPerUnit * 0.2;
    
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
    
    return {
      productId: inventoryItem.productId,
      currentQuantity: inventoryItem.availableQuantity,
      reorderPoint,
      recommendedOrderQuantity: eoq,
      safetyStock,
      urgency: this.calculateUrgency(inventoryItem.availableQuantity, reorderPoint),
      costImpact: this.calculateCostImpact(eoq, inventoryItem.costPerUnit),
      confidence: forecast.accuracy
    };
  }
  
  private calculateUrgency(currentStock: number, reorderPoint: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = currentStock / reorderPoint;
    
    if (ratio <= 0.5) return 'critical';
    if (ratio <= 0.8) return 'high';
    if (ratio <= 1.0) return 'medium';
    return 'low';
  }
}
```

## Real-Time Synchronization

### Event-Driven Architecture

```typescript
// Event system for real-time updates
interface InventoryEvent {
  type: 'QUANTITY_CHANGED' | 'PRODUCT_ADDED' | 'REORDER_TRIGGERED';
  tenantId: string;
  storeId: string;
  productId: string;
  data: Record<string, any>;
  timestamp: Date;
  source: string;
}

class EventBus {
  private redis: Redis;
  private subscribers = new Map<string, Set<EventHandler>>();
  
  async publish(event: InventoryEvent): Promise<void> {
    // Publish to Redis for cross-instance communication
    await this.redis.publish('inventory:events', JSON.stringify(event));
    
    // Notify local subscribers
    const handlers = this.subscribers.get(event.type) || new Set();
    await Promise.all(
      Array.from(handlers).map(handler => handler(event))
    );
  }
  
  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(eventType)?.delete(handler);
    };
  }
}

// Webhook processor for external platforms
class WebhookProcessor {
  async processShopifyWebhook(payload: ShopifyWebhookPayload): Promise<void> {
    const event: InventoryEvent = {
      type: 'QUANTITY_CHANGED',
      tenantId: payload.store.tenant_id,
      storeId: payload.store.id,
      productId: payload.product.id,
      data: {
        newQuantity: payload.inventory_quantity,
        previousQuantity: payload.previous_inventory_quantity,
        variant: payload.variant
      },
      timestamp: new Date(payload.updated_at),
      source: 'shopify'
    };
    
    await this.eventBus.publish(event);
  }
  
  async syncInventoryToShopify(inventoryItem: InventoryItem): Promise<void> {
    const shopifyClient = await this.getShopifyClient(inventoryItem.storeId);
    
    await shopifyClient.inventoryLevel.set({
      location_id: inventoryItem.location.externalId,
      inventory_item_id: inventoryItem.product.externalId,
      available: inventoryItem.availableQuantity
    });
  }
}
```

## Security Architecture

### Multi-Tenant Security

```typescript
// Row-level security implementation
class TenantSecurityMiddleware {
  async setTenantContext(tenantId: string): Promise<void> {
    // Set PostgreSQL session variable for RLS
    await this.db.$executeRaw`SET app.current_tenant = ${tenantId}`;
  }
  
  validateTenantAccess(userId: string, tenantId: string): boolean {
    const userTenants = this.getUserTenants(userId);
    return userTenants.includes(tenantId);
  }
}

// API rate limiting per tenant
class TenantRateLimiter {
  private limiters = new Map<string, RateLimiterRedis>();
  
  async checkRateLimit(tenantId: string, plan: string): Promise<boolean> {
    const limits = this.getPlanLimits(plan);
    
    if (!this.limiters.has(tenantId)) {
      this.limiters.set(tenantId, new RateLimiterRedis({
        keyPrefix: `tenant:${tenantId}`,
        points: limits.requestsPerHour,
        duration: 3600,
        storeClient: this.redis
      }));
    }
    
    try {
      await this.limiters.get(tenantId)!.consume(tenantId);
      return true;
    } catch {
      return false;
    }
  }
}
```

### Data Encryption

```typescript
// Encryption for sensitive data
class DataEncryption {
  private key: Buffer;
  
  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'base64');
  }
  
  encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.key);
    cipher.setAAD(iv);
    
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }
  
  decrypt(encryptedData: string): string {
    const [ivBase64, authTagBase64, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipher('aes-256-gcm', this.key);
    decipher.setAAD(iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

## Monitoring & Observability

### Application Performance Monitoring

```typescript
// OpenTelemetry integration
import { trace, metrics } from '@opentelemetry/api';

class PerformanceMonitoring {
  private tracer = trace.getTracer('restockradar');
  private meter = metrics.getMeter('restockradar');
  
  // Custom metrics
  private inventoryUpdateCounter = this.meter.createCounter('inventory_updates_total');
  private forecastAccuracyGauge = this.meter.createUpDownCounter('forecast_accuracy');
  private apiLatencyHistogram = this.meter.createHistogram('api_latency_ms');
  
  trackInventoryUpdate(storeId: string, productId: string): void {
    this.inventoryUpdateCounter.add(1, {
      store_id: storeId,
      product_id: productId
    });
  }
  
  trackForecastAccuracy(productId: string, accuracy: number): void {
    this.forecastAccuracyGauge.add(accuracy, {
      product_id: productId
    });
  }
  
  async trackAPICall<T>(
    operation: string, 
    fn: () => Promise<T>
  ): Promise<T> {
    const span = this.tracer.startSpan(operation);
    const startTime = Date.now();
    
    try {
      const result = await fn();
      span.setStatus({ code: trace.SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: trace.SpanStatusCode.ERROR,
        message: error.message
      });
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.apiLatencyHistogram.record(duration, {
        operation,
        status: span.status?.code === trace.SpanStatusCode.OK ? 'success' : 'error'
      });
      span.end();
    }
  }
}
```

## Deployment Architecture

### Docker Configuration

```dockerfile
# Multi-stage build for production optimization
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV production

CMD ["node", "server.js"]
```

### Infrastructure as Code

```yaml
# docker-compose.yml for local development
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/restockradar
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
      - clickhouse
  
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: restockradar
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./prisma/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  clickhouse:
    image: clickhouse/clickhouse-server:latest
    ports:
      - "8123:8123"
      - "9000:9000"
    volumes:
      - clickhouse_data:/var/lib/clickhouse
  
  typesense:
    image: typesense/typesense:0.25.0
    ports:
      - "8108:8108"
    environment:
      TYPESENSE_DATA_DIR: /data
      TYPESENSE_API_KEY: development-key
    volumes:
      - typesense_data:/data

volumes:
  postgres_data:
  clickhouse_data:
  typesense_data:
```

This comprehensive architecture provides the foundation for building RestockRadar as an enterprise-grade inventory management platform. The design emphasizes scalability, security, real-time performance, and maintainability while following modern SaaS development best practices.