# Lead Magnet Creator

AI-powered lead magnet creation and optimization platform that enables businesses to create high-converting lead magnets with professional design tools, conversion optimization, and seamless integration capabilities.

## 🚀 Features

### Core Features
- **AI Content Generation**: GPT-4 powered content creation for eBooks, checklists, templates, and more
- **Visual Design Editor**: Drag-and-drop interface with professional templates
- **Conversion Optimization**: Built-in A/B testing and analytics
- **Multi-Channel Distribution**: Website, email, social media, and QR code distribution
- **Team Collaboration**: Real-time editing and approval workflows
- **Enterprise Security**: GDPR/CCPA compliance, encryption, and audit logging

### Technical Features
- **Multi-Tenant Architecture**: Complete data isolation between organizations
- **Real-Time Collaboration**: Operational transformation for live editing
- **Advanced Analytics**: Conversion tracking and performance metrics
- **API-First Design**: Comprehensive REST APIs with webhook support
- **Mobile Responsive**: Progressive Web App with offline capabilities

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Fabric.js
- **Backend**: Node.js, Prisma ORM, PostgreSQL, Redis
- **AI/ML**: OpenAI GPT-4, DALL-E 3
- **Infrastructure**: Docker, AWS S3, Cloudflare
- **Authentication**: NextAuth.js with OAuth providers
- **Payments**: Stripe integration
- **Email**: Resend API

## 📦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lead-magnet-creator
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

4. **Set up the database**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Visit the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Setup

### Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose run --rm app npx prisma migrate dev

# View logs
docker-compose logs -f app
```

### Production Deployment

```bash
# Build and deploy
docker-compose -f docker-compose.yml --profile production up -d

# Run migrations
docker-compose -f docker-compose.yml --profile migration up migrate
```

## 📚 API Documentation

### Authentication

All API endpoints require authentication via Bearer token or session cookie.

### Core Endpoints

#### AI Content Generation
```http
POST /api/ai/generate
Content-Type: application/json

{
  "type": "EBOOK",
  "topic": "Digital Marketing Strategy",
  "industry": "Technology",
  "targetAudience": "Small business owners",
  "tone": "professional",
  "contentLength": "medium",
  "includeImages": true
}
```

#### Lead Magnets
```http
# Create lead magnet
POST /api/lead-magnets

# Get lead magnets
GET /api/lead-magnets

# Update lead magnet
PUT /api/lead-magnets/:id

# Delete lead magnet
DELETE /api/lead-magnets/:id
```

#### Analytics
```http
# Get conversion analytics
GET /api/analytics/conversions?period=30d

# Get A/B test results
GET /api/analytics/ab-tests/:id
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
npm run test:watch
npm run test:coverage
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Load Testing
```bash
npm run test:load
```

## 🚀 Deployment

### Environment Variables

#### Required
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NEXTAUTH_SECRET`: Authentication secret
- `OPENAI_API_KEY`: OpenAI API key

#### Optional
- `STRIPE_SECRET_KEY`: For payment processing
- `AWS_*`: For file storage
- `RESEND_API_KEY`: For email notifications

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented
- [ ] CDN configured
- [ ] Rate limiting enabled

## 📊 Monitoring

### Health Checks
- Application: `GET /api/health`
- Database: `GET /api/health/db`
- Redis: `GET /api/health/redis`

### Metrics
- Response time tracking
- Error rate monitoring
- Usage analytics
- Performance metrics

## 🔒 Security

### Data Protection
- End-to-end encryption for sensitive data
- PII anonymization and protection
- GDPR/CCPA compliance built-in
- Regular security audits

### Access Control
- Role-based permissions (RBAC)
- Multi-factor authentication support
- Session management
- Audit logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write comprehensive tests
- Use conventional commits
- Update documentation
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Documentation: [docs.leadmagnetcreator.com](https://docs.leadmagnetcreator.com)
- Issues: [GitHub Issues](https://github.com/your-org/lead-magnet-creator/issues)
- Email: support@leadmagnetcreator.com

## 🗺️ Roadmap

### Q1 2024
- [ ] Advanced template marketplace
- [ ] Video lead magnet support
- [ ] Enhanced analytics dashboard

### Q2 2024
- [ ] White-label solutions
- [ ] Advanced integrations
- [ ] Mobile app release

### Q3 2024
- [ ] AI voice generation
- [ ] Advanced personalization
- [ ] Enterprise SSO

## 🙏 Acknowledgments

- OpenAI for GPT-4 and DALL-E APIs
- Vercel for hosting and deployment
- The open-source community for amazing tools and libraries