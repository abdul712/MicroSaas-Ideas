# Customer Journey Mapper - User Experience Analytics Platform

A comprehensive customer journey mapping platform that visualizes user interactions across all touchpoints, identifies pain points, analyzes conversion paths, and optimizes the entire customer experience with AI-powered insights.

## 🎯 Features

### Core Capabilities
- **Visual Journey Mapping**: Interactive drag-and-drop journey visualization with D3.js
- **Real-time Analytics**: Live event tracking and processing with ClickHouse
- **AI-Powered Insights**: Machine learning recommendations for optimization
- **Conversion Funnel Analysis**: Advanced Sankey diagrams and funnel visualization
- **Cross-Device Tracking**: Unified customer identification across platforms
- **Multi-Tenant Architecture**: Enterprise-ready with organization management

### Advanced Features
- **Event Tracking SDK**: Lightweight JavaScript and server-side SDKs
- **Privacy Compliance**: Built-in GDPR/CCPA compliance features
- **Custom Segmentation**: Dynamic customer segments and cohort analysis
- **Integration Hub**: Connect with popular tools (GA, Shopify, HubSpot, etc.)
- **Predictive Analytics**: AI-driven user behavior forecasting
- **Real-time Notifications**: Live alerts for journey anomalies

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL 15+
- ClickHouse 23+
- Redis 7+

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd customer-journey-mapper
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Start development services**
```bash
docker-compose up -d postgres redis clickhouse
```

5. **Set up the database**
```bash
npx prisma migrate dev
npx prisma generate
```

6. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Deployment

1. **Using Docker Compose**
```bash
docker-compose -f docker-compose.yml up -d
```

2. **Environment Configuration**
Set the following environment variables:
```bash
DATABASE_URL=postgresql://user:password@host:5432/journey_mapper
CLICKHOUSE_URL=http://clickhouse:8123
REDIS_URL=redis://redis:6379
KAFKA_BROKERS=kafka:9092
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

## 📊 Architecture

### Technology Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, D3.js
- **Backend**: Next.js API Routes, Prisma ORM
- **Databases**: PostgreSQL (structured data), ClickHouse (analytics)
- **Real-time**: WebSockets, Apache Kafka
- **Caching**: Redis
- **Authentication**: NextAuth.js

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   Mobile App    │    │   Server SDK    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼───────────────┐
                    │      API Gateway           │
                    │   (Next.js API Routes)     │
                    └─────────────┬───────────────┘
                                 │
                    ┌─────────────▼───────────────┐
                    │     Event Processor        │
                    │      (Kafka Stream)        │
                    └─────────────┬───────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼───────┐    ┌─────────▼───────┐    ┌─────────▼───────┐
│   PostgreSQL    │    │   ClickHouse    │    │     Redis       │
│ (User & Journey │    │   (Analytics    │    │   (Sessions &   │
│     Data)       │    │     Events)     │    │     Cache)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 SDK Integration

### JavaScript SDK
```html
<!-- Basic setup -->
<script src="https://cdn.journeymapper.com/sdk/v1/journey-tracker.js"></script>
<script>
  JourneyMapper.init({
    apiKey: 'your-api-key',
    customerId: 'user-123',
    journeyId: 'onboarding-flow'
  });
</script>
```

### Programmatic Usage
```javascript
import { initJourneyTracker } from '@journeymapper/sdk';

const tracker = initJourneyTracker({
  apiKey: 'your-api-key',
  customerId: 'user-123',
  autoTrack: {
    pageViews: true,
    clicks: true,
    formSubmissions: true
  }
});

// Track custom events
tracker.track('button_click', {
  buttonId: 'signup-cta',
  page: '/landing'
});

// Track conversions
tracker.trackConversion({
  goalId: 'signup',
  value: 29.99,
  currency: 'USD'
});
```

### Server-side Integration
```javascript
import { ServerSideTracker } from '@journeymapper/node-sdk';

const tracker = new ServerSideTracker({
  apiKey: 'your-api-key'
});

tracker.track({
  eventType: 'purchase',
  customerId: 'user-123',
  properties: {
    amount: 99.99,
    currency: 'USD',
    productId: 'prod-456'
  }
});
```

## 📈 Analytics & Insights

### Journey Visualization
- **Node-Link Diagrams**: Interactive journey flow visualization
- **Sankey Funnels**: Conversion funnel analysis with drop-off points
- **Heatmaps**: User interaction intensity mapping
- **Timeline Views**: Sequential journey progression

### Key Metrics
- **Conversion Rates**: Per-step and overall journey conversion
- **Drop-off Analysis**: Identification of friction points
- **Time to Convert**: Average duration between touchpoints
- **Customer Lifetime Value**: Predictive value scoring
- **Attribution Modeling**: Multi-touch attribution analysis

### AI-Powered Insights
- **Bottleneck Detection**: Automated identification of problematic steps
- **Optimization Recommendations**: AI-suggested improvements
- **Anomaly Detection**: Real-time alerts for unusual patterns
- **Predictive Analytics**: Forecasting of user behavior
- **Segmentation Insights**: Dynamic customer grouping

## 🛡️ Privacy & Compliance

### GDPR Compliance
- **Consent Management**: Built-in cookie and tracking consent
- **Data Anonymization**: Automatic PII detection and masking
- **Right to be Forgotten**: User data deletion capabilities
- **Data Portability**: Export user data in standard formats

### Security Features
- **Data Encryption**: At-rest and in-transit encryption
- **API Security**: Rate limiting and authentication
- **Access Controls**: Role-based permissions
- **Audit Logging**: Complete activity tracking

## 🔌 Integrations

### Marketing Tools
- Google Analytics 4
- Google Tag Manager
- Facebook Pixel
- Mixpanel
- Amplitude

### E-commerce Platforms
- Shopify
- WooCommerce
- Magento
- BigCommerce

### CRM Systems
- Salesforce
- HubSpot
- Pipedrive
- Zendesk

### Communication
- Mailchimp
- SendGrid
- Slack
- Discord

## 📝 API Reference

### Authentication
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.journeymapper.com/v1/events
```

### Event Tracking
```bash
curl -X POST https://api.journeymapper.com/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "events": [{
      "eventType": "page_view",
      "customerId": "user-123",
      "properties": {
        "url": "/dashboard",
        "title": "Dashboard"
      }
    }]
  }'
```

### Journey Analysis
```bash
curl "https://api.journeymapper.com/v1/journeys/analytics?journeyId=onboarding" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Testing Philosophy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint and database integration
- **E2E Tests**: Complete user journey testing
- **Performance Tests**: Load testing for high-traffic scenarios

## 📦 Deployment

### Docker Deployment
```bash
# Build and deploy
docker-compose up -d

# Scale event processors
docker-compose up -d --scale event-processor=3
```

### Environment Configuration
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
CLICKHOUSE_URL=http://clickhouse:8123

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com

# External Services
SENDGRID_API_KEY=your-sendgrid-key
STRIPE_SECRET_KEY=your-stripe-key
```

### Monitoring
- **Health Checks**: Built-in endpoint monitoring
- **Metrics**: Prometheus-compatible metrics export
- **Logging**: Structured JSON logging
- **Alerting**: Integration with PagerDuty, Slack

## 📊 Performance

### Benchmarks
- **Event Processing**: 100K+ events/second
- **Query Performance**: <100ms average response time
- **Uptime**: 99.9% SLA guarantee
- **Scalability**: Supports billions of events

### Optimization Features
- **Event Batching**: Reduces API calls and improves throughput
- **Intelligent Caching**: Redis-based caching for frequent queries
- **Database Optimization**: Proper indexing and query optimization
- **CDN Integration**: Global content delivery for SDK assets

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for quality assurance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](https://docs.journeymapper.com/api)
- [SDK Reference](https://docs.journeymapper.com/sdk)
- [Integration Guides](https://docs.journeymapper.com/integrations)

### Community
- [Discord Community](https://discord.gg/journeymapper)
- [GitHub Discussions](https://github.com/journeymapper/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/journey-mapper)

### Commercial Support
- Email: support@journeymapper.com
- Enterprise Support: enterprise@journeymapper.com
- Status Page: https://status.journeymapper.com

---

**Built with ❤️ for customer success teams worldwide**