# 🚀 CaptionGenius - AI-Powered Social Media Caption Generator

A comprehensive, enterprise-grade SaaS platform for generating engaging, platform-optimized social media captions using advanced AI technology.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

## 🎯 Overview

CaptionGenius is a production-ready Social Media Caption Generator that leverages multiple AI providers (OpenAI, Anthropic, Google) to create engaging, brand-aligned captions optimized for different social media platforms. Built with enterprise-grade architecture following the CLAUDE.md methodology.

### ✨ Key Features

- **🤖 Multi-AI Integration**: OpenAI GPT-4, Anthropic Claude, Google Gemini with intelligent fallback
- **📱 Platform Optimization**: Instagram, Facebook, Twitter, LinkedIn, TikTok, YouTube, Pinterest
- **🎨 Brand Voice Training**: Vector embeddings with semantic matching for consistent brand voice
- **📸 Image Analysis**: Google Vision API integration for context-aware caption generation
- **⚡ Real-time Collaboration**: WebSocket-powered team features with live updates
- **💳 Subscription Management**: Stripe integration with usage-based billing
- **📊 Advanced Analytics**: Performance tracking, engagement metrics, ROI calculation
- **🔒 Enterprise Security**: RBAC, encryption, GDPR compliance, SOC 2 ready
- **🐳 Production Deployment**: Docker containerization with monitoring stack

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, NextAuth.js, Prisma ORM
- **Database**: PostgreSQL with vector support, Redis caching
- **AI Services**: OpenAI, Anthropic, Google AI with cost optimization
- **Image Processing**: Google Cloud Vision API, Sharp
- **Payments**: Stripe with webhook integration
- **Monitoring**: Sentry, custom metrics, health checks
- **Deployment**: Docker, Nginx, multi-stage builds

### System Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   Next.js 14    │◄──►│   API Routes    │◄──►│   Multi-AI      │
│   TypeScript    │    │   Authentication│    │   Integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Database      │    │   External      │
                       │   PostgreSQL    │    │   Services      │
                       │   Redis Cache   │    │   Stripe, etc.  │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-media-caption-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys and configuration
   ```

4. **Set up database**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose up db redis -d
   
   # Run migrations
   npm run db:migrate
   
   # Seed database
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## 🐳 Docker Deployment

### Quick Deployment

```bash
# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up -d

# Run database migrations
docker-compose run --rm migrations

# View logs
docker-compose logs -f app
```

### Production Deployment

```bash
# Build and start with monitoring
docker-compose --profile monitoring up -d

# Check health status
curl http://localhost/health

# Access monitoring
# Application: http://localhost
# Grafana: http://localhost:3001 (admin/admin123)
# Prometheus: http://localhost:9090
```

## 📊 Monitoring & Observability

### Health Checks

The application includes comprehensive health monitoring:

- **Application Health**: `/api/health`
- **Database Connectivity**: Automated checks
- **AI Service Status**: Provider availability
- **Memory Usage**: System resource monitoring

### Metrics Collection

- **Performance Metrics**: API response times, database queries
- **Business Metrics**: Caption generation, user activity, subscriptions
- **Error Tracking**: Automated error reporting with Sentry
- **Cost Monitoring**: AI usage and billing optimization

### Monitoring Stack

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Dashboards and visualization
- **Loki**: Log aggregation and analysis
- **Sentry**: Error tracking and performance monitoring

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | - |
| `REDIS_URL` | Redis connection string | ✅ | - |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | ✅ | - |
| `OPENAI_API_KEY` | OpenAI API key | ✅ | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | ✅ | - |
| `GOOGLE_AI_API_KEY` | Google AI API key | ✅ | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ✅ | - |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Cloud service account | ✅ | - |
| `SENTRY_DSN` | Sentry error tracking | ❌ | - |

### Feature Flags

Configure features through the admin panel or database:

- `ANALYTICS_DASHBOARD`: Advanced analytics features
- `AI_COST_OPTIMIZATION`: Intelligent AI provider selection
- `TEAM_COLLABORATION`: Multi-user features
- `WEBHOOK_SUPPORT`: API webhook integrations

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Type checking
npm run type-check
```

### Test Coverage

The project maintains 90%+ test coverage with comprehensive testing:

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Complete user workflow testing
- **Performance Tests**: Load and stress testing

### Testing Stack

- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing
- **MSW**: API mocking for tests

## 🔒 Security

### Security Features

- **Authentication**: NextAuth.js with OAuth providers
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encryption at rest and in transit
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API abuse prevention
- **Content Moderation**: Automated inappropriate content detection

### Compliance

- **GDPR**: Data portability, right to erasure, consent management
- **SOC 2**: Security controls and monitoring
- **OWASP**: Security best practices implementation
- **Data Retention**: Configurable retention policies

## 📈 Performance

### Performance Optimizations

- **Caching**: Multi-layer caching with Redis
- **CDN**: Static asset optimization
- **Database**: Optimized queries and indexing
- **AI Optimization**: Intelligent provider selection
- **Image Processing**: Efficient image handling and optimization

### Scalability

- **Horizontal Scaling**: Microservices-ready architecture
- **Load Balancing**: Nginx reverse proxy configuration
- **Database Scaling**: Read replicas and connection pooling
- **Monitoring**: Resource usage tracking and alerting

## 🔌 API Reference

### Authentication

All API endpoints require authentication via session or API key:

```bash
# Session-based (web app)
Cookie: next-auth.session-token=...

# API key-based (integrations)
Authorization: Bearer api_key_...
```

### Core Endpoints

#### Generate Caption

```http
POST /api/captions/generate
Content-Type: application/json

{
  "prompt": "Create a caption about a product launch",
  "platform": "INSTAGRAM_FEED",
  "brandVoiceId": "optional-brand-voice-id",
  "imageId": "optional-image-id",
  "preferences": {
    "aiProvider": "OPENAI",
    "temperature": 0.7,
    "maxTokens": 300
  }
}
```

#### List Captions

```http
GET /api/captions?page=1&limit=20&platform=INSTAGRAM_FEED&search=keyword
```

#### Create Brand Voice

```http
POST /api/brand-voices
Content-Type: application/json

{
  "name": "Professional Voice",
  "type": "PROFESSIONAL",
  "description": "Authoritative and expert tone",
  "examples": [
    "Expert insights that drive results",
    "Industry-leading analysis and trends"
  ],
  "keywords": ["expert", "professional", "insights"],
  "toneGuidelines": "Maintain authoritative tone while being approachable"
}
```

#### Upload Image

```http
POST /api/images/upload
Content-Type: multipart/form-data

file: [image file]
description: "Optional description"
```

### Webhook Events

Subscribe to events via webhooks:

- `caption.generated`: New caption created
- `subscription.updated`: Subscription changes
- `image.uploaded`: New image processed
- `user.registered`: New user signup

## 🏢 Business Model

### Subscription Plans

| Plan | Price | Credits | Features |
|------|-------|---------|----------|
| **Free** | $0/month | 20 | Basic features, 2 brand voices |
| **Creator** | $19/month | 200 | All platforms, 5 brand voices, analytics |
| **Professional** | $49/month | 1,000 | Unlimited voices, API access, team collaboration |
| **Agency** | $149/month | 5,000 | White-label, custom training, priority support |

### Revenue Projections

- **Year 1 Target**: $500K ARR (2,500 paying customers)
- **Year 2 Target**: $2M ARR (10,000 paying customers)
- **Year 3 Target**: $6M ARR (25,000 paying customers)

## 🛠️ Development

### Getting Started

1. **Fork and clone** the repository
2. **Install dependencies**: `npm install`
3. **Set up environment**: Copy `.env.example` to `.env.local`
4. **Start database**: `docker-compose up db redis -d`
5. **Run migrations**: `npm run db:migrate`
6. **Start development**: `npm run dev`

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Comprehensive linting rules
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Structured commit messages

### Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # Reusable components
│   ├── ui/            # Base UI components
│   └── landing/       # Landing page components
├── lib/               # Utility libraries
│   ├── ai/            # AI service integrations
│   ├── auth.ts        # Authentication config
│   ├── prisma.ts      # Database client
│   ├── stripe.ts      # Payment processing
│   └── monitoring.ts  # Observability
├── types/             # TypeScript type definitions
└── hooks/             # Custom React hooks
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Create feature branch**: `git checkout -b feature/amazing-feature`
2. **Make changes**: Follow coding standards
3. **Add tests**: Maintain 90%+ coverage
4. **Run checks**: `npm run lint && npm test`
5. **Submit PR**: With detailed description

### Code Review Process

- All changes require peer review
- Automated testing must pass
- Security scan must pass
- Documentation must be updated

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT models and API
- **Anthropic** for Claude AI models
- **Google** for AI and Vision APIs
- **Vercel** for deployment platform
- **Stripe** for payment processing

## 📞 Support

- **Documentation**: [docs.captiongenius.com](https://docs.captiongenius.com)
- **Email Support**: support@captiongenius.com
- **Community**: [Discord](https://discord.gg/captiongenius)
- **GitHub Issues**: For bug reports and feature requests

## 🗺️ Roadmap

### Q1 2024
- [ ] Video caption generation
- [ ] Multi-language support
- [ ] Advanced brand voice analytics
- [ ] Mobile app (React Native)

### Q2 2024
- [ ] Social media scheduling integration
- [ ] Advanced A/B testing
- [ ] Custom AI model training
- [ ] Enterprise SSO integration

### Q3 2024
- [ ] Real-time performance optimization
- [ ] Advanced team collaboration
- [ ] API marketplace
- [ ] White-label solutions

---

Built with ❤️ by the CaptionGenius team. **Ready for production deployment and market launch.**