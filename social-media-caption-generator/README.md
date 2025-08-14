# 🚀 Social Media Caption Generator - Enterprise AI Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-success)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

A production-ready, enterprise-grade social media caption generation SaaS platform powered by multiple AI providers, featuring brand voice training, real-time collaboration, and comprehensive analytics.

## 🎯 Features

### 🤖 AI-Powered Caption Generation
- **Multi-AI Integration**: OpenAI GPT-4, Anthropic Claude, Google Gemini with intelligent routing
- **Platform Optimization**: Instagram, Facebook, Twitter, LinkedIn, TikTok, YouTube, Pinterest
- **Smart Provider Selection**: Cost and complexity-based AI model routing
- **Real-time Generation**: Sub-3 second caption generation with progress tracking

### 🎨 Brand Voice Engine
- **Vector Embeddings**: Semantic brand voice matching with Pinecone integration
- **Voice Training**: AI learns your brand personality from examples
- **Consistency Scoring**: Automated brand voice compliance checking
- **Multi-Brand Support**: Manage multiple brand voices per organization

### 📊 Advanced Analytics
- **Performance Tracking**: Engagement rates, reach metrics, ROI analysis
- **A/B Testing**: Caption variation performance comparison
- **Cost Optimization**: AI usage tracking and cost management
- **Real-time Insights**: Live generation and usage dashboards

### 🔒 Enterprise Security
- **Role-Based Access Control (RBAC)**: Granular permission system
- **Data Encryption**: AES-256-GCM encryption for sensitive data
- **GDPR Compliance**: Data portability, right to erasure, retention policies
- **Security Monitoring**: Real-time threat detection and alerting

### 🤝 Team Collaboration
- **Real-time Collaboration**: WebSocket-powered live editing
- **Organization Management**: Multi-tenant architecture with team roles
- **Approval Workflows**: Caption review and approval processes
- **Activity Tracking**: User activity monitoring and audit logs

### 💳 Subscription Management
- **Stripe Integration**: Secure payment processing with webhook support
- **4-Tier Pricing**: Free, Creator, Professional, Agency plans
- **Usage-Based Billing**: Credit system with rollover capabilities
- **Revenue Analytics**: Subscription metrics and churn analysis

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router and server components
- **TypeScript**: Strict type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Framer Motion**: Smooth animations and micro-interactions
- **Radix UI**: Accessible, unstyled UI components

### Backend
- **Node.js**: JavaScript runtime with Express.js-like routing
- **Prisma ORM**: Type-safe database operations with PostgreSQL
- **NextAuth.js**: Authentication with OAuth providers (Google, GitHub, LinkedIn)
- **Socket.IO**: Real-time bidirectional communication
- **Redis**: Caching and session management

### AI & Machine Learning
- **OpenAI GPT-4**: Advanced language model for complex generation
- **Anthropic Claude**: Long-context AI for brand voice training
- **Google Gemini**: Cost-effective generation for simple tasks
- **Google Vision API**: Image analysis and context extraction
- **Pinecone**: Vector database for semantic brand voice matching

### Database & Storage
- **PostgreSQL**: Primary database with vector extensions
- **Redis**: Caching, rate limiting, and real-time features
- **Prisma**: Database schema management and migrations
- **Vector Support**: pgvector extension for embeddings storage

### DevOps & Monitoring
- **Docker**: Containerized deployment with multi-stage builds
- **Docker Compose**: Local development and production orchestration
- **Sentry**: Error tracking and performance monitoring
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization dashboards and analytics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for containerized setup)

### 1. Clone and Install
```bash
git clone https://github.com/your-org/social-media-caption-generator.git
cd social-media-caption-generator
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

Required environment variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/caption_generator"
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AI APIs
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
GOOGLE_AI_API_KEY="your-google-ai-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_your-stripe-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

### 3. Database Setup
```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🐳 Docker Deployment

### Development
```bash
docker-compose -f docker-compose.yml up -d
```

### Production
```bash
# Build and deploy all services
docker-compose -f docker-compose.yml --profile monitoring up -d

# Run database migrations
docker-compose run --rm migration
```

### Services
- **App**: Main application (port 3000)
- **PostgreSQL**: Database (port 5432)
- **Redis**: Cache and sessions (port 6379)
- **Nginx**: Reverse proxy (ports 80/443)
- **Prometheus**: Metrics (port 9090)
- **Grafana**: Dashboards (port 3001)

## 📖 API Documentation

### Authentication
All API endpoints require authentication via NextAuth.js session cookies or API keys.

### Generate Captions
```bash
POST /api/captions/generate
Content-Type: application/json

{
  "platform": "INSTAGRAM",
  "imageUrl": "https://example.com/image.jpg",
  "brandVoiceId": "brand-voice-id",
  "tone": "professional",
  "variationCount": 3
}
```

### Manage Brand Voices
```bash
# Create brand voice
POST /api/brand-voices
{
  "name": "Professional Voice",
  "description": "Corporate communication style",
  "examples": ["Example caption 1", "Example caption 2"],
  "guidelines": "Keep it professional and engaging"
}

# Get brand voices
GET /api/brand-voices

# Update brand voice
PUT /api/brand-voices/[id]
```

### Analytics
```bash
# Get caption performance
GET /api/analytics/captions/[id]

# Get usage metrics
GET /api/analytics/usage?start=2024-01-01&end=2024-01-31
```

## 🧪 Testing

### Unit Tests
```bash
npm test
npm run test:watch
npm run test:coverage
```

### E2E Tests
```bash
npm run test:e2e
npm run test:e2e:ui
```

### Load Testing
```bash
npm run test:load
```

Coverage target: 90%+ for all critical paths.

## 🔐 Security

### Authentication
- NextAuth.js with OAuth providers
- JWT tokens with refresh mechanism
- Session management with Redis

### Authorization
- Role-based access control (RBAC)
- Resource ownership validation
- Organization-level permissions

### Data Protection
- AES-256-GCM encryption for sensitive data
- Password hashing with bcrypt (12 rounds)
- Input sanitization and validation
- SQL injection prevention

### GDPR Compliance
- Data portability (export user data)
- Right to erasure (delete user data)
- Data retention policies (3-year default)
- Audit logging for compliance

## 📊 Monitoring

### Performance Metrics
- Response times and throughput
- AI generation latency and costs
- Database query performance
- Memory and CPU usage

### Business Metrics
- User registrations and activity
- Caption generations and success rates
- Subscription metrics and revenue
- Feature usage analytics

### Alerting
- Error rate thresholds (>5%)
- Response time alerts (>5 seconds)
- Cost monitoring ($100/hour threshold)
- Security event notifications

### Dashboards
- Real-time system health
- Business KPI tracking
- User behavior analytics
- Cost and usage reports

## 🏗️ Architecture

### System Design
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (Next.js)     │────│   (Node.js)     │────│   (Multi-AI)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Cache         │    │   Vector DB     │
│   (PostgreSQL)  │    │   (Redis)       │    │   (Pinecone)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Database Schema
- **Users**: Authentication and profiles
- **Organizations**: Multi-tenant structure
- **Brand Voices**: AI training data with vectors
- **Captions**: Generated content and analytics
- **Subscriptions**: Billing and usage tracking
- **Audit Logs**: Security and compliance

### AI Pipeline
1. **Input Processing**: Sanitize and validate user input
2. **Provider Selection**: Choose optimal AI model based on complexity
3. **Context Building**: Include brand voice, platform constraints, image analysis
4. **Generation**: Call AI provider with optimized prompts
5. **Post-processing**: Platform optimization, hashtag suggestions, quality scoring
6. **Storage**: Cache results and track usage metrics

## 🚀 Deployment

### Environment Setup
1. **Development**: Local setup with Docker Compose
2. **Staging**: Container orchestration with monitoring
3. **Production**: Multi-region deployment with auto-scaling

### CI/CD Pipeline
1. **Code Quality**: Linting, type checking, security scanning
2. **Testing**: Unit, integration, and E2E tests
3. **Build**: Docker image creation and optimization
4. **Deploy**: Rolling updates with health checks
5. **Monitor**: Performance and error tracking

### Scaling Strategy
- **Horizontal Scaling**: Multiple app instances behind load balancer
- **Database Scaling**: Read replicas and connection pooling
- **Cache Scaling**: Redis cluster for high availability
- **AI Scaling**: Provider failover and rate limiting

## 📋 Roadmap

### Phase 1: Core Platform ✅
- Multi-AI caption generation
- Brand voice training
- Basic analytics and monitoring
- Subscription management

### Phase 2: Advanced Features 🚧
- Video content analysis
- Multilingual support
- Advanced A/B testing
- Custom AI model training

### Phase 3: Enterprise Features 📋
- White-label solutions
- Advanced team collaboration
- Custom integrations
- Dedicated customer success

### Phase 4: Market Expansion 📋
- Mobile applications
- Social media scheduling
- Influencer marketplace
- Agency tools and workflows

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and development process.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Code Standards
- TypeScript strict mode
- ESLint and Prettier configuration
- 90%+ test coverage requirement
- Security-first development

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Reference](docs/api.md)
- [Development Guide](docs/development.md)
- [Deployment Guide](docs/deployment.md)
- [Security Guide](docs/security.md)

### Community
- [GitHub Issues](https://github.com/your-org/social-media-caption-generator/issues)
- [Discussions](https://github.com/your-org/social-media-caption-generator/discussions)
- [Discord Community](https://discord.gg/your-discord)

### Enterprise Support
For enterprise customers:
- Dedicated support channel
- SLA guarantees
- Custom feature development
- Priority bug fixes

---

<div align="center">
  <strong>Built with ❤️ for content creators and marketing teams worldwide</strong>
</div>