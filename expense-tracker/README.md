# 💰 ExpenseTracker Pro - Enterprise Expense Management

<div align="center">

![ExpenseTracker Pro](https://img.shields.io/badge/ExpenseTracker-Pro-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker)

**AI-Powered Expense Management with Enterprise-Grade Security**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API](#-api-reference) • [Contributing](#-contributing)

</div>

## 🎯 Overview

ExpenseTracker Pro is a comprehensive, enterprise-grade expense management SaaS application built with modern technologies. It features AI-powered OCR receipt scanning, multi-tenant architecture, role-based access control, and comprehensive security compliance.

### ✨ Key Highlights

- 🤖 **AI-Powered OCR**: Advanced receipt scanning with 95%+ accuracy
- 🏢 **Multi-Tenant**: Secure organization-based data isolation
- 🔐 **Enterprise Security**: JWT, RBAC, MFA, and comprehensive audit logging
- 📊 **Advanced Analytics**: Real-time dashboards and custom reporting
- 🌍 **Production Ready**: Docker deployment with monitoring and health checks
- 🧪 **90%+ Test Coverage**: Comprehensive testing suite with Jest and Playwright

## 🚀 Features

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| 📸 **Smart Receipt Scanning** | AI-powered OCR with Tesseract.js & Google Vision | ✅ |
| 💳 **Expense Management** | Complete CRUD with approval workflows | ✅ |
| 👥 **Multi-Tenant Architecture** | Organization-based data isolation | ✅ |
| 🔐 **Enterprise Authentication** | JWT + RBAC + MFA support | ✅ |
| 📊 **Analytics Dashboard** | Real-time insights and reporting | ✅ |
| 🗂️ **Category Management** | Hierarchical expense categorization | ✅ |
| 📈 **Project Tracking** | Client and project-based expense allocation | ✅ |
| 💰 **Budget Management** | Budget tracking with alerts | ✅ |

### Security & Compliance

| Feature | Description | Status |
|---------|-------------|--------|
| 🛡️ **PCI Compliance** | Payment card data security standards | ✅ |
| 🇪🇺 **GDPR Ready** | Data protection and privacy compliance | ✅ |
| 🔍 **Audit Logging** | Comprehensive activity tracking | ✅ |
| 🚨 **Security Monitoring** | Threat detection and alerting | ✅ |
| 🔒 **Data Encryption** | At-rest and in-transit encryption | ✅ |
| 🎯 **Rate Limiting** | API protection and DDoS prevention | ✅ |

### Technical Features

| Feature | Description | Status |
|---------|-------------|--------|
| 📱 **Progressive Web App** | Mobile-optimized with offline support | ✅ |
| 🐳 **Docker Deployment** | Production-ready containerization | ✅ |
| 🧪 **Testing Suite** | 90%+ coverage with Jest & Playwright | ✅ |
| 📊 **Monitoring** | Health checks and performance metrics | ✅ |
| 🔄 **API Integration** | RESTful APIs with OpenAPI docs | ✅ |
| ☁️ **Cloud Storage** | AWS S3 with local fallback | ✅ |

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **State**: SWR for data fetching
- **Authentication**: NextAuth.js

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for sessions and rate limiting
- **Storage**: AWS S3 with local fallback
- **OCR**: Tesseract.js + Google Cloud Vision

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Proxy**: Traefik with SSL/TLS
- **Monitoring**: Prometheus + Grafana
- **Testing**: Jest + Playwright

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+ (optional)
- Docker & Docker Compose (for containerized deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expense-tracker
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

4. **Set up the database**
   ```bash
   # Start PostgreSQL and Redis (if using Docker)
   docker-compose up postgres redis -d
   
   # Run database migrations
   npm run db:migrate
   
   # Seed the database (optional)
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Deployment

1. **Production deployment with Docker Compose**
   ```bash
   # Copy environment file
   cp .env.example .env
   # Edit .env with production values
   
   # Start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f app
   ```

2. **With monitoring and SSL**
   ```bash
   # Start with monitoring stack
   docker-compose --profile production --profile monitoring up -d
   ```

## 📖 Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker"
SHADOW_DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker_shadow"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
JWT_SECRET="your-jwt-secret"

# Security
ENCRYPTION_KEY="your-32-character-encryption-key"

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

### Optional Configuration

```bash
# AWS S3 Storage
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="expense-tracker-receipts"

# Google Cloud Vision OCR
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_APPLICATION_CREDENTIALS="path-to-service-account.json"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# File Upload
MAX_FILE_SIZE="10485760"
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp,application/pdf"
```

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# Test with coverage
npm run test:coverage

# End-to-end tests
npm run test:e2e

# Watch mode
npm run test:watch
```

### Testing Philosophy

- **Unit Tests**: Business logic and utilities (90%+ coverage)
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Critical user workflows with Playwright
- **Security Tests**: Authentication and authorization flows

## 📊 Database Schema

The application uses a comprehensive PostgreSQL schema with the following key entities:

- **Organizations**: Multi-tenant data isolation
- **Users**: Authentication and role management
- **Expenses**: Core expense tracking with full audit trail
- **Receipts**: OCR-processed receipt storage and metadata
- **Categories**: Hierarchical expense categorization
- **Projects**: Client and project-based expense allocation
- **Budgets**: Budget management and tracking
- **AuditLogs**: Comprehensive activity logging for compliance

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (USER, ADMIN, SUPER_ADMIN)
- Multi-factor authentication with TOTP
- Session management and security

### Data Protection
- Encryption at rest and in transit
- PCI compliance considerations for payment data
- GDPR-ready data handling and user rights
- Secure file upload with validation and scanning

### Monitoring & Auditing
- Comprehensive audit logging
- Security event monitoring
- Rate limiting and DDoS protection
- Automated threat detection

## 📚 API Reference

### Base URL
```
https://your-domain.com/api
```

### Authentication
All API requests require authentication via Bearer token:
```bash
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Expenses
- `GET /api/expenses` - List expenses with filtering and pagination
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/{id}` - Get expense details
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense
- `PATCH /api/expenses/{id}` - Update expense status

#### Receipts
- `POST /api/receipts/upload` - Upload and process receipt
- `GET /api/receipts` - List receipts with status filtering

#### Categories
- `GET /api/categories` - List expense categories
- `POST /api/categories` - Create new category (Admin only)

#### Health Check
- `GET /api/health` - Application health and system status

### Rate Limits
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- File Upload: 50 uploads per hour
- OCR Processing: 100 requests per hour

## 🚀 Deployment

### Docker Production Deployment

1. **Prepare environment**
   ```bash
   cp .env.example .env
   # Configure production values
   ```

2. **Deploy with SSL**
   ```bash
   docker-compose --profile production up -d
   ```

3. **Monitor deployment**
   ```bash
   # Check application logs
   docker-compose logs -f app
   
   # Check health status
   curl https://your-domain.com/api/health
   ```

### Scaling Considerations

- **Database**: Use PostgreSQL read replicas for read-heavy workloads
- **Redis**: Configure Redis Cluster for high availability
- **Storage**: Use CDN with AWS S3 for global file distribution
- **Application**: Scale horizontally with load balancer
- **Monitoring**: Implement comprehensive monitoring with alerts

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes and add tests
4. Ensure tests pass (`npm run test`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards

- TypeScript with strict mode
- ESLint + Prettier for code formatting
- Comprehensive test coverage (90%+)
- Security-first development approach
- Performance optimization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - Database toolkit
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://radix-ui.com/) - UI components
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine
- [NextAuth.js](https://next-auth.js.org/) - Authentication

## 📞 Support

- 📧 Email: support@expensetracker.com
- 📖 Documentation: [docs.expensetracker.com](https://docs.expensetracker.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/expense-tracker/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-org/expense-tracker/discussions)

---

<div align="center">

**Built with ❤️ for modern businesses**

[⬆️ Back to Top](#-expensetracker-pro---enterprise-expense-management)

</div>