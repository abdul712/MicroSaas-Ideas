# Lead Scoring Tool - System Architecture

## 🏗️ Architecture Overview

This lead scoring platform follows a microservices architecture with ML-powered real-time scoring capabilities, designed for scalability, security, and compliance with GDPR/CCPA requirements.

## 📐 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│ Web Dashboard │ Mobile App │ Widget SDK │ APIs │ Webhooks       │
│ (Next.js)     │ (React)    │ (JS)       │      │                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                          │
├─────────────────────────────────────────────────────────────────┤
│ • Authentication & Authorization (OAuth 2.0 + JWT)             │
│ • Rate Limiting & Throttling                                   │
│ • Request Routing & Load Balancing                             │
│ • API Documentation (OpenAPI/Swagger)                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Application Services                       │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │   User      │ │    Lead      │ │  Scoring    │ │ Integration ││
│ │ Management  │ │ Management   │ │   Engine    │ │   Service   ││
│ │ Service     │ │   Service    │ │   Service   │ │             ││
│ └─────────────┘ └──────────────┘ └─────────────┘ └─────────────┘│
│ ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ Analytics   │ │ Notification │ │   Export    │ │ Audit &     ││
│ │  Service    │ │   Service    │ │   Service   │ │ Compliance  ││
│ └─────────────┘ └──────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ML Pipeline Layer                         │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ Data        │ │ Feature      │ │   Model     │ │   Model     ││
│ │ Ingestion   │ │ Engineering  │ │  Training   │ │  Serving    ││
│ │ Pipeline    │ │   Service    │ │   Service   │ │   Service   ││
│ └─────────────┘ └──────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Data & Storage Layer                       │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ PostgreSQL  │ │    Redis     │ │ ClickHouse  │ │   MongoDB   ││
│ │ (Primary)   │ │   (Cache)    │ │ (Analytics) │ │(Activity Log)││
│ └─────────────┘ └──────────────┘ └─────────────┘ └─────────────┘│
│ ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │   Apache    │ │ Elasticsearch│ │   MinIO     │ │   Vault     ││
│ │   Kafka     │ │   (Search)   │ │(File Store) │ │  (Secrets)  ││
│ └─────────────┘ └──────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Technology Stack

### Frontend Layer
- **Framework**: Next.js 14 with TypeScript
- **UI Library**: Material-UI + Custom Design System
- **State Management**: Redux Toolkit + RTK Query
- **Visualization**: D3.js + Chart.js
- **Real-time**: Socket.io-client
- **Testing**: Jest + React Testing Library + Playwright

### Backend Services
- **API Framework**: Python FastAPI
- **Authentication**: OAuth 2.0 + JWT
- **Database ORM**: SQLAlchemy (PostgreSQL) + Motor (MongoDB)
- **Task Queue**: Celery with Redis broker
- **WebSockets**: Socket.io
- **API Documentation**: OpenAPI/Swagger

### ML Pipeline
- **Core ML**: Python + Scikit-learn
- **Deep Learning**: TensorFlow + PyTorch
- **Feature Store**: Feast
- **Model Serving**: MLflow + FastAPI
- **Pipeline Orchestration**: Apache Airflow
- **Experiment Tracking**: Weights & Biases

### Data Storage
- **Primary Database**: PostgreSQL 14+
- **Cache Layer**: Redis 7+
- **Analytics DB**: ClickHouse
- **Document Store**: MongoDB
- **Search Engine**: Elasticsearch
- **Object Storage**: MinIO (S3-compatible)
- **Message Broker**: Apache Kafka
- **Secrets Management**: HashiCorp Vault

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes
- **Service Mesh**: Istio
- **Monitoring**: Prometheus + Grafana + Jaeger
- **Logging**: ELK Stack (Elasticsearch + Logstash + Kibana)
- **CI/CD**: GitHub Actions + ArgoCD

## 🗃️ Database Design

### PostgreSQL Schema

```sql
-- Core tables for lead and scoring data
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    industry VARCHAR(100),
    size_category VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    job_title VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    current_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

CREATE TABLE scoring_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- 'behavioral', 'demographic', 'composite'
    is_active BOOLEAN DEFAULT false,
    config JSONB NOT NULL,
    performance_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lead_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    model_id UUID REFERENCES scoring_models(id),
    score INTEGER NOT NULL,
    score_breakdown JSONB NOT NULL,
    confidence FLOAT,
    scored_at TIMESTAMP DEFAULT NOW(),
    INDEX(lead_id, scored_at),
    INDEX(model_id, scored_at)
);

CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB NOT NULL,
    source VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT false,
    INDEX(lead_id, timestamp),
    INDEX(activity_type, timestamp),
    INDEX(processed, timestamp)
);

CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    platform VARCHAR(100) NOT NULL, -- 'hubspot', 'salesforce', 'mailchimp'
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Redis Data Structure

```yaml
# Real-time scoring cache
lead_scores:{lead_id}: {
  current_score: 85,
  breakdown: {
    behavioral: 45,
    demographic: 25,
    engagement: 15
  },
  last_updated: "2024-01-01T10:00:00Z"
}

# Session management
session:{session_id}: {
  user_id: "uuid",
  organization_id: "uuid",
  permissions: ["read", "write"],
  expires_at: "2024-01-01T12:00:00Z"
}

# Rate limiting
rate_limit:{organization_id}:{endpoint}: {
  count: 150,
  window_start: "2024-01-01T10:00:00Z"
}
```

### ClickHouse Analytics Schema

```sql
-- High-volume analytics and event tracking
CREATE TABLE lead_score_history (
    lead_id String,
    organization_id String,
    model_id String,
    score UInt16,
    score_breakdown Map(String, UInt16),
    confidence Float32,
    timestamp DateTime
) ENGINE = MergeTree()
ORDER BY (organization_id, lead_id, timestamp);

CREATE TABLE activity_events (
    event_id String,
    lead_id String,
    organization_id String,
    event_type String,
    event_data String,
    source String,
    timestamp DateTime,
    processed UInt8
) ENGINE = MergeTree()
ORDER BY (organization_id, timestamp);
```

## 🤖 ML Pipeline Architecture

### 1. Data Ingestion Pipeline

```python
# Real-time data ingestion from multiple sources
class DataIngestionPipeline:
    def __init__(self):
        self.kafka_consumer = KafkaConsumer('lead-activities')
        self.feature_store = FeatureStore()
    
    async def process_activity(self, activity_data):
        # Extract features from raw activity
        features = self.extract_features(activity_data)
        
        # Store in feature store
        await self.feature_store.store_features(features)
        
        # Trigger real-time scoring
        await self.trigger_scoring(activity_data['lead_id'])
```

### 2. Feature Engineering Service

```python
class FeatureEngineer:
    def extract_behavioral_features(self, lead_id):
        return {
            'email_open_rate': self.calculate_email_engagement(lead_id),
            'website_visit_frequency': self.calculate_visit_frequency(lead_id),
            'content_consumption_score': self.calculate_content_score(lead_id),
            'demo_request_count': self.count_demo_requests(lead_id),
            'last_activity_days': self.days_since_last_activity(lead_id)
        }
    
    def extract_demographic_features(self, lead_id):
        return {
            'company_size_score': self.score_company_size(lead_id),
            'industry_fit_score': self.score_industry_fit(lead_id),
            'title_seniority_score': self.score_job_title(lead_id),
            'geographic_score': self.score_geography(lead_id),
            'technographic_score': self.score_tech_stack(lead_id)
        }
```

### 3. Model Training Service

```python
class ModelTrainer:
    def train_scoring_model(self, organization_id):
        # Load historical data
        X, y = self.load_training_data(organization_id)
        
        # Feature preprocessing
        X_processed = self.preprocess_features(X)
        
        # Train ensemble model
        model = self.create_ensemble_model()
        model.fit(X_processed, y)
        
        # Validate model performance
        metrics = self.validate_model(model, X_processed, y)
        
        # Deploy model if performance is acceptable
        if metrics['auc_roc'] > 0.8:
            self.deploy_model(model, organization_id)
            
        return model, metrics
```

### 4. Real-time Scoring Service

```python
class ScoringService:
    def __init__(self):
        self.model_cache = {}
        self.feature_store = FeatureStore()
    
    async def score_lead(self, lead_id, organization_id):
        # Load model for organization
        model = await self.get_model(organization_id)
        
        # Extract features
        features = await self.feature_store.get_features(lead_id)
        
        # Generate score
        score = model.predict_proba([features])[0][1] * 100
        
        # Generate explanation
        explanation = self.explain_score(model, features)
        
        # Cache result
        await self.cache_score(lead_id, score, explanation)
        
        return {
            'score': int(score),
            'confidence': model.predict_proba([features])[0].max(),
            'breakdown': explanation,
            'timestamp': datetime.utcnow()
        }
```

## 🔐 Security Architecture

### Authentication & Authorization

```yaml
Authentication Flow:
  1. OAuth 2.0 Authorization Code Flow
  2. JWT tokens with refresh mechanism
  3. Multi-factor authentication support
  4. SSO integration (SAML, OIDC)

Authorization:
  - Role-Based Access Control (RBAC)
  - Resource-level permissions
  - Organization-based data isolation
  - API key management for integrations

Security Headers:
  - Content Security Policy (CSP)
  - HTTP Strict Transport Security (HSTS)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
```

### Data Protection

```yaml
Encryption:
  - Data at Rest: AES-256
  - Data in Transit: TLS 1.3
  - Database: Transparent Data Encryption
  - Backups: Encrypted with customer-managed keys

PII Protection:
  - Field-level encryption for sensitive data
  - Data pseudonymization for analytics
  - Audit trails for all data access
  - Automated data retention policies

Compliance:
  - GDPR consent management
  - CCPA data subject rights
  - SOC 2 Type II controls
  - ISO 27001 framework
```

## 📊 API Design

### Core Endpoints

```yaml
Authentication:
  POST /auth/login
  POST /auth/refresh
  POST /auth/logout
  GET /auth/me

Lead Management:
  GET /leads
  POST /leads
  GET /leads/{id}
  PUT /leads/{id}
  DELETE /leads/{id}
  GET /leads/{id}/score
  GET /leads/{id}/activities

Scoring:
  POST /scoring/score-lead
  GET /scoring/models
  POST /scoring/models
  GET /scoring/models/{id}/performance
  PUT /scoring/models/{id}/activate

Analytics:
  GET /analytics/conversion-rates
  GET /analytics/score-distribution
  GET /analytics/model-performance
  POST /analytics/custom-report

Integrations:
  GET /integrations
  POST /integrations
  PUT /integrations/{id}
  DELETE /integrations/{id}
  POST /integrations/{id}/sync
```

### Real-time Events

```yaml
WebSocket Events:
  - lead_score_updated
  - new_lead_activity
  - model_training_complete
  - integration_sync_status
  - alert_triggered
```

## 🚀 Deployment Strategy

### Development Environment

```yaml
Services:
  - Frontend: localhost:3000
  - API Gateway: localhost:8000
  - ML Services: localhost:8001-8004
  - PostgreSQL: localhost:5432
  - Redis: localhost:6379
  - Kafka: localhost:9092

Setup:
  - Docker Compose for local development
  - Hot reloading for all services
  - Integrated testing environment
  - Sample data generation
```

### Production Environment

```yaml
Infrastructure:
  - Kubernetes cluster (AWS EKS/GCP GKE)
  - Multi-zone deployment
  - Auto-scaling groups
  - Load balancers with health checks

Monitoring:
  - Prometheus for metrics
  - Grafana for visualization
  - Jaeger for distributed tracing
  - ELK stack for logging
  - PagerDuty for alerting

Backup & Recovery:
  - Automated database backups
  - Point-in-time recovery
  - Cross-region replication
  - Disaster recovery procedures
```

## 📈 Scalability Considerations

### Horizontal Scaling

```yaml
Stateless Services:
  - API services: Auto-scale based on CPU/memory
  - ML inference: Scale based on queue depth
  - Background workers: Scale based on queue size

Data Layer:
  - PostgreSQL: Read replicas for queries
  - Redis: Cluster mode for high availability
  - ClickHouse: Distributed tables for analytics
  - Kafka: Partitioned topics for throughput

Caching Strategy:
  - Application-level caching (Redis)
  - CDN for static assets
  - Database query caching
  - Model prediction caching
```

### Performance Optimization

```yaml
Database:
  - Proper indexing strategy
  - Query optimization
  - Connection pooling
  - Async query execution

API:
  - Response compression
  - Pagination for large datasets
  - Rate limiting per tenant
  - Request/response caching

ML Pipeline:
  - Batch prediction for bulk scoring
  - Model serving optimization
  - Feature caching
  - Async model training
```

This architecture provides a solid foundation for building a scalable, secure, and compliant lead scoring platform that can handle enterprise-level requirements while maintaining excellent performance and user experience.