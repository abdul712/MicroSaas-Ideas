# Website Heatmap Tool - Enterprise Analytics Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue.svg)

A comprehensive, enterprise-grade website heatmap and user behavior analytics platform built with modern technologies and privacy-first principles.

## 🚀 Features

### Core Analytics
- **Multi-type Heatmaps**: Click, hover, scroll, and touch interaction visualization
- **Session Replay**: Privacy-protected user session recordings
- **Real-time Analytics**: Live visitor tracking and behavior analysis
- **AI-Powered Insights**: Automated UX recommendations and optimization suggestions
- **User Journey Mapping**: Complete visitor flow analysis

### Privacy & Compliance
- **GDPR/CCPA Compliant**: Built-in privacy controls and data protection
- **Data Anonymization**: Automatic PII detection and masking
- **Consent Management**: Granular tracking preferences
- **Retention Policies**: Configurable data lifecycle management

### Performance
- **<10KB Tracking Script**: Ultra-lightweight with <50ms load time
- **Real-time Processing**: Sub-3-second heatmap generation
- **99.9% Uptime**: Enterprise-grade reliability and monitoring
- **Global CDN**: Optimized delivery worldwide

### Enterprise Features
- **Multi-tenancy**: Isolated data per organization
- **Team Collaboration**: Shared insights with role-based access
- **API-First**: Comprehensive REST APIs with webhooks
- **Integrations**: Google Analytics, GTM, CRO tools

## 🏗️ Architecture

This is a microservices-based platform built with:

### Frontend
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** with custom design system
- **Canvas API** for high-performance heatmap rendering
- **WebSockets** for real-time updates

### Backend Services
- **API Gateway**: Nginx-based routing and load balancing
- **Event Collection**: High-throughput data ingestion (100K+ events/sec)
- **Analytics Processing**: Real-time stream processing with Kafka
- **Heatmap Generation**: Canvas-based visualization engine
- **User Management**: Authentication, billing, and RBAC
- **Privacy Service**: GDPR/CCPA compliance and data protection
- **AI Insights**: ML-powered behavioral analysis

### Databases
- **PostgreSQL**: Relational data with RBAC and audit logging
- **ClickHouse**: Time-series analytics with real-time aggregation
- **Redis**: Caching, session management, and rate limiting

### Infrastructure
- **Docker Compose**: Development environment
- **Kubernetes**: Production deployment with auto-scaling
- **Prometheus/Grafana**: Monitoring and observability
- **Apache Kafka**: Event streaming and processing

## 🛠️ Quick Start

### Prerequisites
- Node.js ≥ 18.0.0
- Docker and Docker Compose
- Git

### Development Setup

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd website-heatmap-tool
   npm run setup
   ```

2. **Start Development Environment**
   ```bash
   # Start all services
   docker-compose up -d
   
   # Start development servers
   npm run dev
   ```

3. **Access Applications**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:8080
   - Admin Dashboard: http://localhost:3001

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:frontend
npm run test:backend
npm run test:sdk

# Check test coverage
npm run test:coverage
```

### Linting and Formatting
```bash
# Lint all code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

## 📦 Project Structure

```
website-heatmap-tool/
├── frontend/                 # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/             # App Router pages and layouts
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and configurations
│   │   └── styles/          # Tailwind CSS and global styles
│   └── public/              # Static assets
├── backend/                 # Microservices backend
│   ├── api-gateway/         # Nginx-based API gateway
│   ├── event-collection/    # High-performance event ingestion
│   ├── analytics-processing/ # Real-time data processing
│   ├── heatmap-generation/  # Visualization engine
│   ├── user-management/     # Auth, billing, teams
│   ├── privacy-service/     # GDPR/CCPA compliance
│   └── ai-insights/         # ML-powered recommendations
├── sdk/                     # JavaScript tracking SDK
│   ├── src/                 # SDK source code
│   ├── examples/            # Integration examples
│   └── dist/                # Built SDK files
├── infrastructure/          # Deployment configurations
│   ├── docker/              # Docker configurations
│   ├── kubernetes/          # K8s manifests
│   └── monitoring/          # Prometheus/Grafana setup
├── docs/                    # Documentation
│   ├── api/                 # API documentation
│   ├── architecture/        # System architecture docs
│   └── guides/              # User and developer guides
└── tests/                   # End-to-end and integration tests
    ├── e2e/                 # Playwright E2E tests
    └── integration/         # Service integration tests
```

## 🔧 Configuration

### Environment Variables

Create `.env` files for each service:

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_TRACKING_URL=http://localhost:8080/track

# Backend Services (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/heatmap
REDIS_URL=redis://localhost:6379
CLICKHOUSE_URL=http://localhost:8123
KAFKA_BROKERS=localhost:9092
```

### Database Setup

```bash
# Start database services
docker-compose up -d postgres redis clickhouse

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

## 📊 Performance Targets

- **Tracking Script**: <10KB gzipped, <50ms load time
- **Heatmap Generation**: <3 seconds for real-time updates
- **Throughput**: 10,000+ concurrent sessions, 1M+ events/minute
- **Uptime**: 99.9% availability with auto-scaling
- **Compliance**: GDPR/CCPA ready with privacy controls

## 🧪 Testing Strategy

- **Unit Tests**: 90%+ coverage with Jest
- **Integration Tests**: API and database testing
- **E2E Tests**: Complete user workflows with Playwright
- **Performance Tests**: Load testing with K6
- **Security Tests**: Vulnerability scanning and compliance

## 🚀 Deployment

### Development
```bash
docker-compose up -d
npm run dev
```

### Production
```bash
# Build all services
npm run build

# Deploy to Kubernetes
kubectl apply -f infrastructure/kubernetes/

# Verify deployment
kubectl get pods -n heatmap-tool
```

## 📚 Documentation

- [API Documentation](docs/api/README.md)
- [Architecture Guide](docs/architecture/README.md)
- [Developer Guide](docs/guides/developer.md)
- [User Guide](docs/guides/user.md)
- [Deployment Guide](docs/guides/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](../../issues)
- Email: support@heatmap-tool.com

---

**Built with ❤️ following enterprise-grade standards and CLAUDE.md methodology**