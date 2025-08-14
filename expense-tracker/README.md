# 💰 ExpenseTracker Pro - Enterprise Expense Management SaaS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

## 🚀 Overview

ExpenseTracker Pro is an enterprise-grade expense management SaaS application built with modern technologies and security best practices. It features AI-powered receipt scanning, intelligent categorization, real-time insights, and comprehensive financial compliance tools.

### ✨ Key Features

- **🧠 AI-Powered OCR**: Automatically extract data from receipts using advanced OCR technology
- **📱 Mobile-First Design**: Progressive Web App with offline capabilities
- **🏢 Multi-Tenant Architecture**: Secure organization-level data isolation
- **🔐 Enterprise Security**: JWT authentication, RBAC, MFA, and comprehensive audit logging
- **📊 Real-Time Analytics**: Live expense tracking with interactive dashboards
- **💳 Payment Integration**: Stripe-powered subscription management
- **🌐 RESTful APIs**: Comprehensive API with OpenAPI documentation
- **🔄 Real-Time Features**: WebSocket-powered live updates
- **📋 Compliance Ready**: PCI considerations, GDPR compliance, SOC 2 preparation

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Radix UI for accessible components
- React Query for state management

**Backend:**
- Next.js API Routes
- Prisma ORM with PostgreSQL
- NextAuth.js for authentication
- Redis for caching and sessions

**Infrastructure:**
- Docker containerization
- PostgreSQL database
- Redis cache
- AWS S3 for file storage
- Vercel/AWS deployment ready

**Security:**
- JWT with refresh tokens
- Role-based access control (RBAC)
- Rate limiting and DDoS protection
- Comprehensive audit logging
- Security headers and CSP

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm 8+
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### Quick Start

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

4. **Start development environment with Docker**
   ```bash
   docker-compose up -d
   ```

5. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:password123@localhost:5432/expensetracker"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Redis
REDIS_URL="redis://localhost:6379"

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="expensetracker-receipts"

# Stripe (for payments)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (SendGrid)
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@expensetracker.pro"

# OCR Services
GOOGLE_CLOUD_PROJECT_ID="your-gcp-project-id"
GOOGLE_CLOUD_KEY_FILE="path/to/service-account.json"

# Security
ENCRYPTION_KEY="your-32-character-encryption-key"
```

## 📚 API Documentation

### Authentication

All API endpoints require authentication except for public routes. Include the session token in requests:

```bash
# Get expenses
curl -H "Cookie: next-auth.session-token=..." \
     http://localhost:3000/api/expenses

# Create expense
curl -X POST \
     -H "Cookie: next-auth.session-token=..." \
     -H "Content-Type: application/json" \
     -d '{"amount": 25.99, "description": "Business lunch", "categoryId": "cat_123"}' \
     http://localhost:3000/api/expenses
```

### Core Endpoints

#### Expenses
- `GET /api/expenses` - List expenses with filtering and pagination
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/{id}` - Get expense details
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense

#### Receipts
- `POST /api/receipts/upload` - Upload receipt with OCR processing
- `GET /api/receipts/{id}` - Get receipt details
- `DELETE /api/receipts/{id}` - Delete receipt

#### Categories
- `GET /api/categories` - List expense categories
- `POST /api/categories` - Create custom category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

#### Reports
- `GET /api/reports` - List generated reports
- `POST /api/reports` - Generate new report
- `GET /api/reports/{id}/download` - Download report file

### Request/Response Examples

**Create Expense:**
```json
POST /api/expenses
{
  "amount": 25.99,
  "currency": "USD",
  "description": "Business lunch with client",
  "merchantName": "Restaurant ABC",
  "categoryId": "cat_meals_entertainment",
  "expenseDate": "2024-01-15T12:30:00Z",
  "isTaxDeductible": true,
  "businessPurpose": "Client meeting",
  "paymentMethod": "CREDIT_CARD",
  "tags": ["client", "lunch"]
}
```

**Response:**
```json
{
  "id": "exp_123456",
  "amount": 25.99,
  "currency": "USD",
  "description": "Business lunch with client",
  "merchantName": "Restaurant ABC",
  "category": {
    "id": "cat_meals_entertainment",
    "name": "Meals & Entertainment",
    "isTaxDeductible": true
  },
  "expenseDate": "2024-01-15T12:30:00Z",
  "status": "PENDING",
  "createdAt": "2024-01-15T12:35:00Z"
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Test Coverage

The project maintains 90%+ test coverage across:
- Unit tests for utilities and business logic
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical user workflows

### Writing Tests

Tests are located in `__tests__` directories or `.test.ts` files alongside source code:

```typescript
// src/lib/__tests__/utils.test.ts
import { formatCurrency } from '../utils';

describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    expect(formatCurrency(25.99)).toBe('$25.99');
  });
});
```

## 🐳 Docker Deployment

### Development with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Build production image
docker build -t expensetracker-pro .

# Run with production compose
docker-compose -f docker-compose.prod.yml up -d
```

### Docker Services

- **app**: Main Next.js application
- **postgres**: PostgreSQL database with persistent volumes
- **redis**: Redis cache for sessions and rate limiting
- **nginx**: Reverse proxy with SSL termination (production)
- **worker**: Background job processor (production)

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication with refresh tokens
- **Role-Based Access Control**: USER, ADMIN, SUPER_ADMIN roles
- **Multi-Factor Authentication**: TOTP-based MFA support
- **OAuth Integration**: Google, GitHub, and other OAuth providers

### Data Protection
- **Encryption**: Data encrypted at rest and in transit
- **Input Validation**: Comprehensive input sanitization with Zod
- **SQL Injection Prevention**: Parameterized queries with Prisma
- **XSS Protection**: Content Security Policy and output encoding

### Infrastructure Security
- **Rate Limiting**: Configurable rate limits per endpoint
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Audit Logging**: Comprehensive activity logging
- **File Upload Security**: Type validation, size limits, virus scanning

### Compliance
- **GDPR Ready**: Data anonymization and right to deletion
- **SOC 2 Preparation**: Security controls and monitoring
- **PCI Considerations**: Payment data handling best practices

## 📊 Monitoring & Observability

### Application Monitoring
- **Health Checks**: `/api/health` endpoint for system status
- **Error Tracking**: Sentry integration for error monitoring
- **Performance Monitoring**: Core Web Vitals tracking
- **Custom Metrics**: Business KPIs and usage analytics

### Logging
- **Structured Logging**: JSON-formatted logs with Winston
- **Log Levels**: Configurable log levels per environment
- **Audit Trails**: Complete user activity logging
- **Error Correlation**: Request IDs for tracing

### Alerting
- **Uptime Monitoring**: Health check monitoring
- **Error Rate Alerts**: High error rate notifications
- **Performance Alerts**: Slow query and response time alerts
- **Security Alerts**: Failed login attempts and suspicious activity

## 🚀 Performance Optimization

### Frontend Performance
- **Code Splitting**: Dynamic imports and route-based splitting
- **Image Optimization**: Next.js Image component with WebP
- **Caching Strategy**: SWR for data fetching with intelligent caching
- **Bundle Analysis**: Webpack Bundle Analyzer for optimization

### Backend Performance
- **Database Optimization**: Proper indexing and query optimization
- **Connection Pooling**: PostgreSQL connection pool management
- **Redis Caching**: Cached API responses and session data
- **File CDN**: S3 with CloudFront for receipt storage

### Scalability
- **Horizontal Scaling**: Stateless application design
- **Database Scaling**: Read replicas and connection pooling
- **Auto-scaling**: Container orchestration ready
- **Load Balancing**: Nginx reverse proxy configuration

## 🔧 Configuration

### Application Settings
```typescript
// src/config/app.ts
export const appConfig = {
  name: 'ExpenseTracker Pro',
  version: '1.0.0',
  environment: process.env.NODE_ENV,
  baseUrl: process.env.NEXTAUTH_URL,
  features: {
    ocr: true,
    multiTenant: true,
    realTime: true,
  },
};
```

### Database Configuration
```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code quality rules
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for quality checks

### Pull Request Guidelines
- Include comprehensive tests
- Update documentation as needed
- Follow conventional commit messages
- Ensure all CI checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Security Guide](docs/security.md)
- [Contributing Guide](docs/contributing.md)

### Community
- **Issues**: [GitHub Issues](https://github.com/expensetracker-pro/issues)
- **Discussions**: [GitHub Discussions](https://github.com/expensetracker-pro/discussions)
- **Discord**: [Community Server](https://discord.gg/expensetracker)

### Enterprise Support
For enterprise customers, we offer:
- 24/7 technical support
- Custom feature development
- On-premise deployment assistance
- Security audits and compliance support

---

Built with ❤️ by the ExpenseTracker Pro Team