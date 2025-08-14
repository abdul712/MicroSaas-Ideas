# Follow-up Email Automator - System Architecture

## 🏗️ System Overview

The Follow-up Email Automator is an AI-powered email automation platform designed for enterprise-grade scalability, security, and performance. The system follows a microservices architecture with event-driven communication and multi-tenant isolation.

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui + Custom components
- **Workflow Builder**: React Flow Pro
- **State Management**: Zustand
- **Real-time**: Socket.io client
- **Testing**: Jest + React Testing Library + Playwright

### Backend
- **Runtime**: Node.js 20+ with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis for sessions and rate limiting
- **Queue**: Bull.js with Redis
- **Email Service**: SendGrid (primary) + AWS SES (backup)
- **AI Service**: OpenAI GPT-4 for content generation
- **Analytics**: InfluxDB for time-series metrics
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3 for templates and assets

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (production)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + Elasticsearch
- **Security**: Helmet.js, rate limiting, input validation

## 🏛️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile App     │    │  API Clients    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (Nginx/ALB)   │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  API Gateway    │
                    │ (Auth, Rate     │
                    │  Limiting)      │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Frontend API   │    │ Automation API  │    │ Analytics API   │
│   (Next.js)     │    │  (Express.js)   │    │  (Express.js)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Message Queue  │
                    │   (Bull.js +    │
                    │     Redis)      │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Email Worker   │    │   AI Worker     │    │ Analytics       │
│   (SendGrid/    │    │  (OpenAI API)   │    │  Worker         │
│    AWS SES)     │    │                 │    │ (InfluxDB)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Data Layer    │
                    │ PostgreSQL +    │
                    │ Redis + InfluxDB│
                    └─────────────────┘
```

## 📊 Database Schema Design

### Core Entities

#### Organizations (Multi-tenancy)
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  settings JSONB DEFAULT '{}',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Email Lists
```sql
CREATE TABLE email_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Contacts
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  properties JSONB DEFAULT '{}',
  engagement_score INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  unsubscribed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, email)
);
```

#### Email Templates
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  template_type VARCHAR(50) DEFAULT 'html',
  variables JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Automation Workflows
```sql
CREATE TABLE automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(100) NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  workflow_config JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Email Campaigns
```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  workflow_id UUID REFERENCES automation_workflows(id),
  template_id UUID REFERENCES email_templates(id),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft',
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Email Sends
```sql
CREATE TABLE email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  campaign_id UUID REFERENCES email_campaigns(id),
  contact_id UUID REFERENCES contacts(id),
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'queued',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced_at TIMESTAMP,
  complained_at TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Email Processing Pipeline

### 1. Trigger Detection
- **Event-based triggers**: User actions, time-based, API events
- **Behavioral triggers**: Email opens, clicks, website visits
- **Custom triggers**: Webhooks, integrations, manual activation

### 2. Contact Segmentation
- **Dynamic segmentation**: Real-time filtering based on properties
- **Engagement scoring**: ML-based scoring for email frequency
- **Compliance filtering**: Unsubscribed, bounced, complained contacts

### 3. AI Content Generation
- **Subject line optimization**: A/B test generation with GPT-4
- **Content personalization**: Dynamic content based on contact data
- **Send time optimization**: ML-powered optimal send times

### 4. Email Queue Processing
```typescript
interface EmailJob {
  id: string;
  organizationId: string;
  campaignId: string;
  contactId: string;
  templateId: string;
  scheduledAt: Date;
  priority: 'high' | 'normal' | 'low';
  retryCount: number;
  maxRetries: number;
}
```

### 5. Delivery & Tracking
- **Multi-provider delivery**: SendGrid primary, AWS SES backup
- **Delivery optimization**: IP warming, reputation monitoring
- **Real-time tracking**: Opens, clicks, bounces, complaints
- **Analytics aggregation**: Real-time metrics to InfluxDB

## 🔐 Security Architecture

### Authentication & Authorization
- **JWT Access Tokens**: Short-lived (15 minutes)
- **Refresh Tokens**: Long-lived (7 days), stored in httpOnly cookies
- **Role-Based Access Control**: Organization-level permissions
- **API Rate Limiting**: Per-user and per-organization limits

### Data Protection
- **Encryption at Rest**: AES-256 for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **PII Handling**: Separate encrypted storage for personal data
- **Data Retention**: Configurable retention periods per data type

### Compliance Features
- **GDPR Compliance**: Data export, deletion, consent management
- **CAN-SPAM Compliance**: Unsubscribe links, sender identification
- **CASL Compliance**: Consent tracking, opt-in verification
- **SOC 2**: Security controls and audit logging

## 📈 Analytics & Monitoring

### Email Analytics (InfluxDB)
```typescript
interface EmailMetric {
  measurement: 'email_sends' | 'email_opens' | 'email_clicks';
  timestamp: Date;
  tags: {
    organizationId: string;
    campaignId: string;
    provider: string;
    template: string;
  };
  fields: {
    count: number;
    engagement_score?: number;
    delivery_time?: number;
  };
}
```

### Performance Monitoring
- **Application Metrics**: Response times, error rates, throughput
- **Infrastructure Metrics**: CPU, memory, disk, network usage
- **Business Metrics**: Email delivery rates, engagement rates, revenue
- **Alerting**: PagerDuty integration for critical issues

## 🚀 Scalability Design

### Horizontal Scaling
- **Stateless Services**: All services designed for horizontal scaling
- **Load Balancing**: Application and database load balancing
- **Queue Scaling**: Redis Cluster for high-throughput queuing
- **CDN Integration**: CloudFront for static asset delivery

### Database Scaling
- **Read Replicas**: PostgreSQL read replicas for analytics queries
- **Connection Pooling**: PgBouncer for efficient connection management
- **Partitioning**: Time-based partitioning for email_sends table
- **Archiving**: Automated archiving of old email data

### Email Delivery Scaling
- **Provider Failover**: Automatic failover between email providers
- **Rate Limiting**: Respect provider rate limits and reputation
- **IP Warming**: Automated IP reputation building
- **List Segmentation**: Intelligent segmentation for delivery optimization

## 🔄 Integration Architecture

### Webhook System
```typescript
interface WebhookEvent {
  id: string;
  organizationId: string;
  event: string;
  data: Record<string, any>;
  timestamp: Date;
  signature: string;
}
```

### API Integration Points
- **CRM Integrations**: Salesforce, HubSpot, Pipedrive
- **E-commerce**: Shopify, WooCommerce, Magento
- **Analytics**: Google Analytics, Mixpanel, Amplitude
- **Communication**: Slack, Discord, Microsoft Teams

### Real-time Features
- **WebSocket Connections**: Live dashboard updates
- **Server-Sent Events**: Campaign progress notifications
- **Push Notifications**: Mobile app notifications
- **Live Chat**: Customer support integration

## 📦 Deployment Architecture

### Development Environment
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./src:/app/src
    depends_on:
      - postgres
      - redis
      - influxdb
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: email_automator_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  influxdb:
    image: influxdb:2.0
    ports:
      - "8086:8086"
```

### Production Environment
- **Kubernetes Cluster**: Multi-node cluster with auto-scaling
- **Managed Databases**: RDS PostgreSQL, ElastiCache Redis
- **Container Registry**: ECR for Docker image storage
- **Secrets Management**: AWS Secrets Manager
- **Certificate Management**: Let's Encrypt with cert-manager

This architecture provides a solid foundation for building a scalable, secure, and feature-rich email automation platform that can handle enterprise-grade workloads while maintaining excellent performance and reliability.