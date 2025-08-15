# 📧 Follow-up Email Automator

An enterprise-grade AI-powered email automation platform that uses intelligent follow-up sequences to increase conversions and customer engagement. Built with Next.js 14, TypeScript, and modern technologies following the CLAUDE.md enterprise methodology.

## 🚀 Features

### 🤖 AI-Powered Email Generation
- **GPT-4 Integration**: Intelligent email content generation with context awareness
- **Subject Line Optimization**: A/B testing suggestions and performance-based optimization
- **Sentiment Analysis**: Automatic tone analysis and improvement suggestions
- **Spam Score Analysis**: Real-time deliverability checking and recommendations

### 🎨 Visual Workflow Builder
- **Drag-and-Drop Interface**: React Flow-based visual sequence designer
- **5 Specialized Node Types**: Email, Delay, Condition, Trigger, and Webhook nodes
- **Real-time Metrics**: Performance tracking directly on workflow nodes
- **Complex Logic**: Conditional branching and advanced automation rules

### 📨 Enterprise Email Infrastructure
- **Multi-Provider Support**: SendGrid primary with Resend failover
- **Advanced Tracking**: Open/click tracking with detailed analytics
- **Deliverability Optimization**: Domain verification and reputation monitoring
- **Webhook Processing**: Real-time email event handling

### 🏗️ Automation Engine
- **Bull.js Queuing**: Reliable job processing with Redis backend
- **Smart Scheduling**: Business hours optimization and timezone handling
- **Error Handling**: Comprehensive retry logic and failure management
- **Sequence Management**: Automatic enrollment and progression tracking

### 👥 Contact Management
- **Advanced Segmentation**: Tag-based organization and filtering
- **Engagement Scoring**: Automatic calculation based on email interactions
- **Bulk Operations**: CSV import/export with validation
- **GDPR Compliance**: Data privacy and unsubscribe management

### 📊 Real-time Analytics
- **Performance Dashboard**: Comprehensive metrics and visualizations
- **Campaign Analytics**: Open rates, click rates, conversion tracking
- **Behavioral Insights**: User engagement patterns and optimization suggestions
- **Custom Reports**: Exportable data with filtering options

### 🔒 Security & Compliance
- **Multi-tenancy**: Secure data isolation per organization
- **Authentication**: NextAuth.js with OAuth and credentials support
- **Data Encryption**: At-rest and in-transit security
- **Audit Logging**: Complete activity tracking and compliance reporting

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** for responsive design
- **React Flow** for visual workflow building
- **Recharts** for data visualization
- **Radix UI** for accessible components

### Backend
- **Next.js API Routes** with TypeScript
- **PostgreSQL** with Prisma ORM
- **Redis** for queuing and caching
- **Bull.js** for job processing

### Email & AI
- **SendGrid & Resend** for email delivery
- **OpenAI GPT-4** for content generation
- **Email tracking** with pixel and click tracking

### DevOps & Testing
- **Docker** containerization
- **Jest** for unit testing (90%+ coverage target)
- **Playwright** for E2E testing
- **ESLint** for code quality

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### 1. Clone and Install
```bash
git clone <repository-url>
cd follow-up-email-automator
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

Configure the following environment variables:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/follow_up_email_automator"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Providers
SENDGRID_API_KEY="your-sendgrid-api-key"
RESEND_API_KEY="your-resend-api-key"

# AI Services
OPENAI_API_KEY="your-openai-api-key"

# Redis
REDIS_URL="redis://localhost:6379"
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 4. Start Development
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🐳 Docker Deployment

### Development
```bash
# Start all services
docker-compose --profile dev up

# Access the application
# App: http://localhost:3001
# Mail UI: http://localhost:8025 (MailHog)
```

### Production
```bash
# Build and start production services
docker-compose up

# Access the application
# App: http://localhost:3000
```

### With Monitoring
```bash
# Start with monitoring stack
docker-compose --profile monitoring up

# Access services
# App: http://localhost:3000
# Queue Dashboard: http://localhost:3002
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:ci

# Watch mode
npm run test:watch
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## 📚 API Documentation

### Core Endpoints

#### Templates
- `GET /api/templates` - List email templates
- `POST /api/templates` - Create new template
- `POST /api/templates/generate` - AI generate template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

#### Contacts
- `GET /api/contacts` - List contacts with filtering
- `POST /api/contacts` - Create contact
- `POST /api/contacts/import` - Bulk import from CSV
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

#### Sequences
- `GET /api/sequences` - List email sequences
- `POST /api/sequences` - Create sequence
- `PUT /api/sequences/:id` - Update sequence
- `POST /api/sequences/:id/activate` - Activate sequence
- `POST /api/sequences/:id/enroll` - Enroll contacts

#### Analytics
- `GET /api/analytics/overview` - Dashboard metrics
- `GET /api/analytics/performance` - Performance data
- `GET /api/analytics/sequences` - Sequence analytics

### Webhook Endpoints
- `POST /api/webhooks/sendgrid` - SendGrid event processing
- `POST /api/webhooks/resend` - Resend event processing

### Tracking Endpoints
- `GET /api/track/open/:emailId` - Email open tracking
- `GET /api/track/click/:emailId` - Email click tracking

## 🔧 Configuration

### Email Providers
Configure multiple email providers for redundancy:

```typescript
// SendGrid (Primary)
SENDGRID_API_KEY="sg.xxx"

// Resend (Fallback)
RESEND_API_KEY="re_xxx"
```

### AI Configuration
```typescript
// OpenAI
OPENAI_API_KEY="sk-xxx"

// Feature flags
ENABLE_AI_FEATURES="true"
ENABLE_ANALYTICS="true"
```

### Queue Configuration
```typescript
// Redis connection
REDIS_URL="redis://localhost:6379"

// Queue settings
EMAIL_QUEUE_CONCURRENCY=5
SEQUENCE_QUEUE_CONCURRENCY=3
```

## 📈 Performance Metrics

### Targets
- **Email Delivery Rate**: 99%+
- **Open Rate Improvement**: 25%+
- **Page Load Time**: <3 seconds
- **Queue Processing**: <5 seconds per email
- **Test Coverage**: 90%+

### Monitoring
- Real-time queue monitoring with Bull Board
- Email delivery tracking and analytics
- Performance metrics with Prometheus
- Error tracking and alerting

## 🔐 Security Features

### Authentication
- NextAuth.js with multiple providers
- JWT with refresh token rotation
- Role-based access control (RBAC)

### Data Protection
- Multi-tenant data isolation
- Encryption at rest and in transit
- GDPR compliance features
- Secure unsubscribe handling

### API Security
- Rate limiting on API endpoints
- Input validation with Zod schemas
- SQL injection prevention
- XSS protection

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- 90%+ test coverage requirement

### Commit Convention
```bash
feat: add new email template feature
fix: resolve queue processing issue
docs: update API documentation
test: add contact service tests
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)

### Community
- [GitHub Issues](https://github.com/your-org/follow-up-email-automator/issues)
- [Discussions](https://github.com/your-org/follow-up-email-automator/discussions)

### Enterprise Support
For enterprise support and custom integrations, contact [support@yourcompany.com](mailto:support@yourcompany.com)

---

**Built with ❤️ following the CLAUDE.md enterprise methodology for production-ready, scalable applications.**