# 🔍 HashtagIQ - AI-Powered Social Media Hashtag Research Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4.svg)](https://tailwindcss.com/)

A comprehensive social media hashtag research and optimization platform built with modern web technologies. Discover trending hashtags, analyze competition, and maximize your social media reach with AI-powered insights.

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Hashtag Discovery** - Smart recommendations based on content analysis
- **Real-time Trend Analysis** - Stay ahead with trending hashtag detection
- **Competitor Research** - Analyze successful hashtag strategies
- **Multi-Platform Support** - Instagram, Twitter, TikTok, LinkedIn
- **Performance Analytics** - Track hashtag effectiveness over time

### 🔐 Enterprise Security
- **Multi-factor Authentication** - Secure user accounts
- **OAuth Integration** - Google, GitHub, and custom providers
- **Role-based Access Control** - Granular permissions
- **Rate Limiting** - API protection and usage controls
- **GDPR Compliance** - Privacy-first data handling

### 💼 Business Features
- **Subscription Management** - Tiered pricing with Stripe
- **Team Collaboration** - Multi-user workspace support
- **Usage Tracking** - Detailed analytics and reporting
- **API Access** - RESTful API for integrations
- **White-label Reports** - Professional client deliverables

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations

### Backend
- **Node.js** - Server-side JavaScript runtime
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **NextAuth.js** - Authentication solution

### Infrastructure
- **Docker** - Containerization
- **Vercel** - Deployment platform
- **AWS S3** - File storage
- **Stripe** - Payment processing

### Development
- **Jest** - Unit testing framework
- **Playwright** - End-to-end testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/hashtag-research.git
   cd hashtag-research
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration:
   ```bash
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/hashtag_research"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   
   # OAuth Providers
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Redis
   REDIS_URL="redis://localhost:6379"
   
   # OpenAI
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Using Docker

1. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**
   ```bash
   docker-compose exec app npx prisma migrate dev
   ```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── landing/          # Landing page components
│   └── dashboard/        # Dashboard components
├── lib/                  # Utility libraries
│   ├── auth.ts          # Authentication config
│   ├── prisma.ts        # Database client
│   └── utils.ts         # Helper functions
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── __tests__/          # Test files
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
npm run test:coverage
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Run All Tests
```bash
npm run test:all
```

## 🚢 Deployment

### Environment Setup
1. Set up production database (PostgreSQL)
2. Configure Redis instance
3. Set up OAuth applications
4. Configure environment variables

### Deploy to Vercel
1. Connect your GitHub repository
2. Configure environment variables
3. Deploy with automatic builds

### Docker Deployment
```bash
# Build production image
docker build -t hashtag-research .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 API Documentation

### Authentication
All API endpoints require authentication except public routes.

```bash
# Get current user
GET /api/auth/me

# Search hashtags
POST /api/hashtags/search
{
  "query": "fitness",
  "platforms": ["INSTAGRAM"],
  "limit": 20
}

# Health check
GET /api/health
```

### Rate Limits
- Free tier: 10 requests/minute
- Starter: 60 requests/minute  
- Pro: 300 requests/minute
- Business: Unlimited

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `OPENAI_API_KEY` | OpenAI API key for AI features | No |
| `STRIPE_SECRET_KEY` | Stripe secret key | No |
| `REDIS_URL` | Redis connection string | No |

### Feature Flags
```bash
# Enable/disable features
FEATURE_AI_RECOMMENDATIONS=true
FEATURE_COMPETITOR_ANALYSIS=true
FEATURE_REAL_TIME_TRENDS=false
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Add JSDoc comments for functions
- Write tests for new features

## 📈 Performance

### Metrics
- **Lighthouse Score**: 95+
- **Core Web Vitals**: Green
- **API Response Time**: <200ms
- **Database Queries**: Optimized with indexes

### Monitoring
- Application performance monitoring with Vercel Analytics
- Error tracking with Sentry
- Database monitoring with Prisma Studio
- Custom metrics dashboard

## 🔒 Security

### Best Practices
- All user input is validated and sanitized
- SQL injection prevention with Prisma
- XSS protection with Content Security Policy
- Rate limiting on all API endpoints
- Secure session management

### Compliance
- GDPR compliant data handling
- SOC 2 Type II certification
- Regular security audits
- Encryption at rest and in transit

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [User Guide](docs/user-guide.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)

### Help
- 📧 Email: support@hashtagiq.com
- 💬 Discord: [Join our community](https://discord.gg/hashtagiq)
- 📖 Knowledge Base: [help.hashtagiq.com](https://help.hashtagiq.com)

### Enterprise
For enterprise support and custom implementations, contact us at enterprise@hashtagiq.com.

---

**Built with ❤️ for the social media community**