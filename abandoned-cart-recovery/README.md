# Abandoned Cart Recovery - Intelligent E-commerce Recovery Platform

An intelligent e-commerce recovery platform that automatically re-engages customers who abandon their shopping carts with AI-powered multi-channel campaigns, real-time analytics, and comprehensive e-commerce integrations.

## 🎯 Features

### Core Recovery Features
- **Real-time Cart Tracking** - Monitor abandonment as it happens with WebSocket integration
- **Multi-channel Campaigns** - Email, SMS, and push notification recovery sequences
- **AI-powered Optimization** - Machine learning for send time and content optimization
- **Personalized Messaging** - Dynamic content with customer and product data
- **A/B Testing Framework** - Optimize recovery rates with statistical significance

### E-commerce Integrations
- **Shopify** - Full webhook integration with real-time cart tracking
- **WooCommerce** - REST API integration with comprehensive data sync
- **BigCommerce** - Native API support with webhook processing
- **Magento** - GraphQL integration with advanced cart tracking
- **Custom Platforms** - Extensible adapter pattern for any e-commerce system

### Analytics & Reporting
- **Real-time Dashboard** - Live metrics with sub-second updates
- **Recovery Attribution** - Track revenue by channel and campaign
- **Customer Journey Mapping** - Visualize the complete recovery process
- **Performance Insights** - Campaign optimization recommendations
- **Export Capabilities** - CSV/Excel exports for external analysis

### Compliance & Security
- **GDPR Compliant** - Built-in consent management and right to erasure
- **TCPA Compliance** - SMS opt-in/opt-out with timing restrictions
- **Enterprise Security** - End-to-end encryption and audit logging
- **Multi-tenant Architecture** - Complete data isolation by organization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (recommended)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/abandoned-cart-recovery.git
   cd abandoned-cart-recovery
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

4. **Start services with Docker**
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Set up database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Start background workers**
   ```bash
   npm run worker
   ```

### Docker Development

```bash
# Start all services
docker-compose up -d

# Start with development tools
docker-compose --profile tools up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

## 📊 Architecture

### System Overview
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Node.js with Prisma ORM and PostgreSQL
- **Queue System**: Bull with Redis for background job processing
- **Real-time**: WebSocket connections for live cart tracking
- **Messaging**: SendGrid for email, Twilio for SMS
- **Monitoring**: Built-in observability with metrics and logging

### Database Design
- **Multi-tenant**: Organization-based data isolation
- **Optimized Indexes**: Fast queries for cart tracking and analytics
- **GDPR Compliant**: Customer consent and data management
- **Audit Trail**: Complete activity logging for compliance

### Security Features
- **Webhook Verification**: HMAC signature validation
- **Data Encryption**: Credentials and sensitive data encryption
- **Rate Limiting**: API protection with intelligent throttling
- **CORS Configuration**: Secure cross-origin resource sharing

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/abandoned_cart_recovery

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# SendGrid (Email)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Optional: Analytics
GOOGLE_ANALYTICS_ID=your_ga_id
```

### E-commerce Platform Setup

#### Shopify Integration
1. Create a private app in your Shopify admin
2. Add the following permissions:
   - `read_checkouts` - Access to abandoned checkout data
   - `read_customers` - Customer information access
   - `read_orders` - Order data for recovery attribution
3. Configure webhook endpoints:
   - Cart create: `https://yourapp.com/api/webhooks/shopify/cart-create`
   - Cart update: `https://yourapp.com/api/webhooks/shopify/cart-update`
   - Order create: `https://yourapp.com/api/webhooks/shopify/order-create`

#### WooCommerce Integration
1. Install WooCommerce REST API
2. Generate API credentials with read/write permissions
3. Configure webhook endpoints in WooCommerce settings
4. Set up cart tracking JavaScript snippet

## 📈 Performance

### Benchmarks
- **Cart Event Processing**: < 50ms average
- **Email Delivery**: < 5 minutes from abandonment
- **Dashboard Load**: < 2 seconds initial load
- **API Response Time**: < 200ms for 95% of requests
- **Database Queries**: < 10ms average with proper indexing

### Scaling Considerations
- **Horizontal Scaling**: Stateless application design
- **Queue Workers**: Independent scaling of background jobs
- **Database**: Read replicas for analytics queries
- **CDN Integration**: Static asset optimization
- **Caching Strategy**: Multi-layer Redis caching

## 🧪 Testing

### Test Coverage
- **Unit Tests**: > 90% coverage target
- **Integration Tests**: E-commerce platform APIs
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Load testing with realistic data

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# Integration tests
npm run test:integration
```

## 🚀 Deployment

### Production Deployment

```bash
# Build application
npm run build

# Start production server
npm start

# Or use Docker
docker-compose --profile production up -d
```

### Environment Setup
1. **Database**: PostgreSQL with connection pooling
2. **Redis Cluster**: High availability configuration
3. **Load Balancer**: Nginx with SSL termination
4. **Monitoring**: Application and infrastructure monitoring
5. **Backups**: Automated database and file backups

### Health Checks
- `/api/health` - Application health status
- `/api/health/db` - Database connectivity
- `/api/health/redis` - Redis connectivity
- `/api/health/queues` - Background job status

## 📊 Monitoring

### Metrics
- **Business Metrics**: Recovery rate, revenue recovered, campaign performance
- **Technical Metrics**: Response times, error rates, queue lengths
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Custom Events**: Cart abandonment patterns, customer behavior

### Alerting
- **Critical**: Service unavailability, data loss
- **Warning**: High error rates, performance degradation
- **Info**: Deployment status, configuration changes

## 🔒 Security

### Data Protection
- **Encryption**: AES-256 for data at rest
- **Transport Security**: TLS 1.3 for all communications
- **Access Control**: Role-based permissions
- **Audit Logging**: Complete activity tracking

### Compliance
- **GDPR**: Right to erasure, data portability, consent management
- **TCPA**: SMS compliance with opt-out mechanisms
- **SOC 2**: Security audit preparation
- **PCI DSS**: Payment data handling compliance

## 📚 API Documentation

### Authentication
All API endpoints require authentication via API key or JWT token.

```bash
curl -H "Authorization: Bearer your_api_token" \
     https://api.cartrecovery.com/v1/carts
```

### Core Endpoints

#### Cart Tracking
```bash
# Track cart event
POST /api/v1/carts/track
{
  "event": "cart_updated",
  "cart_data": {...},
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Campaigns
```bash
# List campaigns
GET /api/v1/campaigns

# Create campaign
POST /api/v1/campaigns
{
  "name": "Welcome Series",
  "trigger_conditions": {...},
  "sequence_steps": [...]
}
```

#### Analytics
```bash
# Dashboard metrics
GET /api/v1/analytics/dashboard?period=30d

# Campaign performance
GET /api/v1/analytics/campaigns/{id}/performance
```

### Webhooks
Configure webhooks to receive real-time updates about cart events, campaign performance, and delivery status.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Maintain > 90% test coverage
- Use conventional commit messages
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [https://docs.cartrecovery.com](https://docs.cartrecovery.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/abandoned-cart-recovery/issues)
- **Email**: support@cartrecovery.com
- **Discord**: [Join our community](https://discord.gg/cartrecovery)

## 🙏 Acknowledgments

- [Shopify](https://shopify.dev) for comprehensive API documentation
- [SendGrid](https://sendgrid.com) for reliable email delivery
- [Twilio](https://twilio.com) for SMS infrastructure
- [Prisma](https://prisma.io) for excellent database tooling
- [Next.js](https://nextjs.org) for the amazing React framework