# Business Health Dashboard

**The Fitbit for Your Business** - A comprehensive SaaS platform for real-time business health monitoring and analytics.

## 🎯 Project Overview

The Business Health Dashboard is a production-ready SaaS application that provides real-time business health analytics with AI-powered insights. It serves as a comprehensive monitoring system that tracks key business metrics across 5 categories and provides a unified health score (0-100) with actionable recommendations.

### Key Features

- **Real-time Health Scoring**: Comprehensive 0-100 health score across Financial, Customer, Operational, Growth, and Risk categories
- **AI-Powered Insights**: Machine learning algorithms for anomaly detection and predictive analytics
- **Smart Alert System**: Intelligent early warning system with customizable severity levels
- **Multi-tenant Architecture**: Enterprise-grade security with row-level security (RLS) and data isolation
- **External Integrations**: OAuth 2.0 framework supporting 12+ business tools (QuickBooks, Stripe, Shopify, etc.)
- **Mobile-First Design**: Responsive PWA-ready interface optimized for all devices
- **Real-time Analytics**: Live dashboards with Server-Sent Events (SSE) for instant updates

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 14 with App Router and TypeScript
- Tailwind CSS with custom design system
- Framer Motion for animations
- TanStack Query for state management
- Chart.js + Observable Plot for visualizations

**Backend:**
- FastAPI (Python 3.11+) with async/await
- PostgreSQL 15 + TimescaleDB for time-series data
- Redis for caching and real-time features
- Celery for background job processing
- JWT authentication with refresh tokens

**Infrastructure:**
- Docker containerization
- AWS ECS for deployment
- GitHub Actions for CI/CD
- DataDog for monitoring

### Database Schema

The application uses a multi-tenant architecture with the following core models:

- **Organizations**: Tenant isolation with plan-based features
- **Users**: Role-based access control with MFA support
- **BusinessMetrics**: Time-series metrics storage (TimescaleDB hypertable)
- **HealthScores**: Calculated health scores with insights
- **Alerts**: Intelligent alerting system with escalation
- **Integrations**: External API connection management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- Python 3.11+
- PostgreSQL 15+ (with TimescaleDB extension)
- Redis 6+
- Docker (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/abdul712/MicroSaas-Ideas.git
   cd MicroSaas-Ideas/business-health-dashboard-app
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Configure environment variables
   cp .env.example .env
   # Edit .env with your database and Redis URLs
   
   # Run database migrations
   python -m alembic upgrade head
   
   # Start the API server
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Frontend Setup**
   ```bash
   cd ../  # Back to project root
   npm install
   
   # Configure environment variables
   cp .env.local.example .env.local
   # Edit .env.local with your API URL
   
   # Start the development server
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:8000/api/docs
   - API Health Check: http://localhost:8000/health

### Docker Setup (Alternative)

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📊 Health Score Algorithm

The health score is calculated using a weighted average across 5 categories:

- **Financial Health (25%)**: Revenue, cash flow, burn rate, profit margins
- **Customer Health (25%)**: CAC, LTV, churn rate, NPS scores
- **Operational Health (20%)**: Productivity, uptime, support metrics
- **Growth Health (20%)**: Market expansion, product development, conversions
- **Risk Assessment (10%)**: Financial risk, market risk, compliance status

### Example Calculation

```python
overall_score = (
    financial_score * 0.25 +
    customer_score * 0.25 +
    operational_score * 0.20 +
    growth_score * 0.20 +
    (100 - risk_score) * 0.10  # Risk is inverted
)
```

## 🔌 Integrations

### Supported Platforms

| Platform | Data Types | Real-time | Webhooks |
|----------|------------|-----------|----------|
| QuickBooks | Financial, Invoices, Cash Flow | ❌ | ✅ |
| Stripe | Revenue, Customers, Subscriptions | ✅ | ✅ |
| Shopify | Sales, Orders, Inventory | ✅ | ✅ |
| Google Analytics | Traffic, Conversions | ✅ | ❌ |
| HubSpot | CRM, Marketing, Sales | ✅ | ✅ |
| Salesforce | CRM, Pipeline, Opportunities | ✅ | ✅ |

### OAuth 2.0 Flow

1. User initiates connection to external service
2. Redirect to provider's OAuth authorization endpoint
3. User grants permissions and returns with authorization code
4. Exchange code for access and refresh tokens
5. Store encrypted tokens and begin data synchronization

## 🔒 Security Features

### Authentication & Authorization
- JWT tokens with refresh token rotation
- Role-based access control (Owner, Admin, Manager, Viewer, API User)
- Multi-factor authentication (MFA) support
- API key authentication for programmatic access

### Data Protection
- Row-level security (RLS) for multi-tenant data isolation
- Encryption at rest and in transit (TLS 1.3)
- OWASP Top 10 compliance
- GDPR compliance with data portability and erasure

### Infrastructure Security
- Rate limiting (100 requests/minute per user)
- CORS and security headers
- Input validation and sanitization
- SQL injection prevention via ORM

## 📈 Performance Optimizations

### Frontend
- Code splitting by route and component
- Image optimization with Next.js Image
- Virtual scrolling for large datasets
- Service worker for offline capabilities

### Backend
- TimescaleDB hypertables for time-series performance
- Redis caching for frequently accessed data
- Connection pooling with PgBouncer
- Background job processing with Celery

### Database
- Proper indexing for time-series queries
- Materialized views for common aggregations
- Query optimization and EXPLAIN ANALYZE monitoring
- Automated data retention and cleanup

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
```

### Frontend Testing
```bash
npm run test
npm run test:e2e
npm run test:coverage
```

### Test Coverage Goals
- Unit tests: 90%+ coverage
- Integration tests: API endpoints and database operations
- E2E tests: Critical user workflows

## 📝 API Documentation

### Authentication
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Health Score
```http
GET /api/v1/health/score/{organization_id}
Authorization: Bearer <jwt_token>
```

### Metrics
```http
POST /api/v1/metrics
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "metric_type": "revenue",
  "value": 125400.00,
  "unit": "USD",
  "recorded_at": "2024-01-15T10:00:00Z"
}
```

Full API documentation is available at `/api/docs` when running the server.

## 🚀 Deployment

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/business_health
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
ENVIRONMENT=production
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://yourdomain.com
```

### Docker Deployment

```bash
# Build production images
docker build -t business-health-api ./backend
docker build -t business-health-web .

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### AWS ECS Deployment

1. Build and push images to ECR
2. Create ECS cluster with Fargate
3. Deploy services with load balancer
4. Configure auto-scaling policies

## 📊 Monitoring & Observability

### Health Checks
- Application: `/health`
- Database: Connection pool status
- Redis: Cache connectivity
- External APIs: Integration status

### Metrics
- Application performance (response times, throughput)
- Database performance (query times, connection pool)
- Business metrics (health scores, user activity)
- Error rates and alerting

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking with stack traces
- Audit logs for sensitive operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript/Python type hints
- Write tests for new features
- Update documentation
- Follow commit message conventions
- Ensure CI/CD passes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Full documentation](https://docs.businesshealth.com)
- **API Reference**: Available at `/api/docs`
- **Issues**: [GitHub Issues](https://github.com/abdul712/MicroSaas-Ideas/issues)
- **Email**: support@businesshealth.com

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core health scoring algorithm
- ✅ Basic integrations (Stripe, QuickBooks)
- ✅ Real-time dashboard
- ✅ Multi-tenant architecture

### Phase 2 (Next)
- 🔄 Advanced ML algorithms for anomaly detection
- 🔄 Mobile app (React Native)
- 🔄 Webhooks API for external notifications
- 🔄 Advanced reporting and exports

### Phase 3 (Future)
- 📋 White-label solutions
- 📋 Advanced AI recommendations
- 📋 Industry-specific benchmarking
- 📋 Advanced collaboration features

---

**Built with ❤️ using the CLAUDE.md methodology for production-ready SaaS applications.**