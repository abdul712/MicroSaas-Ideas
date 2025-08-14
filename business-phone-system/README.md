# Business Phone System - Cloud Communication Platform

A comprehensive cloud-based business phone system with VoIP capabilities, call management, team collaboration, and analytics for modern remote and hybrid workforces.

## 🌟 Features

### Core Communication
- **VoIP Calling**: Browser-based calling with WebRTC technology
- **Video Conferencing**: HD video calls with screen sharing
- **Call Management**: Call forwarding, transfer, hold, and recording
- **Voicemail System**: Voice-to-text transcription and email notifications
- **Auto-Attendant**: Intelligent call routing and IVR system

### Team Collaboration
- **Real-time Messaging**: Team chat and presence indicators
- **Conference Calling**: Multi-party conference rooms
- **Screen Sharing**: Collaborate with live screen sharing
- **File Sharing**: Share documents and media during calls
- **Team Directory**: Centralized contact management

### Business Features
- **Multi-tenancy**: Support for multiple organizations
- **Extension Management**: Flexible extension assignment and routing
- **Call Analytics**: Comprehensive reporting and insights
- **CRM Integration**: Connect with popular CRM systems
- **Mobile Apps**: Native iOS and Android applications

### Enterprise Security
- **End-to-end Encryption**: Secure call and message encryption
- **HIPAA Compliance**: Healthcare industry compliance
- **Role-based Access**: Granular permission management
- **Audit Logging**: Complete activity tracking
- **SOC 2 Compliance**: Enterprise security standards

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Environment Variables
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/business_phone_system"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# VoIP Services
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"

# Payments
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"

# Redis
REDIS_URL="redis://localhost:6379"
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd business-phone-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Using Docker

1. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**
   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

## 📱 Architecture

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Real-time**: Socket.io, WebRTC, Simple Peer
- **Authentication**: NextAuth.js with JWT
- **VoIP**: Twilio Voice API, WebRTC
- **Payments**: Stripe
- **Deployment**: Docker, NGINX, Redis

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Apps    │    │  Desktop Apps   │
│   (WebRTC)      │    │   (Native)      │    │    (Electron)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────────┐
         │                Load Balancer                        │
         │                   (NGINX)                          │
         └─────────────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────────┐
         │              Next.js Application                    │
         │         ┌─────────────┐  ┌─────────────┐           │
         │         │   Web UI    │  │  API Routes │           │
         │         │             │  │             │           │
         │         └─────────────┘  └─────────────┘           │
         └─────────────────────────────────────────────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │                            │                            │
┌───▼────┐              ┌────────▼────────┐          ┌───────▼──────┐
│ Redis  │              │   PostgreSQL    │          │ Twilio API   │
│(Cache) │              │   (Database)    │          │   (VoIP)     │
└────────┘              └─────────────────┘          └──────────────┘
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations

### Database Schema
The application uses PostgreSQL with the following main entities:
- **Users**: System users and authentication
- **Organizations**: Multi-tenant organization support
- **Extensions**: Phone extensions and routing
- **Calls**: Call history and metadata
- **Teams**: Team organization and collaboration
- **Voicemails**: Voicemail storage and transcription

### WebRTC Implementation
The system uses WebRTC for peer-to-peer communication:
- **Signaling Server**: Socket.io-based signaling for call setup
- **STUN/TURN Servers**: NAT traversal and relay services
- **Media Handling**: Audio/video stream management
- **Call States**: Comprehensive call state management

## 📊 API Reference

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Call Management
- `POST /api/calls/initiate` - Start a new call
- `GET /api/calls/history` - Get call history
- `POST /api/calls/recording` - Start/stop call recording

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/extensions` - Get user extensions

### Analytics
- `GET /api/analytics/calls` - Call analytics
- `GET /api/analytics/usage` - Usage statistics

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication with secure token management
- Role-based access control (RBAC)
- Multi-factor authentication support
- Session management and automatic logout

### Data Protection
- End-to-end encryption for voice and video calls
- Encrypted data storage
- GDPR compliance features
- Regular security audits

### Infrastructure Security
- Docker containerization
- HTTPS/TLS encryption
- Security headers and CSP
- Rate limiting and DDoS protection

## 📈 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export DATABASE_URL="postgresql://..."
   export NEXTAUTH_SECRET="..."
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

### Scaling Considerations
- **Load Balancing**: NGINX for request distribution
- **Database Scaling**: Read replicas and connection pooling
- **Cache Layer**: Redis for session and data caching
- **CDN**: Asset delivery optimization
- **Monitoring**: Prometheus and Grafana integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.businessphonesystem.com](https://docs.businessphonesystem.com)
- **Community**: [Discord Server](https://discord.gg/businessphone)
- **Issues**: [GitHub Issues](https://github.com/your-org/business-phone-system/issues)
- **Email**: support@businessphonesystem.com

## 🗺️ Roadmap

### Phase 1 (Current) - Foundation ✅
- [x] Basic VoIP calling infrastructure
- [x] User authentication and authorization
- [x] Database schema and API endpoints
- [x] WebRTC implementation
- [x] Docker deployment setup

### Phase 2 - Core Features (In Progress)
- [ ] Call management (transfer, hold, forward)
- [ ] Voicemail system with transcription
- [ ] Auto-attendant and IVR
- [ ] Team collaboration features
- [ ] Mobile applications

### Phase 3 - Advanced Features
- [ ] CRM integrations
- [ ] Advanced analytics and reporting
- [ ] Video conferencing
- [ ] Screen sharing
- [ ] Call center features

### Phase 4 - Enterprise Features
- [ ] HIPAA compliance
- [ ] Advanced security features
- [ ] Multi-region deployment
- [ ] Enterprise integrations
- [ ] White-label solutions

---

Built with ❤️ for modern businesses seeking reliable communication solutions.