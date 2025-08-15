# Content Idea Generator - AI-Powered Content Creation Platform

A comprehensive SaaS platform that generates engaging content ideas using AI, trend analysis, audience intelligence, and competitive research. Built with Next.js 14, TypeScript, and modern web technologies.

## 🚀 Features

### Core Features
- **AI-Powered Content Generation**: Advanced AI analyzes your niche and generates personalized content ideas
- **Real-Time Trend Analysis**: Stay ahead with trending topics from Google Trends and social media
- **Audience Intelligence**: Understand what your audience wants with demographic insights
- **SEO Optimization**: Get keyword difficulty scores, search volume data, and SEO recommendations
- **Competitor Analysis**: Identify content gaps and opportunities
- **Content Planning**: Organize ideas with built-in calendar integration

### Advanced Features
- **Multi-Content Types**: Blog posts, social media, videos, emails, podcasts, and more
- **Tone Customization**: Professional, casual, friendly, authoritative, and more
- **Performance Tracking**: Monitor content performance and ROI
- **Team Collaboration**: Share and collaborate on content ideas
- **Export & Integration**: Export ideas and integrate with popular tools
- **Analytics Dashboard**: Comprehensive analytics and reporting

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations
- **React Query**: Data fetching and caching

### Backend
- **Next.js API Routes**: Serverless functions
- **Prisma**: Modern database ORM
- **PostgreSQL**: Production-ready database
- **NextAuth.js**: Authentication solution

### AI & Analytics
- **OpenAI GPT-4**: Content generation
- **Google Trends API**: Trend analysis
- **SerpAPI**: SEO data (optional)

### Infrastructure
- **Docker**: Containerization
- **Redis**: Caching and sessions
- **Nginx**: Reverse proxy
- **Vercel/AWS**: Cloud deployment

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- PostgreSQL database
- OpenAI API key
- Google OAuth credentials (optional)
- GitHub OAuth credentials (optional)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd content-idea-generator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/content_idea_generator"
NEXTAUTH_SECRET="your-super-secret-jwt-secret-here"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database (optional)
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Deployment

### Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d
```

## 📖 API Documentation

### Authentication
All API endpoints require authentication except for public routes.

### Generate Ideas
```http
POST /api/generate-ideas
Content-Type: application/json

{
  "niche": "Digital Marketing",
  "keywords": ["content marketing", "SEO"],
  "contentType": "blog_post",
  "toneOfVoice": "professional",
  "targetAudience": "Marketing professionals",
  "count": 3
}
```

### Get Trends
```http
GET /api/trends?type=daily&geo=US
GET /api/trends?type=keywords&keywords=marketing,seo
```

### Manage Ideas
```http
GET /api/ideas
POST /api/ideas
PUT /api/ideas/:id
DELETE /api/ideas/:id
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Types
- Unit tests for utilities and services
- Integration tests for API routes
- Component tests for UI components
- E2E tests for critical user flows

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
│   ├── dashboard/        # Dashboard components
│   └── providers.tsx     # Context providers
├── lib/                  # Utilities and configurations
│   ├── auth.ts           # Authentication config
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Utility functions
├── services/             # External service integrations
│   ├── openai.ts         # AI content generation
│   └── trends.ts         # Trend analysis
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── store/                # State management
```

## 🔐 Security Features

- **Authentication**: Secure user authentication with NextAuth.js
- **Authorization**: Role-based access control
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS Protection**: Cross-origin resource sharing protection
- **Environment Isolation**: Secure environment variable management
- **SQL Injection Prevention**: Prisma ORM prevents SQL injection
- **XSS Protection**: Content Security Policy headers

## 🚀 Performance Optimizations

- **Server-Side Rendering**: Next.js SSR for fast initial page loads
- **Static Generation**: Pre-generate static pages where possible
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic code splitting for smaller bundles
- **Caching**: Redis caching for frequently accessed data
- **Database Optimization**: Efficient database queries with Prisma
- **CDN Integration**: Content delivery network for global performance

## 📊 Monitoring & Analytics

### Built-in Analytics
- User behavior tracking
- Content generation metrics
- API usage monitoring
- Performance metrics

### External Integrations
- Google Analytics (optional)
- PostHog (optional)
- Sentry error tracking (optional)

## 🔧 Configuration

### Subscription Plans
Configure subscription plans in:
```typescript
// src/lib/subscription-plans.ts
export const PLANS = {
  free: { credits: 10, price: 0 },
  starter: { credits: 100, price: 19 },
  professional: { credits: 500, price: 49 },
  business: { credits: 2000, price: 149 }
}
```

### AI Model Configuration
Customize AI model settings:
```typescript
// src/services/openai.ts
const MODEL_CONFIG = {
  model: 'gpt-4-turbo-preview',
  temperature: 0.8,
  max_tokens: 4000
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)

### Community
- [GitHub Issues](https://github.com/your-repo/content-idea-generator/issues)
- [Discord Community](https://discord.gg/your-discord)
- [Email Support](mailto:support@contentideagenerator.com)

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Core AI content generation
- [x] User authentication
- [x] Basic dashboard
- [x] Trend analysis integration

### Phase 2 (Next)
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] Content calendar
- [ ] Competitor analysis

### Phase 3 (Future)
- [ ] Mobile app
- [ ] Advanced AI training
- [ ] Enterprise features
- [ ] API marketplace

## 📈 Metrics & KPIs

### Success Metrics
- **User Engagement**: Session duration, page views
- **Content Quality**: Idea usage rate, user ratings
- **Business Metrics**: MRR, churn rate, LTV
- **Technical Metrics**: API response time, uptime

### Target Goals
- 99.9% uptime
- < 3s page load time
- 80%+ user satisfaction
- 90%+ test coverage

---

**Built with ❤️ using Next.js, TypeScript, and AI**