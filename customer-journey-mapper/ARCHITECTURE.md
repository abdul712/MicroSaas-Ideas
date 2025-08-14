# Customer Journey Mapper - Architecture Documentation

## System Overview

The Customer Journey Mapper is a comprehensive platform designed to track, visualize, and optimize customer journeys across multiple touchpoints. The system is built with scalability, privacy compliance, and real-time analytics as core principles.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 14 App Router │ React Components │ D3.js Visualization │
│  TypeScript            │ Tailwind CSS     │ Real-time WebSocket │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                        API Gateway Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes    │ Authentication   │ Rate Limiting       │
│  Input Validation      │ Authorization    │ Request Throttling  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                      Business Logic Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  Event Processing      │ Journey Analysis │ AI Insights Engine  │
│  Customer Segmentation │ Privacy Manager  │ Conversion Funnels  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                        Data Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (Primary)  │ ClickHouse       │ Redis (Cache)       │
│  User & Journey Data   │ Analytics Events │ Sessions & Temp     │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for responsive design
- **Visualization**: D3.js for interactive journey maps
- **State Management**: Zustand for client state
- **Real-time**: WebSocket connections for live updates
- **Drag & Drop**: React DnD Kit for journey builder

### Backend Stack
- **API Framework**: Next.js API Routes
- **ORM**: Prisma with PostgreSQL
- **Authentication**: NextAuth.js with multiple providers
- **Validation**: Zod for runtime type checking
- **Event Processing**: Apache Kafka for streaming
- **Caching**: Redis for session management and caching

### Data Storage
- **Primary Database**: PostgreSQL 15+
  - User accounts, organizations, journey definitions
  - API keys, settings, configuration data
- **Analytics Database**: ClickHouse 23+
  - High-volume event data
  - Real-time analytics queries
  - Time-series data for reporting
- **Cache Layer**: Redis 7+
  - Session storage
  - Temporary data and computations
  - Rate limiting counters

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for development
- **Monitoring**: Built-in health checks and metrics
- **Load Balancing**: Nginx (optional for production)

## Core Components

### 1. Event Tracking SDK

**Purpose**: Lightweight client-side library for capturing user interactions

**Features**:
- Automatic event detection (clicks, page views, form submissions)
- Cross-device user identification
- Privacy-compliant data collection
- Offline event queuing with retry logic
- Real-time event streaming

**Architecture**:
```typescript
JourneyTracker
├── Event Collection
│   ├── Auto-tracking (clicks, pages, forms)
│   ├── Custom event APIs
│   └── Batch processing
├── Privacy Layer
│   ├── Consent management
│   ├── Data anonymization
│   └── PII detection
└── Transport Layer
    ├── HTTP/HTTPS API calls
    ├── WebSocket connections
    └── Offline queue management
```

### 2. Journey Visualization Engine

**Purpose**: Interactive D3.js-powered visualization of customer journeys

**Features**:
- Node-link diagrams for journey flows
- Sankey diagrams for conversion funnels
- Real-time data updates
- Interactive exploration and filtering
- Export capabilities (SVG, PNG, PDF)

**Architecture**:
```typescript
VisualizationEngine
├── Data Processing
│   ├── Journey path calculation
│   ├── Node positioning algorithms
│   └── Link weight computation
├── Rendering Layer
│   ├── D3.js SVG rendering
│   ├── Canvas fallback for performance
│   └── Responsive viewport handling
└── Interaction Layer
    ├── Zoom and pan controls
    ├── Node/link selection
    └── Tooltip information display
```

### 3. Analytics Engine

**Purpose**: High-performance analytics processing using ClickHouse

**Features**:
- Real-time event aggregation
- Conversion funnel analysis
- Customer segmentation
- Cohort analysis
- Attribution modeling

**Architecture**:
```sql
-- Event processing pipeline
Raw Events → Kafka Topics → ClickHouse Tables → Materialized Views → Analytics APIs
```

### 4. Privacy Compliance System

**Purpose**: GDPR/CCPA compliant data handling and user rights management

**Features**:
- Consent management framework
- Automatic PII detection and masking
- Data subject rights (access, deletion, portability)
- Data retention policy enforcement
- Audit logging for compliance

**Architecture**:
```typescript
PrivacyManager
├── Consent Framework
│   ├── Cookie consent banners
│   ├── Preference management
│   └── Consent validation
├── Data Protection
│   ├── PII detection algorithms
│   ├── Anonymization functions
│   └── Encryption utilities
└── Rights Management
    ├── Data access requests
    ├── Deletion workflows
    └── Portability exports
```

## Data Flow Architecture

### 1. Event Collection Flow

```
Client SDK → API Gateway → Event Validation → Kafka Topic → ClickHouse
                      ↓
                 PostgreSQL (metadata)
```

### 2. Real-time Analytics Flow

```
ClickHouse → Materialized Views → Cache Layer → WebSocket → Client Dashboard
```

### 3. Journey Analysis Flow

```
Event Data → Path Calculation → Visualization Data → D3.js Rendering → Interactive UI
```

## Database Schema Design

### PostgreSQL Schema (Operational Data)

```sql
-- Core entities
organizations       -- Multi-tenant organization data
users              -- User accounts and authentication
projects           -- Project organization within orgs
journeys           -- Journey definitions and configuration

-- Event metadata
customers          -- Customer profiles and attributes
events             -- Event metadata and properties
journey_paths      -- Calculated journey progressions
insights           -- AI-generated recommendations

-- System data
api_keys           -- API authentication keys
audit_logs         -- System activity logs
data_requests      -- GDPR/CCPA request tracking
```

### ClickHouse Schema (Analytics Data)

```sql
-- High-volume event data
events             -- Raw event stream
journey_paths      -- Path analysis data
touchpoint_metrics -- Aggregated touchpoint performance
conversion_funnels -- Funnel analysis results
customer_segments  -- Segmentation data
active_sessions    -- Real-time session tracking
```

## Scalability Considerations

### Horizontal Scaling

- **Application Layer**: Stateless API servers behind load balancer
- **Database Layer**: Read replicas for PostgreSQL, distributed ClickHouse cluster
- **Event Processing**: Kafka partitioning for parallel processing
- **Caching**: Redis cluster with consistent hashing

### Performance Optimization

- **Event Batching**: Client SDK batches events to reduce API calls
- **Query Optimization**: Materialized views in ClickHouse for fast analytics
- **Caching Strategy**: Multi-layer caching (Redis, CDN, browser)
- **Data Partitioning**: Time-based partitioning in ClickHouse

### High Availability

- **Database Replication**: Primary-replica setup with automatic failover
- **Load Balancing**: Multiple application instances with health checks
- **Monitoring**: Comprehensive health checks and alerting
- **Backup Strategy**: Automated backups with point-in-time recovery

## Security Architecture

### Data Protection

- **Encryption**: TLS 1.3 for data in transit, AES-256 for data at rest
- **API Security**: JWT tokens, API key authentication, rate limiting
- **Input Validation**: Comprehensive sanitization and validation
- **SQL Injection**: Parameterized queries and ORM protection

### Privacy Compliance

- **Data Minimization**: Collect only necessary data for analytics
- **Consent Management**: Granular consent preferences
- **Data Anonymization**: Automatic PII detection and masking
- **Retention Policies**: Automated data lifecycle management

### Access Control

- **Authentication**: Multi-factor authentication support
- **Authorization**: Role-based access control (RBAC)
- **API Security**: Rate limiting, API key rotation
- **Audit Logging**: Comprehensive activity tracking

## Monitoring and Observability

### Application Monitoring

- **Health Checks**: Endpoint monitoring for all services
- **Performance Metrics**: Response times, throughput, error rates
- **Resource Usage**: CPU, memory, disk, network utilization
- **Custom Metrics**: Business-specific KPIs and analytics

### Error Tracking

- **Exception Monitoring**: Automatic error detection and alerting
- **Log Aggregation**: Centralized logging with structured data
- **Distributed Tracing**: Request flow tracking across services
- **Alert Management**: Intelligent alerting with escalation policies

### Business Intelligence

- **Usage Analytics**: Platform usage patterns and trends
- **Performance Dashboards**: Real-time system performance
- **Customer Insights**: User behavior and engagement metrics
- **Revenue Tracking**: Subscription and billing analytics

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.yml structure
services:
  app:           # Next.js application
  postgres:      # Primary database
  clickhouse:    # Analytics database
  redis:         # Cache layer
  kafka:         # Event streaming
  zookeeper:     # Kafka coordination
```

### Production Environment

```
Internet → CDN → Load Balancer → App Servers
                                      ↓
                              Database Cluster
                              (Primary + Replicas)
                                      ↓
                              Analytics Cluster
                              (ClickHouse Distributed)
                                      ↓
                              Cache Cluster
                              (Redis with Sentinel)
```

### CI/CD Pipeline

1. **Code Quality**: Linting, type checking, security scanning
2. **Testing**: Unit, integration, and end-to-end tests
3. **Build**: Docker image creation with multi-stage builds
4. **Deploy**: Rolling deployment with health checks
5. **Verify**: Post-deployment validation and monitoring

## API Design

### RESTful API Structure

```
/api/v1/
├── /auth          # Authentication endpoints
├── /events        # Event tracking and retrieval
├── /journeys      # Journey management
├── /analytics     # Analytics and reporting
├── /customers     # Customer management
├── /insights      # AI insights and recommendations
└── /admin         # Administrative functions
```

### WebSocket Endpoints

```
/ws/
├── /events        # Real-time event streaming
├── /analytics     # Live analytics updates
└── /notifications # System notifications
```

### SDK Integration

```javascript
// Client-side SDK
import { initJourneyTracker } from '@journeymapper/sdk'

const tracker = initJourneyTracker({
  apiKey: 'jm_...',
  customerId: 'user-123',
  autoTrack: true
})

// Server-side SDK
import { ServerSideTracker } from '@journeymapper/node-sdk'

const tracker = new ServerSideTracker({
  apiKey: 'jm_...'
})
```

This architecture provides a robust foundation for scaling from small teams to enterprise deployments while maintaining high performance, security, and compliance standards.