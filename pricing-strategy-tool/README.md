# Pricing Strategy Tool - AI-Powered Price Optimization Platform

A comprehensive pricing strategy platform that helps businesses optimize their pricing using competitor analysis, market data, psychological pricing principles, and A/B testing with revenue impact predictions.

## 🎯 Features

### Core Functionality
- **AI-Powered Price Optimization**: Machine learning algorithms for optimal pricing recommendations
- **Competitor Intelligence**: Automated 24/7 competitor price monitoring
- **A/B Testing Framework**: Statistical testing for pricing strategies
- **Dynamic Pricing Rules**: Automated price adjustments based on business logic
- **Revenue Impact Modeling**: Predict financial outcomes of pricing decisions
- **Real-time Analytics**: Comprehensive pricing performance dashboards

### Business Features
- **Multi-tenancy Architecture**: Support for multiple businesses
- **Subscription Management**: Tiered pricing plans with trial periods
- **Integration Support**: Connect with e-commerce platforms and marketplaces
- **Team Collaboration**: User management and permission controls
- **API Access**: RESTful APIs for custom integrations

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Modern UI components
- **Recharts**: Data visualization
- **TanStack Table**: Advanced data tables
- **React Hook Form + Zod**: Form handling with validation

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **tRPC**: Type-safe API layer
- **PostgreSQL**: Primary database with Prisma ORM
- **Redis**: Caching and session storage
- **NextAuth.js**: Authentication system

### Infrastructure
- **Docker**: Containerization
- **TimescaleDB**: Time-series data for analytics
- **BullMQ**: Job queue for background tasks
- **Playwright**: Web scraping for competitor data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL database
- Redis instance

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pricing-strategy-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/pricing_strategy"
   REDIS_URL="redis://localhost:6379"
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Start services with Docker**
   ```bash
   docker-compose up -d
   ```

5. **Set up the database**
   ```bash
   npm run db:push
   npm run db:generate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The application uses a comprehensive PostgreSQL schema with the following key entities:

- **Users & Authentication**: User accounts with role-based access
- **Companies**: Multi-tenant business profiles
- **Products**: Product catalog with pricing history
- **Competitors**: Competitor tracking and monitoring
- **Price History**: Time-series pricing data
- **Recommendations**: AI-generated pricing suggestions
- **A/B Tests**: Pricing experiments and results
- **Pricing Rules**: Automated pricing logic

## 🎨 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   └── landing/          # Landing page components
├── lib/                  # Utility libraries
│   ├── auth.ts           # Authentication configuration
│   ├── prisma.ts         # Database client
│   ├── redis.ts          # Caching layer
│   └── utils.ts          # Helper functions
├── server/               # tRPC server
│   ├── routers/          # API route handlers
│   ├── context.ts        # Request context
│   └── trpc.ts           # tRPC configuration
├── hooks/                # React hooks
└── types/                # TypeScript definitions
```

## 🔒 Security Features

- **Authentication**: NextAuth.js with multiple providers
- **Authorization**: Role-based access control
- **Data Protection**: Encrypted sensitive data
- **Rate Limiting**: API and scraping rate limits
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM protection

## 📈 Pricing Plans

### Starter ($79/month)
- Up to 100 products
- 5 competitors tracked
- Daily price updates
- Basic recommendations
- Email alerts

### Growth ($299/month)
- Up to 1,000 products
- 20 competitors tracked
- Hourly updates
- AI recommendations
- API access
- A/B testing

### Scale ($799/month)
- Up to 10,000 products
- Unlimited competitors
- Real-time updates
- Advanced ML features
- Custom rules engine
- Dedicated support

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📦 Deployment

### Docker Production Build
```bash
# Build production image
docker build -t pricing-strategy-tool .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Setup
1. Configure production environment variables
2. Set up SSL certificates
3. Configure domain and DNS
4. Set up monitoring and logging
5. Configure backup procedures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact:
- Email: support@pricingstrategy.com
- Documentation: [docs.pricingstrategy.com](https://docs.pricingstrategy.com)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Core pricing optimization
- [x] Basic competitor monitoring
- [x] User authentication and management
- [x] Dashboard and analytics

### Phase 2 (Next)
- [ ] Advanced ML algorithms
- [ ] E-commerce platform integrations
- [ ] Mobile application
- [ ] Advanced A/B testing

### Phase 3 (Future)
- [ ] White-label solutions
- [ ] Enterprise features
- [ ] API marketplace
- [ ] Advanced analytics and reporting

---

Built with ❤️ for modern businesses who want to optimize their pricing strategies.