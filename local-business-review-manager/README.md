# 🏪 Local Business Review Manager

A comprehensive review management and reputation optimization SaaS platform that monitors, manages, and improves online reviews across all major platforms to boost local SEO and customer trust.

![Review Manager](https://img.shields.io/badge/Review-Manager-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-indigo)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 🚀 Features

### Core Features
- **Multi-Platform Monitoring**: Monitor reviews across Google My Business, Facebook, Yelp, TripAdvisor, and more
- **AI-Powered Responses**: Generate personalized responses using OpenAI that match your brand voice
- **Sentiment Analysis**: Advanced sentiment analysis with emotion detection and topic identification
- **Real-time Notifications**: Instant alerts for new reviews via email, SMS, and in-app notifications
- **Review Invitations**: Automated email and SMS campaigns to encourage positive reviews
- **Local SEO Optimization**: Boost local search rankings through optimized review management

### Advanced Features
- **Multi-tenancy**: Isolated data per business with role-based access control
- **Analytics Dashboard**: Comprehensive insights with competitor analysis and trends
- **Review Gating**: Collect feedback before public reviews to filter out negative experiences
- **Bulk Operations**: Mass review management and response actions
- **White-label Solutions**: Customizable branding for agencies and franchises
- **API Integration**: Connect with CRM and customer service tools

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for component library
- **Chart.js** for analytics visualization
- **Socket.io** for real-time features

### Backend
- **Node.js** with Next.js API Routes
- **Prisma ORM** with PostgreSQL
- **NextAuth.js** for authentication
- **Redis** for caching and sessions
- **OpenAI** for AI responses and sentiment analysis

### Infrastructure
- **Docker** containerization
- **PostgreSQL** primary database
- **Redis** for caching and job queues
- **Nginx** reverse proxy (production)

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+
- OpenAI API key
- Google Cloud Console project (for Google My Business API)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd local-business-review-manager
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/reviewmanager"
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# External APIs
OPENAI_API_KEY="your-openai-api-key"
YELP_API_KEY="your-yelp-api-key"

# Communications
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
SENDGRID_API_KEY="your-sendgrid-key"

# Security
ENCRYPTION_KEY="your-encryption-key"
```

### 3. Development with Docker
```bash
# Start development environment
npm run docker:dev

# Or start individual services
docker-compose -f docker-compose.dev.yml up
```

### 4. Local Development Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed

# Start development server
npm run dev
```

### 5. Production Deployment
```bash
# Build and start production environment
npm run docker:prod

# Or with Docker Compose
docker-compose up -d
```

## 📊 Database Schema

The application uses a comprehensive database schema designed for multi-tenancy:

### Key Models
- **Users**: Authentication and role management
- **Businesses**: Multi-location business management  
- **Reviews**: Cross-platform review aggregation
- **ReviewResponses**: AI-generated and manual responses
- **SentimentScores**: AI-powered sentiment analysis
- **ReviewInvitations**: Automated review request campaigns
- **AnalyticsSnapshots**: Historical performance tracking

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Test Coverage Requirements
- **Unit Tests**: 90%+ coverage requirement
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Critical user flows with Playwright
- **Performance Tests**: Load testing for scalability

## 🔧 Development

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── dashboard/        # Dashboard components
│   └── landing/          # Landing page components
├── lib/                  # Utility libraries
│   ├── auth.ts           # Authentication config
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Helper functions
├── hooks/                # Custom React hooks
├── stores/              # State management
└── types/               # TypeScript definitions
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run test         # Run tests
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

## 🔐 Security Features

### Authentication & Authorization
- JWT tokens with refresh token rotation
- OAuth integration (Google, Facebook)
- Role-based access control (Owner, Manager, Staff)
- Multi-factor authentication support

### Data Protection
- Encryption at rest and in transit
- GDPR compliance with data retention policies
- Secure API endpoints with rate limiting
- SQL injection prevention
- XSS protection with Content Security Policy

### Compliance
- GDPR data protection compliance
- SOC 2 Type II ready architecture
- OWASP security best practices
- Regular security audits and updates

## 📈 Performance

### Optimization Features
- Redis caching for frequently accessed data
- Database query optimization with proper indexing
- Image optimization and lazy loading
- Bundle size optimization
- Service worker for offline functionality

### Scalability
- Multi-tenant architecture with data isolation
- Horizontal scaling support
- Load balancing ready
- CDN integration for static assets
- Background job processing with Bull Queue

## 🚀 Deployment

### Production Deployment Options

#### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# With custom configuration
docker-compose -f docker-compose.prod.yml up -d
```

#### Manual Deployment
1. Build the application: `npm run build`
2. Set up PostgreSQL and Redis
3. Configure environment variables
4. Run migrations: `npm run db:migrate`
5. Start the server: `npm start`

### Environment Configuration

#### Development
- Hot reload enabled
- Debug logging
- Development database
- Relaxed security settings

#### Production
- Optimized builds
- Error logging only
- Production database with backups
- Enhanced security headers
- SSL/TLS termination

## 🔗 API Integration

### Supported Review Platforms
- **Google My Business**: Full CRUD operations
- **Facebook**: Page reviews and ratings
- **Yelp**: Business reviews (read-only)
- **TripAdvisor**: Hotel and restaurant reviews

### Webhook Support
- Real-time review notifications
- Platform-specific webhook handling
- Automatic retry logic
- Event deduplication

## 📞 Support & Documentation

### API Documentation
- OpenAPI/Swagger documentation available at `/api/docs`
- Comprehensive endpoint documentation
- Authentication examples
- Rate limiting information

### Support Channels
- GitHub Issues for bug reports
- Documentation wiki
- Community Discord (coming soon)
- Enterprise support available

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain 90%+ test coverage
- Use conventional commit messages
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Enterprise Features

### White-label Solutions
- Custom branding and domain
- Multi-tenant management
- Agency dashboard
- Client management tools

### Advanced Analytics
- Competitor benchmarking
- Sentiment trend analysis
- ROI tracking and reporting
- Custom dashboard creation

### Integration Ecosystem
- CRM integrations (Salesforce, HubSpot)
- Customer service tools (Zendesk, Intercom)
- Marketing automation platforms
- Business intelligence tools

---

**Built with ❤️ for local businesses everywhere**

For more information, visit our [documentation](docs/) or contact our support team.