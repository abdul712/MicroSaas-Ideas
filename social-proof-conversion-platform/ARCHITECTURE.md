# Social Proof Widget - Conversion Optimization Platform
## System Architecture

### Overview
A comprehensive social proof platform with enterprise-grade features, real-time capabilities, and privacy-first design. Built following CLAUDE.md methodology for production-ready SaaS applications.

## Technology Stack

### Frontend Stack
- **Dashboard**: Next.js 14+ with TypeScript
- **Widget**: Vanilla JavaScript (< 20KB) for universal compatibility
- **Styling**: Tailwind CSS + CSS-in-JS for widget themes
- **State Management**: Zustand for dashboard state
- **Real-time**: WebSocket client for live notifications
- **Testing**: Jest + React Testing Library

### Backend Stack
- **Framework**: Next.js 14+ API routes + Express.js for WebSocket server
- **Database**: PostgreSQL (primary), Redis (real-time), ClickHouse (analytics)
- **ORM**: Prisma with PostgreSQL
- **Authentication**: NextAuth.js with JWT + OAuth 2.0
- **Real-time**: Socket.io for WebSocket connections
- **Queue**: BullMQ with Redis
- **CDN**: CloudFront for global widget delivery

### Infrastructure
- **Cloud**: AWS (primary)
- **Containers**: Docker + Docker Compose
- **Orchestration**: Kubernetes for production
- **CDN**: CloudFront for widget distribution
- **Monitoring**: Prometheus + Grafana
- **Security**: CSP, HTTPS, rate limiting

## System Architecture

### Core Components

#### 1. Widget Engine
- Lightweight JavaScript library (< 20KB gzipped)
- Cross-browser compatibility (IE11+)
- Mobile-responsive design
- Performance optimized loading
- Custom CSS theme support

#### 2. Real-time Notification System
- WebSocket connections for live updates
- Event streaming architecture
- Geographic location detection
- Anonymous visitor tracking
- Privacy-compliant data collection

#### 3. Dashboard & Management Interface
- Next.js 14+ with server-side rendering
- Real-time analytics dashboard
- A/B testing framework
- Campaign management
- Team collaboration features

#### 4. Integration Hub
- E-commerce platform webhooks
- CRM system connections
- Review platform APIs
- Social media integrations
- Custom webhook support

#### 5. Analytics Engine
- ClickHouse for time-series data
- Real-time conversion tracking
- A/B test statistical analysis
- Revenue attribution modeling
- Custom reporting system

## Database Architecture

### PostgreSQL (Primary Database)
```sql
-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'starter',
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Widget configurations
CREATE TABLE widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign management
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    widget_id UUID REFERENCES widgets(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'purchase', 'review', 'visitor', 'custom'
    rules JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social proof events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    campaign_id UUID REFERENCES campaigns(id),
    type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    location JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B testing
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    variants JSONB NOT NULL,
    traffic_split JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Redis (Real-time & Caching)
```
// Real-time visitor data
visitors:{domain}:{session_id} -> {
    location: string,
    timestamp: number,
    page_views: number
}

// Campaign cache
campaign:{campaign_id} -> JSON

// Rate limiting
rate_limit:{ip}:{endpoint} -> count

// WebSocket sessions
ws_session:{session_id} -> {
    organization_id: string,
    widget_id: string,
    connected_at: timestamp
}
```

### ClickHouse (Analytics)
```sql
CREATE TABLE widget_analytics (
    timestamp DateTime64(3),
    organization_id String,
    widget_id String,
    campaign_id String,
    event_type String,
    visitor_id String,
    page_url String,
    device_type String,
    location String,
    conversion_value Float64,
    attribution_data String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, timestamp);

CREATE TABLE conversion_funnel (
    timestamp DateTime64(3),
    organization_id String,
    visitor_id String,
    funnel_step String,
    page_url String,
    revenue Float64
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, timestamp);
```

## API Architecture

### REST Endpoints
```
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me

GET  /api/organizations
POST /api/organizations
PUT  /api/organizations/:id

GET  /api/widgets
POST /api/widgets
PUT  /api/widgets/:id
DELETE /api/widgets/:id

GET  /api/campaigns
POST /api/campaigns
PUT  /api/campaigns/:id
DELETE /api/campaigns/:id

POST /api/events
GET  /api/events/:widget_id

GET  /api/analytics/dashboard
GET  /api/analytics/conversion-rates
GET  /api/analytics/ab-tests

GET  /api/integrations
POST /api/integrations/shopify/webhook
POST /api/integrations/woocommerce/webhook

// Widget API (public)
GET  /widget/v1/config/:api_key
POST /widget/v1/events
GET  /widget/v1/notifications/:widget_id
```

### WebSocket Events
```javascript
// Client -> Server
{
    type: 'join_widget',
    widget_id: 'uuid',
    visitor_data: { location, device, page }
}

{
    type: 'track_event',
    event_type: 'page_view',
    data: { page_url, timestamp }
}

// Server -> Client
{
    type: 'notification',
    data: {
        type: 'purchase',
        message: 'John from New York just purchased "Premium Plan"',
        timestamp: '2024-01-15T10:30:00Z',
        location: 'New York, US'
    }
}

{
    type: 'visitor_count',
    data: {
        current_visitors: 47,
        recent_activity: '3 purchases in last hour'
    }
}
```

## Security Architecture

### Authentication & Authorization
- JWT tokens with RS256 signing
- OAuth 2.0 integration (Google, GitHub)
- Role-based access control (RBAC)
- API key authentication for widgets
- Session management with Redis

### Data Protection
- AES-256 encryption at rest
- TLS 1.3 for data in transit
- GDPR/CCPA compliance features
- Anonymous visitor tracking
- Data retention policies

### Security Headers & CSP
```javascript
const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' *.socialproof.com; img-src 'self' data: https:;",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
```

## Performance Optimization

### Widget Performance
- Lazy loading with IntersectionObserver
- Efficient DOM manipulation
- CSS animations over JavaScript
- Image optimization and WebP support
- Service Worker for caching

### Backend Performance
- Redis caching for frequently accessed data
- Database connection pooling
- Query optimization with indexes
- CDN for static assets
- Horizontal scaling with load balancers

### Real-time Performance
- WebSocket connection pooling
- Event debouncing and throttling
- Efficient message serialization
- Geographic edge servers

## Deployment Architecture

### Development Environment
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      - clickhouse

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: socialproof
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  clickhouse:
    image: clickhouse/clickhouse-server
    ports:
      - "8123:8123"
```

### Production Environment
- Kubernetes deployment with auto-scaling
- Multiple availability zones
- Database replication and backup
- Monitoring with Prometheus/Grafana
- Log aggregation with ELK stack

## Monitoring & Observability

### Application Metrics
- Request latency and throughput
- Error rates and types
- Database query performance
- WebSocket connection health
- Widget load times

### Business Metrics
- Conversion rate improvements
- Revenue attribution
- A/B test performance
- Customer engagement
- Churn prediction

### Alerting
- Performance degradation
- High error rates
- Database connection issues
- WebSocket disconnections
- Security incidents

## Compliance & Privacy

### GDPR Compliance
- Consent management system
- Right to deletion
- Data portability
- Privacy by design
- Regular audits

### CCPA Compliance
- Do not sell opt-out
- Consumer rights portal
- Data disclosure
- Third-party sharing transparency

This architecture supports enterprise-grade scalability, security, and performance while maintaining the simplicity needed for easy widget integration.