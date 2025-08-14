# ShiftSync - Employee Shift Scheduler

A comprehensive workforce management platform that automates employee scheduling, manages availability, handles time-off requests, ensures labor compliance, and optimizes workforce allocation with mobile apps for managers and employees.

## 🚀 Features

### Core Scheduling
- **Intelligent Scheduling**: AI-powered scheduling that considers availability, skills, and business requirements
- **Drag & Drop Interface**: Intuitive schedule builder with visual conflict detection
- **Auto-Scheduling**: Automated schedule generation based on business rules and employee preferences
- **Shift Templates**: Reusable shift patterns and recurring schedule management
- **Real-time Updates**: Live schedule updates with WebSocket integration

### Employee Management
- **Complete Profiles**: Employee skills, availability, contact information, and performance tracking
- **Role-Based Access**: Admin, Manager, and Employee access levels with appropriate permissions
- **Availability Tracking**: Employee availability preferences and time-off management
- **Skills Management**: Skills-based shift assignments and workforce optimization

### Compliance & Analytics
- **Labor Law Compliance**: Automated checking for overtime, breaks, and labor regulations
- **Cost Optimization**: Real-time labor cost tracking with budget management
- **Performance Analytics**: Comprehensive reporting and workforce insights
- **Audit Trails**: Complete history of schedule changes and approvals

### Mobile & Communication
- **Mobile Apps**: Native iOS and Android apps for employees and managers
- **Push Notifications**: Real-time alerts for schedule changes and important updates
- **Shift Swapping**: Employee-initiated shift swaps with approval workflows
- **Time Tracking**: Built-in time clock with GPS verification

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React-based framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component library
- **React Hook Form**: Form management with validation

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Prisma**: Database ORM with type safety
- **PostgreSQL**: Primary database
- **NextAuth.js**: Authentication and authorization
- **Redis**: Caching and session management

### Infrastructure
- **Docker**: Containerization for development and deployment
- **Vercel/AWS**: Production hosting options
- **Stripe**: Payment processing for subscriptions

## 🏗️ Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employee-shift-scheduler
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

4. **Start the database**
   ```bash
   docker-compose up db redis -d
   ```

5. **Set up the database**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Using Docker

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**
   ```bash
   docker-compose exec app npm run db:migrate
   ```

## 📋 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── dashboard/        # Dashboard-specific components
│   └── forms/            # Form components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication configuration
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Utility functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── styles/               # Global styles
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚀 Deployment

### Environment Setup
1. Set up production environment variables
2. Configure database and Redis instances
3. Set up Stripe webhook endpoints
4. Configure email service (SMTP)

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy with Docker
```bash
docker build -t shiftsync .
docker run -p 3000:3000 shiftsync
```

## 📊 Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Organizations**: Multi-tenant organization management
- **Users**: Employees with roles and permissions
- **Locations**: Multiple business locations
- **Shifts**: Shift definitions with requirements
- **Schedules**: Employee-shift assignments
- **Availability**: Employee availability preferences
- **Time-off Requests**: Leave management
- **Shift Swaps**: Employee-initiated shift exchanges
- **Labor Rules**: Compliance and business rules
- **Notifications**: System notifications

## 🔒 Security

- **Authentication**: Secure credential-based authentication with NextAuth.js
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encrypted passwords and secure session management
- **Input Validation**: Comprehensive input validation with Zod
- **SQL Injection Prevention**: Parameterized queries via Prisma
- **CORS Protection**: Cross-origin request security

## 📈 Performance

- **Database Optimization**: Proper indexing and query optimization
- **Caching**: Redis caching for frequently accessed data
- **Code Splitting**: Dynamic imports for optimized loading
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Analysis**: Webpack bundle analyzer integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@shiftsync.com or join our Slack channel.

## 🗺️ Roadmap

- [ ] Mobile app development (React Native)
- [ ] Advanced analytics and reporting
- [ ] Integration with payroll systems
- [ ] Multi-language support
- [ ] Advanced scheduling algorithms (AI/ML)
- [ ] Workforce forecasting and planning
- [ ] Integration marketplace
- [ ] White-label solutions