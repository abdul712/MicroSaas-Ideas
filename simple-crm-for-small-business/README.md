# Simple CRM for Small Business

A streamlined, user-friendly CRM platform designed specifically for small businesses and startups with comprehensive contact management, sales pipeline, and communication features.

## 🚀 Features

### Contact Management
- Comprehensive contact profiles with custom fields
- Company and individual contact organization
- Contact interaction history and timeline
- Import/export functionality (CSV, Google Contacts, etc.)

### Sales Pipeline Management
- Visual pipeline with drag-and-drop functionality
- Customizable sales stages and deal statuses
- Deal value tracking and forecasting
- Automated follow-up reminders and tasks

### Communication Hub
- Email integration (Gmail, Outlook) with 2-way sync
- SMS messaging capabilities
- Call logging and notes
- Email templates and sequences

### Reporting & Analytics
- Sales performance dashboards
- Lead source attribution and ROI tracking
- Team productivity metrics
- Custom report builder

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with multi-tenancy support
- **Authentication**: JWT with secure HTTP-only cookies
- **Email**: SMTP integration with OAuth 2.0 for Gmail/Outlook
- **Caching**: Redis for sessions and performance
- **Deployment**: Docker, Docker Compose

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional)

## 🔧 Installation

### Option 1: Docker Setup (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd simple-crm-for-small-business
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration

4. Start the application:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
docker-compose exec app npm run db:migrate
```

6. Seed the database (optional):
```bash
docker-compose exec app npm run db:seed
```

The application will be available at http://localhost:3000

### Option 2: Manual Setup

1. Clone and install dependencies:
```bash
git clone <repository-url>
cd simple-crm-for-small-business
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database and service configurations
```

3. Set up the database:
```bash
npm run db:migrate
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
```

## 🗄️ Database Setup

The application uses PostgreSQL with Prisma ORM. The database schema supports:

- Multi-tenant architecture with row-level security
- Comprehensive contact and company management
- Flexible sales pipeline with customizable stages
- Activity tracking and task management
- Email integration and thread management
- Custom fields and webhook support

### Migration Commands

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema changes
npm run db:push

# Reset database
npm run db:reset

# Seed database
npm run db:seed
```

## 🔐 Authentication & Security

- JWT-based authentication with secure HTTP-only cookies
- Multi-tenant data isolation via tenant_id
- Row-level security (RLS) for database access
- OAuth 2.0 integration for email providers
- Input validation and sanitization
- Rate limiting and CORS protection

## 📧 Email Integration

### Gmail Setup

1. Create a Google Cloud project
2. Enable Gmail API
3. Create OAuth 2.0 credentials
4. Add credentials to your `.env` file

### Outlook Setup

1. Register an application in Azure AD
2. Configure Microsoft Graph permissions
3. Add credentials to your `.env` file

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

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Production

```bash
# Build production image
docker build -t simple-crm .

# Run production container
docker run -p 3000:3000 simple-crm
```

## 📊 API Documentation

The application provides RESTful APIs for all major functionality:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Contacts
- `GET /api/contacts` - List contacts with filtering
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/[id]` - Get specific contact
- `PUT /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact

### Additional endpoints for deals, activities, tasks, companies, and more.

## 🏗️ Architecture

### Multi-Tenancy
- Shared schema with tenant isolation
- Row-level security for data protection
- Tenant-scoped queries and operations

### Database Design
- Optimized for small business workflows
- Flexible custom fields support
- Comprehensive audit trail
- Efficient indexing for performance

### Performance
- Redis caching for frequently accessed data
- Optimized database queries with Prisma
- Lazy loading and pagination
- Image optimization and CDN integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Documentation: [docs.simple-crm.com](https://docs.simple-crm.com)
- Issues: [GitHub Issues](https://github.com/your-org/simple-crm/issues)
- Email: support@simple-crm.com

## 🗺️ Roadmap

- [ ] Advanced reporting and analytics
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Mobile app (React Native)
- [ ] Webhook APIs for integrations
- [ ] Advanced automation workflows
- [ ] Multi-language support
- [ ] Advanced email marketing features
- [ ] Integration marketplace

---

Built with ❤️ for small businesses worldwide.