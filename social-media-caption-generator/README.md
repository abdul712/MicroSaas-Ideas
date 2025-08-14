# 🚀 Social Media Caption Generator

An enterprise-grade AI-powered social media caption generation platform built with Next.js 14, TypeScript, and modern AI technologies. Generate engaging, platform-optimized captions for Instagram, Facebook, Twitter, LinkedIn, and TikTok with advanced brand voice customization and analytics.

## ✨ Features

### 🤖 AI-Powered Generation
- **Multi-AI Support**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **Platform Optimization**: Tailored captions for each social media platform
- **Brand Voice Training**: Custom AI training with your brand examples
- **Image Analysis**: Google Vision API integration for context-aware captions

### 📊 Enterprise Features
- **Multi-tenancy**: Organization-based isolation and management
- **Team Collaboration**: Real-time collaboration with role-based permissions
- **Analytics Dashboard**: Comprehensive performance tracking and insights
- **API Access**: RESTful APIs for integrations and automation

### 🔒 Security & Compliance
- **Enterprise Security**: SOC 2 compliance, GDPR ready
- **Authentication**: OAuth2, JWT with refresh tokens
- **Data Encryption**: AES-256 encryption at rest and in transit
- **Rate Limiting**: Intelligent rate limiting by subscription tier

### 📱 Platform Support
- **Instagram**: Feed posts, stories, reels optimization
- **Facebook**: Posts, stories with engagement-focused content
- **Twitter/X**: Character-optimized tweets and threads
- **LinkedIn**: Professional content with industry insights
- **TikTok**: Trend-aware captions with hashtag research

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL with vector extensions, Redis cache
- **AI Services**: OpenAI, Anthropic, Google Cloud Vision
- **Authentication**: NextAuth.js with OAuth providers
- **Real-time**: WebSocket with Socket.IO

### System Design
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   AI Services   │
│   Next.js 14    │◄──►│   Rate Limiting │◄──►│   OpenAI GPT-4  │
│   TypeScript     │    │   Auth/JWT      │    │   Claude API    │
│   Tailwind CSS  │    │   Validation    │    │   Google Vision │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm 10+
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional)

### Environment Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/abdul712/MicroSaas-Ideas.git
   cd MicroSaas-Ideas/social-media-caption-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Database setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed database (optional)
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

### Docker Setup (Recommended)
```bash
# Clone and navigate to the project
git clone https://github.com/abdul712/MicroSaas-Ideas.git
cd MicroSaas-Ideas/social-media-caption-generator

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec app npm run db:migrate

# View logs
docker-compose logs -f app
```

## 🔧 Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/social_caption_generator"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# AI Services
OPENAI_API_KEY="sk-your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### AI Service Configuration
The platform supports multiple AI providers with automatic fallback:

1. **Primary**: OpenAI GPT-4 Turbo (best quality)
2. **Secondary**: Anthropic Claude 3.5 Sonnet (creative content)
3. **Fallback**: OpenAI GPT-3.5 Turbo (cost-effective)

### Platform-Specific Settings
Each social media platform has optimized configurations:

- **Character limits**: Enforced per platform
- **Hashtag recommendations**: Platform-specific research
- **Engagement optimization**: Best practices implementation
- **Content formatting**: Platform-native styling

## 📖 API Documentation

### Caption Generation
```bash
POST /api/captions/generate
Content-Type: application/json

{
  "prompt": "Excited to share our new product launch!",
  "platform": "instagram",
  "projectId": "project-id",
  "brandVoiceId": "brand-voice-id",
  "complexity": "medium"
}
```

### Response
```json
{
  "success": true,
  "captionId": "caption-id",
  "captions": [
    {
      "text": "🚀 Exciting news! We're thrilled to announce...",
      "hashtags": ["#productlaunch", "#innovation", "#excited"],
      "emojis": ["🚀", "✨", "🎉"],
      "callToAction": "Check it out in our bio!",
      "score": 92
    }
  ],
  "metadata": {
    "aiProvider": "openai",
    "model": "gpt-4-turbo",
    "tokensUsed": 450,
    "generationTime": 2300,
    "costUsd": 0.0045,
    "creditsUsed": 1,
    "creditsRemaining": 199
  }
}
```

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Test Coverage Requirements
- **Unit Tests**: 90%+ coverage required
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user workflows
- **AI Testing**: Caption quality validation

## 🚢 Deployment

### Production Deployment
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Database migrations**
   ```bash
   npm run db:migrate:deploy
   ```

3. **Start production server**
   ```bash
   npm start
   ```

### Docker Production
```bash
# Build production image
docker build -t social-caption-generator .

# Run with production compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment-Specific Configurations
- **Development**: Hot reload, debug logging, dev tools
- **Staging**: Production build, test data, monitoring
- **Production**: Optimized build, security headers, analytics

## 📊 Monitoring & Analytics

### Application Monitoring
- **Error Tracking**: Sentry integration
- **Performance**: Vercel Analytics and Speed Insights
- **Uptime**: Health check endpoints
- **Logs**: Structured logging with correlation IDs

### Business Analytics
- **Usage Metrics**: Caption generation volume and patterns
- **AI Costs**: Token usage and cost optimization
- **User Engagement**: Feature adoption and retention
- **Performance**: Generation speed and quality scores

## 🔐 Security

### Security Measures
- **Authentication**: Multi-factor authentication support
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encryption at rest and in transit
- **API Security**: Rate limiting, input validation, CORS
- **Content Moderation**: Automated inappropriate content detection

### Compliance
- **GDPR**: Right to deletion, data export, privacy controls
- **SOC 2**: Security controls and audit compliance
- **OWASP**: Security best practices implementation

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Commit message format

## 📋 Roadmap

### Phase 1: Core Platform (✅ Completed)
- [x] AI caption generation with multiple providers
- [x] Multi-platform optimization
- [x] Brand voice training and consistency
- [x] User authentication and authorization
- [x] Basic analytics dashboard

### Phase 2: Advanced Features (🚧 In Progress)
- [ ] Real-time collaboration and comments
- [ ] Advanced analytics and A/B testing
- [ ] Social media account integration
- [ ] Automated posting and scheduling
- [ ] Mobile application

### Phase 3: Enterprise Features (📋 Planned)
- [ ] API marketplace and webhooks
- [ ] Advanced AI training and fine-tuning
- [ ] Multi-language support
- [ ] Enterprise SSO and SCIM
- [ ] Advanced security and compliance

## 💰 Pricing

### Subscription Tiers
- **Free**: 20 captions/month, basic features
- **Creator ($19/month)**: 200 captions, all platforms, analytics
- **Professional ($49/month)**: 1,000 captions, API access, team features
- **Agency ($149/month)**: 5,000 captions, white-label, custom training

## 📞 Support

### Get Help
- **Documentation**: Comprehensive guides and API reference
- **Community**: Discord server for discussions
- **Support**: Email support for paid plans
- **Enterprise**: Dedicated support and onboarding

### Resources
- **Blog**: Social media best practices and tips
- **Tutorials**: Video guides and walkthroughs
- **Templates**: Pre-built caption templates
- **API Reference**: Complete API documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI**: GPT-4 and AI capabilities
- **Anthropic**: Claude AI integration
- **Vercel**: Hosting and deployment platform
- **Supabase**: Database and real-time features
- **Community**: Contributors and feedback

---

**Built with ❤️ by Abdul Rahim**

For questions, suggestions, or support, please [open an issue](https://github.com/abdul712/MicroSaas-Ideas/issues) or contact us at support@socialcaption.ai