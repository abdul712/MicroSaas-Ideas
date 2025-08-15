# Business Process Documenter

A comprehensive business process documentation platform that enables organizations to create, manage, and optimize their workflows with visual process mapping, step-by-step guides, and compliance tracking.

## 🚀 Features

### Core Features
- **Visual Process Mapping** - Drag-and-drop flowchart builder with BPMN 2.0 support
- **Rich Documentation** - Create comprehensive SOPs with multimedia content
- **Version Control** - Track changes with approval workflows and rollback capabilities
- **Team Collaboration** - Real-time editing with role-based permissions
- **Process Execution** - Interactive step-by-step guidance with progress tracking
- **Analytics & Reporting** - Performance metrics and bottleneck identification
- **Compliance Tracking** - Audit trails and regulatory compliance features

### Advanced Features
- **Template Library** - Industry-specific process templates
- **AI-Powered Optimization** - Process improvement suggestions
- **Integration APIs** - Connect with business systems
- **Mobile Execution** - Field process execution on mobile devices
- **Multi-language Support** - Global process documentation

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with OAuth support
- **UI/UX**: Tailwind CSS with Radix UI components
- **File Storage**: AWS S3 compatible storage
- **Process Mapping**: React Flow for visual diagrams
- **Rich Text**: Tiptap editor for documentation

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd business-process-documenter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables in `.env.local`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/business_process_documenter"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

### Docker Setup

1. **Using Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**
   ```bash
   docker-compose exec app npx prisma db push
   ```

## 🗂️ Project Structure

```
business-process-documenter/
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard pages
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── ui/            # Base UI components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── processes/     # Process management
│   │   └── landing/       # Landing page
│   ├── lib/               # Utility functions
│   │   ├── auth.ts        # Authentication config
│   │   ├── prisma.ts      # Database client
│   │   └── utils.ts       # Helper functions
│   ├── hooks/             # Custom React hooks
│   └── types/             # TypeScript type definitions
├── prisma/
│   └── schema.prisma      # Database schema
├── public/                # Static assets
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── Dockerfile
└── docker-compose.yml
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Adding New Features

1. **Database Changes**
   - Update `prisma/schema.prisma`
   - Run `npm run db:push` for development
   - Create migrations for production

2. **API Routes**
   - Add routes in `src/app/api/`
   - Use Prisma client for database operations
   - Implement proper error handling

3. **UI Components**
   - Create reusable components in `src/components/ui/`
   - Use Tailwind CSS for styling
   - Follow existing patterns for consistency

## 🚀 Deployment

### Environment Variables

Required environment variables for production:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="strong-secret-key"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Deploy to Vercel

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main

### Deploy with Docker

```bash
# Build and run
docker-compose -f docker-compose.prod.yml up -d

# Scale the application
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:

- **Organizations** - Multi-tenant organization management
- **Users** - User accounts with role-based access
- **Processes** - Business process definitions
- **ProcessSteps** - Individual steps within processes
- **ProcessExecutions** - Process execution tracking
- **Templates** - Reusable process templates
- **MediaAssets** - File and media management

## 🔐 Security

### Authentication
- NextAuth.js with multiple providers
- JWT-based sessions
- Role-based access control

### Data Protection
- Input validation with Zod
- SQL injection prevention with Prisma
- CSRF protection
- Secure headers configuration

### Privacy
- GDPR compliance features
- Data encryption at rest
- Audit logging for compliance

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

## 📈 Monitoring

### Performance
- Core Web Vitals tracking
- Database query optimization
- Caching strategies

### Analytics
- User behavior tracking
- Process usage analytics
- Performance metrics

### Error Tracking
- Error boundary implementation
- Logging and monitoring
- Alert systems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for formatting
- Write descriptive commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [User Guide](docs/user-guide.md)
- [Admin Guide](docs/admin-guide.md)

### Community
- GitHub Issues for bug reports
- GitHub Discussions for questions
- Discord community for real-time help

### Enterprise Support
For enterprise support and custom features, contact our sales team.

---

**ProcessDoc** - Transform your business processes into actionable, compliant documentation.