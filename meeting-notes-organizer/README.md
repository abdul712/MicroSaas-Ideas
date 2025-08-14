# Meeting Notes Organizer - AI-Powered Meeting Management Platform

A comprehensive meeting management platform that automatically transcribes meetings, organizes notes, extracts action items, tracks decisions, and integrates with calendar and project management tools.

## 🚀 Features

### Core Features
- **AI-Powered Transcription**: Real-time transcription using OpenAI Whisper with 90%+ accuracy
- **Smart Organization**: Automatically extract action items, decisions, and key topics
- **Real-time Collaboration**: Live collaborative note editing with TipTap editor
- **Meeting Recording**: High-quality audio recording with speaker identification
- **Calendar Integration**: Seamless integration with Google Calendar and Outlook
- **Analytics Dashboard**: Track meeting productivity and action item completion

### AI Capabilities
- Automatic action item extraction
- Decision tracking and highlighting
- Key topic identification
- Meeting summary generation
- Speaker identification and diarization
- Multi-language transcription support

### Collaboration Features
- Real-time collaborative editing
- Comment and annotation system
- Team workspaces
- Role-based access control
- Version history tracking

## 🛠️ Technology Stack

### Frontend
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **TipTap** for rich text editing
- **Radix UI** for accessible components
- **Zustand** for state management

### Backend
- **Next.js API Routes** for serverless functions
- **PostgreSQL** with Prisma ORM
- **NextAuth.js** for authentication
- **OpenAI APIs** (Whisper, GPT-4) for AI features
- **WebSocket** for real-time collaboration

### Infrastructure
- **Docker** for containerization
- **Redis** for caching and job queues
- **AWS S3** for file storage
- **Elasticsearch** for search functionality

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Services   │
│                 │    │                 │    │                 │
│ • Next.js App   │────│ • API Routes    │────│ • OpenAI GPT-4  │
│ • TipTap Editor │    │ • Prisma ORM    │    │ • Whisper API   │
│ • Real-time UI  │    │ • NextAuth      │    │ • Custom NLP    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Database      │              │
         │              │                 │              │
         └──────────────│ • PostgreSQL    │──────────────┘
                        │ • Redis Cache   │
                        │ • Elasticsearch │
                        └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- OpenAI API key
- Google OAuth credentials (optional)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd meeting-notes-organizer
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/meeting_notes_organizer"
NEXTAUTH_SECRET="your-secret-key"
OPENAI_API_KEY="your-openai-api-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🐳 Docker Deployment

### Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Production Build

```bash
# Build the Docker image
docker build -t meeting-notes-organizer .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-production-db-url" \
  -e OPENAI_API_KEY="your-openai-key" \
  meeting-notes-organizer
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage Goals
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+
- **Statements**: 80%+

## 📁 Project Structure

```
meeting-notes-organizer/
├── prisma/                 # Database schema and migrations
│   └── schema.prisma
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── api/           # API routes
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Dashboard pages
│   │   └── meeting/       # Meeting pages
│   ├── components/        # Reusable UI components
│   │   ├── notes/         # Note-related components
│   │   ├── ui/           # Base UI components
│   │   └── meeting-provider.tsx
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   │   ├── auth.ts       # Authentication configuration
│   │   ├── prisma.ts     # Database client
│   │   └── utils.ts      # Utility functions
│   ├── services/         # Business logic services
│   │   └── transcription.ts
│   └── types/            # TypeScript type definitions
├── docker-compose.yml     # Development environment
├── Dockerfile            # Production container
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | NextAuth secret key | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for AI features | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ❌ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ❌ |
| `REDIS_URL` | Redis connection string | ❌ |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | ❌ |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3 | ❌ |
| `AWS_S3_BUCKET` | S3 bucket for file storage | ❌ |

### Database Schema

The application uses the following main entities:
- **Users**: Authentication and user management
- **Workspaces**: Team organization
- **Meetings**: Meeting metadata and AI insights
- **Notes**: Rich text meeting notes
- **ActionItems**: Extracted and manual action items
- **Recordings**: Audio recordings and transcriptions
- **Analytics**: Usage and productivity metrics

## 🤖 AI Features

### Transcription Service
- **Model**: OpenAI Whisper
- **Languages**: 50+ languages supported
- **Accuracy**: 90%+ for clear audio
- **Features**: Speaker identification, confidence scoring

### Content Analysis
- **Action Item Extraction**: GPT-4 powered analysis
- **Decision Tracking**: Automatic decision identification
- **Topic Extraction**: Key theme identification
- **Summary Generation**: Concise meeting summaries

## 📊 Analytics & Monitoring

### Built-in Analytics
- Meeting duration and frequency
- Action item completion rates
- User engagement metrics
- Transcription accuracy scores

### Monitoring Integration
- Application performance monitoring
- Error tracking and alerting
- Usage analytics
- Custom dashboards

## 🔐 Security

### Authentication
- NextAuth.js with multiple providers
- JWT token management
- Session security
- Role-based access control

### Data Protection
- Encryption at rest and in transit
- GDPR compliance features
- Secure file storage
- Audit logging

## 🚀 Deployment Options

### Cloud Platforms
- **Vercel**: Recommended for Next.js applications
- **AWS**: ECS, Lambda, or EC2 deployment
- **Google Cloud**: Cloud Run or GKE
- **Digital Ocean**: App Platform or Droplets

### Self-Hosted
- Docker Compose for single-server deployment
- Kubernetes for scalable deployment
- Reverse proxy with Nginx
- SSL certificate management

## 📈 Performance Optimization

### Frontend Optimization
- Code splitting and lazy loading
- Image optimization
- Bundle size monitoring
- Performance metrics tracking

### Backend Optimization
- Database query optimization
- Caching strategies with Redis
- API rate limiting
- Background job processing

## 🔄 API Documentation

### REST Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

#### Meetings
- `GET /api/meetings` - List meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/[id]` - Get meeting details
- `PUT /api/meetings/[id]` - Update meeting
- `DELETE /api/meetings/[id]` - Delete meeting

#### Transcription
- `POST /api/transcription` - Upload and transcribe audio
- `GET /api/transcription/[id]` - Get transcription result

#### Notes
- `GET /api/notes` - List notes
- `POST /api/notes` - Create note
- `PUT /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Ensure PostgreSQL is running
   - Verify network connectivity

2. **AI Features Not Working**
   - Verify OPENAI_API_KEY is set
   - Check API quota and limits
   - Ensure internet connectivity

3. **File Upload Issues**
   - Check file size limits
   - Verify storage configuration
   - Review CORS settings

### Debug Mode

Enable debug logging:

```bash
DEBUG=* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Development Guidelines
- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write comprehensive tests
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenAI** for Whisper and GPT-4 APIs
- **Vercel** for Next.js framework
- **Prisma** for database ORM
- **TipTap** for collaborative editing
- **Tailwind CSS** for styling system

## 📞 Support

- **Documentation**: [Project Wiki](https://github.com/your-org/meeting-notes-organizer/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/meeting-notes-organizer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/meeting-notes-organizer/discussions)

---

**Built with ❤️ for productive meetings**