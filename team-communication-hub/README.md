# 💬 Team Communication Hub

An enterprise-grade team communication and collaboration platform built with modern web technologies, designed for teams of 5-1000+ members with real-time messaging, file sharing, and advanced collaboration features.

## ✨ Features

### 🚀 Core Communication
- **Real-time Messaging** - Instant messaging with Socket.io WebSockets
- **Channel Organization** - Public, private, and announcement channels
- **Direct Messages** - Private conversations between team members
- **Typing Indicators** - Live typing status and user presence
- **Message Threading** - Organized conversations with reply threads
- **Rich Text Support** - Markdown formatting and emoji reactions

### 👥 Team Management
- **Multi-tenant Architecture** - Isolated team workspaces
- **Role-based Permissions** - Owner, Admin, Member, Guest roles
- **Team Invitations** - Secure email-based invitation system
- **User Presence** - Online, away, busy, offline status
- **Member Directory** - Team member profiles and contact info

### 📁 File & Media Sharing
- **Drag & Drop Upload** - Intuitive file sharing interface
- **Multiple File Types** - Images, documents, videos, audio files
- **File Previews** - In-chat image and document previews
- **Cloud Storage** - S3-compatible storage integration
- **File Search** - Search through uploaded files and media

### 🔒 Enterprise Security
- **End-to-end Encryption** - Secure message transmission
- **OAuth Integration** - Google, GitHub, and custom SSO
- **Audit Logging** - Comprehensive activity tracking
- **GDPR Compliance** - Privacy-first data handling
- **Rate Limiting** - Anti-spam and abuse protection

### 📊 Advanced Features
- **Search Everything** - Full-text search across messages and files
- **Message History** - Unlimited message retention
- **Custom Notifications** - Granular notification preferences
- **Mobile Responsive** - PWA with offline support
- **Dark/Light Theme** - User preference themes
- **Keyboard Shortcuts** - Power user productivity features

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Query** - Server state management
- **Zustand** - Client state management

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Socket.io** - Real-time WebSocket communication
- **NextAuth.js** - Authentication and session management
- **Prisma ORM** - Database ORM and migrations
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage

### Infrastructure
- **Docker** - Containerized deployment
- **Nginx** - Reverse proxy and load balancing
- **MinIO** - S3-compatible file storage
- **Prometheus & Grafana** - Monitoring and metrics
- **ElasticSearch & Kibana** - Log aggregation and analysis

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for development)
- PostgreSQL 15+ (for development)
- Redis 7+ (for development)

### Production Deployment

1. **Clone the repository**
```bash
git clone <repository-url>
cd team-communication-hub
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start with Docker Compose**
```bash
# Full production stack
docker-compose up -d

# With monitoring
docker-compose --profile monitoring up -d

# With logging
docker-compose --profile logging up -d

# With admin tools
docker-compose --profile tools up -d
```

4. **Run database migrations**
```bash
docker-compose exec app npx prisma migrate deploy
```

5. **Access the application**
- Main App: http://localhost:3000
- pgAdmin: http://localhost:5050
- Redis Commander: http://localhost:8081
- Grafana: http://localhost:3001

### Development Setup

1. **Install dependencies**
```bash
npm install
```

2. **Set up database**
```bash
# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

3. **Start development servers**
```bash
# Next.js app (port 3000)
npm run dev

# WebSocket server (port 3001)
npm run websocket:dev
```

## 📁 Project Structure

```
team-communication-hub/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── workspace/      # Team workspace pages
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── ui/            # Base UI components
│   │   ├── workspace/     # Workspace components
│   │   ├── channel/       # Channel components
│   │   └── auth/          # Authentication components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   │   ├── auth.ts        # Authentication config
│   │   ├── prisma.ts      # Database client
│   │   ├── redis.ts       # Redis client
│   │   └── utils.ts       # Utility functions
│   ├── server/            # Server-side code
│   │   └── websocket.ts   # WebSocket server
│   └── types/             # TypeScript type definitions
├── prisma/                # Database schema and migrations
├── docker-compose.yml     # Production deployment
├── Dockerfile            # Application container
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options:

- **Database**: `DATABASE_URL`
- **Redis**: `REDIS_URL`
- **Authentication**: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- **OAuth Providers**: `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`
- **File Storage**: `AWS_ACCESS_KEY_ID`, `AWS_S3_BUCKET`
- **Email**: `SMTP_HOST`, `SMTP_USER`

### OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

## 📊 Monitoring & Observability

### Application Metrics
- Response time and throughput
- WebSocket connection health
- Database query performance
- Redis cache hit rates

### Business Metrics
- Active users and teams
- Message volume and patterns
- File upload statistics
- Authentication success rates

### Health Checks
- `/api/health` - Application health
- `/api/health/db` - Database connectivity
- `/api/health/redis` - Redis connectivity

## 🔒 Security

### Data Protection
- Passwords hashed with bcrypt
- JWTs for session management
- HTTPS enforced in production
- CORS properly configured

### Privacy
- GDPR-compliant data handling
- User data export/deletion
- Audit trail for all actions
- Configurable data retention

### Rate Limiting
- API endpoints: 100 requests/minute
- Message sending: 30 messages/minute
- File uploads: 10 files/minute

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚀 Deployment

### Production Checklist
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure OAuth providers
- [ ] Set up SSL certificates
- [ ] Configure email service
- [ ] Set up file storage
- [ ] Configure monitoring
- [ ] Set up backups
- [ ] Configure log rotation
- [ ] Test disaster recovery

### Scaling Considerations
- Horizontal scaling with multiple app instances
- Database read replicas for high read workloads
- Redis clustering for high availability
- CDN for static asset delivery
- Load balancer for traffic distribution

## 📈 Performance

### Optimization Features
- Server-side rendering with Next.js
- Component code splitting
- Image optimization
- Database query optimization
- Redis caching layers
- CDN asset delivery

### Performance Targets
- Page load time: <2 seconds
- Message delivery: <100ms
- File upload: <5 seconds for 25MB
- 99.9% uptime availability
- Support for 1000+ concurrent users

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Development Guide](docs/development.md)

### Getting Help
- Check existing GitHub issues
- Create a new issue with detailed description
- Join our community discussions

---

**Built with ❤️ for modern teams**

*Team Communication Hub - Where collaboration happens*