# Local Business Review Manager - System Architecture

## 🏗️ Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend Layer (Next.js 14)                  │
├─────────────────────────────────────────────────────────────────────┤
│                        API Gateway & Auth Layer                     │
├─────────────────────────────────────────────────────────────────────┤
│                        Core Business Logic                          │
├─────────────────────────────────────────────────────────────────────┤
│                        Data Access Layer (Prisma)                   │
├─────────────────────────────────────────────────────────────────────┤
│                        Database Layer (PostgreSQL + Redis)          │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Charts**: Chart.js with react-chartjs-2
- **Real-time**: Socket.io-client
- **UI Components**: shadcn/ui

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Database ORM**: Prisma
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io
- **Job Queue**: Bull Queue with Redis

### Database
- **Primary**: PostgreSQL (review data, users, businesses)
- **Cache**: Redis (sessions, real-time data, job queues)
- **Search**: PostgreSQL Full-Text Search

### External Integrations
- **AI**: OpenAI GPT-4 (response generation & sentiment analysis)
- **Review Platforms**: Google My Business, Facebook, Yelp APIs
- **Communications**: Twilio (SMS), SendGrid (Email)
- **Analytics**: Custom analytics with PostgreSQL

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Monitoring**: Custom health checks
- **Logging**: Winston with structured logging

## 📊 Database Schema Design

### Core Entities
```sql
-- Users and Authentication
User {
  id: UUID
  email: String
  name: String
  role: UserRole
  createdAt: DateTime
  businesses: Business[]
}

-- Business/Location Management
Business {
  id: UUID
  name: String
  address: String
  phone: String
  website: String
  industry: String
  userId: UUID
  locations: Location[]
  reviewAccounts: ReviewAccount[]
}

Location {
  id: UUID
  name: String
  address: String
  businessId: UUID
  googlePlaceId: String
  reviews: Review[]
}

-- Review Platform Integration
ReviewAccount {
  id: UUID
  platform: Platform (GMB, FACEBOOK, YELP, TRIPADVISOR)
  accountId: String
  accessToken: String (encrypted)
  businessId: UUID
  isActive: Boolean
  lastSyncAt: DateTime
}

-- Review Management
Review {
  id: UUID
  platform: Platform
  platformReviewId: String
  locationId: UUID
  customerName: String
  customerEmail: String?
  rating: Int (1-5)
  reviewText: String
  reviewDate: DateTime
  sentiment: SentimentScore
  isResponded: Boolean
  response: ReviewResponse?
  status: ReviewStatus (NEW, RESPONDED, FLAGGED, RESOLVED)
}

ReviewResponse {
  id: UUID
  reviewId: UUID
  responseText: String
  responseDate: DateTime
  isAIGenerated: Boolean
  approvedBy: UUID
  publishedAt: DateTime?
}

-- AI and Analytics
SentimentScore {
  id: UUID
  reviewId: UUID
  positiveScore: Float
  negativeScore: Float
  neutralScore: Float
  overallSentiment: Sentiment (POSITIVE, NEGATIVE, NEUTRAL)
  confidence: Float
  topics: String[] (JSON)
}

-- Review Invitation System
ReviewInvitation {
  id: UUID
  businessId: UUID
  customerName: String
  customerEmail: String
  customerPhone: String?
  invitationType: InvitationType (EMAIL, SMS, QR)
  status: InvitationStatus (SENT, OPENED, COMPLETED, EXPIRED)
  sentAt: DateTime
  completedAt: DateTime?
  qrCode: String?
}

-- Analytics and Reporting
AnalyticsSnapshot {
  id: UUID
  businessId: UUID
  date: DateTime
  totalReviews: Int
  averageRating: Float
  responseRate: Float
  sentimentDistribution: JSON
  platformBreakdown: JSON
}
```

## 🔄 Data Flow Architecture

### 1. Review Monitoring Pipeline
```
External APIs → Review Collector → Sentiment Analysis → Database → Real-time Updates
```

### 2. AI Response Generation Flow
```
New Review → Sentiment Analysis → Context Building → AI Generation → Human Approval → Platform Publishing
```

### 3. Real-time Notification Flow
```
Database Changes → Event Emitter → WebSocket → Frontend Updates
```

## 🔐 Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Short-lived access tokens (15 min) + Refresh tokens (7 days)
- **OAuth Integration**: Google, Facebook for platform access
- **Role-Based Access**: Owner, Manager, Staff roles
- **Multi-tenancy**: Row-level security for business data isolation

### Data Protection
- **Encryption at Rest**: AES-256 for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **API Security**: Rate limiting, input validation, CSRF protection
- **Secrets Management**: Environment variables with rotation

### Compliance
- **GDPR**: Data retention policies, right to deletion, consent management
- **Data Anonymization**: PII scrubbing for analytics
- **Audit Logging**: All data access and modifications tracked

## 🚀 Performance Architecture

### Caching Strategy
- **Redis Layers**:
  - Session cache (15 min TTL)
  - Review data cache (5 min TTL)
  - Analytics cache (1 hour TTL)
  - API response cache (platform-specific TTL)

### Real-time Features
- **WebSockets**: Live review notifications
- **Server-Sent Events**: Analytics updates
- **Optimistic Updates**: UI responsiveness

### Scalability Design
- **Database Indexing**: Optimized queries for large datasets
- **Connection Pooling**: PostgreSQL connection management
- **Background Jobs**: Queue-based processing for heavy operations
- **CDN Ready**: Static asset optimization

## 🔧 Microservices Breakdown

### Core Services
1. **Authentication Service**: User management, JWT handling
2. **Review Monitoring Service**: Platform API integration, data collection
3. **AI Processing Service**: Sentiment analysis, response generation
4. **Notification Service**: Real-time alerts, email/SMS dispatch
5. **Analytics Service**: Reporting, insights generation
6. **Integration Service**: Third-party API management

### Service Communication
- **Internal**: Direct function calls (monolithic deployment)
- **External**: REST APIs with retry logic
- **Events**: Redis pub/sub for real-time features
- **Background**: Bull Queue for async processing

## 📱 Frontend Architecture

### Component Structure
```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/          # Main dashboard
│   ├── reviews/            # Review management
│   ├── analytics/          # Analytics views
│   ├── settings/           # Business settings
│   └── api/                # API routes
├── components/
│   ├── dashboard/          # Dashboard components
│   ├── reviews/            # Review components
│   ├── charts/             # Analytics charts
│   ├── ui/                 # Reusable UI components
│   └── layout/             # Layout components
├── lib/
│   ├── api/                # API client functions
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── stores/             # Zustand stores
└── types/                  # TypeScript type definitions
```

### State Management
- **Global State**: Zustand for user, business data
- **Server State**: TanStack Query for API data
- **Form State**: React Hook Form
- **Real-time State**: Socket.io integration

## 🧪 Testing Architecture

### Testing Strategy
- **Unit Tests**: Jest + React Testing Library (90%+ coverage)
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for critical user flows
- **Performance Tests**: Lighthouse CI integration

### Test Structure
```
__tests__/
├── unit/
│   ├── components/
│   ├── lib/
│   └── utils/
├── integration/
│   ├── api/
│   └── database/
├── e2e/
│   ├── dashboard.spec.ts
│   ├── reviews.spec.ts
│   └── analytics.spec.ts
└── performance/
    └── lighthouse.config.js
```

## 🔄 Deployment Architecture

### Containerization
```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder
FROM node:18-alpine AS runner
```

### Environment Configuration
- **Development**: Docker Compose with hot reload
- **Staging**: Docker Compose with production builds
- **Production**: Container orchestration ready

### Monitoring & Observability
- **Health Checks**: `/api/health` endpoint
- **Metrics**: Custom metrics collection
- **Logging**: Structured JSON logs
- **Error Tracking**: Integrated error reporting

## 🔧 Development Workflow

### Branch Strategy
- **Main**: Production-ready code
- **Development**: Integration branch
- **Feature**: Individual feature development

### CI/CD Pipeline
1. **Code Quality**: ESLint, Prettier, TypeScript checks
2. **Testing**: Unit, integration, and E2E tests
3. **Security**: Dependency scanning, SAST
4. **Build**: Docker image creation
5. **Deploy**: Automated deployment pipeline

This architecture ensures scalability, maintainability, and production-readiness while following enterprise-grade best practices.