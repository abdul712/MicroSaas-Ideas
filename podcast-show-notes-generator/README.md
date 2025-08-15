# PodcastNotes AI - Podcast Show Notes Generator

Transform your podcast audio into comprehensive, SEO-optimized show notes in minutes with AI-powered transcription and content generation.

## 🎯 Overview

PodcastNotes AI is a complete MicroSaaS solution that helps podcasters create professional show notes automatically. Using advanced AI transcription and content generation, it saves 3+ hours per episode while improving SEO and audience engagement.

### Key Features

- **AI-Powered Transcription**: 95%+ accuracy with OpenAI Whisper and AssemblyAI
- **Smart Show Notes**: Auto-generated summaries, timestamps, quotes, and resources
- **SEO Optimization**: Built-in keyword research and content optimization
- **Social Media Ready**: Platform-specific content for Twitter, LinkedIn, Instagram
- **Multiple Export Formats**: Markdown, HTML, PDF, and direct publishing
- **Team Collaboration**: Multi-user workflows with review and approval
- **Platform Integrations**: Connect with Spotify, WordPress, Buffer, and more

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key
- AssemblyAI API key (optional)

### Installation

1. **Clone and setup**
   ```bash
   cd podcast-show-notes-generator
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="your-secret"
   OPENAI_API_KEY="sk-..."
   ASSEMBLYAI_API_KEY="..."
   GITHUB_CLIENT_ID="..."
   GITHUB_CLIENT_SECRET="..."
   ```

3. **Database Setup**
   ```bash
   npm run db:push
   npm run db:generate
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS + Radix UI
- TanStack Query for state management
- NextAuth.js for authentication

**Backend:**
- Next.js API routes
- Prisma with PostgreSQL
- OpenAI API (Whisper + GPT-4)
- AssemblyAI API
- Vercel Blob for file storage

**Infrastructure:**
- Vercel deployment
- PlanetScale/Supabase database
- Upstash Redis for queuing
- Cloudflare CDN

### Database Schema

Key models:
- **User**: Authentication and subscription management
- **Podcast**: Podcast show information
- **Episode**: Individual episode data
- **Transcription**: AI transcription results
- **ShowNotes**: Generated show notes content
- **Export**: Export history and formats

## 📚 Usage

### Basic Workflow

1. **Upload Audio**: Drag and drop MP3/WAV/M4A files up to 500MB
2. **AI Processing**: Automatic transcription and content generation
3. **Review & Edit**: Customize generated show notes
4. **Export & Publish**: Multiple format export or direct publishing

### Subscription Plans

- **Starter ($19/month)**: 10 hours transcription, basic features
- **Professional ($39/month)**: 50 hours, advanced features, integrations
- **Enterprise ($99/month)**: Unlimited usage, white-label, API access

## 🧪 Testing

Run the test suite:

```bash
# Unit tests
npm test

# Test coverage
npm run test:coverage

# Type checking
npm run type-check
```

## 📦 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Set Environment Variables**
4. **Deploy**

### Docker Deployment

```bash
# Build image
docker build -t podcast-notes-ai .

# Run container
docker run -p 3000:3000 --env-file .env podcast-notes-ai
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Yes |
| `OPENAI_API_KEY` | OpenAI API key for transcription/generation | Yes |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key (fallback) | No |
| `GITHUB_CLIENT_ID/SECRET` | GitHub OAuth credentials | Yes |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth credentials | No |
| `STRIPE_SECRET_KEY` | Stripe payment processing | No |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | Yes |

### Feature Flags

Configure features in `src/lib/config.ts`:

```typescript
export const config = {
  features: {
    assemblyAiBackup: true,
    realTimeProcessing: false,
    teamCollaboration: true,
  },
  limits: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxDuration: 180 * 60, // 3 hours
  }
}
```

## 🔐 Security

- **Authentication**: OAuth with GitHub/Google
- **File Security**: Secure upload with validation
- **Data Protection**: Encryption at rest and in transit
- **GDPR Compliance**: Data deletion and export capabilities
- **Rate Limiting**: API endpoint protection

## 📈 Performance

- **Processing Speed**: Sub-3 minute processing for 60-minute episodes
- **Transcription Accuracy**: 95%+ with dual AI providers
- **Uptime Target**: 99.9% availability
- **CDN**: Global content delivery for fast loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.podcastnotes.ai](https://docs.podcastnotes.ai)
- **Email Support**: support@podcastnotes.ai
- **GitHub Issues**: For bug reports and feature requests

## 🗺️ Roadmap

### Current Version (v1.0)
- ✅ Core transcription and show notes generation
- ✅ Basic export formats
- ✅ User authentication and billing

### Upcoming Features
- 🔄 Real-time transcription during recording
- 🔄 Advanced speaker identification
- 🔄 Multi-language support expansion
- 🔄 Video podcast support
- 🔄 Advanced analytics dashboard

---

**Built with ❤️ for podcasters worldwide**