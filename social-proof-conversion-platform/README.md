# Social Proof Widget - Conversion Optimization Platform

A comprehensive social proof platform that displays real-time customer activity, reviews, testimonials, and social signals to increase website conversions through psychological triggers and social validation.

## 🚀 Features

- **Real-time Notifications**: Show live customer activity, purchases, and signups
- **Smart Targeting**: Display notifications based on visitor location, device, and behavior
- **Advanced Analytics**: Track conversion impact and ROI with detailed performance metrics
- **Mobile Optimized**: Perfect display on all devices with responsive design
- **Easy Integration**: Connect with Shopify, WooCommerce, and 20+ platforms
- **Privacy First**: GDPR compliant with anonymous tracking and consent management

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS + CSS-in-JS for widget themes
- **State Management**: Zustand for dashboard state
- **Real-time**: WebSocket client for live notifications
- **Testing**: Jest + React Testing Library

### Backend
- **API**: Next.js API routes + Express.js for WebSocket server
- **Database**: PostgreSQL (primary), Redis (real-time), ClickHouse (analytics)
- **ORM**: Prisma with PostgreSQL
- **Authentication**: NextAuth.js with JWT + OAuth 2.0
- **Real-time**: Socket.io for WebSocket connections
- **Queue**: BullMQ with Redis

### Widget Engine
- **Core**: Vanilla JavaScript (< 20KB gzipped)
- **Compatibility**: Cross-browser support (IE11+)
- **Performance**: Lazy loading with IntersectionObserver
- **Animations**: CSS animations with fallbacks

## 📋 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL, Redis, and ClickHouse (or use Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/social-proof-conversion-platform.git
   cd social-proof-conversion-platform
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

4. **Start the development environment**
   ```bash
   # Start databases with Docker
   docker-compose up -d postgres redis clickhouse
   
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Start the development server
   npm run dev
   ```

5. **Build the widget**
   ```bash
   npm run widget:build
   ```

The application will be available at `http://localhost:3000`.

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── widget/        # Widget API endpoints
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # UI components
│   └── dashboard/        # Dashboard components
├── lib/                  # Utilities and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Database client
│   ├── redis.ts          # Redis client
│   └── websocket-server.ts # WebSocket server
├── hooks/                # React hooks
├── types/                # TypeScript type definitions
└── store/                # State management

widget/
├── src/
│   ├── index.ts          # Widget entry point
│   └── styles.css        # Widget styles
└── webpack.config.js     # Widget build configuration

prisma/
└── schema.prisma         # Database schema
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/socialproof"

# Redis
REDIS_URL="redis://localhost:6379"

# ClickHouse (Analytics)
CLICKHOUSE_URL="http://localhost:8123"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Widget Installation

To install the widget on a website, add this code before the closing `</body>` tag:

```html
<script>
  window.socialProofConfig = {
    apiKey: 'sp_your_api_key_here',
    position: 'bottom-left',
    theme: 'auto',
    displayDuration: 5000
  };
</script>
<script src="https://cdn.socialproof.com/widget/v1/social-proof-widget.min.js"></script>
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e
```

## 🚀 Deployment

### Using Docker

```bash
# Build production image
docker build -t social-proof-platform .

# Run with Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Using Vercel

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 📊 Analytics

The platform includes comprehensive analytics powered by ClickHouse:

- **Real-time Metrics**: Live visitor counts, conversion rates
- **Conversion Funnel**: Track user journey and drop-off points
- **A/B Testing**: Compare widget variants and performance
- **Revenue Attribution**: Track revenue impact of social proof

## 🔒 Security

- **Authentication**: NextAuth.js with JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encryption at rest and in transit
- **Privacy Compliance**: GDPR/CCPA features built-in
- **Rate Limiting**: API protection against abuse

## 🔌 Integrations

### E-commerce Platforms
- Shopify
- WooCommerce
- BigCommerce
- Magento

### Payment Processors
- Stripe
- PayPal
- Square

### Marketing Tools
- Mailchimp
- Klaviyo
- HubSpot
- Salesforce

### Analytics
- Google Analytics
- Mixpanel
- Segment

## 🎯 Performance

- **Widget Size**: < 20KB gzipped
- **Load Time**: < 500ms without impacting site speed
- **CDN**: Global edge distribution
- **Caching**: Redis-powered caching strategy
- **Database**: Optimized queries with proper indexing

## 📈 Success Metrics

- **Technical**: 99.9% uptime, < 50ms load impact
- **Business**: 15% average conversion increase
- **Scale**: Handles 10,000+ concurrent connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [https://docs.socialproof.com](https://docs.socialproof.com)
- **Support Email**: support@socialproof.com
- **Discord Community**: [Join our Discord](https://discord.gg/socialproof)

## 🗺 Roadmap

- [ ] Advanced AI-powered personalization
- [ ] Multi-language support
- [ ] White-label solution for agencies
- [ ] Advanced A/B testing with statistical significance
- [ ] Integration marketplace
- [ ] Mobile SDK for native apps

---

Built with ❤️ by the SocialProof team