# Invoice Generator - Professional Invoicing Platform

A comprehensive, production-ready SaaS platform for creating professional invoices, processing payments, and managing business finances. Built with Next.js 14, TypeScript, Prisma, and Stripe.

## 🚀 Features

### Core Invoice Management
- **Professional Invoice Creation** - Rich invoice builder with customizable templates
- **Multi-Currency Support** - 50+ currencies with real-time exchange rates  
- **PDF Generation** - High-quality PDF invoices with professional branding
- **Line Items & Calculations** - Automatic tax, discount, and total calculations
- **Invoice Numbering** - Automatic sequential numbering with customizable formats

### Payment Processing
- **Stripe Integration** - Secure credit card and ACH payments
- **Online Payment Portal** - Branded customer payment experience
- **Payment Tracking** - Automatic payment reconciliation and receipt generation
- **Partial Payments** - Support for installment plans and partial payments
- **Webhook Processing** - Real-time payment status updates

### Client Management
- **Client Database** - Comprehensive contact and billing information
- **Payment History** - Track all client payments and outstanding balances
- **Client Portal** - Dedicated portal for clients to view and pay invoices
- **Credit Tracking** - Monitor client credit limits and payment terms

### Business Analytics
- **Dashboard Analytics** - Revenue tracking and financial insights
- **Aging Reports** - Track outstanding invoices and overdue payments
- **Client Analytics** - Top clients by revenue and payment behavior
- **Export Capabilities** - CSV and Excel export for financial data

### Automation & Notifications
- **Email Notifications** - Automatic invoice delivery and payment confirmations
- **Payment Reminders** - Configurable reminder sequences for overdue invoices
- **Status Tracking** - Real-time invoice status updates (Draft, Sent, Viewed, Paid)
- **Audit Logging** - Comprehensive activity tracking for compliance

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form state management
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Database modeling and queries
- **PostgreSQL** - Primary database
- **JWT Authentication** - Secure user authentication
- **bcryptjs** - Password hashing

### Payment Processing
- **Stripe** - Payment processing and webhooks
- **Multi-currency** - International payment support
- **PCI Compliance** - Secure payment handling

### PDF & Email
- **jsPDF** - Client-side PDF generation
- **Nodemailer** - Email delivery service
- **Template Engine** - Customizable email templates

### DevOps & Deployment
- **Docker** - Containerized deployment
- **Docker Compose** - Multi-service orchestration
- **Nginx** - Reverse proxy and load balancing
- **Jest** - Unit and integration testing
- **Playwright** - End-to-end testing

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis (optional, for caching)
- Stripe account

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invoice-generator
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
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # (Optional) Seed the database
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

### Docker Deployment

1. **Using Docker Compose (Recommended)**
   ```bash
   # Copy environment variables
   cp .env.example .env
   # Edit .env with production values
   
   # Start all services
   docker-compose up -d
   ```

2. **Using Docker only**
   ```bash
   # Build the image
   docker build -t invoice-generator .
   
   # Run the container
   docker run -p 3000:3000 \
     -e DATABASE_URL="your-database-url" \
     -e NEXTAUTH_SECRET="your-secret" \
     invoice-generator
   ```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | JWT signing secret | ✅ |
| `NEXTAUTH_URL` | Application base URL | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret | ✅ |
| `EMAIL_SERVER_HOST` | SMTP server host | ✅ |
| `EMAIL_SERVER_PORT` | SMTP server port | ✅ |
| `EMAIL_SERVER_USER` | SMTP username | ✅ |
| `EMAIL_SERVER_PASSWORD` | SMTP password | ✅ |
| `EMAIL_FROM` | Default sender email | ✅ |
| `REDIS_URL` | Redis connection string | ❌ |
| `AWS_ACCESS_KEY_ID` | AWS access key (for file storage) | ❌ |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | ❌ |
| `AWS_S3_BUCKET` | S3 bucket name | ❌ |

### Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Set up webhook endpoints:
   - **Endpoint URL**: `https://yourdomain.com/api/payments/webhook`
   - **Events**: `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Email Configuration

The application supports SMTP email delivery. Popular providers:

- **Gmail**: Use App Passwords for authentication
- **SendGrid**: Use API key as password
- **Mailgun**: Use SMTP credentials
- **AWS SES**: Use SMTP interface

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### End-to-End Tests
```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e
```

### API Testing
```bash
# Test API endpoints
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Invoices
- `GET /api/invoices` - List invoices with filtering
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/[id]` - Get invoice details
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `GET /api/invoices/[id]/pdf` - Download invoice PDF
- `POST /api/invoices/[id]/send` - Send invoice via email

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create new client
- `GET /api/clients/[id]` - Get client details
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments` - List payments
- `POST /api/payments` - Record manual payment

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics
- `GET /api/currencies` - Get supported currencies
- `POST /api/currencies/convert` - Convert currency amounts

## 🔒 Security

### Security Features
- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs with salt rounds
- **Input Validation** - Zod schema validation
- **SQL Injection Protection** - Prisma ORM with parameterized queries
- **XSS Protection** - Content Security Policy headers
- **CORS Configuration** - Controlled cross-origin requests
- **Rate Limiting** - API endpoint protection
- **Audit Logging** - Activity tracking and monitoring

### PCI Compliance
- **No Card Data Storage** - All payment data handled by Stripe
- **Webhook Verification** - Stripe signature validation
- **HTTPS Enforcement** - SSL/TLS encryption required
- **Environment Isolation** - Separate development/production environments

## 🚀 Deployment

### Production Deployment

1. **Prepare Environment**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export DATABASE_URL="your-production-database"
   export NEXTAUTH_SECRET="your-production-secret"
   ```

2. **Database Migration**
   ```bash
   # Run production migrations
   npm run db:migrate
   ```

3. **Build Application**
   ```bash
   # Build for production
   npm run build
   
   # Start production server
   npm run start
   ```

### Cloud Deployment Options

#### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

#### AWS
- **ECS**: Container-based deployment
- **Elastic Beanstalk**: Application platform
- **Lambda**: Serverless deployment

#### Google Cloud
- **Cloud Run**: Container deployment
- **App Engine**: Platform-as-a-Service
- **Compute Engine**: Virtual machines

#### DigitalOcean
- **App Platform**: Simple deployment
- **Droplets**: Virtual private servers
- **Kubernetes**: Container orchestration

## 📊 Monitoring

### Application Monitoring
- **Health Checks** - API endpoint health monitoring
- **Error Tracking** - Comprehensive error logging
- **Performance Metrics** - Response time and throughput
- **Database Monitoring** - Query performance and connections

### Business Metrics
- **Revenue Tracking** - Monthly and annual revenue
- **Invoice Analytics** - Creation and payment rates
- **Client Metrics** - Customer acquisition and retention
- **Payment Processing** - Success rates and failures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages
- Ensure security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - Database toolkit
- [Stripe](https://stripe.com/) - Payment processing
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://radix-ui.com/) - UI components

## 📞 Support

For support, email support@invoicegenerator.com or create an issue in the repository.

---

**Invoice Generator** - Professional invoicing made simple. Built with ❤️ for modern businesses.