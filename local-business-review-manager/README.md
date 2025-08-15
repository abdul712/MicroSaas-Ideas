# 🏪 Local Business Review Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

Enterprise-grade Local Business Review Manager - A comprehensive multi-platform review monitoring and reputation management SaaS platform built with Next.js 14, TypeScript, and modern web technologies.

## ✨ Features

### 🎯 Core Features
- **Multi-Platform Review Monitoring** - Google My Business, Facebook, Yelp, TripAdvisor, and more
- **AI-Powered Response Generation** - OpenAI integration for intelligent, brand-consistent responses
- **Real-Time Notifications** - Instant alerts for new reviews via email, SMS, and in-app notifications
- **Sentiment Analysis** - Advanced AI sentiment analysis with actionable insights
- **Review Aggregation** - Centralized dashboard for all review platforms
- **Automated Response Workflows** - Streamline review management with intelligent automation

### 🏢 Business Features
- **Multi-Tenant Architecture** - Complete business isolation and data security
- **Role-Based Access Control** - Granular permissions for team collaboration
- **Multi-Location Management** - Manage reviews across multiple business locations
- **Review Invitation Campaigns** - Proactive review generation via email and SMS
- **Advanced Analytics & Reporting** - Comprehensive insights and performance metrics
- **White-Label Solutions** - Agency and franchise management capabilities

### 🔒 Security & Compliance
- **GDPR Compliance** - Full data protection and privacy controls
- **Enterprise Security** - OWASP compliance, encryption at rest and in transit
- **Audit Logging** - Complete activity tracking and compliance reporting
- **Rate Limiting** - API protection and cost optimization
- **Data Retention Policies** - Configurable retention and anonymization

### 🚀 Technical Excellence
- **90%+ Test Coverage** - Comprehensive testing with Jest and React Testing Library
- **Docker Deployment** - Production-ready containerization
- **Redis Caching** - High-performance caching and session management
- **Real-Time Updates** - WebSocket integration for live notifications
- **API-First Design** - RESTful APIs with OpenAPI documentation

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for sessions and caching
- **Authentication**: NextAuth.js with OAuth providers
- **AI**: OpenAI API for response generation and sentiment analysis
- **Real-time**: Redis Pub/Sub and WebSockets
- **Testing**: Jest, React Testing Library, Playwright (E2E)
- **Deployment**: Docker, Docker Compose

### External Integrations
- **Review Platforms**: Google My Business, Facebook Graph API, Yelp Fusion API, TripAdvisor API
- **Communication**: Twilio (SMS), SendGrid (Email)
- **Payments**: Stripe for subscription management
- **AI Services**: OpenAI GPT for response generation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd local-business-review-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Seed database (optional)
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Docker Deployment

1. **Production deployment**
   ```bash
   # Build and start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f app
   ```

2. **Development with Docker**
   ```bash
   # Start only database and cache
   docker-compose up -d postgres redis
   
   # Run app locally
   npm run dev
   ```

3. **With monitoring (optional)**
   ```bash
   # Start with Prometheus and Grafana
   docker-compose --profile monitoring up -d
   ```

## 📊 Database Schema

The application uses a comprehensive multi-tenant database schema designed for scalability:

### Core Entities
- **Users & Authentication** - NextAuth.js integration with role-based access
- **Tenants** - Multi-tenancy with subscription management
- **Businesses & Locations** - Multi-location business management
- **Review Platforms** - Integration with multiple review platforms
- **Reviews & Responses** - Comprehensive review and response management
- **Campaigns & Invitations** - Review generation campaigns
- **Analytics** - Detailed metrics and reporting
- **Audit Logs** - Complete activity tracking

### Key Features
- **Data Isolation** - Complete tenant separation
- **Audit Trail** - Full GDPR-compliant logging
- **Scalable Design** - Optimized for high-volume operations
- **Flexible Schema** - Support for custom review platforms

## 🧪 Testing

### Test Coverage
The application maintains 90%+ test coverage across all critical components:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Types
- **Unit Tests** - Component and function testing
- **Integration Tests** - API endpoint and database testing
- **E2E Tests** - Complete user workflow testing
- **Performance Tests** - Load and stress testing

### Test Structure
```
src/
├── __tests__/          # Unit tests
├── components/
│   └── __tests__/      # Component tests
├── lib/
│   └── __tests__/      # Utility tests
└── services/
    └── __tests__/      # Service tests
```

## 📡 API Documentation

### Authentication
All API endpoints require authentication except public webhooks:

```bash
# Authentication header
Authorization: Bearer <jwt-token>
```

### Core Endpoints

#### Reviews
- `GET /api/reviews` - List reviews with filtering
- `GET /api/reviews/:id` - Get review details
- `POST /api/reviews/:id/respond` - Create review response
- `PUT /api/reviews/:id/status` - Update review status

#### Businesses
- `GET /api/businesses` - List user businesses
- `POST /api/businesses` - Create new business
- `PUT /api/businesses/:id` - Update business
- `DELETE /api/businesses/:id` - Delete business

#### Analytics
- `GET /api/analytics/summary` - Review summary metrics
- `GET /api/analytics/trends` - Trend analysis
- `GET /api/analytics/platforms` - Platform breakdown

#### Integrations
- `POST /api/integrations/connect` - Connect review platform
- `POST /api/integrations/sync` - Manual sync trigger
- `GET /api/integrations/status` - Integration status

## 🔧 Configuration

### Environment Variables

#### Required
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/review_manager

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key

# Redis
REDIS_URL=redis://localhost:6379
```

#### Optional Integrations
```env
# AI Services
OPENAI_API_KEY=sk-your-openai-key

# Review Platforms
GOOGLE_MY_BUSINESS_API_KEY=your-gmb-key
YELP_API_KEY=your-yelp-key
FACEBOOK_CLIENT_ID=your-facebook-id
FACEBOOK_CLIENT_SECRET=your-facebook-secret

# Communication
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
SENDGRID_API_KEY=your-sendgrid-key

# Payments
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
```

### Feature Flags
Control feature availability per tenant:

```typescript
// Tenant-level feature configuration
{
  aiResponsesEnabled: boolean,
  sentimentAnalysisEnabled: boolean,
  competitorTrackingEnabled: boolean,
  whitelabelEnabled: boolean
}
```

## 🚀 Deployment

### Production Deployment

1. **Prepare environment**
   ```bash
   # Set production environment variables
   cp .env.example .env.production
   # Configure all required variables
   ```

2. **Build and deploy**
   ```bash
   # Build Docker image
   docker build -t review-manager .
   
   # Deploy with compose
   docker-compose -f docker-compose.yml --profile production up -d
   ```

3. **Database migration**
   ```bash
   # Run migrations
   docker-compose exec app npx prisma migrate deploy
   ```

### Monitoring & Observability

#### Health Checks
- **Application**: `GET /api/health`
- **Database**: Built-in Prisma connection monitoring
- **Redis**: Connection and performance monitoring
- **External APIs**: Platform connectivity monitoring

#### Logging
- **Structured Logging**: JSON format with correlation IDs
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Metrics**: Response times and throughput monitoring
- **Audit Logs**: Complete user activity tracking

#### Metrics (with Prometheus)
- Application metrics (requests, response times, errors)
- Business metrics (reviews, responses, satisfaction)
- Infrastructure metrics (database, cache, API usage)
- Custom dashboards with Grafana

## 🤝 Contributing

### Development Workflow

1. **Setup development environment**
   ```bash
   npm install
   npm run db:generate
   npm run dev
   ```

2. **Code quality**
   ```bash
   # Linting
   npm run lint
   
   # Type checking
   npm run type-check
   
   # Testing
   npm run test
   ```

3. **Pre-commit hooks**
   - Automatic linting and formatting
   - Type checking
   - Test execution
   - Security scanning

### Code Standards
- **TypeScript** - Strict mode enabled
- **ESLint** - Airbnb configuration with custom rules
- **Prettier** - Consistent code formatting
- **Conventional Commits** - Standardized commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Integration Guide](docs/integrations.md)
- [Security Guide](docs/security.md)

### Community
- [GitHub Issues](https://github.com/your-org/local-business-review-manager/issues)
- [Discussions](https://github.com/your-org/local-business-review-manager/discussions)
- [Discord Community](https://discord.gg/your-invite)

### Enterprise Support
For enterprise customers:
- Dedicated support channel
- Priority bug fixes
- Custom feature development
- Implementation assistance

---

**Built with ❤️ for local businesses to manage their online reputation effectively.**