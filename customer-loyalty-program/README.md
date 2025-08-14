# Customer Loyalty Program - Rewards & Retention Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.19.1-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.7-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

A comprehensive customer loyalty and rewards platform that helps businesses create, manage, and optimize loyalty programs with points systems, tier management, personalized rewards, and retention analytics.

## 🎯 Features

### 🏆 Core Loyalty System
- **Flexible Points System** - Customizable earning rules and point values
- **Multi-Tier Programs** - Bronze, Silver, Gold, Platinum, Diamond tiers
- **Smart Rewards Catalog** - Digital discounts, free items, gift cards, experiences
- **Automated Tier Upgrades** - Progressive benefits based on point thresholds
- **Gamification Elements** - Achievements, badges, progress tracking

### 👥 Customer Experience
- **Digital Loyalty Cards** - Beautiful, animated mobile-first design
- **Real-time Points Tracking** - Live balance updates and transaction history
- **Personalized Rewards** - AI-driven recommendations based on behavior
- **Mobile-Optimized Portal** - PWA-ready customer interface
- **Social Sharing** - Share achievements and rewards

### 📊 Business Management
- **Analytics Dashboard** - Customer retention, LTV, program ROI
- **Campaign Management** - Targeted promotions and bonus campaigns
- **Customer Segmentation** - Behavioral and demographic targeting
- **Multi-Location Support** - Centralized management for chains
- **Staff Management** - Role-based access and permissions

### 🔧 Technical Excellence
- **Enterprise Security** - RBAC, fraud prevention, audit trails
- **API-First Design** - RESTful APIs with comprehensive documentation
- **Real-time Updates** - WebSocket notifications and live data
- **Scalable Architecture** - Microservices-ready design
- **Comprehensive Testing** - 90%+ test coverage with Jest

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+ (optional, for caching)
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd customer-loyalty-program
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

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # Seed with sample data (optional)
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

### Docker Setup (Recommended)

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**
   ```bash
   docker-compose exec app npx prisma db push
   ```

3. **Access the application**
   ```
   http://localhost:3000
   ```

## 📚 Documentation

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/session` - Get current session

#### Loyalty Management
- `GET /api/loyalty/membership` - Get user memberships
- `POST /api/loyalty/membership` - Create new membership
- `GET /api/loyalty/rewards` - Get available rewards
- `POST /api/loyalty/redeem` - Redeem reward
- `POST /api/loyalty/points/award` - Award points

#### Business Management
- `GET /api/business/analytics` - Business analytics
- `GET /api/business/customers` - Customer list
- `POST /api/business/campaigns` - Create campaign

### Database Schema

The platform uses a comprehensive PostgreSQL schema with 15+ models:

- **Users & Authentication** - User accounts, sessions, OAuth
- **Business Management** - Business profiles, staff, settings
- **Customer Profiles** - Customer data, preferences, history
- **Loyalty Programs** - Program configuration, rules, tiers
- **Points & Transactions** - Point history, earning rules, redemptions
- **Rewards Management** - Reward catalog, redemption tracking
- **Campaigns & Marketing** - Targeted campaigns, analytics

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes     │    │   Database      │
│   (Next.js)     │◄──►│   (REST API)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Components │    │ Loyalty Engine   │    │   Redis Cache   │
│   (Radix UI)    │    │ (Business Logic) │    │   (Optional)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Coverage
- **Unit Tests** - Utils, components, business logic
- **Integration Tests** - API endpoints, database operations
- **E2E Tests** - User workflows, critical paths
- **Performance Tests** - Load testing, stress testing

## 🚀 Deployment

### Environment Configuration

#### Production Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/loyalty_program"

# Security
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://yourdomain.com"

# OAuth
GOOGLE_CLIENT_ID="production-google-client-id"
GOOGLE_CLIENT_SECRET="production-google-client-secret"

# Email
RESEND_API_KEY="production-resend-key"
```

### Docker Deployment

1. **Build production image**
   ```bash
   docker build -t loyalty-platform .
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Cloud Deployment

#### Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```

#### AWS ECS
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t loyalty-platform .
docker tag loyalty-platform:latest <account>.dkr.ecr.us-east-1.amazonaws.com/loyalty-platform:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/loyalty-platform:latest
```

## 📈 Performance

### Optimization Features
- **Image Optimization** - Next.js automatic image optimization
- **Code Splitting** - Automatic route-based code splitting
- **Caching Strategy** - Redis caching for frequently accessed data
- **Database Indexing** - Optimized database queries with proper indexes
- **CDN Integration** - Static asset optimization

### Performance Metrics
- **Page Load Time** - < 2 seconds (target)
- **Time to Interactive** - < 3 seconds (target)
- **Core Web Vitals** - LCP < 2.5s, FID < 100ms, CLS < 0.1
- **API Response Time** - < 200ms (95th percentile)

## 🔒 Security

### Security Features
- **Authentication** - NextAuth.js with secure session management
- **Authorization** - Role-based access control (RBAC)
- **Data Protection** - Encryption at rest and in transit
- **Input Validation** - Zod schema validation for all inputs
- **SQL Injection Prevention** - Prisma ORM with parameterized queries
- **XSS Protection** - Content Security Policy headers
- **Rate Limiting** - API rate limiting with Redis

### Security Checklist
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] SSL certificates configured
- [ ] Security headers implemented
- [ ] Regular security audits scheduled

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Run linting: `npm run lint`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Standards
- **TypeScript** - Strict type checking enabled
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **Conventional Commits** - Standardized commit messages
- **Test Coverage** - Minimum 90% coverage required

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guide](docs/contributing.md)

### Community
- [GitHub Issues](https://github.com/yourusername/customer-loyalty-program/issues)
- [GitHub Discussions](https://github.com/yourusername/customer-loyalty-program/discussions)

### Commercial Support
For enterprise support, custom features, or deployment assistance, contact us at support@yourdomain.com

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**