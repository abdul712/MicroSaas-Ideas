# Customer Journey Mapper - User Experience Analytics Platform

A comprehensive customer journey mapping platform that visualizes user interactions across all touchpoints, identifies pain points, analyzes conversion paths, and optimizes the entire customer experience.

## 🚀 Features

### Core Functionality
- **Visual Journey Maps**: Create stunning visual representations of customer journeys with drag-and-drop simplicity
- **Real-time Analytics**: Track customer behavior across all touchpoints in real-time
- **Conversion Optimization**: Identify bottlenecks and optimize conversion rates at every stage
- **Customer Segmentation**: Segment customers based on behavior and create personalized experiences
- **AI-Powered Insights**: Get actionable recommendations powered by machine learning
- **Multi-Channel Tracking**: Track interactions across web, mobile, email, social media, and offline channels

### Technical Features
- **High-Performance Analytics**: ClickHouse-powered analytics for processing billions of events
- **Real-time Processing**: Apache Kafka for event streaming and real-time data processing
- **Interactive Visualizations**: D3.js-powered journey visualizations and Sankey diagrams
- **Drag & Drop Builder**: Intuitive journey builder with touchpoint templates
- **Event Tracking SDK**: Lightweight JavaScript SDK for cross-platform event collection
- **Privacy Compliance**: Built-in GDPR and CCPA compliance features

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **D3.js**: Data visualization and interactive charts
- **Zustand**: State management
- **React DnD Kit**: Drag and drop functionality

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **PostgreSQL**: Primary database for structured data
- **ClickHouse**: High-performance analytics database
- **Redis**: Caching and session management
- **Apache Kafka**: Event streaming (production)

### Authentication & Security
- **NextAuth.js**: Authentication system
- **JWT**: Token-based authentication
- **RBAC**: Role-based access control
- **Data encryption**: At rest and in transit

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- ClickHouse (for analytics)
- Redis (for caching)

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd customer-journey-mapper
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Configure the following environment variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/journey_mapper"
CLICKHOUSE_URL="http://localhost:8123"
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Optional: OAuth providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

4. **Set up the database**
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Set up ClickHouse schema
# Run the SQL commands in clickhouse/schema.sql
```

5. **Start the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🎯 Usage

### Setting Up Your First Journey

1. **Create an Organization**: Sign up and create your organization
2. **Install Tracking Code**: Add the JavaScript SDK to your website
3. **Define Journey Stages**: Set up the stages of your customer journey
4. **Map Touchpoints**: Use the drag-and-drop builder to map touchpoints
5. **Set Goals**: Define conversion goals and success metrics
6. **Analyze Results**: View real-time analytics and insights

### JavaScript SDK Usage

```html
<!-- Add to your website -->
<script src="https://your-domain.com/sdk/journey-tracker.js"></script>
<script>
  // Initialize tracking
  JourneyTracker.init({
    apiUrl: 'https://your-domain.com/api',
    organizationId: 'your-org-id',
    apiKey: 'your-api-key',
    debug: true
  });

  // Identify users
  JourneyTracker.identify({
    id: 'user123',
    email: 'user@example.com',
    attributes: {
      plan: 'premium',
      signup_date: '2024-01-01'
    }
  });

  // Track custom events
  JourneyTracker.event('button_clicked', {
    button_text: 'Get Started',
    page: 'homepage'
  });

  // Track conversions
  JourneyTracker.conversion('signup_completed', 0, {
    plan: 'premium'
  });
</script>
```

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Client    │───▶│   Next.js App    │───▶│   PostgreSQL    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Mobile Apps    │───▶│  Event Tracking  │───▶│   ClickHouse    │
└─────────────────┘    │       API        │    │   (Analytics)   │
                       └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Third-party    │───▶│  Apache Kafka    │───▶│  Real-time      │
│  Integrations   │    │  (Event Stream)  │    │  Processing     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Database Schema
- **Organizations**: Multi-tenant organization data
- **Users**: User accounts and authentication
- **Journeys**: Journey definitions and configurations
- **Customers**: Customer profiles and attributes
- **Events**: Raw event data and properties
- **Touchpoints**: Journey touchpoint definitions
- **Insights**: AI-generated insights and recommendations

## 📊 Analytics & Metrics

### Key Performance Indicators
- **Conversion Rate**: Overall journey conversion rate
- **Drop-off Points**: Where customers leave the journey
- **Average Journey Time**: Time to complete the journey
- **Touchpoint Performance**: Effectiveness of each touchpoint
- **Customer Lifetime Value**: Long-term customer value

### Visualization Types
- **Journey Flow**: Interactive node-link diagrams
- **Sankey Diagrams**: Conversion funnel visualization
- **Heatmaps**: Page interaction visualization
- **Time Series**: Trends over time
- **Cohort Analysis**: Customer behavior by cohort

## 🔒 Security & Privacy

### Data Protection
- **Encryption**: All data encrypted at rest and in transit
- **Access Controls**: Role-based permissions system
- **Audit Logging**: Complete audit trail of all actions
- **Data Retention**: Configurable data retention policies

### Privacy Compliance
- **GDPR**: Right to be forgotten, data portability
- **CCPA**: California Consumer Privacy Act compliance
- **Cookie Consent**: Built-in consent management
- **Data Anonymization**: Personal data anonymization

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
```bash
# Set production environment variables
DATABASE_URL="your-production-db-url"
CLICKHOUSE_URL="your-clickhouse-cluster-url"
REDIS_URL="your-redis-cluster-url"
NEXTAUTH_SECRET="your-production-secret"
```

2. **Build the application**
```bash
npm run build
```

3. **Database Migration**
```bash
npm run db:migrate
```

4. **Start production server**
```bash
npm start
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build -d
```

### Cloud Deployment
- **Vercel**: Optimized for Next.js applications
- **AWS**: ECS/EKS with RDS and ElastiCache
- **Google Cloud**: Cloud Run with Cloud SQL
- **Azure**: Container Instances with Azure Database

## 📈 Pricing

### Starter - $79/month
- Up to 10,000 monthly events
- 3 journey maps
- Basic analytics
- Email support
- 30-day data retention

### Growth - $299/month
- Up to 100,000 monthly events
- Unlimited journeys
- Advanced analytics
- Priority support
- 90-day data retention
- API access

### Professional - $799/month
- Up to 1M monthly events
- Custom segments
- Predictive analytics
- Phone support
- 1-year data retention
- White-label options

### Enterprise - Custom pricing
- Unlimited events
- Dedicated infrastructure
- Custom integrations
- Dedicated CSM
- Unlimited retention
- On-premise option

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.customerjourneymapper.com](https://docs.customerjourneymapper.com)
- **Community**: [GitHub Discussions](https://github.com/customer-journey-mapper/community/discussions)
- **Issues**: [GitHub Issues](https://github.com/customer-journey-mapper/issues)
- **Email**: support@customerjourneymapper.com

## 🗺️ Roadmap

### Q1 2024
- [ ] Mobile SDKs (iOS/Android)
- [ ] Advanced segmentation
- [ ] A/B testing integration
- [ ] Slack/Teams notifications

### Q2 2024
- [ ] Machine learning insights
- [ ] Predictive analytics
- [ ] Custom dashboard builder
- [ ] API webhooks

### Q3 2024
- [ ] Multi-language support
- [ ] Advanced integrations
- [ ] Custom reporting
- [ ] Enterprise SSO

### Q4 2024
- [ ] AI-powered recommendations
- [ ] Real-time personalization
- [ ] Advanced attribution modeling
- [ ] White-label solution

---

Built with ❤️ by the Customer Journey Mapper team.