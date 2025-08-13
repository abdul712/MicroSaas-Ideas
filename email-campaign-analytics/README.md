# Email Campaign Analytics

A comprehensive email marketing analytics platform with multi-provider integration, advanced A/B testing, subscriber intelligence, and AI-powered insights.

## 🚀 Features

### Core Analytics
- **Real-time Campaign Tracking**: Monitor email performance with live updates
- **A/B Testing Framework**: Statistical significance analysis with automated winner detection
- **Cohort Analysis**: Track subscriber engagement over time
- **Industry Benchmarking**: Compare performance against industry standards

### Subscriber Intelligence
- **Behavior Tracking**: Individual subscriber engagement scoring
- **Churn Prediction**: ML-powered churn risk assessment
- **Smart Segmentation**: Automated grouping based on behavior and preferences
- **Lifecycle Analysis**: Track subscriber journey from signup to conversion

### Deliverability & Reputation
- **Inbox Placement Monitoring**: Track delivery across major email providers
- **Sender Reputation Management**: Monitor and improve domain reputation
- **Automated List Cleaning**: Remove bounced and inactive subscribers
- **Spam Score Analysis**: Content optimization recommendations

### Revenue Attribution
- **E-commerce Integration**: Connect with Shopify, WooCommerce, and more
- **Multi-touch Attribution**: Track customer journey across multiple campaigns
- **Customer Lifetime Value**: Analyze long-term subscriber value
- **ROI Calculation**: Accurate cost-per-acquisition analysis

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Radix UI** for accessible components

### Backend
- **FastAPI** (Python) for high-performance API
- **PostgreSQL** for primary data storage
- **ClickHouse** for time-series analytics
- **Redis** for caching and real-time features
- **Celery** for background job processing

### Infrastructure
- **Docker** containerization
- **Docker Compose** for local development
- **Next.js** optimized for production deployment
- **Prisma** for database management

## 📁 Project Structure

```
email-campaign-analytics/
├── src/                    # Frontend source code
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── lib/              # Utility functions
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript type definitions
├── api/                   # Backend API
│   ├── routers/          # FastAPI route handlers
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   └── core/             # Configuration and utilities
├── prisma/               # Database schema and migrations
├── docker-compose.yml    # Local development environment
└── Dockerfile           # Production container
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Local Development

1. **Clone and setup**
   ```bash
   cd email-campaign-analytics
   npm install
   ```

2. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

3. **Setup the database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start the frontend**
   ```bash
   npm run dev
   ```

5. **Start the backend** (in another terminal)
   ```bash
   npm run api:dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Environment Variables

Create a `.env.local` file:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/email_analytics"
REDIS_URL="redis://localhost:6379"
CLICKHOUSE_URL="http://localhost:8123"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Email Provider APIs
MAILCHIMP_API_KEY="your-mailchimp-key"
SENDGRID_API_KEY="your-sendgrid-key"
KLAVIYO_API_KEY="your-klaviyo-key"
```

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run E2E tests
```bash
npm run test:e2e
```

### Test Coverage Goals
- **Unit Tests**: 90%+ coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user workflows

## 📊 Email Provider Integrations

### Supported Platforms
- **Mailchimp** - Complete API integration
- **SendGrid** - Webhook support for real-time data
- **Klaviyo** - E-commerce focused analytics
- **ConvertKit** - Creator-focused features
- **ActiveCampaign** - CRM integration
- **Constant Contact** - Small business features
- **HubSpot Email** - Marketing automation
- **Custom SMTP** - Bring your own server

### Integration Features
- **OAuth 2.0 Authentication** - Secure provider connections
- **Real-time Webhooks** - Instant event processing
- **Historical Data Import** - Up to 2 years of past campaigns
- **Unified Data Model** - Consistent analytics across providers

## 🔒 Security & Compliance

### Security Features
- **JWT Authentication** with refresh tokens
- **OAuth 2.0** for email provider connections
- **Data Encryption** at rest and in transit
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization

### Compliance
- **GDPR Compliant** - Data anonymization and deletion
- **SOC 2 Ready** - Security audit preparation
- **Privacy by Design** - Minimal data collection
- **Webhook Security** - Signature verification

## 📈 Performance

### Optimization Features
- **Real-time Processing** - Sub-second analytics updates
- **Intelligent Caching** - Redis-powered performance
- **Database Optimization** - Indexed time-series queries
- **CDN Ready** - Static asset optimization
- **Auto-scaling** - Handle millions of email events

### Monitoring
- **Health Checks** - Automatic system monitoring
- **Performance Metrics** - Response time tracking
- **Error Tracking** - Comprehensive logging
- **Uptime Monitoring** - 99.9% availability target

## 🚢 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

### Environment Setup
- Configure environment variables for production
- Set up SSL certificates
- Configure monitoring and logging
- Set up backup procedures

## 📚 API Documentation

### REST API
- **OpenAPI/Swagger** documentation at `/docs`
- **Comprehensive endpoints** for all features
- **Rate limiting** and authentication
- **Webhook support** for real-time data

### GraphQL (Coming Soon)
- **Real-time subscriptions** for live analytics
- **Flexible queries** for custom dashboards
- **Type-safe** schema definition

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Document new features
- Follow security guidelines

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: Comprehensive guides and tutorials
- **Community**: Discord/Slack community support
- **Enterprise**: Priority support for enterprise customers
- **Status Page**: Real-time system status

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core analytics platform
- ✅ Multi-provider integration
- ✅ Real-time dashboard
- ✅ A/B testing framework

### Phase 2 (Q2 2025)
- 🔄 Advanced ML models
- 🔄 Mobile application
- 🔄 White-label options
- 🔄 Advanced segmentation

### Phase 3 (Q3 2025)
- 📋 Voice analytics
- 📋 International expansion
- 📋 Enterprise features
- 📋 Advanced automations

---

**Built with ❤️ for email marketers who demand better analytics**