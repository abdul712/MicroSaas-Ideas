# 🏛️ Membership Site Builder

A comprehensive MicroSaaS platform that enables creators and businesses to create, manage, and monetize membership communities with content protection, payment processing, and engagement tools.

## 🚀 Features

### 🏗️ Core Features
- **Drag & Drop Site Builder** - Visual site builder with pre-built templates
- **Membership Management** - Complete member lifecycle management
- **Content Protection** - DRM-protected content with access controls
- **Payment Processing** - Integrated Stripe billing with subscriptions
- **Analytics Dashboard** - Real-time member and revenue analytics
- **Community Features** - Discussions, events, and member networking

### 🛡️ Security & Protection
- Multi-factor authentication support
- Content piracy prevention measures
- Secure payment processing (PCI DSS)
- Member data encryption
- GDPR and privacy compliance

### 💰 Monetization
- Multiple subscription plans
- One-time payments and lifetime access
- Trial periods and promotional pricing
- Automated billing and invoicing
- Affiliate and referral programs

### 🎨 Customization
- Professional templates for different niches
- Custom branding and themes
- Mobile-responsive design
- SEO optimization tools
- Custom domain support

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** + Radix UI components
- **Framer Motion** for animations
- **TipTap** rich text editor
- **Zustand** for state management

### Backend
- **Next.js API routes** with GraphQL
- **PostgreSQL** with row-level security
- **Prisma ORM** for database management
- **NextAuth.js** for authentication
- **Redis** for caching and sessions

### Payment & Storage
- **Stripe** for payment processing
- **AWS S3** + CloudFront for file storage
- **UploadThing** for file uploads
- **WebSocket** for real-time features

### Development & Deployment
- **Docker** for containerization
- **Jest** for testing
- **ESLint & Prettier** for code quality
- **GitHub Actions** for CI/CD

## 🏁 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL
- Redis
- Stripe account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd membership-site-builder
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
   npm run db:generate
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Docker Setup

1. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

This will start:
- Application on http://localhost:3000
- PostgreSQL on port 5432
- Redis on port 6379
- PgAdmin on http://localhost:5050

## 📊 Database Schema

The application uses a comprehensive database schema including:

- **Users & Authentication** - User accounts, sessions, OAuth
- **Membership Sites** - Site configuration, themes, settings
- **Membership Tiers** - Pricing plans and access levels
- **Memberships** - User subscriptions and access
- **Content Management** - Protected content with access controls
- **Payments** - Stripe integration and billing
- **Community** - Discussions, events, and networking
- **Analytics** - Member engagement and business metrics

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/membership_sites"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_ID=""
GITHUB_SECRET=""

# Payment Processing
STRIPE_PUBLIC_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# File Storage
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# Email
EMAIL_FROM=""
EMAIL_SERVER_HOST=""
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main**

### Docker Production

1. **Build production image**
   ```bash
   docker build -t membership-site-builder .
   ```

2. **Run with production compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📖 API Documentation

The application provides comprehensive APIs for:

- **Authentication** - Sign up, sign in, OAuth
- **Site Management** - Create, update, delete sites
- **Membership** - Manage members and subscriptions
- **Content** - CRUD operations with access control
- **Payments** - Stripe webhooks and billing
- **Analytics** - Member and revenue metrics

## 🎨 Customization

### Adding New Templates

1. Create template components in `src/components/templates/`
2. Add template configuration to database
3. Include in site builder options

### Custom Payment Providers

1. Implement provider interface in `src/lib/payments/`
2. Add provider configuration
3. Update payment flows

### Extending Analytics

1. Add new metrics to `src/services/analytics/`
2. Update database schema if needed
3. Create dashboard visualizations

## 🔐 Security

- **Authentication** - Multiple providers with secure sessions
- **Authorization** - Role-based access control
- **Content Protection** - DRM and access restrictions
- **Payment Security** - PCI DSS compliant processing
- **Data Privacy** - GDPR compliant data handling

## 📈 Performance

- **Next.js SSR/SSG** for fast page loads
- **Redis caching** for frequently accessed data
- **CDN delivery** for static assets
- **Database optimization** with proper indexing
- **Image optimization** with Next.js Image component

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation** - [docs.example.com](https://docs.example.com)
- **GitHub Issues** - Report bugs and request features
- **Community** - Join our Discord server
- **Email Support** - support@example.com

## 🎯 Roadmap

### Phase 1 (Completed)
- ✅ Core site builder functionality
- ✅ Basic membership management
- ✅ Payment processing integration
- ✅ Content management system

### Phase 2 (In Progress)
- 🔄 Advanced analytics dashboard
- 🔄 Community features (discussions, events)
- 🔄 Mobile app companion
- 🔄 Advanced content protection

### Phase 3 (Planned)
- 📅 AI-powered content recommendations
- 📅 Advanced automation workflows
- 📅 Marketplace for templates and plugins
- 📅 White-label solutions

---

**Built with ❤️ for the creator economy**