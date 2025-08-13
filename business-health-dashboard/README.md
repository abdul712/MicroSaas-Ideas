# Business Health Dashboard

An intelligent business health dashboard that aggregates data from all business tools into one simple, visual interface with health scores, early warning alerts, and actionable recommendations.

## 🎯 Features

- **Health Score System**: Overall business health (0-100) with category breakdowns
- **Smart Alerts**: Intelligent early warning system for business issues
- **One-Click Integrations**: Connect 20+ business tools instantly
- **Real-time Metrics**: Monitor all business KPIs in real-time
- **Industry Benchmarks**: Compare performance against peers
- **Mobile-First Design**: Full responsive experience with PWA support

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, GraphQL, Prisma ORM
- **Database**: PostgreSQL, InfluxDB (time-series), Redis (cache)
- **Authentication**: Auth0
- **Deployment**: Docker, AWS ECS
- **Testing**: Jest, Playwright
- **Monitoring**: Sentry, DataDog

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd business-health-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the database**
   ```bash
   docker-compose up -d postgres redis influxdb
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

### Unit Tests
```bash
npm run test
npm run test:watch
npm run test:coverage
```

### E2E Tests
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

## 📦 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build and run manually
docker build -t business-health-dashboard .
docker run -p 3000:3000 business-health-dashboard
```

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `AUTH0_SECRET` | Auth0 secret key | - |
| `AUTH0_BASE_URL` | Application base URL | http://localhost:3000 |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |
| `SENDGRID_API_KEY` | SendGrid API key | - |

### Integration Setup

1. **QuickBooks**: Set up OAuth app in QuickBooks Developer Portal
2. **Stripe**: Configure webhooks for payment events
3. **Google Analytics**: Enable Analytics Reporting API
4. **Auth0**: Configure social login providers

## 📊 API Documentation

### Health Score API
```typescript
// GET /api/health-score
{
  "overall": 78,
  "financial": 82,
  "customer": 75,
  "operations": 80,
  "growth": 71,
  "marketing": 76
}
```

### Metrics API
```typescript
// GET /api/metrics
{
  "revenue": { "value": 145000, "change": 12.5 },
  "expenses": { "value": 89000, "change": -3.2 },
  "customers": { "value": 1247, "change": 5.3 }
}
```

### Alerts API
```typescript
// GET /api/alerts
[
  {
    "id": "alert_123",
    "type": "warning",
    "title": "High expense spike",
    "severity": "warning",
    "timestamp": "2024-01-15T10:30:00Z"
  }
]
```

## 🔒 Security

- **Data Encryption**: All data encrypted at rest and in transit
- **Authentication**: Multi-factor authentication via Auth0
- **Authorization**: Role-based access control (RBAC)
- **API Security**: Rate limiting, input validation, CORS
- **Compliance**: SOC 2, GDPR compliant

## 📈 Performance

- **Core Web Vitals**: < 2.5s LCP, < 100ms FID, < 0.1 CLS
- **Lighthouse Score**: 95+ across all categories
- **Bundle Size**: < 200KB initial JS bundle
- **API Response**: < 200ms average response time

## 🧩 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│                     API Layer (GraphQL)                     │
├─────────────────────────────────────────────────────────────┤
│                  Business Logic Layer                       │
├─────────────────────────────────────────────────────────────┤
│     PostgreSQL     │    InfluxDB    │       Redis           │
│   (Core Data)      │ (Time Series)  │     (Cache)           │
└─────────────────────────────────────────────────────────────┘
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.businesshealth.app](https://docs.businesshealth.app)
- **Email**: support@businesshealth.app
- **Discord**: [Join our community](https://discord.gg/businesshealth)
- **GitHub Issues**: [Report bugs](https://github.com/your-org/business-health-dashboard/issues)

## 📊 Roadmap

- [ ] Advanced AI-powered insights
- [ ] Mobile apps (iOS/Android)
- [ ] White-label solutions
- [ ] Advanced reporting & analytics
- [ ] Workflow automation
- [ ] Third-party marketplace

---

Made with ❤️ by the Business Health Dashboard team