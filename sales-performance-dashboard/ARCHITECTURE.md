# Sales Performance Dashboard - System Architecture

## 🏗️ Overview

The Sales Performance Dashboard is a real-time analytics SaaS platform built with a microservices architecture, event-driven data processing, and AI-powered insights.

## 🎯 Architecture Principles

1. **Microservices First**: Loosely coupled services for scalability
2. **Event-Driven**: Real-time data processing with event sourcing
3. **Multi-Tenant**: Secure data isolation per organization
4. **API-First**: Comprehensive REST and GraphQL APIs
5. **Cloud-Native**: Container-based deployment with auto-scaling

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer (NGINX)                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                     API Gateway                                 │
│              (Rate Limiting, Auth, CORS)                       │
└─────────┬─────────────────────────────────────────────┬─────────┘
          │                                             │
┌─────────▼─────────┐                         ┌─────────▼─────────┐
│   Frontend App    │                         │   WebSocket       │
│   (Next.js 14)    │                         │   Service         │
│   - Dashboard UI  │                         │   - Real-time     │
│   - Charts/Viz    │                         │   - Notifications │
│   - Mobile        │                         │   - Live Updates  │
└───────────────────┘                         └───────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
┌───▼─────────┐    ┌─────────▼──────┐    ┌─────────────▼─┐
│   Auth      │    │  Analytics     │    │  Integration  │
│   Service   │    │  Engine        │    │  Hub          │
│   - JWT     │    │  - Real-time   │    │  - CRM APIs   │
│   - OAuth   │    │  - KPI Calc    │    │  - Webhooks   │
│   - RBAC    │    │  - Aggregation │    │  - ETL Jobs   │
└─────┬───────┘    └────────┬───────┘    └───────┬───────┘
      │                     │                    │
      │    ┌────────────────┼────────────────────┼──────────┐
      │    │                │                    │          │
┌─────▼────▼─┐    ┌─────────▼──────┐    ┌───────▼──┐   ┌───▼────┐
│ PostgreSQL │    │   TimescaleDB  │    │  Redis   │   │ ClickHouse│
│ (Primary)  │    │ (Time-series)  │    │ (Cache)  │   │(Analytics)│
│ - Users    │    │ - Metrics      │    │ - Sessions│   │ - OLAP    │
│ - Orgs     │    │ - Events       │    │ - Jobs    │   │ - Reports │
│ - Config   │    │ - Forecasts    │    │ - Pubsub  │   │ - Insights│
└────────────┘    └────────────────┘    └───────────┘   └─────────┘
                           │
              ┌────────────▼────────────┐
              │     ML Pipeline         │
              │   - Forecasting         │
              │   - Prophet/TensorFlow  │
              │   - Model Training      │
              │   - Batch Predictions   │
              └─────────────────────────┘
```

## 🔗 Service Architecture

### 1. API Gateway
- **Technology**: Express.js with custom middleware
- **Responsibilities**:
  - Request routing and load balancing
  - Rate limiting (100 req/min per user)
  - Authentication verification
  - CORS handling
  - Request/response logging

### 2. Authentication Service
- **Technology**: Node.js + Passport.js
- **Features**:
  - JWT token management (15min access, 7d refresh)
  - OAuth 2.0 providers (Google, Microsoft, Salesforce)
  - Multi-factor authentication (TOTP)
  - Role-based access control
  - Session management

### 3. Analytics Engine
- **Technology**: Node.js + Python (ML components)
- **Features**:
  - Real-time metric calculations
  - Time-series data aggregation
  - KPI processing and alerts
  - Forecasting model execution
  - Custom report generation

### 4. Integration Hub
- **Technology**: Node.js + Apache Kafka
- **Features**:
  - CRM API connectors (Salesforce, HubSpot, Pipedrive)
  - Webhook processors
  - ETL job scheduler
  - Data transformation pipelines
  - Error handling and retries

### 5. WebSocket Service
- **Technology**: Socket.IO
- **Features**:
  - Real-time dashboard updates
  - Live notifications
  - Collaborative features
  - Connection management
  - Room-based data distribution

## 💾 Database Design

### Primary Database (PostgreSQL)
```sql
-- Organizations (Multi-tenancy)
organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  settings JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Users
users (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  role_id UUID REFERENCES roles(id),
  profile JSONB,
  created_at TIMESTAMP
);

-- Integrations
integrations (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  type VARCHAR(50) NOT NULL, -- 'salesforce', 'hubspot', etc.
  config JSONB ENCRYPTED,
  status VARCHAR(20) DEFAULT 'active',
  last_sync TIMESTAMP
);

-- Dashboards
dashboards (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  config JSONB, -- Layout, widgets, filters
  is_public BOOLEAN DEFAULT false
);
```

### Time-Series Database (TimescaleDB)
```sql
-- Sales Metrics (Hypertable)
CREATE TABLE sales_metrics (
  time TIMESTAMPTZ NOT NULL,
  organization_id UUID NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL(15,2),
  dimensions JSONB, -- team_id, user_id, product_id, etc.
  metadata JSONB
);

SELECT create_hypertable('sales_metrics', 'time');

-- Continuous Aggregates for Performance
CREATE MATERIALIZED VIEW daily_sales_summary
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 day', time) AS day,
  organization_id,
  metric_type,
  SUM(value) as total_value,
  AVG(value) as avg_value,
  COUNT(*) as count
FROM sales_metrics
GROUP BY day, organization_id, metric_type;
```

### Analytics Database (ClickHouse)
```sql
-- Sales Events (For OLAP queries)
CREATE TABLE sales_events (
  timestamp DateTime,
  organization_id String,
  event_type LowCardinality(String),
  user_id String,
  deal_id String,
  amount Decimal(15,2),
  properties Map(String, String)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, timestamp);

-- Materialized Views for Fast Aggregations
CREATE MATERIALIZED VIEW daily_revenue_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (organization_id, date)
AS SELECT
  toDate(timestamp) as date,
  organization_id,
  sum(amount) as revenue
FROM sales_events
WHERE event_type = 'deal_closed_won'
GROUP BY date, organization_id;
```

## 🔄 Data Flow Architecture

### 1. Real-time Data Pipeline
```
CRM Webhook → API Gateway → Integration Hub → Kafka Stream → Analytics Engine
                                                    ↓
WebSocket Service ← TimescaleDB ← Data Processor ← Event Consumer
```

### 2. Batch Processing Pipeline
```
Scheduled Job → CRM API Fetch → Data Transformer → Bulk Insert → Aggregation Jobs
                                                         ↓
ML Pipeline ← Historical Data ← TimescaleDB ← Data Warehouse Sync
```

### 3. Query Processing
```
User Request → API Gateway → Analytics Engine → Query Optimizer → Database
                                     ↓                                ↓
Dashboard Update ← WebSocket ← Cache Check ← Result Processor ← Query Result
```

## 🚀 Deployment Architecture

### Container Strategy
```dockerfile
# Frontend Container
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

# Backend Service Container
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]

# ML Service Container
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sales-dashboard-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sales-dashboard-api
  template:
    metadata:
      labels:
        app: sales-dashboard-api
    spec:
      containers:
      - name: api
        image: sales-dashboard/api:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

## 🔒 Security Architecture

### Authentication Flow
```
User Login → OAuth Provider → JWT Token → API Gateway → Service Authorization
                    ↓                           ↓
User Context ← Decode Claims ← Verify Signature ← Token Validation
```

### Data Encryption
- **At Rest**: AES-256 encryption for sensitive data
- **In Transit**: TLS 1.3 for all communications
- **Application**: Field-level encryption for credentials

### Access Control
```json
{
  "roles": {
    "admin": ["*"],
    "manager": ["dashboard:read", "dashboard:write", "team:read"],
    "analyst": ["dashboard:read", "reports:read"],
    "viewer": ["dashboard:read"]
  },
  "resources": [
    "dashboard", "reports", "integrations", "users", "team"
  ]
}
```

## 📊 Performance Specifications

### Response Time Targets
- **Dashboard Load**: < 2 seconds
- **Real-time Updates**: < 500ms
- **Report Generation**: < 5 seconds
- **API Responses**: < 200ms (95th percentile)

### Scalability Targets
- **Concurrent Users**: 10,000+
- **Data Points**: 100M+ per month
- **API Requests**: 1M+ per day
- **Real-time Connections**: 1,000+ simultaneous

### Availability Targets
- **Uptime**: 99.9% (8.76 hours downtime/year)
- **Recovery Time**: < 5 minutes
- **Backup**: 4-hour RPO, 1-hour RTO

## 🔧 Technology Stack Summary

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts + D3.js
- **State**: Zustand + React Query

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **ORM**: Prisma
- **Validation**: Zod
- **Queue**: Bull/BullMQ with Redis

### Databases
- **Primary**: PostgreSQL 15
- **Time-series**: TimescaleDB
- **Cache**: Redis 7
- **Analytics**: ClickHouse (optional)

### Infrastructure
- **Containers**: Docker + Docker Compose
- **Orchestration**: Kubernetes
- **Load Balancer**: NGINX
- **CDN**: CloudFlare
- **Monitoring**: Grafana + Prometheus

### ML/AI
- **Forecasting**: Prophet
- **Advanced ML**: TensorFlow.js
- **Data Processing**: Apache Kafka
- **Model Serving**: TensorFlow Serving

## 🎯 Next Steps

1. **Database Schema Creation**: Implement PostgreSQL + TimescaleDB schemas
2. **API Design**: Create OpenAPI specifications
3. **Service Implementation**: Start with Authentication Service
4. **Frontend Setup**: Initialize Next.js 14 project
5. **Integration Framework**: Build CRM connector foundation