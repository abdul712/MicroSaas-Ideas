# Customer Lifetime Value Tracker

## 🎯 Overview

A comprehensive SaaS platform for tracking and analyzing customer lifetime value with predictive analytics, real-time data processing, and seamless e-commerce integrations.

## ✨ Key Features

- **CLV Calculation Engine**: Historical and predictive CLV with multiple methodologies
- **Customer Analytics Dashboard**: Interactive visualizations and segmentation
- **E-commerce Integrations**: Shopify, WooCommerce, Stripe, and more
- **Advanced Analytics**: Churn prediction, cohort analysis, and revenue forecasting
- **Real-time Updates**: Live data synchronization and notifications
- **Multi-tenant Architecture**: Secure data isolation for enterprise use

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Fastify (high-performance API)
- **Database**: PostgreSQL with TimescaleDB
- **Cache**: Redis for sessions and background jobs
- **ORM**: Prisma for type-safe database operations

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **UI**: Tailwind CSS with Radix UI components
- **State**: Zustand + TanStack Query
- **Charts**: Recharts for data visualizations

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Documentation**: OpenAPI 3.0 with Swagger UI

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd customer-lifetime-value-tracker
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Environment**
   ```bash
   docker-compose up -d
   ```

4. **Database Setup**
   ```bash
   docker-compose exec backend npm run db:migrate
   docker-compose exec backend npm run db:seed
   ```

5. **Access the Application**
   - Frontend Dashboard: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/docs
   - Database Admin: http://localhost:8080 (with --profile tools)

### Manual Development (without Docker)

1. **Install Dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Start Database Services**
   ```bash
   docker-compose up postgres redis -d
   ```

3. **Run Backend**
   ```bash
   cd backend
   npm run db:migrate
   npm run dev
   ```

4. **Run Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

## 📊 Project Structure

```
customer-lifetime-value-tracker/
├── backend/                 # Fastify API server
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   ├── middlewares/     # Custom middleware
│   │   ├── utils/           # Utility functions
│   │   └── workers/         # Background job workers
│   ├── prisma/              # Database schema and migrations
│   ├── tests/               # Backend tests
│   └── Dockerfile           # Backend container
├── frontend/                # Next.js dashboard
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities and configurations
│   │   └── types/           # TypeScript definitions
│   ├── public/              # Static assets
│   └── Dockerfile           # Frontend container
├── docs/                    # Documentation
├── scripts/                 # Development scripts
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml       # Development environment
└── README.md               # This file
```

## 🔧 Development Commands

### Backend
```bash
cd backend

# Development
npm run dev                  # Start development server
npm run build               # Build for production
npm run start               # Start production server

# Database
npm run db:generate         # Generate Prisma client
npm run db:migrate          # Run database migrations
npm run db:seed             # Seed development data

# Testing & Quality
npm run test                # Run tests
npm run test:coverage       # Run tests with coverage
npm run lint                # Lint code
npm run format              # Format code
```

### Frontend
```bash
cd frontend

# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run start              # Start production server

# Testing & Quality
npm run test               # Run tests
npm run test:coverage      # Run tests with coverage
npm run lint               # Lint code
npm run type-check         # TypeScript checking
```

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend && npm run test

# Frontend tests
cd frontend && npm run test

# E2E tests
npm run test:e2e

# Coverage reports
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Complete user workflow testing
- **Performance Tests**: Load and stress testing

## 🔒 Security

### Authentication
- JWT tokens with short expiry (15 minutes)
- Refresh token rotation
- Multi-factor authentication (TOTP)
- Role-based access control

### Data Protection
- Row-level security for multi-tenancy
- Encryption at rest and in transit
- GDPR compliance features
- Audit logging for sensitive operations

### API Security
- Rate limiting (100 req/min per user)
- Request validation with Zod schemas
- CORS and CSP headers
- SQL injection prevention

## 📋 API Documentation

### Authentication Endpoints
```
POST /auth/register        # User registration
POST /auth/login          # User login
POST /auth/refresh        # Refresh access token
POST /auth/logout         # Logout and invalidate tokens
```

### CLV Calculation Endpoints
```
GET  /clv/customers/:id   # Get customer CLV data
POST /clv/calculate       # Trigger CLV calculation
GET  /clv/segments        # Get customer segments
GET  /clv/cohorts         # Get cohort analysis
```

### Integration Endpoints
```
GET  /integrations        # List integrations
POST /integrations        # Add new integration
PUT  /integrations/:id    # Update integration
POST /webhooks/:platform  # Webhook receivers
```

Full API documentation available at: `/docs` when running the server.

## 🚀 Deployment

### Production Deployment

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   JWT_SECRET=secure-random-string
   ```

2. **Database Setup**
   ```bash
   npm run db:deploy        # Run production migrations
   ```

3. **Docker Production Build**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Cloud Deployment
- **AWS**: ECS with RDS and ElastiCache
- **GCP**: Cloud Run with Cloud SQL and Memorystore
- **Azure**: Container Instances with PostgreSQL and Redis Cache

## 📊 Monitoring & Observability

### Metrics
- API response times and error rates
- Database query performance
- CLV calculation accuracy
- User engagement metrics

### Logging
- Structured JSON logging with Winston
- Request/response logging
- Error tracking with stack traces
- Audit logs for compliance

### Health Checks
```bash
GET /health              # Application health
GET /health/db          # Database connectivity
GET /health/redis       # Redis connectivity
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Maintain 90%+ test coverage
- Use conventional commit messages
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/username/clv-tracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/username/clv-tracker/discussions)

## 🎯 Roadmap

### Phase 1 (Completed)
- [x] Core architecture design
- [x] Database schema implementation
- [x] Authentication system
- [x] Basic CLV calculations

### Phase 2 (In Progress)
- [ ] Advanced ML models
- [ ] Real-time data processing
- [ ] E-commerce integrations
- [ ] Customer segmentation

### Phase 3 (Planned)
- [ ] Mobile applications
- [ ] Advanced analytics
- [ ] Enterprise features
- [ ] Third-party marketplace

---

Built with ❤️ using modern web technologies and best practices.