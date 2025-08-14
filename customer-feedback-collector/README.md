# Customer Feedback Collector - AI-Powered Feedback Platform

A comprehensive, enterprise-grade SaaS platform for collecting, analyzing, and acting on customer feedback with AI-powered insights.

## 🚀 Features

### Core Functionality
- **Multi-Channel Feedback Collection**: Widgets, email surveys, SMS, QR codes, API
- **AI-Powered Analysis**: Sentiment analysis, topic extraction, emotion detection
- **Real-Time Analytics**: Live dashboards with NPS/CSAT tracking
- **Survey Builder**: Drag-and-drop interface with 15+ question types
- **Multi-Tenant Architecture**: Organization-based data isolation
- **Customizable Widgets**: Popup, slide-in, embedded, floating tab options

### Technical Features
- **Enterprise Security**: JWT auth, RBAC, rate limiting, GDPR compliance
- **Performance Optimized**: Sub-2-second loading, Redis caching
- **Scalable Architecture**: Docker containerization, microservices-ready
- **Comprehensive API**: RESTful endpoints with OpenAPI documentation
- **Testing Suite**: 90%+ coverage with Jest and Playwright

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **AI/ML**: OpenAI GPT-4 integration
- **Authentication**: NextAuth.js with JWT tokens
- **Caching**: Redis for rate limiting and performance
- **Deployment**: Docker containers with docker-compose

## 📦 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional)

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd customer-feedback-collector
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Configure the following variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/feedback_collector"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI (for AI analysis)
OPENAI_API_KEY="your-openai-key"

# Redis
REDIS_URL="redis://localhost:6379"

# OAuth Providers (optional)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

4. Set up the database:
```bash
npm run db:migrate
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
npm run test:coverage
```

### End-to-End Tests
```bash
npm run test:e2e
npm run test:e2e:ui
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## 📊 Database Schema

The application uses a comprehensive 15-model database schema:

### Core Models
- **Organization**: Multi-tenant isolation
- **User**: Authentication and roles
- **Survey**: Feedback collection configuration
- **Question**: Survey questions with validation
- **Response**: Customer feedback submissions
- **Answer**: Individual question responses

### Analytics Models
- **SentimentAnalysis**: AI-powered sentiment data
- **Analytics**: Aggregated metrics
- **Widget**: Embeddable feedback collection

### Business Models
- **Subscription**: Billing and usage tracking
- **Plan**: Pricing tiers
- **Integration**: Third-party connections

## 🔧 API Documentation

### Authentication
```bash
POST /api/auth/signup
POST /api/auth/signin
```

### Surveys
```bash
GET /api/surveys
POST /api/surveys
GET /api/surveys/[id]
PUT /api/surveys/[id]
DELETE /api/surveys/[id]
POST /api/surveys/[id]/publish
```

### Responses
```bash
GET /api/responses
POST /api/responses
```

### Analytics
```bash
GET /api/analytics/[surveyId]
```

### Health Check
```bash
GET /api/health
```

## 🛡️ Security Features

- **Authentication**: JWT-based with NextAuth.js
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Redis-backed with configurable limits
- **Input Validation**: Zod schemas for all endpoints
- **CSRF Protection**: Built-in Next.js protection
- **CORS Configuration**: Configurable for widget endpoints
- **Data Encryption**: At rest and in transit

## 🌍 Multi-Tenancy

The platform implements a hybrid multi-tenancy approach:
- **Row-Level Security (RLS)** for small/medium organizations
- **Schema-per-tenant** ready for enterprise clients
- **Data isolation** enforced at the application level
- **Tenant-aware Prisma client** for database operations

## 🤖 AI Integration

### Sentiment Analysis
- **Real-time processing** with OpenAI GPT-4
- **Emotion detection** (joy, anger, fear, sadness, surprise, disgust)
- **Topic extraction** and keyword identification
- **Confidence scoring** for analysis quality

### Response Categorization
- **Automatic categorization** into predefined categories
- **Custom category** support for organizations
- **Batch processing** for efficiency

## 🔗 Widget Integration

### Supported Widget Types
- **Popup**: Modal overlay with customizable triggers
- **Slide-in**: Non-intrusive side panel
- **Embedded**: Inline form integration
- **Floating Tab**: Persistent feedback button
- **Modal**: Full-screen feedback collection

### Embed Code Examples
```html
<!-- Popup Widget -->
<script src="https://yourapp.com/widgets/[id]/popup.js" async></script>

<!-- Inline Widget -->
<div id="feedback-widget-[id]"></div>
<script src="https://yourapp.com/widgets/[id]/inline.js" async></script>
```

## 📈 Performance Optimization

- **Server-Side Rendering** with Next.js 14 App Router
- **Image Optimization** with Next.js Image component
- **Code Splitting** for optimal bundle sizes
- **Redis Caching** for API responses
- **Database Query Optimization** with Prisma
- **CDN Integration** ready for static assets

## 🏗️ Architecture Decisions

### Database
- **PostgreSQL** for ACID compliance and complex queries
- **Prisma ORM** for type-safe database operations
- **Connection pooling** for production scalability

### Caching
- **Redis** for session storage and rate limiting
- **Next.js caching** for API responses
- **Browser caching** with proper headers

### State Management
- **Server State**: React Query for API calls
- **Client State**: React hooks for local state
- **Form State**: React Hook Form with Zod validation

## 🚀 Deployment Guide

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring and alerting configured
- [ ] Backup procedures implemented
- [ ] Load balancing configured
- [ ] CDN configured for static assets

### Monitoring
- **Health Checks**: `/api/health` endpoint
- **Metrics**: Built-in analytics tracking
- **Logging**: Structured logging with Winston
- **Error Tracking**: Ready for Sentry integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: [docs.yourapp.com](https://docs.yourapp.com)
- **Issues**: [GitHub Issues](https://github.com/yourorg/feedback-collector/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourorg/feedback-collector/discussions)
- **Email**: support@yourapp.com

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Core survey functionality
- [x] AI-powered analysis
- [x] Multi-tenant architecture
- [x] Widget system
- [x] Analytics dashboard

### Phase 2 (Next)
- [ ] Advanced integrations (Slack, Teams, Zapier)
- [ ] White-label customization
- [ ] Advanced reporting
- [ ] Mobile app
- [ ] Advanced AI features

### Phase 3 (Future)
- [ ] Machine learning models
- [ ] Predictive analytics
- [ ] Advanced automation
- [ ] Enterprise features
- [ ] Global expansion

---

Built with ❤️ using Next.js 14, TypeScript, and modern web technologies.