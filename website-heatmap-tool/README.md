# Website Heatmap Tool - Complete MicroSaaS

A comprehensive website heatmap and user behavior analytics platform built with Next.js 14, providing real-time user interaction tracking, heatmap generation, and conversion optimization insights.

## 🚀 Features

### Core Analytics
- **Click Heatmaps**: Visual representation of where users click most
- **Mouse Movement Tracking**: Track user cursor movements and attention patterns
- **Scroll Depth Analysis**: Monitor how far users scroll on pages
- **Session Recordings**: Watch real user sessions (privacy-compliant)
- **Real-time Analytics**: Live visitor tracking and metrics

### Privacy & Compliance
- **GDPR Compliant**: Built-in privacy controls and data anonymization
- **Cookie Consent**: Integrated consent management
- **Data Retention Policies**: Configurable data retention periods
- **Sensitive Data Filtering**: Automatic removal of PII

### Advanced Features
- **A/B Testing Integration**: Compare variations and measure impact
- **Conversion Funnels**: Track user journeys and identify drop-off points
- **Custom Events**: Track specific user interactions
- **Team Collaboration**: Share insights across team members
- **API Access**: Comprehensive REST API for integrations

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** for components
- **Canvas API** for heatmap rendering

### Backend
- **Next.js API Routes** for serverless functions
- **PostgreSQL** for primary data storage
- **Redis** for caching and real-time features
- **Prisma** as ORM
- **ClickHouse** for analytics data (optional)

### Infrastructure
- **Docker** for containerization
- **WebSocket** for real-time updates
- **CDN** for tracking script delivery
- **Rate limiting** for API protection

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Tracking Script │───▶│   API Gateway   │───▶│   Data Pipeline │
│   (< 50KB)       │    │  (Rate Limited) │    │  (Real-time)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard UI  │◀───│  Next.js App    │───▶│   Database      │
│  (React/Canvas) │    │   (App Router)  │    │ (PostgreSQL)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▼
                       ┌─────────────────┐
                       │  Redis Cache    │
                       │  (Real-time)    │
                       └─────────────────┘
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd website-heatmap-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/heatmap_analytics"
   REDIS_URL="redis://localhost:6379"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Using Docker

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**
   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

The application will be available at `http://localhost:3000`.

## 📊 Usage

### Adding a Website

1. Sign up and log into the dashboard
2. Click "Add Website" 
3. Enter your domain and website name
4. Copy the tracking code
5. Add the tracking code to your website

### Tracking Code Installation

Add this script to your website's `<head>` section:

```html
<script
  src="https://your-domain.com/tracking/heatmap-tracker.js"
  data-tracking-id="your-tracking-id"
  data-privacy-mode="false"
  async
></script>
```

### API Usage

The platform provides a comprehensive REST API:

```javascript
// Get click heatmap data
const response = await fetch('/api/heatmaps/clicks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    websiteId: 'your-website-id',
    url: '/your-page',
    dateRange: { from: '2024-01-01', to: '2024-01-31' }
  })
});
```

## 🔧 Configuration

### Privacy Settings

```javascript
// Initialize with privacy mode
window.HeatMapAnalytics.init({
  trackingId: 'your-id',
  privacyMode: true,
  anonymizeIPs: true,
  respectDoNotTrack: true
});
```

### Custom Events

```javascript
// Track custom events
window.HeatMapAnalytics.track('button_click', {
  button_name: 'signup',
  location: 'header'
});
```

## 📈 Performance

### Tracking Script
- **Size**: < 50KB gzipped
- **Load Impact**: < 50ms on page load
- **Data Collection**: Batched and throttled

### Dashboard
- **Load Time**: < 3 seconds
- **Real-time Updates**: WebSocket-based
- **Data Processing**: Optimized with Redis caching

## 🔒 Security

### Data Protection
- All data encrypted in transit (TLS 1.3)
- Database encryption at rest
- IP address hashing for privacy
- Automatic PII detection and removal

### API Security
- Rate limiting (100 requests/minute)
- CORS protection
- Input validation and sanitization
- SQL injection prevention

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📦 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```bash
docker build -t heatmap-analytics .
docker run -p 3000:3000 heatmap-analytics
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Yes |
| `NEXTAUTH_URL` | Application base URL | Yes |

## 📊 Monitoring

### Health Checks
- `/api/health` - Application health
- `/api/health/db` - Database connectivity
- `/api/health/redis` - Redis connectivity

### Metrics
- Real-time visitor counts
- API response times
- Database query performance
- Error rates and alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Full API Documentation](docs/api.md)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discord**: [Community Discord](https://discord.gg/your-server)

## 🗺️ Roadmap

- [ ] Mobile app for iOS/Android
- [ ] Advanced ML-powered insights
- [ ] White-label solutions
- [ ] Advanced A/B testing features
- [ ] Enterprise SSO integration

---

Built with ❤️ for better user experience analytics.