# 🏢 Client Portal Builder - Enterprise MicroSaaS

A comprehensive, enterprise-grade client portal builder SaaS platform built with Next.js 14, TypeScript, and Prisma. Create branded, secure client portals in minutes with drag-and-drop functionality, real-time collaboration, and advanced security features.

## ✨ Features

### 🏗️ Portal Builder
- **Drag & Drop Interface**: Intuitive visual portal builder
- **Pre-built Templates**: Industry-specific portal templates
- **Real-time Preview**: See changes instantly as you build
- **Custom Branding**: White-label with custom domains and themes
- **Mobile Responsive**: Portals work perfectly on all devices

### 🔐 Enterprise Security
- **Multi-factor Authentication**: TOTP, SMS, and authenticator app support
- **Role-based Access Control**: Granular permissions system
- **Data Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Audit Logging**: Comprehensive activity tracking
- **GDPR Compliance**: Built-in privacy controls

### 📁 File Management
- **Secure File Sharing**: Client-specific file access
- **Version Control**: Automatic file versioning
- **Bulk Upload**: Drag & drop multiple files
- **Access Control**: Per-file permissions
- **Storage Analytics**: Usage tracking and reporting

### 💬 Communication Hub
- **Real-time Messaging**: WebSocket-powered chat
- **Threaded Conversations**: Organized discussions
- **File Comments**: Comment directly on shared files
- **Email Integration**: Automatic email notifications
- **Message Templates**: Pre-written message templates

### 📊 Analytics & Reporting
- **Portal Analytics**: Usage statistics and insights
- **Client Engagement**: Track client activity
- **File Downloads**: Monitor file access
- **Custom Reports**: Generate detailed reports
- **Usage Metrics**: Storage and bandwidth tracking

## 🚀 Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **React Query**: Server state management
- **React DnD**: Drag and drop functionality

### Backend
- **Node.js**: Runtime environment
- **Prisma**: Database ORM
- **NextAuth.js**: Authentication
- **PostgreSQL**: Primary database
- **Redis**: Caching and sessions
- **Socket.io**: Real-time features

### Infrastructure
- **Docker**: Containerization
- **MinIO**: S3-compatible storage
- **Nginx**: Reverse proxy
- **Vercel/AWS**: Deployment options

## 🏗️ Architecture

### Multi-tenant Design
- **Account Isolation**: Complete data separation
- **Resource Quotas**: Per-tenant limits
- **Custom Domains**: White-label support
- **Scalable Architecture**: Handles thousands of tenants

### Database Schema
```sql
-- Key tables
Accounts (multi-tenant isolation)
Users (team members)
Clients (external portal users)
Portals (individual client portals)
Files (secure file management)
Messages (communication system)
Activities (audit logging)
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker (optional)

### Quick Start with Docker
```bash
# Clone the repository
git clone <repository-url>
cd client-portal-builder

# Start with Docker Compose
docker-compose up -d

# The application will be available at http://localhost:3000
```

### Manual Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up the database
npx prisma migrate dev
npx prisma db seed

# Start the development server
npm run dev
```

## 📋 Environment Variables

### Required Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/client_portal_builder"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Security
JWT_SECRET="your-jwt-secret-key"
ENCRYPTION_KEY="your-32-character-encryption-key"
```

### Optional Variables
```env
# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"

# File Storage
S3_ACCESS_KEY_ID="your-s3-access-key"
S3_SECRET_ACCESS_KEY="your-s3-secret-key"
S3_REGION="us-east-1"
S3_BUCKET_NAME="client-portal-files"

# Redis
REDIS_URL="redis://localhost:6379"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLIC_KEY="pk_test_..."
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Testing Strategy
- **Unit Tests**: 90%+ code coverage target
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user journeys
- **Security Tests**: Vulnerability scanning
- **Performance Tests**: Load testing

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── auth/              # Authentication pages
│   └── portal/            # Client portal pages
├── components/            # React components
│   ├── ui/                # Base UI components
│   ├── dashboard/         # Dashboard components
│   └── portal/            # Portal components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication config
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Helper functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── styles/               # Global styles

prisma/
├── schema.prisma         # Database schema
├── migrations/           # Database migrations
└── seed.ts              # Database seeding

tests/
├── __tests__/           # Unit tests
├── integration/         # Integration tests
└── e2e/                # End-to-end tests
```

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- OAuth 2.0 integration (Google, Microsoft, etc.)
- Multi-factor authentication (TOTP, SMS)
- Role-based access control (RBAC)
- Session management with automatic timeout

### Data Protection
- End-to-end encryption for sensitive files
- AES-256 encryption at rest
- TLS 1.3 encryption in transit
- Secure file upload with virus scanning
- Data anonymization for GDPR compliance

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-XSS-Protection: 1; mode=block

## 📈 Performance

### Optimization Features
- Server-side rendering (SSR)
- Static site generation (SSG) where applicable
- Image optimization with Next.js
- Code splitting and lazy loading
- CDN integration for static assets
- Database query optimization
- Redis caching layer

### Monitoring
- Application performance monitoring
- Error tracking and alerting
- Usage analytics
- Performance metrics
- Health checks and uptime monitoring

## 🌐 Deployment

### Production Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-specific Configs
- **Development**: Hot reload, debug logging
- **Staging**: Production-like environment for testing
- **Production**: Optimized builds, monitoring enabled

## 📊 Monitoring & Analytics

### Built-in Analytics
- Portal usage statistics
- File download tracking
- User engagement metrics
- Performance monitoring
- Error tracking

### Integration Support
- Google Analytics
- Mixpanel
- Segment
- Custom analytics via webhooks

## 🔧 Configuration

### Feature Flags
```env
ENABLE_REALTIME="true"
ENABLE_ANALYTICS="true"
ENABLE_WHITE_LABEL="true"
ENABLE_API_ACCESS="true"
```

### Customization Options
- Custom themes and branding
- White-label configuration
- Email template customization
- Webhook integrations
- Custom domain setup

## 📚 API Documentation

### REST API Endpoints
- **Authentication**: `/api/auth/*`
- **Portals**: `/api/portals/*`
- **Clients**: `/api/clients/*`
- **Files**: `/api/files/*`
- **Messages**: `/api/messages/*`

### WebSocket Events
- Real-time messaging
- File upload progress
- Portal updates
- User presence indicators

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Standards
- TypeScript strict mode
- ESLint + Prettier formatting
- Conventional commit messages
- Test coverage requirements
- Documentation updates

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🆘 Support

### Documentation
- [Getting Started Guide](docs/getting-started.md)
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Security Guide](docs/security.md)

### Community
- GitHub Issues for bug reports
- GitHub Discussions for questions
- Discord community chat
- Email support for enterprise customers

## 🎯 Roadmap

### Q1 2024
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Advanced workflow automation
- [ ] Enterprise SSO integration

### Q2 2024
- [ ] AI-powered content suggestions
- [ ] Advanced file preview
- [ ] Video conferencing integration
- [ ] Multi-language support

### Q3 2024
- [ ] Advanced reporting engine
- [ ] Custom widget marketplace
- [ ] Advanced security features
- [ ] Performance optimizations

---

## 📞 Contact

For questions, support, or enterprise inquiries:
- Email: support@clientportalbuilder.com
- Website: https://clientportalbuilder.com
- Twitter: @ClientPortalApp

---

**Built with ❤️ following CLAUDE.md enterprise methodology for production-ready SaaS applications.**