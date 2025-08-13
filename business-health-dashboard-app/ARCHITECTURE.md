# Business Health Dashboard - System Architecture

## 🎯 Project Overview
**Business Health Dashboard** - A comprehensive SaaS platform that provides real-time business health analytics with AI-powered insights. Think "Fitbit for your business" - providing a single health score and actionable insights for business performance.

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Integrations  │
│   (Next.js 14)  │◄──►│   (FastAPI)     │◄──►│  External APIs  │
│                 │    │                 │    │                 │
│ • Dashboard UI  │    │ • REST APIs     │    │ • QuickBooks    │
│ • Real-time     │    │ • GraphQL       │    │ • Stripe        │
│ • Mobile-first  │    │ • WebSockets    │    │ • Google Anal.  │
│ • PWA ready     │    │ • Background    │    │ • HubSpot       │
└─────────────────┘    │   Jobs          │    │ • Shopify       │
                       └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Database      │
                       │  PostgreSQL +   │
                       │  TimescaleDB    │
                       │                 │
                       │ • Multi-tenant  │
                       │ • Time-series   │
                       │ • ACID          │
                       └─────────────────┘
```

### Component Architecture

#### Frontend Architecture (Next.js 14)
```
app/
├── (dashboard)/
│   ├── overview/          # Main health dashboard
│   ├── metrics/           # Detailed metrics views
│   ├── alerts/            # Alert management
│   ├── integrations/      # API connections
│   └── settings/          # User preferences
├── api/                   # API routes
├── components/
│   ├── charts/            # Visualization components
│   ├── ui/                # Base UI components
│   └── layout/            # Layout components
└── lib/
    ├── auth/              # Authentication logic
    ├── api/               # API client
    └── utils/             # Utility functions
```

#### Backend Architecture (FastAPI)
```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── health/        # Health score endpoints
│   │   │   ├── metrics/       # Metrics CRUD
│   │   │   ├── alerts/        # Alert management
│   │   │   ├── integrations/  # External API management
│   │   │   └── auth/          # Authentication endpoints
│   │   └── deps.py            # Dependencies
│   ├── core/
│   │   ├── config.py          # Configuration
│   │   ├── security.py        # Security utilities
│   │   └── database.py        # Database connection
│   ├── models/                # Database models
│   ├── schemas/               # Pydantic schemas
│   ├── services/              # Business logic
│   └── background/            # Background tasks
└── tests/                     # Test suite
```

## 🗄️ Database Design

### Core Tables Structure

#### Multi-tenant Architecture
```sql
-- Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'starter',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-Level Security for multi-tenancy
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
```

#### Business Health Metrics
```sql
-- Core business metrics time-series table
CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    metric_type VARCHAR(100) NOT NULL, -- 'revenue', 'customers', 'cash_flow', etc.
    category VARCHAR(50) NOT NULL,     -- 'financial', 'customer', 'operational'
    value DECIMAL(15,2) NOT NULL,
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TimescaleDB hypertable for time-series optimization
SELECT create_hypertable('business_metrics', 'recorded_at');

-- Indexes for optimal query performance
CREATE INDEX idx_business_metrics_org_type_time 
ON business_metrics (organization_id, metric_type, recorded_at DESC);
```

#### Health Score System
```sql
-- Business health scores
CREATE TABLE health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    financial_score INTEGER CHECK (financial_score >= 0 AND financial_score <= 100),
    customer_score INTEGER CHECK (customer_score >= 0 AND customer_score <= 100),
    operational_score INTEGER CHECK (operational_score >= 0 AND operational_score <= 100),
    growth_score INTEGER CHECK (growth_score >= 0 AND growth_score <= 100),
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    insights JSONB DEFAULT '{}',
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Alert System
```sql
-- Intelligent alert system
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(50) NOT NULL,
    metric_type VARCHAR(100),
    threshold_value DECIMAL(15,2),
    current_value DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
```

#### External Integrations
```sql
-- API integration configurations
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    provider VARCHAR(100) NOT NULL, -- 'quickbooks', 'stripe', 'shopify'
    provider_id VARCHAR(255),
    config JSONB NOT NULL,
    credentials_encrypted TEXT,
    status VARCHAR(20) DEFAULT 'active',
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Technology Stack

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + HeadlessUI
- **State Management**: Zustand + TanStack Query
- **Charts**: Observable Plot + Chart.js
- **Animation**: Framer Motion
- **Forms**: React Hook Form + Zod

### Backend Stack
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15 + TimescaleDB
- **Caching**: Redis
- **Task Queue**: Celery with Redis broker
- **Authentication**: JWT with refresh tokens
- **API Documentation**: OpenAPI/Swagger

### Infrastructure Stack
- **Containerization**: Docker + Docker Compose
- **Cloud**: AWS (ECS, RDS, ElastiCache)
- **CDN**: CloudFront
- **Monitoring**: DataDog
- **CI/CD**: GitHub Actions

## 🔒 Security Architecture

### Authentication & Authorization
```python
# JWT-based authentication with refresh tokens
class AuthService:
    def generate_tokens(self, user_id: str, org_id: str):
        access_token = create_access_token(
            data={"sub": user_id, "org": org_id},
            expires_delta=timedelta(hours=1)
        )
        refresh_token = create_refresh_token(
            data={"sub": user_id},
            expires_delta=timedelta(days=7)
        )
        return {"access_token": access_token, "refresh_token": refresh_token}
```

### Multi-tenant Security
- **Row-Level Security (RLS)** on all tenant tables
- **JWT tokens include organization context**
- **API endpoints filter by organization ID**
- **Encryption at rest** for sensitive data

### Data Protection
- **HTTPS/TLS 1.3** for all communications
- **API rate limiting** (100 requests/minute per user)
- **Input validation** with Pydantic schemas
- **SQL injection prevention** via ORM

## 📊 Health Score Algorithm

### Scoring Categories (0-100 each)

#### 1. Financial Health (25% weight)
```python
def calculate_financial_score(metrics: Dict) -> int:
    factors = {
        'cash_flow_ratio': metrics.get('cash_flow') / metrics.get('expenses', 1),
        'revenue_growth': calculate_growth_rate(metrics.get('revenue_history')),
        'burn_rate': calculate_burn_rate(metrics),
        'profit_margin': metrics.get('profit') / metrics.get('revenue', 1)
    }
    
    # Weighted scoring algorithm
    score = (
        min(factors['cash_flow_ratio'] * 30, 30) +
        min(factors['revenue_growth'] * 25, 25) +
        max(50 - factors['burn_rate'] * 20, 0) +
        min(factors['profit_margin'] * 45, 45)
    )
    
    return min(int(score), 100)
```

#### 2. Customer Health (25% weight)
- Customer acquisition cost trends
- Customer lifetime value
- Churn rate and retention
- Net Promoter Score

#### 3. Operational Health (20% weight)
- Process efficiency metrics
- Team productivity
- System uptime and performance
- Inventory turnover

#### 4. Growth Health (20% weight)
- Market expansion metrics
- Product development pipeline
- Lead generation trends
- Conversion rate optimization

#### 5. Risk Assessment (10% weight)
- Financial risk indicators
- Market risk factors
- Operational risk assessment
- Compliance status

## 🔄 Real-time Features

### Server-Sent Events (SSE)
```typescript
// Real-time dashboard updates
const useRealtimeHealth = (orgId: string) => {
  const [healthData, setHealthData] = useState(null);
  
  useEffect(() => {
    const eventSource = new EventSource(`/api/health/stream/${orgId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setHealthData(data);
    };
    
    return () => eventSource.close();
  }, [orgId]);
  
  return healthData;
};
```

### Background Processing
```python
# Celery tasks for data processing
@celery_app.task
def calculate_health_scores(organization_id: str):
    """Background task to calculate and update health scores"""
    service = HealthScoreService()
    scores = service.calculate_all_scores(organization_id)
    
    # Broadcast updated scores via SSE
    broadcast_health_update(organization_id, scores)
    
    # Check for new alerts
    alert_service = AlertService()
    alert_service.evaluate_thresholds(organization_id, scores)
```

## 🔌 Integration Architecture

### OAuth 2.0 Flow
```python
class IntegrationService:
    async def initiate_oauth(self, provider: str, org_id: str):
        """Start OAuth flow for external service integration"""
        config = OAUTH_CONFIGS[provider]
        
        auth_url = (
            f"{config['auth_url']}?"
            f"client_id={config['client_id']}&"
            f"redirect_uri={config['redirect_uri']}&"
            f"scope={config['scope']}&"
            f"state={generate_state_token(org_id, provider)}&"
            f"response_type=code"
        )
        
        return {"auth_url": auth_url}
```

### Webhook Processing
```python
@router.post("/webhooks/{provider}")
async def process_webhook(provider: str, request: Request):
    """Process incoming webhooks from integrated services"""
    signature = request.headers.get("X-Webhook-Signature")
    payload = await request.body()
    
    # Verify webhook signature
    if not verify_webhook_signature(provider, payload, signature):
        raise HTTPException(401, "Invalid signature")
    
    # Queue webhook for processing
    process_webhook_data.delay(provider, payload.decode())
    
    return {"status": "accepted"}
```

## 🚀 Performance Optimizations

### Database Optimizations
- **Time-series partitioning** for metrics data
- **Materialized views** for common aggregations
- **Connection pooling** with PgBouncer
- **Read replicas** for analytics queries

### Frontend Optimizations
- **Code splitting** by route and component
- **Image optimization** with Next.js Image
- **Virtual scrolling** for large datasets
- **Service worker** for offline capabilities

### Caching Strategy
- **Redis caching** for frequently accessed data
- **CDN caching** for static assets
- **Browser caching** with appropriate headers
- **Query result caching** for expensive computations

## 📈 Scalability Considerations

### Horizontal Scaling
- **Stateless application design**
- **Database sharding** by organization
- **Microservices architecture** ready
- **Load balancer** configuration

### Monitoring & Observability
- **Application metrics** with Prometheus
- **Error tracking** with Sentry
- **Performance monitoring** with DataDog
- **Structured logging** with ELK stack

This architecture provides a solid foundation for building a production-ready, scalable business health dashboard that can grow from startup to enterprise scale while maintaining security, performance, and reliability standards.