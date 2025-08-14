# Website Heatmap Tool - Enterprise Architecture

## 🏗️ System Architecture Overview

This document outlines the enterprise-grade architecture for the Website Heatmap Tool, designed to handle high-traffic websites with real-time analytics, privacy compliance, and AI-powered insights.

## 📊 Architecture Principles

### Core Design Principles
- **Privacy-First**: GDPR/CCPA compliance built into every component
- **Real-time Performance**: Sub-second event processing and visualization
- **Enterprise Security**: SOC 2 Type II compliance with comprehensive audit logging
- **Scalability**: Handle 10M+ events per day with auto-scaling
- **Multi-tenancy**: Secure data isolation between organizations

### Technical Standards
- **Microservices Architecture**: Domain-driven service decomposition
- **Event-Driven Design**: Async communication with event sourcing
- **API-First**: Comprehensive REST APIs with OpenAPI documentation
- **Container-Native**: Docker and Kubernetes for deployment
- **Observability**: Comprehensive monitoring and alerting

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Website A    │  Website B    │  Dashboard App │  Mobile App    │
│  + SDK        │  + SDK        │  (Next.js)     │  (Future)      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CDN LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  CloudFlare CDN   │  Geographic Distribution │  Edge Computing  │
│  SDK Delivery     │  <50ms Global Latency   │  Event Processing │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                              │
├─────────────────────────────────────────────────────────────────┤
│  Rate Limiting    │  Authentication      │  Request Routing     │
│  SSL Termination  │  API Versioning      │  Load Balancing      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Event          │  Analytics      │  User          │  Privacy   │
│  Collection     │  Processing     │  Management    │  Service   │
│  Service        │  Service        │  Service       │            │
├─────────────────┼─────────────────┼────────────────┼────────────┤
│  Heatmap        │  Session        │  AI Insights   │  Export    │
│  Generation     │  Replay         │  Service       │  Service   │
│  Service        │  Service        │                │            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MESSAGE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Apache Kafka Cluster                                          │
│  - Event Streaming    - Message Persistence    - Partitioning  │
│  - Real-time Processing    - Replay Capability    - Scaling    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL       │  ClickHouse        │  Redis Cluster        │
│  (Application)    │  (Time-series)     │  (Caching/Sessions)   │
│  - Users          │  - Events          │  - Session Data       │
│  - Organizations  │  - Heatmap Data    │  - Cache              │
│  - Websites       │  - Analytics       │  - Rate Limiting      │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Component Architecture

### 1. Frontend Architecture (Next.js 14)

#### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for client state, TanStack Query for server state
- **Visualization**: D3.js + Canvas API with WebGL acceleration
- **Build Tools**: Turbo for monorepo, SWC for compilation

#### Component Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard layouts
│   ├── api/               # API routes
│   └── globals.css
├── components/
│   ├── ui/                # Reusable UI components
│   ├── charts/            # Visualization components
│   ├── heatmap/           # Heatmap rendering
│   └── forms/             # Form components
├── lib/
│   ├── api/               # API client
│   ├── auth/              # Authentication
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript types
└── hooks/                 # Custom React hooks
```

#### Key Features
- **Real-time Dashboard**: WebSocket-based live analytics
- **Interactive Heatmaps**: Canvas-based rendering with zoom/pan
- **Advanced Filtering**: Dynamic segmentation and comparison
- **Export Capabilities**: High-resolution heatmap images and data export
- **Mobile Responsive**: Full functionality on all devices

### 2. Backend Microservices Architecture

#### 2.1 Event Collection Service
**Purpose**: High-performance event ingestion and initial processing

**Technology Stack**:
- Node.js with Fastify framework
- TypeScript for type safety
- Redis for event buffering
- Prometheus metrics

**Capabilities**:
- Handle 100K+ events per second
- Real-time event validation and filtering
- Automatic bot detection and filtering
- Privacy controls (PII detection)
- Geographic event routing

**API Endpoints**:
```typescript
POST /v1/events/collect     # Batch event collection
POST /v1/events/click       # Individual click events
POST /v1/events/scroll      # Scroll depth events
POST /v1/events/mouse       # Mouse movement events
GET  /v1/events/health      # Health check
```

#### 2.2 Analytics Processing Service
**Purpose**: Real-time event processing and aggregation

**Technology Stack**:
- Node.js with Apache Kafka integration
- ClickHouse for time-series data
- Redis for caching
- TensorFlow.js for ML processing

**Capabilities**:
- Real-time event stream processing
- Aggregation and statistical analysis
- Anomaly detection and alerting
- Performance metrics calculation
- Conversion funnel analysis

**Processing Pipeline**:
```
Raw Events → Validation → Enrichment → Aggregation → Storage
     ↓
Kafka Topic → Stream Processing → ClickHouse → Cache Update
```

#### 2.3 Heatmap Generation Service
**Purpose**: On-demand heatmap visualization generation

**Technology Stack**:
- Node.js with Canvas API
- Sharp for image processing
- Redis for caching
- WebGL for GPU acceleration

**Capabilities**:
- Multiple heatmap types (click, scroll, attention)
- Real-time heatmap updates
- High-resolution export (PNG, SVG, PDF)
- Responsive heatmap adaptation
- Batch generation for reports

**Generation Pipeline**:
```
Request → Data Query → Density Calculation → Canvas Rendering → Cache/Return
```

#### 2.4 User Management Service
**Purpose**: Authentication, authorization, and user lifecycle

**Technology Stack**:
- Node.js with Express
- PostgreSQL for user data
- JWT with refresh tokens
- OAuth2 integration

**Capabilities**:
- Multi-factor authentication
- Role-based access control (RBAC)
- Team management and invitations
- Subscription and billing integration
- Audit logging

#### 2.5 Privacy Service
**Purpose**: GDPR/CCPA compliance and data protection

**Technology Stack**:
- Node.js with specialized privacy libraries
- PostgreSQL for consent management
- Encryption at rest and in transit

**Capabilities**:
- Automatic PII detection and masking
- Consent management and enforcement
- Data subject rights (access, deletion, portability)
- Data retention policy enforcement
- Privacy impact assessments

#### 2.6 AI Insights Service
**Purpose**: Machine learning-powered behavioral analysis

**Technology Stack**:
- Python with FastAPI
- TensorFlow/PyTorch for ML models
- Apache Airflow for ML pipelines
- MLflow for model management

**Capabilities**:
- User behavior clustering and segmentation
- Conversion optimization recommendations
- Anomaly detection and alerting
- Predictive analytics
- A/B testing statistical analysis

### 3. Database Architecture

#### 3.1 PostgreSQL (Primary Database)
**Purpose**: Application data with ACID compliance

**Schema Design**:
```sql
-- Organizations and multi-tenancy
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users with RBAC
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Websites being tracked
CREATE TABLE websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    domain VARCHAR(255) NOT NULL,
    tracking_id UUID UNIQUE DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT TRUE,
    privacy_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy and consent management
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID REFERENCES websites(id),
    visitor_id VARCHAR(255) NOT NULL,
    consent_granted BOOLEAN NOT NULL,
    consent_categories JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.2 ClickHouse (Time-Series Analytics)
**Purpose**: High-performance analytics and event storage

**Schema Design**:
```sql
-- Event storage with partitioning
CREATE TABLE events (
    timestamp DateTime64(3),
    website_id String,
    session_id String,
    visitor_id String,
    event_type LowCardinality(String),
    page_url String,
    element_selector String,
    x_coordinate Int32,
    y_coordinate Int32,
    viewport_width Int32,
    viewport_height Int32,
    device_type LowCardinality(String),
    user_agent String,
    ip_address IPv4,
    country_code FixedString(2),
    created_date Date
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_date)
ORDER BY (website_id, created_date, timestamp)
SETTINGS index_granularity = 8192;

-- Pre-aggregated heatmap data
CREATE MATERIALIZED VIEW heatmap_data_hourly
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(created_date)
ORDER BY (website_id, page_url, created_date, hour)
AS SELECT
    website_id,
    page_url,
    toDate(timestamp) as created_date,
    toHour(timestamp) as hour,
    x_coordinate,
    y_coordinate,
    device_type,
    count() as click_count
FROM events
WHERE event_type = 'click'
GROUP BY website_id, page_url, created_date, hour, x_coordinate, y_coordinate, device_type;
```

#### 3.3 Redis Cluster
**Purpose**: Caching, session storage, and real-time data

**Data Structures**:
```redis
# User sessions
SET session:{session_id} "{user_data}" EX 3600

# Rate limiting
SET rate_limit:{api_key}:{endpoint} {count} EX 3600

# Real-time analytics cache
ZADD live_visitors:{website_id} {timestamp} {visitor_id}

# Heatmap cache
SET heatmap:{website_id}:{page_url}:{filters} "{heatmap_data}" EX 1800

# Event buffer for batch processing
LPUSH events_buffer:{website_id} "{event_data}"
```

### 4. Infrastructure Architecture

#### 4.1 Kubernetes Deployment
**Container Orchestration**: Kubernetes with Helm charts

**Deployment Structure**:
```yaml
# Namespace organization
apiVersion: v1
kind: Namespace
metadata:
  name: heatmap-production
---
# Microservice deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: event-collection-service
spec:
  replicas: 5
  selector:
    matchLabels:
      app: event-collection
  template:
    spec:
      containers:
      - name: event-collection
        image: heatmap/event-collection:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: KAFKA_BROKERS
          value: "kafka-cluster:9092"
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
```

#### 4.2 Service Mesh (Istio)
**Purpose**: Service-to-service communication, security, and observability

**Features**:
- Automatic TLS between services
- Circuit breaking and retries
- Traffic management and canary deployments
- Distributed tracing with Jaeger
- Metrics collection with Prometheus

#### 4.3 Monitoring and Observability

**Stack Components**:
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Dashboards and visualization
- **Jaeger**: Distributed tracing
- **ELK Stack**: Centralized logging
- **Sentry**: Error tracking and performance monitoring

**Key Metrics**:
```yaml
# Application metrics
- http_requests_total
- http_request_duration_seconds
- events_processed_total
- heatmap_generation_duration
- active_sessions_count

# Infrastructure metrics
- cpu_usage_percent
- memory_usage_bytes
- disk_usage_percent
- network_bytes_total

# Business metrics
- daily_active_users
- conversion_rate
- subscription_churn_rate
- revenue_per_customer
```

### 5. Security Architecture

#### 5.1 Authentication & Authorization
**Multi-layered Security**:

```typescript
// JWT Token Structure
interface JWTPayload {
  sub: string;           // User ID
  org: string;           // Organization ID
  role: string;          // User role
  permissions: string[]; // Granular permissions
  iat: number;          // Issued at
  exp: number;          // Expiration
}

// RBAC Permission Matrix
const permissions = {
  'admin': ['*'],
  'owner': ['org:*', 'user:*', 'website:*', 'analytics:*'],
  'manager': ['website:*', 'analytics:*', 'user:read'],
  'analyst': ['analytics:*', 'website:read'],
  'viewer': ['analytics:read', 'website:read']
};
```

#### 5.2 Data Encryption
**Encryption Standards**:
- **In Transit**: TLS 1.3 for all communications
- **At Rest**: AES-256 encryption for sensitive data
- **Application Level**: Field-level encryption for PII

```typescript
// Encryption service
class EncryptionService {
  async encryptPII(data: string): Promise<string> {
    // Use AWS KMS or similar for key management
    return encrypt(data, await this.getEncryptionKey());
  }
  
  async decryptPII(encryptedData: string): Promise<string> {
    return decrypt(encryptedData, await this.getDecryptionKey());
  }
}
```

#### 5.3 Privacy Controls
**GDPR/CCPA Compliance**:

```typescript
// Privacy service implementation
class PrivacyService {
  async detectPII(data: any): Promise<PIIDetectionResult> {
    // Use ML models to detect potential PII
    const patterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/ // Credit Card
    ];
    
    return this.analyzePII(data, patterns);
  }
  
  async anonymizeData(data: any): Promise<any> {
    // Apply k-anonymity and other anonymization techniques
    return this.applyAnonymization(data);
  }
}
```

### 6. Performance Architecture

#### 6.1 Caching Strategy
**Multi-Level Caching**:

```typescript
// Cache hierarchy
interface CacheStrategy {
  L1: 'Browser Cache';        // 1-5 minutes
  L2: 'CDN Cache';           // 15-60 minutes
  L3: 'Application Cache';   // 5-30 minutes (Redis)
  L4: 'Database Cache';      // Query result caching
}

// Cache implementation
class CacheService {
  async getHeatmapData(key: string): Promise<HeatmapData | null> {
    // Try L3 cache first
    let data = await this.redis.get(`heatmap:${key}`);
    if (data) return JSON.parse(data);
    
    // Fallback to database with L4 cache
    data = await this.database.getHeatmapData(key);
    if (data) {
      await this.redis.setex(`heatmap:${key}`, 1800, JSON.stringify(data));
    }
    
    return data;
  }
}
```

#### 6.2 Auto-Scaling Configuration
**Horizontal Pod Autoscaler (HPA)**:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: event-collection-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: event-collection-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 🚀 Deployment Architecture

### Development Environment
- **Local Development**: Docker Compose with hot reloading
- **Testing**: Kubernetes in Docker (kind) for integration tests
- **Staging**: Dedicated Kubernetes cluster for pre-production testing

### Production Environment
- **Cloud Provider**: AWS with multi-region deployment
- **Container Orchestration**: Amazon EKS with Fargate
- **Database**: Amazon RDS for PostgreSQL, self-managed ClickHouse cluster
- **Caching**: Amazon ElastiCache for Redis
- **CDN**: CloudFlare with edge computing capabilities
- **Monitoring**: Amazon CloudWatch + Datadog for comprehensive observability

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Run Tests
      run: npm test -- --coverage
    - name: Security Scan
      run: npm audit
    - name: Performance Tests
      run: npm run test:performance

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - name: Build Docker Images
      run: docker build -t heatmap/api:${{ github.sha }} .
    - name: Push to Registry
      run: docker push heatmap/api:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to Kubernetes
      run: |
        helm upgrade --install heatmap-api ./helm/api \
          --set image.tag=${{ github.sha }} \
          --namespace production
```

## 🔄 Data Flow Architecture

### Event Collection Flow
```
1. User Action on Website
   ↓
2. JavaScript SDK Captures Event
   ↓
3. Event Batching and Privacy Filtering
   ↓
4. Send to Event Collection Service (via CDN)
   ↓
5. Validation and Enrichment
   ↓
6. Publish to Kafka Topic
   ↓
7. Stream Processing (Analytics Service)
   ↓
8. Store in ClickHouse (Events) + PostgreSQL (Metadata)
   ↓
9. Update Real-time Cache (Redis)
   ↓
10. WebSocket Update to Dashboard (if active)
```

### Heatmap Generation Flow
```
1. User Requests Heatmap via Dashboard
   ↓
2. Check Cache (Redis L3)
   ↓
3. If Cache Miss: Query ClickHouse
   ↓
4. Apply Filters and Aggregations
   ↓
5. Generate Density Map
   ↓
6. Render Canvas/WebGL Visualization
   ↓
7. Cache Result and Return to Client
   ↓
8. Client Renders Interactive Heatmap
```

## 📈 Scalability Considerations

### Traffic Projections
- **Year 1**: 1M page views/month, 100 concurrent users
- **Year 2**: 10M page views/month, 1K concurrent users
- **Year 3**: 100M page views/month, 10K concurrent users

### Scaling Strategy
1. **Horizontal Scaling**: Auto-scaling based on metrics
2. **Database Sharding**: Partition by organization/website
3. **Geographic Distribution**: Multi-region deployment
4. **Edge Computing**: CDN-based event processing
5. **Caching Optimization**: Multi-tier caching strategy

This architecture provides a robust foundation for an enterprise-grade website heatmap tool that can scale to handle millions of events while maintaining privacy compliance and real-time performance.