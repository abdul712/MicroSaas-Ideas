# Social Media Caption Generator - Enterprise Architecture

## 🏗️ System Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   AI Services   │
│   Next.js 14    │◄──►│   Rate Limiting │◄──►│   OpenAI GPT-4  │
│   TypeScript     │    │   Auth/JWT      │    │   Claude API    │
│   Tailwind CSS  │    │   Validation    │    │   Google Vision │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │              ┌─────────────────┐                │
         │              │   Business      │                │
         │              │   Logic Layer   │                │
         │              │   - Caption Gen │                │
         │              │   - Brand Voice │                │
         │              │   - Analytics   │                │
         │              └─────────────────┘                │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Real-time     │    │   Database      │    │   External APIs │
│   WebSocket     │    │   PostgreSQL    │    │   Social Media  │
│   Push Notifs   │    │   Redis Cache   │    │   Trend APIs    │
│   Collaboration │    │   Vector Store  │    │   Scheduling    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Animations**: Framer Motion
- **State Management**: Zustand + React Query
- **Real-time**: Socket.IO client
- **Testing**: Jest + React Testing Library + Playwright

### Backend Stack
- **Runtime**: Node.js 20+ with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis for session/generation cache
- **Queue**: Bull Queue with Redis
- **Real-time**: Socket.IO
- **Authentication**: NextAuth.js with JWT + OAuth2
- **Validation**: Zod schemas

### AI & ML Stack
- **Primary AI**: OpenAI GPT-4 Turbo
- **Secondary AI**: Anthropic Claude 3.5 Sonnet
- **Fallback AI**: Google Gemini Pro
- **Image Analysis**: Google Cloud Vision API
- **Vector Store**: Pinecone for brand voice embeddings
- **Content Moderation**: OpenAI Moderation API

### Infrastructure & DevOps
- **Hosting**: Vercel (Frontend) + Railway (Backend)
- **Database**: Supabase PostgreSQL
- **CDN**: Cloudflare
- **Monitoring**: Sentry + Vercel Analytics
- **CI/CD**: GitHub Actions
- **Container**: Docker with multi-stage builds
- **Security**: OWASP compliance + SOC 2 Type II

## 📊 Database Schema Design

### Core Entities
```sql
-- Users & Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    credits_remaining INTEGER DEFAULT 20,
    credits_renewed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Organizations (Multi-tenancy)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'starter',
    billing_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User-Organization Relationships
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
    joined_at TIMESTAMP DEFAULT NOW()
);

-- Brand Voice Profiles
CREATE TABLE brand_voices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tone VARCHAR(100), -- professional, casual, friendly, etc.
    personality JSONB, -- structured personality traits
    sample_content TEXT[], -- training examples
    embedding_vector VECTOR(1536), -- OpenAI embeddings
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Caption Generation Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    brand_voice_id UUID REFERENCES brand_voices(id),
    settings JSONB, -- project-specific settings
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Generated Captions
CREATE TABLE captions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    user_id UUID REFERENCES users(id),
    
    -- Input data
    image_url TEXT,
    image_analysis JSONB, -- Vision API results
    prompt TEXT,
    target_platform VARCHAR(50), -- instagram, facebook, twitter, etc.
    
    -- Generated content
    caption_text TEXT NOT NULL,
    hashtags TEXT[],
    emojis TEXT[],
    call_to_action TEXT,
    
    -- Metadata
    ai_model VARCHAR(100), -- gpt-4, claude-3, etc.
    generation_time_ms INTEGER,
    quality_score DECIMAL(3,2), -- 0.00-1.00
    
    -- Performance tracking
    engagement_rate DECIMAL(5,4), -- if connected to social accounts
    clicks INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'generated', -- generated, approved, posted, archived
    is_favorite BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    posted_at TIMESTAMP
);

-- Platform-specific optimizations
CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    platform VARCHAR(50) NOT NULL, -- instagram, facebook, etc.
    settings JSONB NOT NULL, -- character limits, hashtag preferences, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, platform)
);

-- Analytics and Performance
CREATE TABLE caption_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caption_id UUID REFERENCES captions(id),
    platform VARCHAR(50),
    
    -- Engagement metrics
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    
    -- Calculated metrics
    engagement_rate DECIMAL(5,4),
    ctr DECIMAL(5,4), -- click-through rate
    
    collected_at TIMESTAMP DEFAULT NOW()
);

-- API Usage Tracking
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    
    endpoint VARCHAR(255),
    ai_provider VARCHAR(100), -- openai, anthropic, google
    tokens_used INTEGER,
    cost_usd DECIMAL(10,6),
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes for Performance
```sql
-- Performance indexes
CREATE INDEX idx_captions_project_created ON captions(project_id, created_at DESC);
CREATE INDEX idx_captions_user_platform ON captions(user_id, target_platform);
CREATE INDEX idx_brand_voices_org ON brand_voices(organization_id);
CREATE INDEX idx_api_usage_org_date ON api_usage(organization_id, created_at);

-- Vector similarity search (for brand voice matching)
CREATE INDEX idx_brand_voices_embedding ON brand_voices 
USING ivfflat (embedding_vector vector_cosine_ops);
```

## 🔐 Security Architecture

### Authentication & Authorization
- **Multi-Factor Authentication**: TOTP + SMS backup
- **OAuth Providers**: Google, GitHub, LinkedIn
- **JWT Tokens**: Short-lived access (15min) + refresh tokens (7 days)
- **Role-Based Access Control**: Organization-level permissions
- **API Key Management**: Rate-limited API keys for integrations

### Data Protection
- **Encryption at Rest**: AES-256 for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **Content Privacy**: User content isolated per organization
- **Data Retention**: Configurable policies (30/90/365 days)
- **GDPR Compliance**: Right to deletion, data export

### API Security
- **Rate Limiting**: Tiered by subscription level
- **Input Validation**: Zod schemas for all inputs
- **Content Moderation**: Automated inappropriate content detection
- **CORS Configuration**: Strict origin validation
- **CSP Headers**: Prevent XSS attacks

## 🚀 Performance Architecture

### Caching Strategy
```typescript
// Multi-level caching
interface CacheStrategy {
  // Level 1: Browser cache (10min)
  browserCache: {
    userProfile: '10m',
    brandVoices: '5m',
    projectSettings: '15m'
  },
  
  // Level 2: CDN cache (1hour)
  cdnCache: {
    staticAssets: '7d',
    generatedImages: '1h',
    publicContent: '30m'
  },
  
  // Level 3: Redis cache (varies)
  redisCache: {
    userSessions: '7d',
    captionGenerations: '1h',
    aiResponses: '24h',
    analyticsData: '15m'
  }
}
```

### Scalability Design
- **Horizontal Scaling**: Stateless API design
- **Database Sharding**: By organization_id
- **Queue Processing**: Background jobs for AI generation
- **CDN Distribution**: Global content delivery
- **Auto-scaling**: Based on CPU/memory usage

### Cost Optimization
- **AI Request Batching**: Reduce API calls by 40%
- **Intelligent Caching**: Cache similar requests
- **Model Selection**: Route to optimal AI model by complexity
- **Usage Analytics**: Track and optimize expensive operations

## 🔄 Real-time Features

### WebSocket Implementation
```typescript
// Real-time collaboration events
interface RealtimeEvents {
  'caption:generating': { projectId: string, status: 'started' | 'processing' | 'complete' },
  'caption:generated': { captionId: string, caption: CaptionData },
  'user:joined': { userId: string, projectId: string },
  'user:left': { userId: string, projectId: string },
  'brand-voice:updated': { brandVoiceId: string, changes: Partial<BrandVoice> }
}
```

### Live Features
- **Real-time Caption Generation**: Live status updates
- **Collaborative Editing**: Multiple users editing brand voices
- **Live Notifications**: Generation complete, quota warnings
- **Activity Feeds**: Team activity tracking

## 📈 Analytics & Monitoring

### Application Monitoring
- **Error Tracking**: Sentry for error monitoring
- **Performance Monitoring**: Core Web Vitals tracking
- **API Monitoring**: Response times, error rates
- **Database Monitoring**: Query performance, connection pools

### Business Analytics
- **User Behavior**: Caption generation patterns
- **Content Performance**: Engagement tracking
- **Revenue Metrics**: Subscription conversions, churn
- **AI Cost Tracking**: Token usage optimization

### Alerting System
- **Performance Alerts**: >3s response times
- **Error Rate Alerts**: >1% error rate
- **Quota Alerts**: API limits approaching
- **Security Alerts**: Suspicious activity patterns

## 🔌 Integration Architecture

### Social Media APIs
```typescript
interface SocialPlatformConfig {
  instagram: {
    api: 'Meta Graph API',
    features: ['posting', 'analytics', 'stories'],
    limits: { posts: '25/hour', analytics: '200/hour' }
  },
  twitter: {
    api: 'Twitter API v2',
    features: ['posting', 'analytics', 'threads'],
    limits: { posts: '300/15min', analytics: '100/15min' }
  },
  linkedin: {
    api: 'LinkedIn Marketing API',
    features: ['posting', 'analytics', 'company-pages'],
    limits: { posts: '100/day', analytics: '500/day' }
  }
}
```

### Third-party Integrations
- **Scheduling Tools**: Buffer, Hootsuite, Later integration
- **Design Tools**: Canva API for image enhancement
- **Analytics**: Google Analytics, Facebook Pixel
- **Payment Processing**: Stripe for subscriptions
- **Email**: SendGrid for transactional emails

This architecture provides a robust foundation for an enterprise-grade social media caption generator that can scale to thousands of users while maintaining performance, security, and reliability standards required by the CLAUDE.md methodology.