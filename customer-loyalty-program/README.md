# Customer Loyalty Program Platform

A comprehensive customer loyalty and rewards platform built with Next.js 14, featuring points systems, tier management, personalized rewards, and retention analytics.

## 🚀 Features

### Core Loyalty Engine
- **Flexible Points System**: Customizable earning rules and point calculations
- **Multi-tier Loyalty Structures**: Bronze, Silver, Gold, Platinum, Diamond tiers with exclusive benefits
- **Reward Catalog Management**: Digital and physical rewards with intelligent redemption
- **Advanced Gamification**: Achievements, badges, streaks, and challenges
- **Real-time Analytics**: Customer lifetime value, retention metrics, and ROI tracking

### Customer Experience
- **Responsive Web Portal**: Mobile-first design with PWA capabilities
- **Personalized Dashboard**: Points balance, tier progress, and reward recommendations
- **Social Features**: Leaderboards, sharing, and community engagement
- **Multi-language Support**: Internationalization ready
- **Accessibility**: WCAG 2.1 compliant interface

### Business Management
- **Program Configuration**: Easy setup and management of loyalty programs
- **Customer Segmentation**: Targeted campaigns and personalized experiences
- **Integration APIs**: RESTful APIs for e-commerce and POS integration
- **Advanced Analytics**: Business intelligence and custom reporting
- **Fraud Prevention**: Secure transactions and activity monitoring

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom implementations
- **Animations**: Framer Motion for engaging interactions
- **State Management**: Zustand for loyalty program state
- **Authentication**: NextAuth.js with OAuth 2.0 support
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management and caching
- **Queue System**: BullMQ for background job processing
- **Email**: Resend for transactional emails
- **Testing**: Jest with React Testing Library
- **Deployment**: Docker with multi-stage builds

### Database Schema
- **Users**: Customer and business owner accounts
- **Loyalty Programs**: Multi-tenant program configurations
- **Tiers**: Flexible tier structures with benefits
- **Points**: Transaction tracking and balance management
- **Rewards**: Catalog with stock and availability management
- **Activities**: Customer engagement and behavior tracking
- **Analytics**: Performance metrics and business intelligence

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- npm or yarn

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
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # (Optional) Seed with sample data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Docker Setup

1. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**
   ```bash
   docker-compose run migrate
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration
- `GET /api/auth/session` - Get current session

### Loyalty Program Endpoints
- `GET /api/loyalty/points` - Get user points and membership stats
- `POST /api/loyalty/points` - Award points to user
- `GET /api/loyalty/rewards` - Get available rewards
- `POST /api/loyalty/redeem` - Redeem reward
- `GET /api/loyalty/activities` - Get user activity history

### Analytics Endpoints
- `GET /api/analytics/dashboard` - Business dashboard metrics
- `GET /api/analytics/customers` - Customer segmentation data
- `GET /api/analytics/performance` - Program performance metrics

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `RESEND_API_KEY` | Email service API key | No |

### Loyalty Program Configuration

```typescript
// Example loyalty program configuration
const programConfig = {
  type: 'POINTS',
  earningRules: [
    {
      type: 'PURCHASE',
      pointsAwarded: 1,
      triggerCondition: { minAmount: 1 }
    },
    {
      type: 'REVIEW',
      pointsAwarded: 50,
      triggerCondition: {}
    }
  ],
  tiers: [
    {
      name: 'Bronze',
      minPoints: 0,
      multiplier: 1.0,
      benefits: ['Standard rewards']
    },
    {
      name: 'Silver',
      minPoints: 500,
      multiplier: 1.2,
      benefits: ['Priority support', '20% bonus points']
    }
  ]
}
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
docker build -t loyalty-program .
docker run -p 3000:3000 loyalty-program
```

### Environment Setup
- Set up production database
- Configure Redis cluster
- Set up monitoring and logging
- Configure CDN for static assets
- Set up SSL certificates

## 📈 Performance

- **Core Web Vitals**: Optimized for LCP, FID, and CLS
- **Caching Strategy**: Redis caching for frequently accessed data
- **Database Optimization**: Indexed queries and connection pooling
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting

## 🔒 Security

- **Authentication**: Secure JWT-based authentication
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Content Security Policy headers
- **Rate Limiting**: API rate limiting and throttling
- **Data Encryption**: Encryption at rest and in transit

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@loyaltyprogram.com
- 📚 Documentation: [https://docs.loyaltyprogram.com](https://docs.loyaltyprogram.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/customer-loyalty-program/issues)

## 🙏 Acknowledgments

- Next.js team for the excellent framework
- Prisma team for the robust ORM
- Radix UI for accessible component primitives
- All contributors and beta testers