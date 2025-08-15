# EventPro - Local Event Promotion Platform

A comprehensive local event promotion platform that helps event organizers create, promote, and manage local events with social media integration, ticket sales, and community engagement features.

## 🎯 Features

- **Event Creation & Management**: Intuitive event creation wizard with templates
- **Multi-Platform Distribution**: Automatically post to Facebook, Instagram, Google My Business, and 50+ local directories
- **Advanced Analytics**: Track performance across all platforms with real-time analytics
- **Marketing Automation**: AI-powered social media content generation and optimal posting times
- **Secure Payment Processing**: Stripe integration for ticket sales and subscriptions
- **Local SEO Optimization**: Boost local discovery with location-based keywords and Google Events integration

## 🚀 Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with PostGIS for location data
- **Authentication**: NextAuth.js with multiple providers
- **Payment Processing**: Stripe for subscriptions and ticket sales
- **File Storage**: AWS S3 with CloudFront CDN
- **Caching**: Redis for session management and caching
- **Email**: SendGrid for transactional emails
- **Deployment**: Docker containers with Kubernetes support

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL 14+ with PostGIS extension
- Redis 6+

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd local-event-promotion-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the `.env.local` file with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://eventpro:eventpro_password@localhost:5432/eventpro?schema=public"
   
   # Authentication
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # Social Auth (Optional for development)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Stripe (Use test keys for development)
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   
   # AWS S3 (Optional for development)
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_S3_BUCKET="eventpro-uploads"
   ```

4. **Start with Docker Compose**
   ```bash
   # Start all services (PostgreSQL, Redis, MinIO for local S3)
   docker-compose up -d postgres redis minio mailhog
   
   # Wait for services to be ready
   sleep 10
   ```

5. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # Seed the database with initial data
   npx prisma db seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at:
   - **Main App**: http://localhost:3000
   - **MailHog (Email Testing)**: http://localhost:8025
   - **MinIO Console (S3 Testing)**: http://localhost:9001

### Docker Development Setup (Alternative)

```bash
# Start all services including the app
docker-compose up -d

# Check logs
docker-compose logs -f app
```

## 🛠️ Development

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma db reset

# Deploy schema changes
npx prisma db push

# Generate migration
npx prisma migrate dev --name your-migration-name
```

### Code Quality

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📊 Project Structure

```
local-event-promotion-tool/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                # API routes
│   │   ├── auth/               # Authentication pages
│   │   ├── dashboard/          # Dashboard pages
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── auth/               # Authentication components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── events/             # Event components
│   │   ├── landing/            # Landing page components
│   │   └── ui/                 # Reusable UI components
│   ├── lib/                    # Utility libraries
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Database client
│   │   ├── stripe.ts          # Stripe integration
│   │   ├── s3.ts              # AWS S3 integration
│   │   └── utils.ts           # Helper functions
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript type definitions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts               # Database seeding
├── docker/                    # Docker configuration
├── public/                    # Static assets
└── Configuration files
```

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available environment variables.

#### Required for Basic Functionality
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - NextAuth secret key

#### Optional for Full Functionality
- Social authentication provider credentials
- Stripe API keys for payments
- AWS credentials for file storage
- SendGrid API key for emails
- Google Maps API key for location features

### Social Media Integration

To enable social media posting features:

1. **Facebook/Instagram**:
   - Create a Facebook App
   - Add Facebook Login and Instagram Basic Display products
   - Configure required permissions

2. **Google My Business**:
   - Set up Google My Business API
   - Configure OAuth 2.0 credentials

3. **Twitter/LinkedIn**:
   - Create developer accounts and apps
   - Obtain API keys and configure OAuth

## 🚀 Deployment

### Production Deployment with Docker

1. **Build production image**
   ```bash
   docker build -t eventpro:latest .
   ```

2. **Deploy with Docker Compose**
   ```bash
   # Use production profile
   docker-compose --profile production up -d
   ```

### Cloud Deployment

#### AWS/Vercel/Railway

1. **Set up production database** (PostgreSQL with PostGIS)
2. **Configure environment variables**
3. **Set up S3 bucket for file storage**
4. **Configure CDN (CloudFront)**
5. **Set up monitoring and logging**

#### Environment-specific considerations

- **Development**: Use local MinIO for S3, MailHog for emails
- **Staging**: Use cloud services with test credentials
- **Production**: Full cloud infrastructure with monitoring

## 📈 Monitoring and Analytics

### Built-in Analytics
- Event performance tracking
- User engagement metrics
- Revenue and conversion analytics
- Social media reach and engagement

### External Monitoring (Optional)
- Prometheus + Grafana for infrastructure monitoring
- Sentry for error tracking
- PostHog for product analytics

## 🔒 Security

### Security Features
- NextAuth.js for secure authentication
- Stripe for PCI-compliant payment processing
- CSRF protection
- Rate limiting
- Input validation and sanitization
- Secure headers configuration

### Security Best Practices
- Environment variables for sensitive data
- Database query parameterization
- File upload validation
- HTTPS enforcement in production
- Regular security audits

## 🧪 Testing

### Test Types
- Unit tests with Jest
- Integration tests for API endpoints
- E2E tests with Playwright
- Security testing

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📚 API Documentation

API documentation is automatically generated and available at `/api/docs` when running in development mode.

### Key API Endpoints

- `/api/auth/*` - Authentication endpoints
- `/api/events/*` - Event management
- `/api/organizations/*` - Organization management
- `/api/stripe/*` - Payment processing
- `/api/upload/*` - File upload handling
- `/api/social/*` - Social media integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure they pass
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Documentation: [Coming Soon]
- Issues: GitHub Issues
- Discussions: GitHub Discussions

## 🗺️ Roadmap

### Phase 1 (Current) - Core Platform
- ✅ Authentication and user management
- ✅ Database architecture and setup
- ✅ Payment processing integration
- ✅ File storage configuration
- 🚧 Event creation and management
- 🚧 Basic social media integration

### Phase 2 - Enhanced Features
- Advanced analytics dashboard
- Multi-platform social media automation
- Local SEO optimization tools
- Email marketing integration
- Mobile responsive design

### Phase 3 - Scale and Optimize
- API rate limiting and optimization
- Advanced caching strategies
- Multi-tenant architecture
- Enterprise features
- Mobile app development

## 🏆 Credits

Built with ❤️ using modern web technologies and best practices for local event promotion.

---

For more information, visit our [documentation](coming-soon) or contact our [support team](coming-soon).