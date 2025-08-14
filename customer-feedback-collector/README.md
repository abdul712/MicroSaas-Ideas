# 📊 Customer Feedback Collector

A comprehensive AI-powered customer feedback collection and analysis platform built with Next.js 14, TypeScript, and Prisma.

## 🚀 Features

### 🎯 Core Functionality
- **Multi-Channel Feedback Collection**: Widgets, forms, email surveys, SMS, and API integrations
- **AI-Powered Analysis**: Advanced sentiment analysis, topic modeling, and emotion detection
- **Real-Time Analytics**: Live dashboards with NPS, CSAT, and CES tracking
- **Multi-Tenant Architecture**: Isolated data for multiple organizations
- **Customizable Widgets**: Popup, sidebar, embedded, and floating feedback widgets

### 🛡️ Security & Compliance
- **GDPR/CCPA Compliant**: Built-in data privacy and protection
- **End-to-End Encryption**: Secure data transmission and storage
- **Role-Based Access Control**: Fine-grained permissions system
- **Audit Logging**: Complete activity tracking
- **Data Anonymization**: Optional anonymous feedback collection

### 🔌 Integrations
- **Slack & Microsoft Teams**: Real-time notifications
- **CRM Systems**: Salesforce, HubSpot integration
- **Webhook Support**: Custom integrations
- **REST API**: Comprehensive API access
- **Zapier Compatible**: Automation workflows

### 📱 User Experience
- **Mobile-First Design**: Optimized for all devices
- **Accessibility Compliant**: WCAG 2.1 AA standards
- **Custom Branding**: White-label options
- **Real-Time Notifications**: Instant feedback alerts
- **Offline Support**: Queue feedback when offline

## 🏗️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session and data caching
- **AI/ML**: OpenAI GPT-4 for sentiment analysis
- **Authentication**: NextAuth.js with JWT tokens
- **Payments**: Stripe integration
- **Deployment**: Docker, Docker Compose
- **Real-Time**: WebSocket connections

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL
- Redis
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/customer-feedback-collector.git
   cd customer-feedback-collector
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

4. **Start the database**
   ```bash
   docker-compose up -d database redis
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to access the application.

### Docker Deployment

1. **Production deployment**
   ```bash
   docker-compose up -d
   ```

2. **Run migrations in production**
   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

## 📚 API Documentation

### Authentication
```bash
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### Feedback Collection
```bash
POST /api/feedback          # Submit feedback
GET  /api/feedback          # Get feedback list
GET  /api/feedback/[id]     # Get specific feedback
PUT  /api/feedback/[id]     # Update feedback status
```

### Projects
```bash
GET  /api/projects          # List projects
POST /api/projects          # Create project
GET  /api/projects/[id]     # Get project details
PUT  /api/projects/[id]     # Update project
DELETE /api/projects/[id]   # Delete project
```

### Analytics
```bash
GET /api/analytics/dashboard    # Dashboard metrics
GET /api/analytics/sentiment    # Sentiment analysis
GET /api/analytics/topics       # Topic analysis
GET /api/analytics/export       # Export data
```

## 🎨 Widget Integration

### Basic Widget
```html
<div id="feedback-widget"></div>
<script>
  window.FeedbackFlow = {
    projectId: 'your-project-id',
    type: 'popup',
    settings: {
      title: 'Share your feedback',
      showRating: true,
      collectEmail: true
    }
  };
</script>
<script src="https://cdn.feedbackflow.com/widget.js"></script>
```

### React Component
```jsx
import { FeedbackWidget } from '@/components/feedback/feedback-widget'

function MyApp() {
  return (
    <FeedbackWidget
      projectId="your-project-id"
      type="embedded"
      settings={{
        title: "How was your experience?",
        showRating: true,
        showNPS: true
      }}
    />
  )
}
```

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Configuration
- **Unit Tests**: Jest + Testing Library
- **E2E Tests**: Playwright
- **API Tests**: Supertest
- **Coverage**: 90%+ target

## 🔧 Configuration

### Environment Variables
See `.env.example` for all available configuration options.

### Database Schema
The application uses Prisma with PostgreSQL. Key models include:
- `User` - User accounts
- `Organization` - Multi-tenant organizations
- `Project` - Feedback collection projects
- `Feedback` - Customer feedback entries
- `FeedbackAnalysis` - AI analysis results

### AI Analysis
Configure OpenAI integration for sentiment analysis:
```env
OPENAI_API_KEY=sk-your-api-key
```

## 📊 Monitoring & Analytics

### Built-in Analytics
- Real-time feedback monitoring
- Sentiment analysis trends
- Topic modeling
- NPS/CSAT/CES scoring
- Custom reporting

### External Integrations
- Google Analytics
- Mixpanel
- Amplitude
- Custom webhooks

## 🚀 Deployment

### Production Checklist
- [ ] Set secure environment variables
- [ ] Configure SSL certificates
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Set up CDN for static assets
- [ ] Configure email service
- [ ] Set up error tracking

### Scaling Considerations
- **Horizontal Scaling**: Multiple app instances behind load balancer
- **Database**: Read replicas for analytics queries
- **Caching**: Redis cluster for high availability
- **File Storage**: S3-compatible storage for uploads
- **CDN**: CloudFront/CloudFlare for global distribution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.feedbackflow.com](https://docs.feedbackflow.com)
- **GitHub Issues**: Report bugs and feature requests
- **Discord**: Join our community
- **Email**: support@feedbackflow.com

## 🗺️ Roadmap

### v1.1 (Next Release)
- [ ] Advanced analytics dashboard
- [ ] Slack/Teams bot integration
- [ ] Video feedback collection
- [ ] Advanced survey builder

### v2.0 (Future)
- [ ] Mobile apps (iOS/Android)
- [ ] Advanced AI insights
- [ ] Multi-language support
- [ ] Enterprise SSO integration

---

Built with ❤️ using the CLAUDE.md methodology for enterprise-grade quality.